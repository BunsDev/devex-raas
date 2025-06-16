## Setting up the K8s Cluster

> 📌 **Note**: The following docs were meant for personal use. If you find any issue, feel free to contribute to the project.

Please read the [Contribution Guide](./CONTRIBUTING.md) before sending PR requests.

---

### Step 0: Prerequisites

Your system should have the following installed:

```

* This project cloned
* Docker
* kubectl
* kind (For Local Testing only)
* helm (Optional — already included via pre-generated ingress-controller.yaml)

````

---

### Step 1: Create a new Cluster

You can create a new cluster on Cloud (DigitalOcean, AWS, Azure) or test locally using `kind`.

To create a local Kind cluster:

```bash
kind create cluster --name devex-cluster
````

To check if the cluster is running:

```bash
kubectl get nodes
```

Sample output:

```
NAME                        STATUS   ROLES           AGE   VERSION
devex-cluster-control-plane   Ready    control-plane   45m   v1.33.1
```

> 📝 By default, Kind creates a single-node cluster. To create multiple nodes, define a Kind config file.

---

### Step 2: Install NGINX Ingress Controller

You can use Helm (recommended) or apply the generated YAML.

**Add Helm repo and create namespace:**

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm search repo ingress-nginx --versions

kubectl create namespace ingress-nginx
```

#### Option 1: Install using Helm

```bash
helm install ingress-nginx ingress-nginx \
  --namespace ingress-nginx
```

#### Option 2: Use pre-generated template

> Skip if you've already installed via Helm.

```bash
helm template ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx > ./ingress-controller.yaml

kubectl apply -f ./ingress-controller.yaml
```

---

### Step 3: (Kind only) Port Forwarding for Local Testing

Check if NGINX Ingress Controller is running:

```bash
kubectl -n ingress-nginx get pods
```

Check services:

```bash
kubectl -n ingress-nginx get svc
```

Output should show something like:

```
NAME                         TYPE           CLUSTER-IP     EXTERNAL-IP   PORT(S)                      AGE
ingress-nginx-controller     LoadBalancer   10.96.130.21   <pending>     80:31011/TCP,443:31772/TCP   26m
```

> ⚠️ In `kind`, LoadBalancer will remain `<pending>` since it doesn't support real LoadBalancer by default.

Use port-forwarding instead:

```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8000:80
```

You can now access the Ingress Controller at:
➡️ [http://localhost:8000/](http://localhost:8000/)

---

### Step 4: (Kind only) Load Local Docker Image into the Cluster

If your runner-service image is not pushed to a remote registry (DockerHub, GitHub, etc), load it manually:

```bash
kind load docker-image runner-service:latest
```

> ✅ Skip this step if you're pulling the image from a container registry.

---

### Step 5: (Required) Add Secrets for DigitalOcean Spaces Access

To allow the `s3-downloader` init container to fetch files from **DigitalOcean Spaces**, create a Kubernetes secret with your Spaces credentials:

```bash
kubectl create secret generic aws-creds \
  --from-literal=access_key=<YOUR_DO_SPACES_ACCESS_KEY> \
  --from-literal=secret_key=<YOUR_DO_SPACES_SECRET_KEY>
```

> 🔐 This secret is mounted as environment variables in the `s3-downloader` container using `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

Also ensure your S3 commands in the init container include the proper endpoint

---

### ✅ Congrats! Your K8s Cluster is Ready

You can now deploy workloads like REPLs, services, and ingress configurations.
