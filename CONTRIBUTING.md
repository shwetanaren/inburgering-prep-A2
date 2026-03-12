# Contributing

Thanks for considering a contribution.

## Good first contributions

- Fix mobile-web issues, especially Safari
- Improve copy or UX on existing screens
- Add new content themes in the existing content format
- Improve accessibility, responsiveness, or visual consistency
- Add tests around services, SRS behavior, or content validation

## Before you start

- Open an issue if the change is large or changes product behavior
- Keep changes focused
- Preserve the mobile-first UX
- Avoid adding backend dependencies for the web build unless necessary

## Local setup

```bash
npm install
npm test
npm run web
```

## Deployment model

This repo is the source code repo.
The public site is deployed to the separate GitHub Pages repo:

- source: `inburgering-prep-A2`
- live site: `https://shwetanaren.github.io/`
- published repo: `shwetanaren.github.io`

To publish a new static build:

```bash
npm run deploy
```

## Pull requests

Please keep pull requests small and explain:

- what changed
- why it changed
- how you tested it

If your change affects UI, include screenshots.
If your change affects content behavior, include the impacted theme or learning flow.

## Content contributions

If you add learning content, keep it consistent with the existing schema and theme structure.
Prefer extending the current JSON packs rather than inventing a parallel format.
