# Deployment Guide

This guide explains how to deploy the Meal Planner app to various platforms.

## Vercel Deployment (Recommended)

Vercel is perfect for static sites and has excellent free tier support.

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Follow the prompts**:
   - Set up and deploy? **Yes**
   - Which scope? (Choose your account)
   - Link to existing project? **No** (for first deployment)
   - Project name? (Press Enter for default or enter custom name)
   - Directory? (Press Enter for current directory `.`)

5. **Production deployment**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect settings (no build command needed)
   - Click "Deploy"

3. **Automatic deployments**:
   - Every push to `main` branch = production deployment
   - Every pull request = preview deployment

### Vercel Configuration

The project includes `vercel.json` which:
- Configures static file serving
- Sets up proper routing for SPA
- Adds security headers
- Sets correct MIME types for JS/CSS files

## Alternative Platforms

### Netlify

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy
   netlify deploy --prod
   ```

Or drag and drop the folder to [app.netlify.com/drop](https://app.netlify.com/drop)

### GitHub Pages

1. **Push to GitHub** (as above)

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` / `master`
   - Folder: `/ (root)`
   - Save

3. **Note**: GitHub Pages works, but you may need to adjust paths if using a custom domain with subdirectory.

### Cloudflare Pages

1. **Push to GitHub** (as above)

2. **Connect to Cloudflare Pages**:
   - Go to Cloudflare Dashboard → Pages
   - Connect your GitHub repository
   - Build settings:
     - Build command: (leave empty)
     - Build output directory: `.`
   - Deploy

## Post-Deployment Checklist

- [ ] Test all navigation (Home, Shopping List, Daily Plans)
- [ ] Test shopping list checkboxes and persistence
- [ ] Verify localStorage works (check items, refresh page)
- [ ] Test on mobile device
- [ ] Check console for any errors
- [ ] Verify all assets load correctly

## Custom Domain

### Vercel
1. Go to project settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### Netlify
1. Go to site settings → Domain management
2. Add custom domain
3. Configure DNS

## Environment Variables

Currently, the app doesn't require any environment variables. If you add features later (like analytics), you can add them in:
- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Build & Deploy → Environment

## Troubleshooting

### Module import errors
- Ensure all file paths use relative paths (they do)
- Check browser console for 404 errors
- Verify `vercel.json` routing is correct

### localStorage not working
- Check if site is served over HTTPS (required for some browsers)
- Verify browser allows localStorage (not in private/incognito mode)

### Styling issues
- Clear browser cache
- Check that CSS file is loading (Network tab)
- Verify paths in `index.html` are correct

## Performance Tips

The app is already optimized, but for even better performance:
- Consider adding a service worker for offline support (future enhancement)
- Enable Vercel's automatic compression
- Use Vercel Analytics (optional, requires account upgrade)
