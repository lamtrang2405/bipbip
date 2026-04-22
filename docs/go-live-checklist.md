# Go-live Checklist

## Infrastructure
- [ ] Create Supabase production project.
- [ ] Run `supabase/schema.sql` on production database.
- [ ] Configure environment variables in Vercel.
- [ ] Set `NEXT_PUBLIC_SITE_URL` to production domain.

## Security
- [ ] Set strong `ADMIN_PASSWORD`.
- [ ] Restrict admin access path in monitoring alerts.
- [ ] Verify RLS policies with anonymous and admin users.

## Content
- [ ] Seed at least 10 stories and 30+ chapters.
- [ ] Ensure each story has unique title, slug, and summary.
- [ ] Verify chapter ordering and prev/next navigation.

## Tracking
- [ ] Connect `/api/analytics` to storage or GA4.
- [ ] Validate event payloads for page/story/chapter/search.
- [ ] Create dashboard for chapter completion and retention.
