# Inburgering Prep A2

Mobile-first Dutch learning app for A2 inburgering practice.

Live site: [https://shwetanaren.github.io/](https://shwetanaren.github.io/)

Plain-language guide for learners and non-technical visitors: [`README-plain-language.md`](README-plain-language.md)

## What it is

This project started as an Expo-led iOS app and is now published as a mobile-first web app.
It focuses on three practice areas:

- Words
- Sentences
- Dialogues

The app is structured around weekly themes such as supermarket, municipality, housing, school, work, and transport.

## What users can do

- Review theme-based Dutch vocabulary
- Practice A-G sentence patterns
- Read and complete short dialogues
- Track streaks and weekly activity
- Switch between themes from the home screen

## Current product shape

This is an MVP with a strong mobile layout.

Current implementation includes:

- Expo Router navigation
- React Native / React Native Web UI
- NativeWind styling
- Local browser persistence on web
- Theme-scoped progress for words, sentences, and dialogues
- Static deployment to GitHub Pages

## Important behavior on web

The web version stores learning progress in the browser.

That means:

- progress is local to the browser/device
- clearing browser storage resets progress
- progress does not sync across devices
- this is not yet a full offline PWA

## Stack

- Expo
- Expo Router
- React Native
- React Native Web
- NativeWind
- TypeScript
- Vitest

## Repo structure

- `app/` - routes and screens
- `components/` - shared UI and client helpers
- `packages/services/` - app-facing service layer
- `packages/services/web.ts` - web storage-backed implementation
- `packages/content/` and `content/` - bundled learning content
- `tests/` - content and SRS tests

## Run locally

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Run on web:

```bash
npm run web
```

Run tests:

```bash
npm test
```

## Build for web

Export the static site:

```bash
npm run export:web
```

The output is written to `dist/`.

## Deploy

This repo is configured to publish the exported site into the separate GitHub Pages user-site repo:

- source repo: `inburgering-prep-A2`
- published site repo: `shwetanaren.github.io`

Deploy command:

```bash
npm run deploy
```

## Contributing

Contributions are welcome.

If you want to help, start here:

- Read [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Open an issue for bugs, UI problems, or content gaps
- Propose improvements to themes, sentence patterns, dialogue flows, or accessibility

Good contribution areas:

- new themes and content packs
- UI polish and mobile-web compatibility
- Safari/mobile browser fixes
- accessibility improvements
- offline/PWA support
- tests around SRS and content behavior

## Notes

- Safari still needs a final device validation pass.
- The app is optimized first for phone-sized screens.
- The content model is designed to expand into more themes over time.

## License

This project is open source under the MIT License.
See [`LICENSE`](LICENSE).
