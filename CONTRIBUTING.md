# Contributing to Nitrowave Aero

Thanks for your interest in contributing! Bug reports, ideas, skins, shader worlds and code are all welcome.

## Before you start

- For larger changes, please open an issue first to discuss the approach.
- Check existing issues and pull requests to avoid duplicates.

## Development setup

See the [README](README.md#build-from-source). In short:

```powershell
npm ci
npm run tauri:dev
```

## Before opening a pull request

Run the checks that CI runs:

```powershell
npm test
npm run build
npm run landing:build
cd src-tauri; cargo check --locked; cd ..
```

## Guidelines

- **Keep changes focused.** One pull request should do one thing.
- **Match the existing style.** TypeScript is strict; follow the surrounding code's naming and comment density.
- **Add tests** for pure logic (parsers, storage, platform rules) where practical. Tests live next to the code as `*.test.ts(x)`.
- **No tracking, analytics or network calls** without discussing them first. Nitrowave is a local player.
- **Keep the YouTube policy.** Nitrowave must not embed or hide YouTube playback. Links open in the user's browser.
- **Do not commit** generated output (`dist/`, `site-dist/`, `target/`, installers) or personal files.
- **Assets.** Only contribute images, fonts and sounds you have the right to share under the MIT License, and say where they came from.

## Commit and pull request style

- Write short, descriptive commit messages in the imperative mood, for example `Fix volume slider on high DPI`.
- Describe what changed and why in the pull request. Include screenshots for visual changes.
- Use the pull request template.

## Licence

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
