# GitHub Actions Deployment

This directory contains GitHub Actions workflows for automated deployment to your Ubuntu server.

## Workflow: Deploy to Ubuntu Server

### Overview

The `deploy.yml` workflow automatically deploys your application to an Ubuntu server via SSH when code is pushed to the main branch.

### What it does:

1. **Checkout code** - Gets the latest code from the repository
2. **Setup SSH** - Configures SSH access to your server
3. **Create environment file** - Generates `.env` file from GitHub secrets
4. **Copy environment file** - Transfers the `.env` file to your server
5. **Deploy** - Connects to server, pulls latest code, and starts Docker services
6. **Verify** - Checks that all services are running correctly

### Required GitHub Secrets

You need to configure these secrets in your GitHub repository:

#### SSH Configuration
- `SSH_PRIVATE_KEY` - Your SSH private key for server access
- `SSH_USER` - Username for SSH connection (e.g., `ubuntu`, `root`)
- `SERVER_HOST` - Server IP address or hostname

#### Application Secrets
- `AUTH_TOKEN` - Authentication token for your application
- `HEX_ENCRYPTION_KEY` - Encryption key for hex operations
- `ALLOWED_ORIGINS` - CORS allowed origins (optional, defaults to `*`)

### Setting up GitHub Secrets

#### Step-by-Step Guide:

1. **Navigate to your GitHub repository**
   - Go to your repository on GitHub.com
   - Make sure you're logged in and have admin access to the repo

2. **Access the Secrets settings**
   - Click on the **Settings** tab (top menu bar of your repo)
   - In the left sidebar, click on **Secrets and variables**
   - Click on **Actions** from the dropdown

3. **Add each secret**
   - Click the green **New repository secret** button
   - Enter the secret name and value
   - Click **Add secret**

#### Required Secrets to Add:

**SSH Configuration:**
```
Name: SSH_PRIVATE_KEY
Value: [Your complete SSH private key - see SSH Key Setup below]

Name: SSH_USER  
Value: ubuntu
(or whatever username you use to SSH into your server)

Name: SERVER_HOST
Value: 192.168.1.100
(replace with your correct server IP address or domain name)
```

**Application Secrets:**
```
Name: AUTH_TOKEN
Value: [Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"]

Name: HEX_ENCRYPTION_KEY
Value: Your secure string for generating hex values

Name: ALLOWED_ORIGINS
Value: *
(or specify your allowed domains like: https://yourdomain.com,https://api.yourdomain.com)
```

#### Visual Guide:

1. **Repository Settings**
   ```
   Your Repo → Settings → Secrets and variables → Actions
   ```

2. **Add Secret Form**
   ```
   Name: SSH_PRIVATE_KEY
   Secret: -----BEGIN OPENSSH PRIVATE KEY-----
           [your private key content here]
           -----END OPENSSH PRIVATE KEY-----
   ```

3. **Verify Secrets Added**
   - You should see all secrets listed (values are hidden)
   - Green checkmark indicates successful addition

#### Quick Commands to Generate Secrets:

```bash
# Generate AUTH_TOKEN (32-byte hex string)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Get your SSH private key content
cat ~/.ssh/id_rsa
# Copy the ENTIRE output including -----BEGIN/END-----
```

### SSH Key Setup

1. **Generate SSH key pair** (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   ```

2. **Add public key to server**:
   ```bash
   # Copy public key to server
   ssh-copy-id -i ~/.ssh/id_rsa.pub user@your-server-ip

   # Run by: 
   ssh -i path_to/.ssh/id_rsa 'user@ip'
   
   # Or manually append to authorized_keys
   cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
   ```

3. **Add private key to GitHub secrets**:
   - Copy the entire private key file content
   - Add it as `SSH_PRIVATE_KEY` secret in GitHub

### Server Requirements

Your Ubuntu server must have:
- **Docker** and **Docker Compose** installed
- **Git** installed
- **Make** installed (for Makefile commands)
- **SSH access** configured
- **Application directory** structure: `~/apps/Proxy/`

### Workflow Triggers

The workflow runs on:
- **Push** to `main` or `master` branch
- **Pull request** to `main` or `master` branch
- **Manual trigger** via GitHub Actions interface

### Manual Deployment

You can manually trigger the deployment:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy to Ubuntu Server** workflow
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

### Troubleshooting

#### SSH Connection Issues
```bash
# Test SSH connection manually
ssh -i /path/to/private/key user@server-ip

# Check if key is properly formatted (no extra spaces/newlines)
```

#### Docker Issues
```bash
# Check if Docker is running on server
sudo systemctl status docker

# Check Docker Compose version
docker compose version
```

#### Application Issues
```bash
# Check logs on server
cd ~/apps/Proxy/docker
make logs

# Check service status
make status
```

### Security Best Practices

1. **Use dedicated SSH key** for GitHub Actions
2. **Limit SSH key permissions** on server
3. **Use environment variables** for sensitive data
4. **Regularly rotate secrets**
5. **Monitor deployment logs**

### Example Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
mkdir -p ~/apps
cd ~/apps
git clone https://github.com/yourusername/Tunnel.git Proxy

# Setup permissions
sudo usermod -aG docker $USER
```

### Monitoring

The workflow includes verification steps that check:
- Service status after deployment
- Container health checks
- Application responsiveness

### Environment Variables

The workflow creates a `.env` file with these variables:
- `NODE_ENV=production`
- `PORT=8080`
- `HOST=0.0.0.0`
- `LOG_LEVEL=info`
- `METRICS_ENABLED=true`
- `COMPRESSION_ENABLED=true`
- `FORCE_CONSOLE_OUTPUT=true`
- `MONGODB_URI=mongodb://mongo:27017/proxy`
- `REDIS_URL=redis://redis:6379`
- Plus any secrets you configure

### Customization

You can modify the workflow to:
- Deploy to different branches
- Add additional verification steps
- Include database migrations
- Send notifications on deployment success/failure
- Deploy to multiple servers

### Support

If you encounter issues:
1. Check the Actions logs in GitHub
2. Verify all secrets are correctly configured
3. Test SSH connection manually
4. Check server logs and Docker status
