# Deployment

## Platform: Railway
## URL: https://bipbip-production.up.railway.app
## Deploy Command: `railway up -d`
## Environment Variables:
- `ADMIN_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL` (Set to `https://bipbip-production.up.railway.app`)
- `NEXT_PUBLIC_ENABLE_ANALYTICS` (true)
- `NEXT_PUBLIC_ENABLE_ADS` (true)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- `NEXT_PUBLIC_ADSENSE_CLIENT`

## Custom Domain:
Currently using the default Railway domain. To add a custom domain later:
1. Run `railway domain` and follow instructions.
2. Update `NEXT_PUBLIC_SITE_URL` via `railway variables set NEXT_PUBLIC_SITE_URL=https://your-domain.com`.

## Rollback:
To rollback to a previous version, use the Railway Dashboard:
1. Go to your Project -> Service -> Deployments.
2. Find the previous stable deployment.
3. Click "Redeploy".
