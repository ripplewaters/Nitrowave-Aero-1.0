# Preparing a release and Vercel website

One repository contains the Windows app, macOS preview and website. GitHub Releases hosts
the downloadable packages; Vercel hosts only the website. The website build does not build
desktop apps. MIT licensing makes the source reusable; it does not make preview packages
tested or signed.

## 1. Prepare source and desktop packages

Review the local changes, run `npm ci`, `npm test`, `npm run build`, and
`npm run landing:build`, then `npm run release:verify`. Run `cargo check --locked` and
`cargo clippy --locked -- -D warnings` in `src-tauri`. Commit and push only the reviewed
changes under your own Git identity; do not add AI co-author trailers.

After the workflows are on the default branch, open **Actions → Prepare desktop release →
Run workflow**. Select the reviewed branch. Leave `create_draft` off for artifacts only,
or turn it on to prepare a draft beta release once both packages pass. The workflow never
publishes a release. Its builds use the selected source revision on Windows and Mac runners.
Download artifacts within their 30-day retention period.

For version 1.0.0, the draft contains:

| File | Purpose |
| --- | --- |
| `Nitrowave-Aero-1.0.0-Windows-x64-setup.exe` | Windows per-user x64 installer |
| `Windows-SHA256SUMS.txt` | Windows installer checksum |
| `Nitrowave-Aero-1.0.0-macOS-universal-preview.dmg` | macOS 14.2+ universal preview |
| `Nitrowave-Aero-1.0.0-macOS-universal-preview.app.zip` | App bundle for developer QA |
| `macOS-SHA256SUMS.txt` | Mac package checksums |

The Windows installer is unsigned. By default, the Mac preview uses an ad-hoc signature
and is not notarized. This is a beta/preview release path, not proof of a stable signed 1.0 release.
See [MACOS.md](MACOS.md) for Developer ID signing, notarization and Gatekeeper verification.
The manual workflow can sign/notarize when `notarize_macos` is enabled and these repository
secrets are configured: `APPLE_CERTIFICATE` (base64-encoded Developer ID Application `.p12`),
`APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `KEYCHAIN_PASSWORD`, `APPLE_ID`,
`APPLE_PASSWORD` (app-specific password) and `APPLE_TEAM_ID`. It refuses missing credentials,
checks Gatekeeper and stapled tickets, and cleans up its temporary certificate/keychain.
No credentials are committed to this repository. This signed workflow requires a real CI run
with your certificate to verify; it cannot be established by Windows checks.
To offer Mac as a regular public download, replace the preview with the signed, notarized,
tested package and update the download wording before deployment. The Mac preview filename
still describes its limited local-file feature set even when that package is notarized.
Coordinate changes to `landing/release.json`, the Mac copy in `src/landing/main.tsx`, and
the preview assertion in `scripts/verify-release.mjs` after documented native/public-release QA.

## 2. Verify the downloaded packages

On Windows, compare the EXE hash with `Windows-SHA256SUMS.txt`:

```powershell
Get-FileHash .\Nitrowave-Aero-1.0.0-Windows-x64-setup.exe -Algorithm SHA256
```

Install on a clean Windows user account. Check local playback, seek/pause/volume, shader
response, Follow with browser or Spotify audio, skin/size changes, settings after restart,
and uninstall. An existing development installation is insufficient install evidence.

On a Mac, run `shasum -a 256 -c macOS-SHA256SUMS.txt` with both Mac files in the same folder.
Complete the native checks in [MACOS.md](MACOS.md), including Apple Silicon and Intel testing.
Do not claim these tests passed just because CI produced a universal executable.

## 3. Publish packages and configure downloads

Review the draft release notes and attach only packages from the verified source revision.
Publish the draft manually as a prerelease if releasing the current beta/preview. Draft
assets are inaccessible to ordinary visitors, so publish before making download buttons live.

`landing/release.json` is the website's download manifest. Use direct asset URLs from the
published `v1.0.0` release, for example:

```text
https://github.com/ripplewaters/Nitrowave-Aero-1.0/releases/download/v1.0.0/Nitrowave-Aero-1.0.0-Windows-x64-setup.exe
https://github.com/ripplewaters/Nitrowave-Aero-1.0/releases/download/v1.0.0/Nitrowave-Aero-1.0.0-macOS-universal-preview.dmg
```

Preserve the Mac preview label until signing and native QA are complete. Check each asset
and checksum URL in a private browser window; authentication can hide a broken public link.
Do not put installer binaries in Git or the Vercel website output.

After publishing the release, run the required public-download gate:

```sh
npm run landing:build
npm run release:verify -- --published
```

This downloads both public packages and compares them with their published SHA-256 checksums.
It fails for unpublished drafts, missing files or mismatched hashes. Do not take the website
live while this check fails. The ordinary `release:verify` checks only local website output.

## 4. Deploy the landing page on Vercel

Import `ripplewaters/Nitrowave-Aero-1.0` as a Vercel project. Use repository root `.` and
framework preset **Other**. The root `vercel.json` sets build command
`npm run landing:build` and output directory `site-dist`. Use `npm ci` as install command
and Node.js 22.x. This static website needs no secret environment variables.

Deploy a preview first. Verify the home page, images/fonts, both platform labels, all legal
pages, mobile layout, GitHub source link and published download/checksum links. Download
from that preview and compare package hashes. Then promote/deploy to production and attach
your domain if desired.

The GitHub source can be public while the website is still in preview. Ordinary users
download the installer from the website; developers can inspect or build the same source.

## References

- [Tauri macOS signing and notarization](https://v2.tauri.app/distribute/sign/macos/)
- [GitHub release management](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [Vercel project configuration](https://vercel.com/docs/project-configuration)
