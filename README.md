# ChainCraft — Web3, Crypto & AI Education

ChainCraft (internally `ccweb-project`) is the marketing + content site for a
cohort-based education platform focused on Web3, crypto, and AI. It's built as
a fast, modern React single-page app.

## Stack

- [Vite](https://vitejs.dev/) + React 18 + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) with a custom dark theme
- [React Router](https://reactrouter.com/) for client-side routing
- [lucide-react](https://lucide.dev/) for icons
- Zero backend dependencies — all content lives in `src/data/*`

## Pages

| Route | Description |
| --- | --- |
| `/` | Marketing home (hero, tracks, featured courses, testimonials, CTA) |
| `/courses` | Filterable course catalog (by track + level) |
| `/courses/:slug` | Course detail page with curriculum, outcomes, instructor |
| `/learn` | Free guides organized into Start here / Toolkits / Reference |
| `/blog` | Blog index |
| `/blog/:slug` | Blog post |
| `/pricing` | Free / Pro / Cohort pricing with monthly–yearly toggle |
| `/about` | Mission, values, team, policies |
| `/contact` | Contact form (client-side) |
| `/faq` | Accordion FAQ |
| `*` | 404 page |

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — typecheck and build a production bundle
- `npm run preview` — preview the production build locally

## Project structure

```
src/
  components/
    brand/        Logo
    layout/       Header, Footer, SiteLayout
    ui/           SectionHeading, Badge
  data/           courses.ts, posts.ts (static content)
  lib/            utils (cn helper)
  pages/          Home, Courses, CourseDetail, Learn, Blog, BlogPost,
                  About, Pricing, Contact, FAQ, NotFound
  App.tsx         Route definitions
  main.tsx        App entry (Router + StrictMode)
  index.css       Tailwind layers + custom theme tokens
```

## Editing content

Courses and blog posts are plain TypeScript arrays in `src/data/`. Add, remove,
or re-order entries there — routes and listings pick them up automatically.
