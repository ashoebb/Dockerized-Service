# Dockerized Node.js Service with GitHub Actions Deployment

A complete CI/CD pipeline for a simple Node.js service deployed to AWS EC2 using GitHub Actions and Docker.

## Features

- **Node.js Service**: Express.js app with two routes:
  - `GET /` → Returns "Hello, world!"
  - `GET /secret` → Protected by Basic Auth, returns secret message
- **Dockerized**: Multi-stage Docker build for small production images
- **CI/CD**: GitHub Actions workflows for build, test, and deploy
- **Container Registry**: Images pushed to GitHub Container Registry (ghcr.io)
- **Deployment**: Automated deployment to AWS EC2 via SSH

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker & Docker Compose

### Run Locally

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd dockerized-node-service
   ```

2. Create `.env` file from example:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Start with Docker Compose:
   ```bash
   docker compose up -d
   ```

4. Test the service:
   ```bash
   # Public route
   curl http://localhost:3000/
   # Output: Hello, world!

   # Protected route (with Basic Auth)
   curl -u admin:supersecretpassword http://localhost:3000/secret
   # Output: This is a secret message!
   ```

5. Stop the service:
   ```bash
   docker compose down
   ```

## Project Structure

```
├── .github/
│   └── workflows/
│       ├── ci.yml          # Build and push Docker image to ghcr.io
│       └── deploy.yml      # Deploy to EC2 via SSH
├── .dockerignore           # Files excluded from Docker build
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Local dev & EC2 deployment config
├── package.json            # Node.js dependencies
├── server.js               # Express.js application
└── README.md               # This file
```

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. Go to AWS Console → EC2 → Launch Instance
2. Choose **Ubuntu Server 22.04 LTS** (or 24.04)
3. Instance type: **t3.micro** (free tier eligible)
4. Configure Security Group:
   - SSH (port 22) - Your IP
   - HTTP (port 80) - Anywhere (optional, for reverse proxy)
   - Custom TCP (port 3000) - Anywhere (for direct access)
5. Create/download key pair (`.pem` file)

### 2. Connect and Configure Server

```bash
# Connect to your instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
exit
```

### 3. Generate SSH Key for GitHub Actions

On your **local machine** (not the EC2):

```bash
# Generate a new SSH key for GitHub Actions (no passphrase)
ssh-keygen -t ed25519 -f ~/.ssh/github_actions_deploy -C "github-actions-deploy"

# Copy the PUBLIC key to EC2
ssh-copy-id -i ~/.ssh/github_actions_deploy.pub ubuntu@<EC2_PUBLIC_IP>

# Display the PRIVATE key (copy this for GitHub Secrets)
cat ~/.ssh/github_actions_deploy
```

### 4. Get EC2 Host Key (for known_hosts)

```bash
# Run locally to get the host key
ssh-keyscan -t ed25519 <EC2_PUBLIC_IP>
```

## GitHub Repository Setup

### 1. Create GitHub Repository

1. Create a new repository on GitHub
2. Push your local code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```

### 2. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `AWS_EC2_HOST` | `<EC2_PUBLIC_IP>` | Public IP of your EC2 instance |
| `AWS_EC2_USER` | `ubuntu` | SSH username (default for Ubuntu) |
| `AWS_EC2_SSH_KEY` | `<PRIVATE_KEY>` | Private key from `cat ~/.ssh/github_actions_deploy` |
| `AWS_EC2_KNOWN_HOSTS` | `<HOST_KEY>` | Output from `ssh-keyscan -t ed25519 <EC2_PUBLIC_IP>` |
| `SECRET_MESSAGE` | `Your secret here` | Message for `/secret` route |
| `USERNAME` | `admin` | Basic Auth username |
| `PASSWORD` | `strong-password` | Basic Auth password |

**Note**: `GITHUB_TOKEN` is automatically available - no need to add it.

### 3. Enable GitHub Container Registry

1. Go to **Settings → Actions → General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests**
5. Save

## Deployment

### Automatic Deployment (on push to main)

The deploy workflow triggers automatically after CI succeeds on pushes to `main`.

### Manual Deployment

1. Go to **Actions → Deploy to EC2**
2. Click **Run workflow**
3. Select branch and click **Run workflow**

### Verify Deployment

```bash
# Test public route
curl http://<EC2_PUBLIC_IP>:3000/

# Test protected route
curl -u <USERNAME>:<PASSWORD> http://<EC2_PUBLIC_IP>:3000/secret
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_MESSAGE` | Message returned by `/secret` | "This is a secret message!" |
| `USERNAME` | Basic Auth username | "admin" |
| `PASSWORD` | Basic Auth password | "supersecretpassword" |
| `PORT` | Server port | 3000 |

## Security Best Practices

- ✅ `.env` excluded from Docker image via `.dockerignore`
- ✅ Non-root user in Docker container
- ✅ Multi-stage build for smaller attack surface
- ✅ Secrets stored in GitHub Secrets (not in code)
- ✅ SSH key authentication for deployment
- ✅ Health checks for container reliability
- ✅ Image attestation for supply chain security

## Troubleshooting

### Docker Build Fails
- Check Node.js version compatibility
- Verify `package.json` has correct dependencies

### Deployment Fails
- Verify EC2 Security Group allows SSH (port 22)
- Check SSH key is correct in GitHub Secrets
- Ensure `known_hosts` matches EC2 host key
- Verify Docker is installed on EC2

### Service Not Accessible
- Check EC2 Security Group allows port 3000
- Verify container is running: `docker compose ps`
- Check logs: `docker compose logs`

## License

MIT