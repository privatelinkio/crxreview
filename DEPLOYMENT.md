# Deployment Guide

This guide covers deploying CRX Review to GitHub Pages and other hosting environments.

## GitHub Pages Setup

### Automated Deployment with GitHub Actions

This project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on every push to the main branch.

#### Initial Setup

1. **Push to GitHub** (prerequisite):
   - Create a repository on GitHub (ensure it's public for free GitHub Pages)
   - Push your code:
     ```bash
     git remote add origin https://github.com/yourusername/crxreview.git
     git branch -M main
     git push -u origin main
     ```

2. **Enable GitHub Pages**:
   - Navigate to your repository on GitHub
   - Go to **Settings** → **Pages**
   - Under "Build and deployment":
     - Select "GitHub Actions" as the source
     - The workflow will automatically detect and deploy on next push

3. **Workflow Configuration**:
   - The workflow file is located at `.github/workflows/deploy.yml`
   - It runs on every push to the main branch
   - Build artifacts are automatically deployed to the `gh-pages` branch

#### How the Workflow Works

The GitHub Actions workflow performs:

1. **Build Environment Setup**:
   - Checks out code from the repository
   - Sets up Node.js 20
   - Installs npm dependencies with `npm ci`

2. **Build Process**:
   - Runs TypeScript type checking
   - Builds the production bundle with Vite
   - Optimizes and minifies all assets

3. **Deployment**:
   - Uploads build artifacts to GitHub Pages
   - GitHub automatically serves from `https://username.github.io/crxreview/`

#### Accessing Your Deployed Application

Once deployment completes:
- Default URL: `https://your-username.github.io/crxreview/`
- Check deployment status in repository **Actions** tab
- View deployment details by clicking the workflow run

### Custom Domain Configuration

To use a custom domain with GitHub Pages:

#### Step 1: Prepare Your Domain

1. Register or verify ownership of your domain
2. Have access to DNS settings for your domain registrar

#### Step 2: Create CNAME File

1. Create a file named `CNAME` in the `public/` directory:
   ```
   public/CNAME
   ```

2. Add your domain name (one line, no https://):
   ```
   crxreview.example.com
   ```

3. Commit and push:
   ```bash
   git add public/CNAME
   git commit -m "Add custom domain configuration"
   git push origin main
   ```

#### Step 3: Update DNS Records

Configure DNS records with your domain registrar:

**Option A: Using ALIAS/ANAME record (recommended)**
```
Alias/ANAME record: username.github.io
```

**Option B: Using A records**
```
A record: 185.199.108.153
A record: 185.199.109.153
A record: 185.199.110.153
A record: 185.199.111.153
```

**Option C: Using AAAA records (IPv6)**
```
AAAA record: 2606:50c0:8000::153
AAAA record: 2606:50c0:8001::153
AAAA record: 2606:50c0:8002::153
AAAA record: 2606:50c0:8003::153
```

#### Step 4: Enable HTTPS (GitHub Pages)

1. Return to GitHub repository
2. Go to **Settings** → **Pages**
3. Check "Enforce HTTPS" (may take a few minutes to activate)

#### Verification

After DNS propagation (up to 24 hours):
- Visit your custom domain
- Should redirect to your GitHub Pages site
- HTTPS should be enabled automatically

## Alternative Deployment Platforms

### Vercel Deployment

Vercel provides easy GitHub Pages alternative with built-in CI/CD.

#### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select "Import Git Repository"
4. Connect your GitHub account and select the crxreview repository

#### Step 2: Configure Project

1. **Framework Preset**: Select "Vite"
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Install Command**: `npm ci`

#### Step 3: Deploy

1. Click "Deploy"
2. Vercel automatically deploys and provides a preview URL
3. Custom domain configuration available in settings

### Netlify Deployment

Netlify offers similar GitHub integration and free hosting.

#### Step 1: Connect Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize
4. Select the crxreview repository

#### Step 2: Build Settings

- **Base directory**: Leave empty
- **Build command**: `npm run build`
- **Publish directory**: `dist`

#### Step 3: Environment Variables

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. No environment variables required for this project

#### Step 4: Deploy

Click "Deploy site" and wait for the build to complete.

### Manual Static Hosting

For other hosting providers (AWS S3, Google Cloud Storage, etc.):

#### Step 1: Build Production Bundle

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

#### Step 2: Upload Files

Upload the entire contents of the `dist/` folder to your hosting provider:

```bash
# AWS S3 example
aws s3 sync dist/ s3://your-bucket-name/crxreview/ --delete

# Google Cloud Storage example
gsutil -m cp -r dist/* gs://your-bucket-name/crxreview/
```

#### Step 3: Configure Base Path (if needed)

If not deploying to `/crxreview/`, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/', // or your custom path
  // ... rest of config
})
```

Then rebuild:
```bash
npm run build
```

## Build Optimization

### Understanding the Build Output

The production build generates optimized chunks:

```
dist/
├── index.html                    # Main HTML file
├── assets/
│   ├── vendor-{hash}.js         # React ecosystem (~450 KB)
│   ├── syntax-{hash}.js         # Prism.js syntax highlighting
│   ├── zip-{hash}.js            # JSZip archive handling
│   ├── utils-{hash}.js          # Utilities & state management
│   ├── index-{hash}.js          # Application code
│   └── index-{hash}.css         # Tailwind CSS styles
└── vite.svg                      # Static assets
```

### Bundle Size Analysis

Check actual bundle sizes in the build output:

```bash
npm run build
```

Look for the "computing gzip size" section:
```
dist/assets/vendor-*.js          450 kB │ gzip: 142 kB
dist/assets/index-*.js           500 kB │ gzip:  85 kB
dist/assets/index-*.css           21 kB │ gzip:   5 kB
```

### Performance Optimization Tips

1. **Lazy Loading**: Dynamic imports are configured in the build
2. **Code Splitting**: Manual chunks separate vendor libraries
3. **CSS Minification**: Automatic with production build
4. **JavaScript Minification**: Terser configured in `vite.config.ts`
5. **Console Removal**: Console logs removed in production build

## Troubleshooting Deployment

### Issue: Deployment fails with "Cannot find module"

**Cause**: Missing npm dependencies
**Solution**:
```bash
npm install
npm run build
git push origin main
```

### Issue: GitHub Pages shows 404

**Cause**: Base path configuration mismatch
**Solution**: Verify `vite.config.ts` has `base: '/crxreview/'`

### Issue: Assets return 404 after deployment

**Cause**: Base path not correctly set
**Solution**:
1. Check repository name matches base path
2. Verify `vite.config.ts` configuration
3. Clear browser cache and refresh

### Issue: Custom domain not working

**Cause**: DNS records not propagated or CNAME file missing
**Solution**:
1. Check DNS records with: `nslookup yourdomain.com`
2. Verify `public/CNAME` file exists and contains correct domain
3. Wait up to 24 hours for DNS propagation
4. Check GitHub Pages settings for SSL certificate status

### Issue: HTTPS not enabling

**Cause**: DNS or CNAME misconfiguration
**Solution**:
1. Verify DNS is configured correctly
2. Wait for certificate provisioning (5-15 minutes after DNS update)
3. Try disabling and re-enabling "Enforce HTTPS" in GitHub Pages settings

### Issue: Workflow fails with timeout

**Cause**: Large dependencies or slow network
**Solution**:
1. Check workflow logs in Actions tab
2. Verify npm dependencies install correctly locally
3. Consider using `npm ci` instead of `npm install`

## Monitoring Deployment

### GitHub Actions

1. Navigate to repository **Actions** tab
2. Click the latest workflow run
3. View build logs and deployment status
4. Re-run failed workflows if needed

### Performance Monitoring

After deployment, monitor:

1. **Lighthouse Scores**: Use Chrome DevTools
2. **Bundle Size**: Check build output
3. **Page Load Time**: Use browser DevTools
4. **Error Logs**: Check browser console for production errors

## Rollback Procedures

### GitHub Pages Rollback

If deployment causes issues:

1. **Quick Rollback**: Push a previous commit
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Via GitHub UI**:
   - Go to repository Actions tab
   - Click previous successful workflow
   - Re-run the workflow to redeploy that version

3. **Manual Rollback**: Modify and push a fix
   ```bash
   # Fix the issue
   git add .
   git commit -m "Fix deployment issue"
   git push origin main
   ```

## Security Considerations

1. **Sensitive Data**: Never commit API keys or credentials
2. **Environment Variables**: Use GitHub Secrets for sensitive config
3. **HTTPS**: Always enable for production deployments
4. **CORS**: Configure appropriately if using APIs
5. **Content Security Policy**: Add CSP headers if needed

## CI/CD Best Practices

1. **Always use `npm ci`** instead of `npm install` in CI/CD
2. **Run type checking** before building
3. **Test builds locally** before pushing
4. **Use semantic versioning** for releases
5. **Document environment variables** needed for deployment

## Advanced Configuration

### GitHub Actions Secrets

For deployments requiring credentials:

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click "New repository secret"
3. Add secret name and value
4. Reference in workflow: `${{ secrets.SECRET_NAME }}`

### Custom Deploy Hooks

To run custom scripts during deployment:

Edit `.github/workflows/deploy.yml` and add steps:

```yaml
- name: Custom Hook
  run: |
    echo "Running custom deployment hooks..."
    ./scripts/post-deploy.sh
```

### Scheduled Deployments

Deploy on a schedule instead of on push:

```yaml
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly at 2 AM Sunday
```

## Support & Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

For additional help, check the main [README.md](README.md) or review the [IMPLEMENTATION.md](IMPLEMENTATION.md) guide.
