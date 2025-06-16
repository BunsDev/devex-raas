## Setting up the k8s Cluster

Please Note: The Following docs were meant for personal use only. If you find any issue in it, feel free to contribute in the project.

Please Read the Contribution Guide, before sending PR requests.

### Step 0: Prerequisites
Your System should have installed
```
Cloned this project
docker
kubectl
helm
```

Following are the steps for setting up the k8s Cluster.
Note: This is to be only done once, when creating a new cluster on cloud or kind

### Step 1: Create a new Cluster
Create or new cluster on Cloud (DigitalOcean, AWS or Azure) or we can test locally using kind

```
kind create cluster --name devex-cluster
```
To See whether the cluster is running
```
kubectl get nodes
NAME                                  STATUS   ROLES           AGE   VERSION
devex-cluster-control-plane   Ready    control-plane   45m   v1.33.1
```

Note: By default we have a single node in a kind cluster, create a kind config file to create more nodes

### Step 2: Install Nginx-Ingress-Controller on this Cluster
We can get Nginx Ingress Controller using helm

First Add the Repository & Create a new namespace
```
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm search repo ingress-nginx --versions

kubectl create namespace ingress-nginx
```

Then we can either install helm in the cluster, or use template files
- helm install
```
helm install ingress-nginx ingress-nginx \
--namespace ingress-nginx \
```
- helm template
```
helm template ingress-nginx ingress-nginx \
--repo https://kubernetes.github.io/ingress-nginx \
--namespace ingress-nginx \
> ./ingress-controller.yaml

kubectl apply -f ./ingress-controller.yaml
```

### Step 3: (Kind only) Port Forwarding
Check the installation

```
kubectl -n ingress-nginx get pods
```

The traffic for our cluster will come in over the Ingress service
Note that we dont have load balancer capability in kind by default, so our LoadBalancer is pending:

```
kubectl -n ingress-nginx get svc
NAME                                 TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller             LoadBalancer   10.96.130.21    <pending>     80:31011/TCP,443:31772/TCP   26m
ingress-nginx-controller-admission   ClusterIP      10.96.125.210   <none>        443/TCP                      26m
```

For testing purposes in KIND ONLY, we will simply setup port-forwarding
If you are running in the cloud, you will get a real IP address.

```
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8000:80
```

We can reach our controller on https://localhost:8000/

### Step 4: If Runner Image isn't deployed on any Container Registery
We can load a docker image from our local system to the Kind cluster using
```
kind load docker-image <image-name>
```

note: If the runner-service image is deployed at a Registery, then we dont need to do this

#### Congrats, We are good to go now
