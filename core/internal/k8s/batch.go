package k8s

// import (
// 	"context"
// 	"fmt"
// 	"log"
// 	"time"

// 	batchv1 "k8s.io/api/batch/v1"
// 	corev1 "k8s.io/api/core/v1"
// 	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
// 	"k8s.io/client-go/kubernetes"
// )

// // Note: This Function uses Batch Jobs, ie. making new pods, and creating different pods from our main deployment and theirfore the Job Cannot use Volume from this directory, we would need to use something like persistant containers
// // Currently we are not using this in our codebase

// // Helper function to create a temporary upload sidecar
// func createUploadSidecar(clientset *kubernetes.Clientset, ctx context.Context, userName, replId, region, bucket string) error {
// 	// Create a job that mounts the same volume and uploads files
// 	clientBatchV1 := clientset.BatchV1()
// 	jobName := replId + "-upload-job"

// 	job := &batchv1.Job{
// 		ObjectMeta: metav1.ObjectMeta{
// 			Name: jobName,
// 		},
// 		Spec: batchv1.JobSpec{
// 			Template: corev1.PodTemplateSpec{
// 				Spec: corev1.PodSpec{
// 					RestartPolicy: corev1.RestartPolicyNever,
// 					Volumes: []corev1.Volume{
// 						{
// 							Name: "workspace-vol",
// 							VolumeSource: corev1.VolumeSource{
// 								PersistentVolumeClaim: &corev1.PersistentVolumeClaimVolumeSource{
// 									ClaimName: replId + "-workspace", // You'll need to create this PVC
// 								},
// 							},
// 						},
// 					},
// 					Containers: []corev1.Container{
// 						{
// 							Name:    "s3-uploader",
// 							Image:   "amazon/aws-cli",
// 							Command: []string{"sh", "-c"},
// 							Args: []string{
// 								fmt.Sprintf(`aws s3 cp /workspaces s3://%s/repl/%s/%s/ --recursive --endpoint-url https://%s.digitaloceanspaces.com`, bucket, userName, replId, region),
// 							},
// 							VolumeMounts: []corev1.VolumeMount{
// 								{
// 									Name:      "workspace-vol",
// 									MountPath: "/workspaces",
// 								},
// 							},
// 							Env: awsEnvVars(),
// 						},
// 					},
// 				},
// 			},
// 		},
// 	}

// 	_, err := clientBatchV1.Jobs("default").Create(ctx, job, metav1.CreateOptions{})
// 	if err != nil {
// 		return fmt.Errorf("failed to create upload job: %w", err)
// 	}

// 	// Wait for job to finish
// 	if err := waitForJobCompletion(clientset, ctx, jobName); err != nil {
// 		return err
// 	}

// 	// Clean up the job
// 	defer func() {
// 		clientBatchV1.Jobs("default").Delete(ctx, replId+"-upload-job", metav1.DeleteOptions{})
// 	}()

// 	return nil
// }

// // Helper function to wait for job to complete
// func waitForJobCompletion(clientset *kubernetes.Clientset, ctx context.Context, jobName string) error {
// 	const (
// 		namespace    = "default"
// 		pollInterval = 2 * time.Second
// 		timeout      = 2 * time.Minute
// 	)

// 	start := time.Now()
// 	for {
// 		// Timeout check
// 		if time.Since(start) > timeout {
// 			return fmt.Errorf("timed out waiting for job %s to complete", jobName)
// 		}

// 		job, err := clientset.BatchV1().Jobs(namespace).Get(ctx, jobName, metav1.GetOptions{})
// 		if err != nil {
// 			return fmt.Errorf("failed to get job: %w", err)
// 		}
// 		log.Println("job status: ", job.Status)

// 		if job.Status.Succeeded > 0 {
// 			log.Printf("✅ Job %s completed successfully", jobName)
// 			return nil
// 		}

// 		if job.Status.Failed > 0 {
// 			return fmt.Errorf("job %s failed", jobName)
// 		}

// 		log.Printf("⏳ Waiting for job %s to complete...", jobName)
// 		time.Sleep(pollInterval)
// 	}
// }
