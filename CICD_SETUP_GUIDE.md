# CI/CD Pipeline Setup Guide for HotTip Inventory

## Overview
This guide will set up an automated CI/CD pipeline using GitHub Actions to automatically build and deploy your project to your VPS when you push to the main branch.

**Your VPS Deployment Path:** `/var/www/hottip-inventory1`

---

## PART 1: SSH KEY GENERATION

### Step 1: Generate SSH Key Pair on Your Local Machine (PowerShell)

```powershell
# Generate SSH key
ssh-keygen -t ed25519 -C "your-email@example.com" -f "$env:USERPROFILE\.ssh\hottip_deploy"
```

**When prompted:**
- Press Enter (for default location) or specify path
- Enter a strong passphrase (or leave empty for automation)

This creates two files:
- `hottip_deploy` (private key - NEVER share)
- `hottip_deploy.pub` (public key)

### Step 2: Add Public Key to VPS

```bash
# On VPS (via SSH)
mkdir -p ~/.ssh
cat >> ~/.ssh/authorized_keys << 'EOF'
# Paste content of hottip_deploy.pub here
EOF
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Step 3: Add Private Key to GitHub Secrets

1. Go to **GitHub Repository → Settings → Secrets and variables → Actions**
2. Click **"New repository secret"**
3. Name: `SSH_PRIVATE_KEY`
4. Value: Copy entire content of `hottip_deploy` file
5. Click **"Add secret"**

---

## PART 2: VPS SETUP & CONFIGURATION

### Prerequisites on VPS

1. **Install Node.js & npm**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PM2 globally**
```bash
sudo npm install -g pm2
pm2 startup
pm2 save
```

3. **Install Git**
```bash
sudo apt-get install git
```

4. **Create project directory**
```bash
mkdir -p /var/www/hottip
cd /var/www/hottip
git init --bare repo.git
mkdir -p app
```

5. **Create post-receive hook** (Auto-deploy on push)
```bash
nano /var/www/hottip/repo.git/hooks/post-receive
```

Add this content:
```bash
#!/bin/bash
cd /var/www/hottip/app
git fetch origin
git reset --hard origin/main
npm install
cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..
pm2 restart hottip || pm2 start dist/index.js --name hottip
```

Save: `Ctrl+O → Enter → Ctrl+X`

```bash
chmod +x /var/www/hottip/repo.git/hooks/post-receive
```

6. **Set up environment file on VPS**
```bash
cd /var/www/hottip/app
nano .env
```

Add your VPS environment variables (production values):
```
VITE_API_BASE_URL=https://your-domain.com/api
JWT_SECRET=your-production-secret
DEV_TOKEN_SECRET=your-production-token
DATABASE_URL=postgresql://...production...
VITE_WS_URL=wss://your-domain.com
API_BASE_URL=https://your-domain.com
CLIENT_ORIGIN=https://your-domain.com
```

---

## PART 3: GITHUB REPOSITORY SETUP

### Step 1: Create GitHub Secrets

Go to **Settings → Secrets and variables → Actions**

Add these 3 secrets:

| Secret Name | Value |
|------------|-------|
| `VPS_HOST` | Your VPS IP (e.g., 192.168.1.100) |
| `VPS_USER` | VPS username (usually `root` or `ubuntu`) |
| `VPS_SSH_KEY` | Content of your `hottip_deploy` private key file |

### Step 2: Create GitHub Actions Workflow

Create file: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up SSH
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan -H ${{ secrets.SSH_HOST }} >> ~/.ssh/known_hosts

      - name: Deploy to VPS
        run: |
          ssh -i ~/.ssh/id_ed25519 -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} "cd ${{ secrets.DEPLOY_PATH }} && git pull origin main && npm install && cd client && npm install && npm run build && cd ../server && npm install && cd .. && pm2 restart hottip || pm2 start dist/index.js --name hottip"

      - name: Verify deployment
        run: |
          ssh -i ~/.ssh/id_ed25519 -p ${{ secrets.SSH_PORT }} ${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }} "pm2 status"
```

---

## PART 4: YOUR CURRENT MANUAL PROCESS (Reference)

Currently, you're doing this manually:

```powershell
# 1. Connect to VPS
ssh -i ~/.ssh/hottip_deploy user@your-vps-ip

# 2. On VPS - Go to product directory
cd /var/www/hottip/app

# 3. Pull latest code
git pull origin main

# 4. Build client
cd client
npm install
npm run build
cd ..

# 5. Install server dependencies
cd server
npm install
cd ..

# 6. Restart application
pm2 restart hottip
```

---

## PART 5: WORKFLOW - WHERE TO PERFORM EACH STEP

### LOCAL (PowerShell) - Do Once:
- [ ] Generate SSH keys
- [ ] Add public key to GitHub secrets
- [ ] Create `.github/workflows/deploy.yml` file
- [ ] Push to GitHub

### VPS (SSH) - Do Once:
- [ ] Install Node.js
- [ ] Install PM2
- [ ] Create project directories
- [ ] Set up post-receive hook
- [ ] Create `.env` file with production values
- [ ] Test git clone access

### Automatic (After Push to main):
- [ ] GitHub Actions automatically runs
- [ ] Code is built
- [ ] Code is deployed to VPS
- [ ] Application is restarted

---

## QUICK START CHECKLIST

### ✅ Step 1: Local (PowerShell)
```powershell
# Generate SSH key
ssh-keygen -t ed25519 -f "$env:USERPROFILE\.ssh\hottip_deploy"

# Copy public key content
Get-Content "$env:USERPROFILE\.ssh\hottip_deploy.pub" | Set-Clipboard
```

### ✅ Step 2: VPS (SSH)
```bash
# Add public key
echo "your-public-key" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Verify SSH works from local
# Exit and test: ssh -i hottip_deploy user@vps-ip
```

### ✅ Step 3: GitHub
1. Add 3 secrets to **Settings → Secrets and variables → Actions**:
   - `VPS_HOST` (your VPS IP)
   - `VPS_USER` (VPS username)
   - `VPS_SSH_KEY` (private key content)
2. Create `.github/workflows/deploy.yml`
3. Push to main branch
4. Check **Actions** tab for deployment logs

### ✅ Step 4: Test
```bash
# Push a small change to main branch
git push origin main

# Monitor on GitHub Actions tab
# SSH into VPS and check:
pm2 logs hottip
```

---

## ALTERNATIVE: Using Replit Deployment (If Using Replit)

Since you have `.replit` in your project, if your VPS is Replit:

1. Install npm packages: `npm install`
2. Set environment variables in Replit secrets
3. Use Replit's built-in deployment features

---

## TROUBLESHOOTING

| Issue | Solution |
|-------|----------|
| SSH key permission denied | Check file permissions: `chmod 600 ~/.ssh/hottip_deploy` |
| GitHub Actions fails | Check SSH_HOST, SSH_USER in secrets match your VPS |
| npm install timeout | Increase Node.js heap: `export NODE_OPTIONS="--max-old-space-size=4096"` |
| PM2 restart fails | Check error logs: `pm2 logs hottip` |
| .env file not found | Create `.env` on VPS with production values |
| Port conflicts | Check running processes: `lsof -i :5000` |

---

## MANUAL DEPLOYMENT (When You Need To)

If you need to deploy manually without GitHub Actions:

```powershell
# On PowerShell
ssh -i "$env:USERPROFILE\.ssh\hottip_deploy" user@vps-ip

# On VPS
cd /var/www/hottip/app
git pull origin main
npm install
cd client && npm install && npm run build && cd ..
cd server && npm install && cd ..
pm2 restart hottip
```

---

## SECURITY BEST PRACTICES

1. ✅ Never commit `.env` file (already in .gitignore)
2. ✅ Use strong passphrases for SSH keys
3. ✅ Rotate SSH keys every 6 months
4. ✅ Use different keys for different services
5. ✅ Monitor GitHub Actions logs for failed deployments
6. ✅ Keep VPS packages updated: `sudo apt update && sudo apt upgrade`
7. ✅ Use firewall to restrict SSH access: `sudo ufw allow 22`

