package k8s

import (
	"context"
	"fmt"
	"log"

	"path/filepath"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

// Initializes the K8s client
func getClientSet() *kubernetes.Clientset {
	kubeconfig := filepath.Join(homedir.HomeDir(), ".kube", "config")
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Fatalf("Failed to load kubeconfig: %v", err)
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Failed to create clientset: %v", err)
	}

	return clientset
}

func CreateReplDeploymentAndService(userName, replId string) error {
	clientset := getClientSet()
	ctx := context.Background()

	labels := map[string]string{
		"app": replId,
	}

	// 1. Deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: "workspace-vol",
							VolumeSource: corev1.VolumeSource{
								EmptyDir: &corev1.EmptyDirVolumeSource{},
							},
						},
					},
					InitContainers: []corev1.Container{
						{
							Name:    "s3-downloader",
							Image:   "amazon/aws-cli",
							Command: []string{"sh", "-c"},
							Args: []string{
								fmt.Sprintf(`aws s3 cp s3://devex/repl/%s/%s/ /workspaces --recursive --endpoint-url https://%s.digitaloceanspaces.com && echo "Resources copied from DO Spaces";`, userName, replId, "blr1"),
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "workspace-vol",
									MountPath: "/workspaces",
								},
							},
							Env: awsEnvVars(),
						},
					},
					Containers: []corev1.Container{
						{
							Name:            "runner",
							Image:           "runner-service:latest",
							ImagePullPolicy: corev1.PullNever,
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "workspace-vol",
									MountPath: "/workspaces",
								},
							},
							Ports: []corev1.ContainerPort{
								{
									ContainerPort: 8081,
								},
							},
						},
					},
				},
			},
		},
	}

	_, err := clientset.AppsV1().Deployments("default").Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create deployment: %w", err)
	}

	// 2. Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId,
		},
		Spec: corev1.ServiceSpec{
			Selector: labels,
			Ports: []corev1.ServicePort{
				{
					Port:       8081,
					TargetPort: intstrFromInt(8081),
				},
			},
			Type: corev1.ServiceTypeClusterIP, // Change to LoadBalancer for cloud
		},
	}

	_, err = clientset.CoreV1().Services("default").Create(ctx, service, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	// 3. Ingress
	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId + "-ingress",
			Annotations: map[string]string{
				"nginx.ingress.kubernetes.io/rewrite-target": "/$2",
			},
		},
		Spec: networkingv1.IngressSpec{
			IngressClassName: strPtr("nginx"),
			Rules: []networkingv1.IngressRule{
				{
					IngressRuleValue: networkingv1.IngressRuleValue{
						HTTP: &networkingv1.HTTPIngressRuleValue{
							Paths: []networkingv1.HTTPIngressPath{
								{
									Path:     "/" + replId + "(/|$)(.*)",
									PathType: pathTypePtr(networkingv1.PathTypeImplementationSpecific),
									Backend: networkingv1.IngressBackend{
										Service: &networkingv1.IngressServiceBackend{
											Name: replId,
											Port: networkingv1.ServiceBackendPort{
												Number: 8081,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	}

	_, err = clientset.NetworkingV1().Ingresses("default").Create(ctx, ingress, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create ingress: %w", err)
	}

	log.Printf("✅ Deployment and Service for repl %s created.\n", replId)
	return nil
}

// Utility functions
func int32Ptr(i int32) *int32 {
	return &i
}

func intstrFromInt(i int) intstr.IntOrString {
	return intstr.IntOrString{Type: intstr.Int, IntVal: int32(i)}
}

func pathTypePtr(pt networkingv1.PathType) *networkingv1.PathType {
	return &pt
}

func strPtr(s string) *string {
	return &s
}

func awsEnvVars() []corev1.EnvVar {
	return []corev1.EnvVar{
		{
			Name: "AWS_ACCESS_KEY_ID",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{
						Name: "aws-creds",
					},
					Key: "access_key",
				},
			},
		},
		{
			Name: "AWS_SECRET_ACCESS_KEY",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{
						Name: "aws-creds",
					},
					Key: "secret_key",
				},
			},
		},
	}
}
