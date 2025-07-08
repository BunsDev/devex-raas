package k8s

import (
	"context"
	"fmt"
	"log"

	"github.com/parthkapoor-dev/core/models"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

var RUNNER_CLUSTER_IP = dotenv.EnvString("RUNNER_CLUSTER_IP", "localhost")

func CreateReplDeploymentAndService(userName, replId, template string) error {
	clientset := getClientSet()
	ctx := context.Background()

	config, exists := models.TemplateConfigs[template]
	if !exists {
		return fmt.Errorf("unsupported template: %s", template)
	}

	region := dotenv.EnvString("SPACES_REGION", "blr1")
	bucket := dotenv.EnvString("SPACES_BUCKET", "devex")

	labels := map[string]string{
		"app":      replId,
		"template": template,
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
							Image:           fmt.Sprintf("ghcr.io/parthkapoor-dev/devex/runner-%s:latest", template),
							ImagePullPolicy: corev1.PullAlways,
							Env: []corev1.EnvVar{
								{
									Name:  "REPL_ID",
									Value: replId,
								},
								{
									Name:  "TEMPLATE",
									Value: template,
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
									ContainerPort: config.Port,
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("250m"),
									corev1.ResourceMemory: resource.MustParse("512Mi"),
								},
								Limits: corev1.ResourceList{
									corev1.ResourceCPU:    resource.MustParse("750m"),
									corev1.ResourceMemory: resource.MustParse("1Gi"),
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
					Port:       config.Port,
					TargetPort: intstrFromInt(int(config.Port)),
				},
			},
			Type: corev1.ServiceTypeClusterIP,
		},
	}

	_, err = clientset.CoreV1().Services("default").Create(ctx, service, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	// 3. Ingress (same as before, but using config.Port)
	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId + "-ingress",
			Annotations: map[string]string{
				"nginx.ingress.kubernetes.io/use-regex":          "true",
				"nginx.ingress.kubernetes.io/rewrite-target":     "/$1",
				"nginx.ingress.kubernetes.io/websocket-services": replId,
				"nginx.ingress.kubernetes.io/ssl-redirect":       "false",
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
												Number: config.Port,
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

	log.Printf("✅ Deployment and Service for repl %s (template: %s) created.\n", replId, template)
	return nil
}
