package k8s

import (
	"context"
	"fmt"
	"log"

	"github.com/parthkapoor-dev/core/pkg/dotenv"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var RUNNER_DOCKER_IMAGE = dotenv.EnvString("RUNNER_DOCKER_IMAGE", "parthkapoor-dev/devx-runner:latest")
var RUNNER_CLUSTER_IP = dotenv.EnvString("RUNNER_CLUSTER_IP", "localhost")

func CreateReplDeploymentAndService(userName, replId string) error {
	clientset := getClientSet()
	ctx := context.Background()

	region := dotenv.EnvString("SPACES_REGION", "blr1")
	bucket := dotenv.EnvString("SPACES_BUCKET", "devex")

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
								fmt.Sprintf(`aws s3 cp s3://%s/repl/%s/%s/ /workspaces --recursive --endpoint-url https://%s.digitaloceanspaces.com && echo "Resources copied from DO Spaces";`, bucket, userName, replId, region),
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
							Image:           RUNNER_DOCKER_IMAGE,
							ImagePullPolicy: corev1.PullAlways,
							Env: []corev1.EnvVar{
								{
									Name:  "REPL_ID",
									Value: replId,
								},
							},
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

							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("250m"),  // 0.25 CPU
									corev1.ResourceMemory: resource.MustParse("512Mi"), // 512 MB RAM
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("750m"), // 0.5 CPU max
									corev1.ResourceMemory: resource.MustParse("1Gi"),  // 1 GB RAM max
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

	const tlsSecretName = "tls-secret"

	// 3. Ingress (path-based, using repl.parthkapoor.me/repl-id)
	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId + "-ingress",
			Annotations: map[string]string{
				"nginx.ingress.kubernetes.io/use-regex":          "true",
				"nginx.ingress.kubernetes.io/rewrite-target":     "/$1",
				"nginx.ingress.kubernetes.io/websocket-services": replId,
				"nginx.ingress.kubernetes.io/ssl-redirect":       "false", // disable for now
				"nginx.ingress.kubernetes.io/proxy-read-timeout": "3600",
				"nginx.ingress.kubernetes.io/proxy-send-timeout": "3600",
			},
		},
		Spec: networkingv1.IngressSpec{
			IngressClassName: strPtr("nginx"),
			TLS: []networkingv1.IngressTLS{
				{
					Hosts:      []string{RUNNER_CLUSTER_IP},
					SecretName: "tls-secret",
				},
			},
			Rules: []networkingv1.IngressRule{
				{
					Host: RUNNER_CLUSTER_IP,
					IngressRuleValue: networkingv1.IngressRuleValue{
						HTTP: &networkingv1.HTTPIngressRuleValue{
							Paths: []networkingv1.HTTPIngressPath{
								{
									Path:     fmt.Sprintf("/%s/(.*)", replId),
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
