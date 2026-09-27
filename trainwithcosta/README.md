# trainwithcosta.com — Emmanuel Costa

Marketing and coaching-application website for Emmanuel Costa, IFBB Pro Men's Physique athlete and coach.

---

## Deployment summary (Cloudflare Pages)

| Setting | Value |
|---|---|
| Framework preset | **None** |
| Build command | *(leave empty)* |
| Build output directory | **public** |
| Root directory | *(leave empty — the repository root)* |
| Environment variables | **None** |
| Node.js version | Not required |

Push to the repository's default branch and Cloudflare Pages redeploys automatically.

---

## Framework

**None.** Plain HTML, CSS and JavaScript — no framework, no bundler, no dependencies, no build step. Files are served exactly as they are committed, which is why the build command is empty.

- **Required Node.js version:** none. Node is not used.
- **Installation command:** none. There is nothing to install.
- **Local development command:** none required — open `public/index.html` in a browser. To run it over a local server instead (closer to production), use any static server, for example:
  ```
  cd public && python3 -m http.server 4180
  ```
  then open <http://localhost:4180>. (Also fine: `npx serve public`, or VS Code's Live Server extension.)
- **Production build command:** none. The contents of `public/` are the production site.

---

## Project structure

```
.
├── public/                  ← everything Cloudflare publishes (build output directory)
│   ├── index.html           ← the whole one-page site
│   ├── privacy.html
│   ├── terms.html
│   ├── 404.html             ← shown automatically for unknown URLs
│   ├── favicon.svg
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── _headers             ← Cloudflare security + caching headers
│   ├── css/styles.css       ← all styling, design tokens at the top
│   ├── js/main.js           ← menu, scroll reveals, video loops, form handling
│   └── assets/
│       ├── img/             ← web-sized photos (640 / 1080 / 1600 px wide)
│       ├── video/           ← three training loops + poster stills
│       └── logo/            ← flat logo files, charcoal and white
├── source/
│   └── photos-original/     ← full-resolution originals (kept for re-editing, not published)
├── tools/
│   └── optimize-photos.sh   ← regenerates public/assets/img from the originals
├── .gitignore
└── README.md
```

Everything in `public/` is published. Everything outside it is source material that stays private.

---

## Editing the site

The content lives in `public/index.html`, in clearly commented sections (hero, about, coaching, process, application, FAQ, footer). Text can be edited directly.

**Colours, fonts and spacing** are defined once at the top of `public/css/styles.css`, under `:root`. Change a value there and it updates everywhere.

**Replace a photo.** Put the original in `source/photos-original/` named one of `hero`, `stage`, `pose`, `inperson` or `apply`, then run:
```
sh tools/optimize-photos.sh
```
It writes the three web sizes into `public/assets/img/`. (macOS only — it uses built-in system tools.) The hero is referenced as `hero-640.jpg` and `hero-1206.jpg` in `index.html`; update those names if you replace it.

**Replace a video.** Put an MP4 (H.264, muted, roughly 6 seconds) in `public/assets/video/` using the existing names: `train.mp4`, `refine.mp4`, `focus.mp4`, each with a matching `-poster.jpg` still.

---

## The application form

Submissions are delivered by [Web3Forms](https://web3forms.com) — a free service, no account or server needed. The form posts to `https://api.web3forms.com/submit` with an access key in `public/index.html`:

```html
<input type="hidden" name="access_key" value="…">
```

This key is **public by design**: it only allows sending a message to the inbox it was registered to, and every Web3Forms integration exposes it in the page. It is not a password and grants no access to any account. If it ever attracts spam, generate a new key at web3forms.com and replace that one line.

Applications are delivered to the email address the key is registered to. Send a test application after the first deployment to confirm they arrive.

---

## First-time Cloudflare Pages setup

1. Push this project to a GitHub repository.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, and pick the repository.
3. Enter the settings from the table at the top of this file. The build command stays empty and the output directory is `public`.
4. **Save and Deploy.** The first deployment takes about a minute and gives you a `*.pages.dev` address.
5. **Custom domain:** in the project, go to **Custom domains → Set up a custom domain**, enter `trainwithcosta.com`, and follow the DNS instructions. Add `www.trainwithcosta.com` too if you want it to work. Cloudflare issues the HTTPS certificate automatically.

After that, every push to the default branch deploys automatically. Pull requests get their own preview link.

---

## Notes

- **Client-side routing:** none. Every page is a real file, so refreshing or opening a URL directly always works and no redirect rules are needed.
- **`_headers`** sets security headers and caching. Photos and videos are cached for a year; CSS, JS and pages revalidate on each visit, so updates appear immediately after a deploy.
- **Accessibility and motion:** animations respect the visitor's "reduce motion" setting; videos then show a still image with a play button instead of moving automatically.
- **Analytics:** none installed. Cloudflare Web Analytics can be switched on in the Pages project without touching the code.
