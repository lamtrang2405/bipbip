# NangTho Studio (Author-First MVP)

Web reading product similar to meokammap, optimized for personal story publishing first.

## Stack
- Next.js App Router + TypeScript + Tailwind CSS.
- Supabase (Postgres/Auth/RLS-ready).
- Vercel deployment target.

## Local setup
1. Copy env:
   - `cp .env.example .env.local`
2. Update `.env.local` values (Supabase + admin password).
3. Run dev server:
   - `npm run dev`

## MVP routes
- `/` home (featured/new/full)
- `/stories` listing + tag filter
- `/stories/[slug]` story detail
- `/stories/[slug]/[chapterSlug]` chapter reader
- `/search` search stories
- `/admin/login` admin authentication
- `/admin` admin CMS (create story with multi-chapter input, upload thumbnail, excel import)

## CMS storage
- Story/chapter data created in CMS is persisted to `data/stories.json`.
- Uploaded covers are stored in `public/uploads/covers`.
- Story metadata supported in CMS: title, author, summary, tags, completion status, total chapters, thumbnail, category.
- Excel import available at `/admin`:
  - Download template: `/admin/template/excel`
  - Upload `.xlsx/.xls` with columns: `title, author, summary, tags, completionStatus, totalChaptersPlanned, thumbnailUrl, category, chapterTitle, chapterContent`.

## Supabase schema and RLS
- SQL file: `supabase/schema.sql`
- Includes tables: stories, chapters, tags, story_tags, story_metrics_daily
- Includes RLS for:
  - Public read only for published content
  - Admin full CRUD using JWT role `admin`

## Docs
- PRD: `docs/PRD-MVP.md`
- Go-live checklist: `docs/go-live-checklist.md`

## GitHub Pages HTML
- Entry: `docs/index.html`
- Story page: `docs/pages/web-truyen.html`
- CMS page: `docs/pages/cms.html`
