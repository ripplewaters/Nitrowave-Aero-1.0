# Release preparation verification — 11 October 2026

Source baseline: `15e95c5` on `main` in `Nitrowave-Aero-1.0`. All changes are local;
no commit, push, release publication or Vercel deployment was performed.

The shared source and Vercel website configuration are prepared for a Windows beta
and an explicitly labelled Mac developer preview. This is not approval of a stable,
signed public Mac release. Follow [LAUNCH.md](LAUNCH.md) in order before going live.

## Verified locally

| Check | Result |
| --- | --- |
| Vitest 5.0.3 | 33 tests passed |
| Frontend typecheck and production build | Passed |
| Landing build and release manifest verification | Passed |
| npm audit | Zero reported vulnerabilities, including dev dependencies |
| Windows `cargo clippy --locked -- -D warnings` | Passed |
| Windows Tauri release build with locked Cargo dependencies | Passed; NSIS installer produced |
| GitHub Actions workflow review | actionlint 1.7.12 passed; workflows not run on GitHub in this task |
| Browser desktop and mobile QA | Passed at 1440×1000 and 390×844; eight shipped skins, world switching, FAQ, reduced motion, legal pages and release URL names checked |
| Browser errors/local HTTP failures | None |
| Actual native Windows WebView2 QA | Startup, WASAPI initialization, local WAV playback with visual levels, pause/seek/volume/repeat, skin/shader buttons and size cycle passed |
| Independent screenshot review | Desktop/mobile website and native app at 500×560, 350×392, 210×235 passed for fit/readability |
| Git diff whitespace check | Passed |

Native testing used an isolated `WEBVIEW2_USER_DATA_FOLDER`; it did not use the existing
installed app's settings. The test app was closed afterward. Screenshots establish webview
rendering; they do not establish desktop transparency against all wallpaper colours.

## Prepared Windows package

Local path: `release/v1.0.0/Nitrowave-Aero-1.0.0-Windows-x64-setup.exe`

- Size: 3,328,751 bytes.
- SHA-256: `789882c2d852b95bb9e7e62a4a509f601c89b2a362ac1cba913451dbd5d62962`.
- Authenticode: unsigned; the website and release notes disclose this.
- Checksum file: `release/v1.0.0/Windows-SHA256SUMS.txt`.

Local evidence is saved under `release/verification/`: `browser-qa.json`, `native-qa.json`,
`npm-audit.json`, `rust-audit.json` and screenshots. These generated artifacts are ignored
by Git. The website output is `site-dist/` and can be rebuilt without Rust or desktop binaries.

## Security and licensing review

Updated Vitest and source-map-js to remove reported npm findings. Updated WASAPI 0.24 to
0.25 to address its RustSec unsoundness warning, and replaced yanked yoke-derive 0.8.3
with 0.8.4. Rust audit reports zero vulnerabilities, but retains six maintenance warnings
and a GLib unsoundness warning in the all-platform lockfile. GLib is absent from Windows
and Apple Silicon Mac target dependency trees. Maintenance warnings include Tauri's
transitive `unic-*` components; no claim of a comprehensive security audit is made.

Third-party notices now include actual license texts for previously omitted packages,
with version-specific upstream sources where published crates omit their license files.
Windows and universal Mac notice generation were checked; Windows notices are the checked-in
website document. Fresh Mac packaging generates and bundles its own target-specific notices.
Privacy text now describes both platforms and Windows-only capture features.

## Mac evidence and remaining gates

The existing local Mac preview in sibling `Nitrowave/release/macos-preview-37195735037`
was independently verified: both hashes match, ZIP CRC checks pass, and the Mach-O executable
contains Intel and Apple Silicon slices. Its source is older revision `914bb5e28e072c449f8b2de6ac6c7027b1d1d7b1`;
it is ad-hoc signed and has older bundled legal resources. Do not present that artifact as
a build of the final source prepared in this task.

The new manual workflow packages both platforms from the selected Git revision and can
create a draft prerelease. Optional Apple signing/notarization is configured, but requires
the repository secrets described in [LAUNCH.md](LAUNCH.md) and a successful Mac runner build.
It was reviewed statically, not executed here.

Before public launch:

1. Review, commit and push these source changes under your own Git identity.
2. Build both packages from that revision using the manual release workflow.
3. Complete clean-user Windows installation/uninstallation and Spotify/browser media-control QA.
4. Complete native Mac installation/playback/window QA; keep the Mac preview label unless
   Developer ID signing, notarization and native QA are complete.
5. Publish the reviewed GitHub release, then run `npm run release:verify -- --published`.
   This downloads both public assets and verifies their actual SHA-256 hashes. Draft or
   absent downloads cannot pass it.
6. Deploy a Vercel preview from repository root with `vercel.json`; check it, then go live.

Only `ripplewaters` was listed by GitHub as contributor during the audit. The original
commit has no AI co-author trailer. Local Git identity uses your GitHub noreply address,
and project Claude settings disable automatic commit/PR attribution.
