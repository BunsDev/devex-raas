package k8s

import (
	"log"

	"path/filepath"

	"github.com/parthkapoor-dev/core/pkg/dotenv"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var KUBE_CONFIG_PATH = dotenv.EnvString("KUBE_CONFIG_PATH", filepath.Join(homedir.HomeDir(), ".kube", "config"))

// Initializes the K8s client
func getClientSet() *kubernetes.Clientset {
	kubeconfig := KUBE_CONFIG_PATH
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
