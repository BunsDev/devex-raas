# 📦 GitHub Actions Workflows

This folder contains CI/CD pipelines for the Devex project. Each workflow automates deployment and image publishing for various components.

## 🔐 Required Repository Secrets

Before using these workflows, make sure the following secrets are added under:
**GitHub Repo → Settings → Secrets → Actions**

| Secret Name               | Description                                 |
|--------------------------|---------------------------------------------|
| `DEPLOY_SSH_PRIVATE_KEY` | SSH private key for remote deploy user      |
| `DO_SPACES_KEY`          | Access key for DigitalOcean Spaces          |
| `DO_SPACES_SECRET`       | Secret key for DigitalOcean Spaces          |
| `DO_SPACES_BUCKET`       | Bucket name where templates will be synced  |
| `DO_SPACES_ENDPOINT`     | Endpoint URL for DigitalOcean Spaces        |

---

## 🧱 Workflows Summary

### `core-pipeline.yaml`

- **Triggers**: On changes in `core/` or the workflow file itself.
- **What it does**:
  - Builds the Docker image for the Core service.
  - Pushes it to GHCR.
  - Deploys the updated Core service via Docker Stack to a remote VPS using SSH.

📄 See also: [`core/DEPLOYMENT.md`](../../core/DEPLOYMENT.md)

---

### `runner-pipeline.yaml`

- **Triggers**: On changes in `runner/` or the workflow file.
- **What it does**:
  - Dynamically finds all Dockerfiles in `runner/`.
  - Builds and pushes one Docker image per template runner to GHCR.
  - Tags each image with both `:latest` and the current `git sha`.

---

### `templates-pipeline.yaml`

- **Triggers**: On changes in any folder inside `templates/` _(excluding README files)_.
- **What it does**:
  - Checks if any individual template folder exceeds 8MB.
  - If all are within limits, syncs the `templates/` directory to DigitalOcean Spaces (S3-compatible).

---
