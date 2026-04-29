# Go-live Checklist

## Infrastructure
- [ ] Create Supabase production project.
- [ ] Run `supabase/schema.sql` on production database.
- [ ] Configure environment variables in Railway (or equivalent non-Vercel platform).
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain.

## Security
- [ ] Set strong `ADMIN_PASSWORD`.
- [ ] Restrict admin access path in monitoring alerts.
- [ ] Verify RLS policies with anonymous and admin users.

## Content
- [ ] Seed at least 10 stories and 30+ chapters.
- [ ] Ensure each story has unique title, slug, and summary.
- [ ] Verify chapter ordering and prev/next navigation.

## Runtime/Health
- [ ] Docker image build pass.
- [ ] Container start pass (`npm run start` in container).
- [ ] Health endpoint `/api/health` returns `{"ok":true}`.

## Tracking
- [ ] Connect `/api/analytics` to storage or GA4.
- [ ] Validate event payloads for page/story/chapter/search.
- [ ] Create dashboard for chapter completion and retention.
