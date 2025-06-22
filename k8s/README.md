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
```

---

### Step 1: Create a new Cluster

You can create a new cluster on Cloud (DigitalOcean, AWS, Azure) or test locally using `kind`.

To create a local Kind cluster:

```bash
kind create cluster --name devex-cluster
```

To verify the cluster is running:

```bash
kubectl get nodes
```

Sample output:

```
NAME                          STATUS   ROLES           AGE   VERSION
devex-cluster-control-plane   Ready    control-plane   45m   v1.33.1
```

---

### Step 2: Install NGINX Ingress Controller

You can use Helm (recommended) or apply a pre-generated YAML manifest.

**Create the ingress-nginx namespace:**

```bash
kubectl create namespace ingress-nginx
```

#### Option 1: Install using Helm

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx --namespace ingress-nginx
```

#### Option 2: Use pre-generated YAML

> Skip if you've already installed via Helm.

```bash
helm template ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx > ./ingress-controller.yaml

kubectl apply -f ./ingress-controller.yaml
```

---

### Step 3: (Kind only) Port Forwarding for Local Testing

In `kind`, LoadBalancer services do not work out of the box. Use port forwarding instead.

Check if NGINX is running:

```bash
kubectl -n ingress-nginx get pods
kubectl -n ingress-nginx get svc
```

Forward traffic to your local machine:

```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 8000:80
```

Now access Ingress at:
➡️ [http://localhost:8000/](http://localhost:8000/)

---

### Step 4: Load Local Docker Image into the Cluster (If Needed)

If you're not using a remote registry for your `runner-service` image:

```bash
kind load docker-image runner-service:latest
```

Skip if the image is pulled from DockerHub or GHCR.

---

### Step 5: Add Secrets for DigitalOcean Spaces Access

For the `s3-downloader` init container to fetch workspace files:

```bash
kubectl create secret generic aws-creds \
  --from-literal=access_key=<YOUR_DO_SPACES_ACCESS_KEY> \
  --from-literal=secret_key=<YOUR_DO_SPACES_SECRET_KEY>
```

These are mounted into the Pod as `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

---

### Step 6: Install cert-manager and Let’s Encrypt Issuer

We use **cert-manager** to automatically provision TLS certificates using **Let’s Encrypt**.

* cert-manager handles:

  * Creating ACME challenges via Ingress
  * Issuing certificates
  * Storing them in a Kubernetes `Secret`
  * Automatically renewing them before expiry

#### 1. Install cert-manager

```bash
kubectl apply -f ./cert-manager.yaml
```

This installs the CRDs and core cert-manager components.

#### 2. Create Let's Encrypt ClusterIssuer

```bash
kubectl apply -f ./cert-issuer-nginx-ingress.yaml
```

This file defines a `ClusterIssuer` named `letsencrypt-cluster-issuer`. It uses HTTP-01 challenge via the Ingress controller (`nginx`) to verify ownership of the domain.

#### 3. Secret: tls-secret

Certificates are issued and saved in a secret named `tls-secret`. This is referenced in your Ingress definitions:

```yaml
tls:
  - hosts:
      - repl.parthkapoor.me
    secretName: tls-secret
```

cert-manager automatically renews certificates before expiration.

---

### 🔐 Important TLS Notes

* Make sure your domain (`repl.parthkapoor.me`) points to your Ingress controller’s external IP via an `A` record.
* Ensure port `80` and `443` are open on your VPS/cluster node.
* The ACME challenge requires access to `/.well-known/acme-challenge/...` via HTTP.
* You must configure `ingress-nginx` with:

  ```yaml
  strict-validate-path-type: "false"
  ```

  in the `ingress-nginx` ConfigMap to allow `pathType: Exact`.

---

### ✅ Congrats! Your K8s Cluster is Ready for TLS-enabled REPLs

You can now:

* Create dynamic workloads (`/repl-id`)
* Access them via `https://repl.parthkapoor.me/repl-id`
* Get certificates managed and auto-renewed via cert-manager

---
