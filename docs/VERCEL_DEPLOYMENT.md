# Vercel Deployment Configuration

## Environment Variables

To fix the 401 error when loading metadata on Vercel, you need to set the `NEXT_PUBLIC_SITE_URL` environment variable.

### Setting Up on Vercel

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Name**: `NEXT_PUBLIC_SITE_URL`
   - **Value**: Your production URL (e.g., `https://your-domain.vercel.app` or your custom domain)
   - **Environments**: Select all (Production, Preview, Development)

4. **Redeploy** your application for the changes to take effect

### Why This Is Needed

When API routes run on the server side in Vercel, they need to fetch static JSON files from the `/public` directory. The original code tried to use `process.env.VERCEL_URL`, which can cause issues:

- Preview deployments may have Vercel's authentication enabled
- The `VERCEL_URL` format might not include the protocol correctly
- Fetching from the deployment URL itself can cause circular dependency issues

By setting `NEXT_PUBLIC_SITE_URL` to your public production URL, server-side fetch calls will work correctly without authentication issues.

### Local Development

For local development, the code falls back to `http://localhost:3000`, so no environment variable is needed locally.

### Alternative: Custom Domain

If you're using a custom domain, use that as the `NEXT_PUBLIC_SITE_URL`:

```
NEXT_PUBLIC_SITE_URL=https://marxists-explorer.com
```

## Verifying the Fix

After setting the environment variable and redeploying:

1. Check the deployment logs for any errors
2. Visit your site and navigate to different categories
3. The metadata should load without 401 errors
4. Check the browser console for any warnings

## Troubleshooting

### Still Getting 401 Errors?

1. **Verify the environment variable is set correctly**:
   - Check Vercel dashboard → Settings → Environment Variables
   - Ensure it's applied to all environments
   
2. **Redeploy after setting**:
   - Environment variable changes require a redeploy
   - Go to Deployments → ⋮ (menu) → Redeploy
   
3. **Check the URL format**:
   - Must include `https://`
   - No trailing slash
   - Use your production domain

### Preview Deployments with Authentication

If you have Vercel's password protection enabled on preview deployments:

- The `NEXT_PUBLIC_SITE_URL` should point to your production URL, not preview URLs
- Preview deployments will fetch data from production
- This is acceptable as the data is static

### Performance Note

On Vercel, API routes that fetch from themselves add latency. For better performance in the future, consider:
- Using Edge Functions
- Implementing proper caching headers
- Moving to static generation where possible

