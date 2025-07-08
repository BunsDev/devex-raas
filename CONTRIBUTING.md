# 👥 Contributing to Devex

Welcome to the Devex project! We're excited you're here 🎉
Whether you’re fixing a bug, improving docs, or adding a new template — every contribution is valued.

---

## 📖 Before You Start

Make sure to:

- Carefully read the [README.md](../README.md) at the root to understand what Devex is and how it works.
- Explore the `README.md` files inside each subdirectory (`core/`, `runner/`, `templates/`, `web/`, etc.) to get a deeper understanding of each module.
- Use [PULL_REQUEST_TEMPLATE.md](../PULL_REQUEST_TEMPLATE) for creating a Pull Request.

---

## 🔧 Local Setup

> You’ll need:
> - Docker & Docker Compose
> - Node.js (v20+)
> - Go (1.21+)

1. **Fork the repository** to your GitHub account.
2. **Clone your fork:**

```bash
git clone https://github.com/your-username/devex.git
cd devex
````

3. **Create a new branch:**

```bash
git checkout -b feat/your-feature-name
```

Use descriptive names like:

* `feat/add-node-template`
* `fix/typo-in-core`
* `docs/update-template-guide`

---

## 🚀 How to Contribute

You can contribute in many ways:

### 1. 💡 Add a New Template

Follow the [Template Contribution Guide](./templates/README.md) or see [this full workflow](.github/workflows/README.md).

Steps include:

* Add files to `templates/<your-template>/`
* Add Dockerfile to `runner/<your-template>.dockerfile`
* Register the template in:

  * `web/lib/templates.tsx`
  * `core/models/templates.go`

---

### 2. 🐛 Fix a Bug or Improve Code

* Navigate to the relevant module (`core/`, `runner/`, `web/`, etc.).
* Each has its own `README.md` and may contain TODOs, architecture notes, or issues.
* Submit your fix as a PR with a descriptive title and message. Checkout [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md)

---

### 3. 📝 Improve Docs

* You can improve the documentation anywhere — main `README.md`, internal docs, or this `CONTRIBUTING.md`.
* All text contributions are equally valuable!

---

## 🧪 Before Submitting a PR

Make sure to:

* [ ] Rebase from `main` to stay up to date.
* [ ] Run and test your code locally.
* [ ] Ensure templates are under 8MB (checked in CI).
* [ ] Lint your code (if applicable).
* [ ] Add/Update README if your change affects usage.
* [ ] Avoid committing secrets or sensitive info.

---

## 📬 Submitting a Pull Request

Once you're ready:

```bash
git add .
git commit -m "feat: add node.js template"
git push origin feat/add-node-template
```

Then:

1. Open your GitHub fork
2. Click “Compare & Pull Request”
3. Fill out:

   * What you changed
   * Why it matters
   * Anything reviewers should check/test
4. Submit!

---

## ✅ PR Review & Merge

After submission:

* A maintainer (Parth) will review your PR.
* You may get feedback — please respond or update the code as needed.
* Once approved, it will be merged into `main` and deployed automatically (CI/CD pipelines are in place).

---

## 🔐 Required Secrets (for Maintainers)

> Maintainers must configure these in **GitHub → Repo Settings → Secrets > Actions**

| Secret Name              | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `DEPLOY_SSH_PRIVATE_KEY` | For remote stack deployment via SSH     |
| `DO_SPACES_KEY`          | DigitalOcean Spaces Access Key          |
| `DO_SPACES_SECRET`       | DigitalOcean Spaces Secret Key          |
| `DO_SPACES_BUCKET`       | S3-compatible bucket name for templates |
| `DO_SPACES_ENDPOINT`     | Endpoint URL for DigitalOcean Spaces    |

See `.github/workflows/README.md` for more details.

---

## 💬 Need Help?

* Open a [GitHub Issue](https://github.com/parthkapoor-dev/devex/issues)
* Or contact [Parth Kapoor](https://parthkapoor.me) for guidance.

---

Thanks for contributing to Devex 💖
We appreciate your time, code, and energy!
