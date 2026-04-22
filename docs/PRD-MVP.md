# PRD - Author First MVP

## Goal
- Build a web novel reader where one author can publish personal stories quickly.
- Keep reading experience public and frictionless (no login needed for readers).
- Prepare data model and architecture for future multi-author expansion.

## Personas
- **Author/Admin:** creates stories, chapters, and controls publish state.
- **Reader:** browses genres, reads chapters, searches stories.

## MVP Features
- Home page with `featured`, `new`, and `full` sections.
- Story listing with tag filtering.
- Story detail page with chapter index.
- Chapter reading page with prev/next navigation.
- Search page by title/summary/tag.
- Secure admin login and CMS forms for creating story/chapter.
- SEO basics (`sitemap`, `robots`, metadata).
- Analytics ingestion endpoint for key events.

## User Flows
1. Reader lands on home -> opens story -> reads chapter -> next chapter.
2. Reader uses search -> opens relevant story.
3. Admin logs in -> creates new story -> creates chapter -> checks on public pages.

## KPI Baseline (first 30 days)
- DAU / WAU.
- Average chapters per session.
- Chapter completion rate.
- Search success rate.
- 7-day returning readers.
