# AWS Amplify Deployment Guide

Complete guide to deploying your PremiumEstate application to AWS Amplify with S3 storage and Cognito authentication.

## Prerequisites

Before you begin, ensure you have:
- ✅ AWS Account with admin access
- ✅ GitHub account
- ✅ AWS CLI installed (`aws --version`)
- ✅ Node.js 18+ and pnpm installed
- ✅ Your application code in a Git repository

## Deployment Steps

### Step 1: Create AWS S3 Bucket

1. **Login to AWS Console**
   - Navigate to S3 service
   - Click "Create bucket"

2. **Configure Bucket**
   ```
   Bucket name: your-realestate-bucket
   Region: us-east-1 (or your preferred region)
   Block Public Access: Uncheck (we'll configure CORS)
   Versioning: Disabled (optional)
   Encryption: Enabled (recommended)
   ```

3. **Configure CORS**
   - Go to bucket → Permissions → CORS
   - Add the following configuration:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

4. **Create Initial Data Files**
   
   Upload your JSON files using AWS CLI:
   ```bash
   aws s3 cp public/storage/properties.json s3://your-realestate-bucket/properties/properties.json
   aws s3 cp public/storage/users.json s3://your-realestate-bucket/properties/users.json
   ```

   Or use the AWS Console:
   - Go to your bucket
   - Create folder: `properties`
   - Upload `properties.json` and `users.json`

### Step 2: Create IAM User for S3 Access

1. **Navigate to IAM**
   - AWS Console → IAM → Users → Add users

2. **Create User**
   ```
   User name: amplify-realestate-user
   Access type: Programmatic access
   ```

3. **Attach Policy**
   
   Create a custom policy with these permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::your-realestate-bucket/*",
           "arn:aws:s3:::your-realestate-bucket"
         ]
       }
     ]
   }
   ```

4. **Save Credentials**
   - Download the access key ID and secret access key
   - Store them securely (you'll need them for environment variables)

### Step 3: Set Up AWS Cognito

#### Option A: Using Amplify CLI (Recommended)

1. **Install Amplify CLI**
   ```bash
   npm install -g @aws-amplify/cli
   ```

2. **Configure Amplify**
   ```bash
   amplify configure
   ```
   Follow the prompts to set up your AWS credentials.

3. **Initialize Amplify in Your Project**
   ```bash
   cd your-project-directory
   amplify init
   ```
   
   Configuration:
   ```
   Project name: realestate
   Environment: prod
   Default editor: Visual Studio Code (or your choice)
   App type: javascript
   Framework: react
   Source directory: src
   Distribution directory: dist
   Build command: pnpm run build
   Start command: pnpm run dev
   ```

4. **Add Authentication**
   ```bash
   amplify add auth
   ```
   
   Configuration:
   ```
   Use default configuration: Default configuration
   How do you want users to sign in?: Email
   Do you want to configure advanced settings?: No
   ```

5. **Deploy to AWS**
   ```bash
   amplify push
   ```

6. **Get Cognito Credentials**
   ```bash
   amplify status
   ```
   
   Save the following:
   - User Pool ID
   - User Pool Client ID

#### Option B: Manual Setup via AWS Console

1. **Navigate to Cognito**
   - AWS Console → Cognito → User Pools

2. **Create User Pool**
   ```
   Step 1: Configure sign-in experience
   - Provider types: Cognito user pool
   - Cognito user pool sign-in options: Email
   
   Step 2: Configure security requirements
   - Password policy: Cognito defaults
   - MFA: No MFA
   
   Step 3: Configure sign-up experience
   - Self-registration: Enabled
   - Required attributes: name, email
   
   Step 4: Configure message delivery
   - Email: Send email with Cognito
   
   Step 5: Integrate your app
   - User pool name: realestate-users
   - App client name: realestate-client
   - Don't generate a client secret
   
   Step 6: Review and create
   ```

3. **Save Credentials**
   - User Pool ID: Found in User Pool overview
   - App Client ID: Found in App integration → App clients

### Step 4: Push Code to GitHub

1. **Initialize Git (if not already done)**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - PremiumEstate application"
   ```

2. **Create GitHub Repository**
   - Go to GitHub.com
   - Click "New repository"
   - Name: `premium-real-estate`
   - Make it private or public
   - Don't initialize with README (you already have one)

3. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/premium-real-estate.git
   git branch -M main
   git push -u origin main
   ```

### Step 5: Deploy to AWS Amplify

1. **Open Amplify Console**
   - AWS Console → AWS Amplify
   - Click "New app" → "Host web app"

2. **Connect Repository**
   - Select: GitHub
   - Authorize AWS Amplify to access your GitHub
   - Select your repository: `premium-real-estate`
   - Select branch: `main`

3. **Configure Build Settings**
   
   Amplify auto-detects Vite, but verify these settings:
   
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install -g pnpm
           - pnpm install
       build:
         commands:
           - pnpm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

4. **Add Environment Variables**
   
   In Amplify Console → App settings → Environment variables:
   
   | Key | Value | Example |
   |-----|-------|---------|
   | `VITE_PRODUCTION` | `true` | `true` |
   | `VITE_AWS_ACCESS_KEY_ID` | Your IAM access key | `AKIAIOSFODNN7EXAMPLE` |
   | `VITE_AWS_SECRET_ACCESS_KEY` | Your IAM secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
   | `VITE_AWS_REGION` | Your AWS region | `us-east-1` |
   | `VITE_S3_BUCKET_NAME` | Your S3 bucket name | `your-realestate-bucket` |
   | `VITE_S3_FOLDER_NAME` | S3 folder prefix | `properties` |
   | `VITE_USER_POOL_ID` | Cognito User Pool ID | `us-east-1_xxxxxxxxx` |
   | `VITE_USER_POOL_CLIENT_ID` | Cognito Client ID | `1234567890abcdefghij` |
   | `VITE_AWS_COGNITO_REGION` | Cognito region | `us-east-1` |

5. **Advanced Settings (Optional)**
   
   - **Custom Domain**: Add your custom domain if you have one
   - **Rewrites and redirects**: Add SPA redirect rule:
     ```
     Source: </^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf)$)([^.]+$)/>
     Target: /index.html
     Type: 200 (Rewrite)
     ```

6. **Save and Deploy**
   - Click "Save and deploy"
   - Amplify will:
     1. Provision resources
     2. Build your app
     3. Deploy to CDN
     4. Provide a URL

### Step 6: Verify Deployment

1. **Check Build Status**
   - Monitor the build logs in Amplify Console
   - Ensure all phases complete successfully

2. **Test Your Application**
   - Open the Amplify-provided URL
   - Test authentication (sign up/login)
   - Test property listing
   - Test admin panel (if you have admin user)

3. **Common Issues**
   
   **Build fails:**
   ```bash
   # Check Node version in build settings
   # Should be 18 or higher
   ```
   
   **Images not loading:**
   ```bash
   # Verify S3 CORS configuration
   # Check AWS credentials in environment variables
   # Ensure bucket policy allows read access
   ```
   
   **Authentication fails:**
   ```bash
   # Verify Cognito User Pool IDs
   # Check Cognito region matches your setup
   # Ensure no typos in environment variables
   ```

### Step 7: Set Up Continuous Deployment

Amplify automatically sets up CI/CD:

1. **Auto-Deploy on Push**
   - Push to `main` branch triggers automatic deployment
   ```bash
   git add .
   git commit -m "Update feature"
   git push origin main
   ```

2. **Branch Deployments**
   - Create feature branches for testing:
   ```bash
   git checkout -b feature/new-feature
   git push origin feature/new-feature
   ```
   - Amplify can deploy each branch separately

3. **Pull Request Previews**
   - Enable in: Amplify Console → Previews
   - Automatic preview deployments for PRs

## Post-Deployment

### Create Admin User

1. **Sign up through the app**
   - Use your deployed URL
   - Create a user account

2. **Update User Role in S3**
   
   ```bash
   # Download users.json
   aws s3 cp s3://your-realestate-bucket/properties/users.json users.json
   
   # Edit users.json and change role to "admin"
   # Find your user and update:
   {
     "id": "user_xxxxx",
     "email": "your@email.com",
     "role": "admin"  // Changed from "user"
   }
   
   # Upload back to S3
   aws s3 cp users.json s3://your-realestate-bucket/properties/users.json
   ```

3. **Log out and log back in**
   - Admin panel will now appear in navbar

### Custom Domain Setup

1. **In Amplify Console**
   - Domain management → Add domain
   - Enter your domain: `www.yourdomain.com`

2. **DNS Configuration**
   - Add CNAME record in your DNS provider
   - Point to Amplify-provided domain

3. **SSL Certificate**
   - Amplify automatically provisions SSL
   - Wait for DNS validation

## Monitoring and Maintenance

### View Logs
```bash
# In Amplify Console
App → Build history → View logs
```

### Monitor Metrics
- Amplify Console → Monitoring
- View traffic, errors, and performance

### Update Environment Variables
- Amplify Console → Environment variables
- Make changes and redeploy

### Rollback Deployment
```bash
# In Amplify Console
Build history → Select previous build → Redeploy
```

## Cost Estimation

### AWS Amplify
- Build minutes: First 1000 minutes/month free
- Hosting: First 15GB served free
- After free tier: ~$0.01 per build minute, ~$0.15/GB data transfer

### S3 Storage
- First 5GB free
- After: ~$0.023/GB/month
- Data transfer: First 100GB/month free

### Cognito
- First 50,000 MAUs free
- After: Starts at $0.0055/MAU

**Estimated Monthly Cost for Small/Medium Site**: $5-20

## Security Best Practices

1. **Rotate IAM Credentials**
   ```bash
   # Every 90 days, create new access keys
   # Update in Amplify environment variables
   ```

2. **Enable CloudWatch Logs**
   - Monitor for suspicious activity
   - Set up alarms for errors

3. **Use Secrets Manager** (Optional)
   - Store sensitive credentials
   - Reference in Amplify

4. **Enable MFA for Admin Users**
   - Add extra security layer
   - Configure in Cognito

## Troubleshooting

### Build Fails with "pnpm not found"
```yaml
# Ensure preBuild includes pnpm installation
preBuild:
  commands:
    - npm install -g pnpm
    - pnpm install
```

### Environment Variables Not Loading
```bash
# Prefix must be VITE_ for Vite to expose them
# Must start with VITE_ in .env
# Restart build after adding variables
```

### S3 Permission Errors
```json
# Check IAM policy includes:
{
  "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
  "Resource": "arn:aws:s3:::bucket-name/*"
}
```

### CORS Errors
```bash
# Verify CORS in S3 bucket
# Ensure AllowedOrigins includes your Amplify domain
# Or use "*" for all origins during testing
```

## Support

- **AWS Amplify Docs**: https://docs.amplify.aws
- **AWS S3 Docs**: https://docs.aws.amazon.com/s3
- **AWS Cognito Docs**: https://docs.aws.amazon.com/cognito

## Next Steps

- ✅ Set up custom domain
- ✅ Configure email templates in Cognito
- ✅ Add CloudWatch monitoring
- ✅ Set up automated backups for S3
- ✅ Configure CloudFront CDN
- ✅ Add AWS WAF for security

---

🎉 **Congratulations!** Your PremiumEstate application is now live on AWS Amplify!

Visit your app at: `https://main.xxxxxx.amplifyapp.com`
