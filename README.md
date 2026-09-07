# XiaoBai Blog

A personal science and mathematics blog focused on black holes, nonlinear dynamics, chaos, and finite element methods.

Live site: [xiao-bai-blog.vercel.app](https://xiao-bai-blog.vercel.app)

## Tech stack

- React 19 and React Router
- Vite
- Tailwind CSS
- Three.js
- KaTeX
- Giscus comments

## Development

```bash
npm install
npm run dev
```

Before submitting a change:

```bash
npm run lint
npm run build
```

## Project structure

- `src/config/posts.js` contains the post index and route metadata.
- `src/pages/` contains the individual posts and interactive demonstrations.
- `src/components/` contains shared article and comment layouts.
- `public/blackhole.html` contains the standalone black-hole simulation.

# Private library

The Blog includes a password-protected `/library` PDF reader backed by Vercel
Private Blob. See [LIBRARY-SETUP.md](./LIBRARY-SETUP.md) for the one-time setup and
incremental publishing workflow. The public repository never contains the source
documents or secrets.
