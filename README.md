# Sankruv Media website

Redesigned multi-page website for Sankruv Media, a digital marketing agency in Mumbai.
Plain HTML, CSS and JavaScript. No build step and no libraries, so it runs on any hosting
(Hostinger, GitHub Pages, Netlify) by uploading the files as they are.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `services.html` | Services (four services, each with its own anchor) |
| `projects.html` | Projects |
| `about.html` | About |
| `blog.html` | Blog list |
| `contact.html` | Contact |
| `social-media-management.html` | Service landing page |
| `web-development-design.html` | Service landing page |
| `branding-creative-design.html` | Service landing page |
| `corporate-commercial-shoots.html` | Service landing page |
| `404.html` | Not-found page (set it as the error page in hosting) |

Shared files:

- `assets/css/site.css` holds all styling. Brand colours are the variables at the top (`--void`, `--slate`, `--text`, `--teal`).
- `assets/js/site.js` holds all behaviour, including the 3D scene.
- `assets/img/` holds the logo, favicon and social share image.
- `robots.txt` and `sitemap.xml` are for search engines.

## The 3D scene

One WebGL canvas sits behind every page. Each `<section>` carries a `data-fx` attribute with
seven numbers: `x y scale split hue dim model`. While a section is in the middle of the screen
the 3D object moves to that position and morphs into that model:

| Model | Shape | Used on |
| --- | --- | --- |
| 0 | Brand core; with `split` at 1 it separates into a torus, cube, gem and capsule (the four services) | Home hero, services |
| 1 | Linked rings | Testimonials, About |
| 2 | Stacked screens | Projects |
| 3 | Cut gem | Why us |
| 4 | Lattice sphere | Process, Blog |
| 5 | Signal rings | FAQ, Contact |

The same canvas also draws the background: a lit grid floor running to the horizon, drifting dust
at two depths, a slow aurora, and three small satellites orbiting the model.

Other 3D pieces are plain CSS: the services prism and the ring of cards on the home page, the
reviews deck, and the tilt on project cards.

Visitors who turn on "reduce motion" get a still frame, and devices that cannot keep up get a
lower render resolution automatically.

## Conversion pieces

- Sticky bar on phones with Call, WhatsApp and Free quote.
- Service picker in the closing section; it opens `contact.html?service=...` with that service preselected.
- Every service landing page has its own quote button that preselects the service.

## Before going live

1. **Domain.** Canonical links, `sitemap.xml`, `robots.txt` and the structured data all use
   `https://www.sankruvmedia.com/`. Change them if the site goes live on another address.
2. **Contact form.** It has no server yet. It checks the fields and then opens the visitor's
   email app or WhatsApp. Connect it to a form service or backend to receive leads directly.
3. **Logo.** `assets/img/logo.png` was cropped from a screenshot. Replace it with the original file.
4. **Testimonials.** The three quotes are paraphrased. Paste the exact wording from the old site.
5. **About text, FAQ answers and the "How we work" steps** were written from the old homepage
   content and need the client's approval.
6. **Projects.** Four projects are listed without photos. Add images and the remaining projects.
7. **Blog.** The eight posts link to the articles on the old site. Move the article text here
   before the old site is switched off.
8. **Packages.** The old site linked to a Packages page that is not part of this build.
