package k8s

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/parthkapoor-dev/core/pkg/dotenv"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

func DeleteReplDeploymentAndService(userName, uuid_replId string) error {
	clientset := getClientSet()
	ctx := context.Background()

	replId := fmt.Sprintf("repl-%s", uuid_replId)

	region := dotenv.EnvString("SPACES_REGION", "blr1")
	bucket := dotenv.EnvString("SPACES_BUCKET", "devex")

	// Step 1: Upload workspace from pod to DigitalOcean Spaces
	log.Println("📤 Uploading workspace from pod to DigitalOcean Spaces...")

	if err := InjectEphemeralUploader(clientset, ctx, replId, uuid_replId, userName, region, bucket); err != nil {
		log.Printf("⚠️ Failed to inject uploader: %v", err)
	} else {
		log.Printf("✅ Uploaded /workspaces to s3://devex/repl/%s/%s/", userName, replId)
	}

	// Step 2: Delete resources
	for _, resource := range []struct {
		name string
		del  func() error
	}{
		{
			name: "Ingress",
			del: func() error {
				return clientset.NetworkingV1().Ingresses("default").Delete(ctx, replId+"-ingress", metav1.DeleteOptions{})
			},
		},
		{
			name: "Service",
			del: func() error {
				return clientset.CoreV1().Services("default").Delete(ctx, replId, metav1.DeleteOptions{})
			},
		},
		{
			name: "Deployment",
			del: func() error {
				return clientset.AppsV1().Deployments("default").Delete(ctx, replId, metav1.DeleteOptions{})
			},
		},
	} {
		err := resource.del()
		if err != nil {
			log.Printf("⚠️ Failed to delete %s: %v", resource.name, err)
		} else {
			log.Printf("✅ %s deleted for repl %s", resource.name, replId)
		}
	}

	return nil
}

// InjectEphemeralUploader injects an ephemeral container into the running REPL pod to upload files
func InjectEphemeralUploader(clientset *kubernetes.Clientset, ctx context.Context, replId, uuid_replId, userName, region, bucket string) error {
	const namespace = "default"

	// Fetch the target pod
	podList, err := clientset.CoreV1().Pods("default").List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", replId),
	})
	if err != nil || len(podList.Items) == 0 {
		return err
	}
	pod := podList.Items[0]

	// Prepare the ephemeral container spec
	ephemeral := corev1.EphemeralContainer{
		EphemeralContainerCommon: corev1.EphemeralContainerCommon{
			Name:    "s3-uploader",
			Image:   "amazon/aws-cli",
			Command: []string{"sh", "-c"},
			Args: []string{
				fmt.Sprintf(`aws s3 cp /workspaces s3://%s/repl/%s/%s/ --recursive --endpoint-url https://%s.digitaloceanspaces.com`, bucket, userName, uuid_replId, region),
			},
			VolumeMounts: []corev1.VolumeMount{
				{
					Name:      "workspace-vol",
					MountPath: "/workspaces",
				},
			},
			Env: awsEnvVars(),
		},
		// TargetContainerName: "runner", // optional but helps in debugging
	}

	pod.Spec.EphemeralContainers = append(pod.Spec.EphemeralContainers, ephemeral)

	if _, err = clientset.CoreV1().Pods(namespace).UpdateEphemeralContainers(
		ctx, pod.Name, &pod, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("failed to update pod with ephemeral container: %w", err)
	}
	log.Printf("📦 Ephemeral uploader injected into pod %s", pod.Name)

	if err := waitForEphemeralUpload(clientset, pod.Name); err != nil {
		return err
	}

	return nil
}

func waitForEphemeralUpload(clientset *kubernetes.Clientset, podName string) error {
	const (
		namespace = "default"
		timeout   = 2 * time.Minute
		interval  = 2 * time.Second
	)

	start := time.Now()
	for time.Since(start) < timeout {
		pod, err := clientset.CoreV1().Pods(namespace).Get(context.Background(), podName, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("failed to get updated pod: %w", err)
		}

		for _, ec := range pod.Status.EphemeralContainerStatuses {
			if ec.Name == "s3-uploader" {
				if ec.State.Terminated != nil {
					if ec.State.Terminated.ExitCode == 0 {
						log.Println("✅ Ephemeral container finished successfully")
						return nil
					}
					return fmt.Errorf("ephemeral container failed with code %d", ec.State.Terminated.ExitCode)
				}
			}
		}

		log.Println("⏳ Waiting for ephemeral uploader to complete...")
		time.Sleep(interval)
	}

	return fmt.Errorf("timeout: ephemeral container did not finish in time")
}
