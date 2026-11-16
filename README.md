# Sankruv Media: website and Client Hub (React)

The new Sankruv Media website and its private admin, the Client Hub. Both are written in React.

| Part | What it is | Where the code is |
| --- | --- | --- |
| Website | 18 pages, 3D and scroll animations, films wall, blog, SEO files | `react/src/` (pages), `content/` (text, films, blog posts), `assets/` (styles, images) |
| Client Hub | Clients, projects, reminders, payments, client emails, team logins, installable as an app | `react/admin/` (React screens), `admin/` (PHP + SQLite backend) |

Read **[HOW-IT-WORKS.md](HOW-IT-WORKS.md)** for the full guide: how to build, upload to Hostinger, do the first setup, and change content.

## Quick start

```bash
cd react
npm install
npm run build        # makes react/dist: the complete site, ready to upload
```

Upload everything inside `react/dist/` to `public_html` on Hostinger. The server needs PHP 8 (for the Client Hub only). Node is needed only on your computer, to build.

## Folder map

```
react/            React source and the build script
  src/            website: App, pages, UI parts, films wall, animation engine
  admin/          Client Hub screens (React)
  build.cjs       builds everything into react/dist
admin/            Client Hub backend (PHP), email templates, app icons
content/          site.json, services.json, projects.json, videos.json, blog/*.md
assets/           site.css and images
tools/            gen_emails.py (regenerates the 12 email templates)
```

Older, non-React versions of the site and admin were removed. They remain in the Git history if they are ever needed.
