# Nitrowave Aero on macOS

Prepared 2026-10-04. This is a local-file playback preview, not a verified Mac release.

## Scope and requirements

The same React/SVG/WebGL2 interface and Web Audio player are reused. The Mac config is
automatically merged by Tauri on macOS and produces an app bundle and DMG. The selected
minimum is macOS 14.2, leaving room for a future Core Audio taps implementation.
Both Apple Silicon and Intel are supported by the universal build target.

Windows retains its NSIS installer, WASAPI capture and media session integration.
The landing page and release workflow include both platforms in this same repository.

Mac system audio capture, other-app track metadata and other-app transport controls are
**not implemented**. The UI disables Follow and explains that local files drive the visuals.
Public YouTube links still open in the browser; their sound does not drive the Mac preview.
The private YouTube build is outside this Mac preview workflow.

## Build on a Mac

Install Xcode Command Line Tools (`xcode-select --install`), Rust using rustup, and Node.js
22 LTS with npm. Work from a checkout containing these changes.

```sh
npm ci
npm test
npm run tauri:dev
```

Build for the current Mac's architecture (local testing with an ad-hoc signature):

```sh
APPLE_SIGNING_IDENTITY=- npm run tauri:build
```

Build one download for both architectures:

```sh
rustup target add aarch64-apple-darwin x86_64-apple-darwin
APPLE_SIGNING_IDENTITY=- npm run tauri:build -- --target universal-apple-darwin
```

Universal outputs:

- `src-tauri/target/universal-apple-darwin/release/bundle/macos/Nitrowave Aero.app`
- DMG in `src-tauri/target/universal-apple-darwin/release/bundle/dmg/`

Without `--target`, outputs are under `src-tauri/target/release/bundle/`.
Third-party notices are generated for the selected target, including both slices for universal.
This regenerates the shared `src-tauri/THIRD-PARTY-NOTICES.txt`; do not run different platform
builds concurrently in the same checkout. Regenerate Windows notices before its next package.

## Build through GitHub Actions

`.github/workflows/macos-preview.yml` is manual. Once the workflow exists on the default
branch, start **Actions → macOS preview → Run workflow** for the desired source branch.
The workflow tests, builds both architectures, checks the executable and signature, and
uploads DMG, a zipped app preserving bundle metadata, and SHA-256 checksums as an artifact.
It does not publish a GitHub release or change the website.

The preview uses an ad-hoc signature and is not notarized. It is intended for developer QA;
it does not establish that Gatekeeper will accept a public download. A successful run checks
package integrity; the native QA below still requires physical Macs.

For coordinated Windows/Mac packages, use **Prepare desktop release** instead. It produces
`Nitrowave-Aero-1.0.0-macOS-universal-preview.dmg`, a metadata-preserving app ZIP and
`macOS-SHA256SUMS.txt`, alongside the Windows installer. The version comes from the shared
package/config/Cargo version. Optionally it creates a draft beta release, never a public one.
See [LAUNCH.md](LAUNCH.md). No separate Mac repository or permanent platform branch is needed.

## Sign and notarize a public release

Obtain an Apple Developer membership and a **Developer ID Application** certificate with
its private key installed in the Mac's keychain. Find the exact identity with:

```sh
security find-identity -v -p codesigning
```

Set `APPLE_SIGNING_IDENTITY` to that identity. For notarization, supply `APPLE_ID`,
`APPLE_PASSWORD` (an Apple app-specific password), and `APPLE_TEAM_ID` through the environment.
Alternatively use `APPLE_API_ISSUER`, `APPLE_API_KEY`, and `APPLE_API_KEY_PATH` for an App Store
Connect API key. Keep credentials outside source control. Then run:

```sh
npm run tauri:build -- --target universal-apple-darwin
```

Tauri signs and notarizes when configured with those credentials. The standalone preview
workflow deliberately uses ad-hoc signing. The coordinated **Prepare desktop release**
workflow supports Developer ID signing and notarization through the `notarize_macos` input
and the repository secrets listed in [LAUNCH.md](LAUNCH.md). Public distribution still
requires a successful signed build and clean-Mac native QA.

Verify the final app and disk image, then test a browser-downloaded copy on another Mac:

```sh
codesign --verify --deep --strict --verbose=2 'src-tauri/target/universal-apple-darwin/release/bundle/macos/Nitrowave Aero.app'
spctl --assess --type execute --verbose=2 'src-tauri/target/universal-apple-darwin/release/bundle/macos/Nitrowave Aero.app'
xcrun stapler validate 'src-tauri/target/universal-apple-darwin/release/bundle/macos/Nitrowave Aero.app'
# Run xcrun stapler validate on the generated DMG as well.
```

The transparent webview uses Tauri's `macOSPrivateApi` switch. Keep this distribution on the
website; the current transparent implementation is incompatible with Mac App Store acceptance.

## Required Mac QA before claiming compatibility

- Install from the DMG into Applications and launch from Finder; verify quit/relaunch.
- Inspect transparency against light and dark desktops, all skins, Retina scaling and the
  500×560 → 350×392 → 210×235 → 500×560 size cycle. Check drag, minimize, close and saved position.
- Play MP3, AAC/M4A and WAV; check pause, seek, repeat, volume, file switching and shader response.
  Check OGG and FLAC separately: accepting a filename does not prove the system can decode it.
- Check each shader in WKWebView for WebGL2 support, clipping, frame rate and GPU load.
- Verify the Follow control is disabled and the explanation is visible. Confirm opening YouTube
  does not stop a local track or claim to capture browser audio.
- Test offline playback and settings after a restart. Test Apple Silicon and Intel separately;
  a universal executable alone does not prove both machines work.
- For a signed release, repeat download/install on a clean Mac and verify Gatekeeper acceptance.

## Next implementation: system audio

Add a macOS capture module behind `#[cfg(target_os = "macos")]`, retaining the current
`audio_levels` response (bass, mid, treble, level, available). Use Core Audio process taps
and an aggregate device, exclude Nitrowave's own playback to prevent double analysis, and
normalize the incoming sample format/rate before computing bands. Handle output-device
changes, sleep/wake, permission denial/revocation and cleanup of taps/devices.

Only once the capture module works, enable `systemAudio` for macOS in `platform_capabilities`.
Do not enable `systemMedia` until a separate supported metadata/control implementation exists.
Add `NSAudioCaptureUsageDescription` to the Mac Info.plist when capture is implemented;
no capture permissions are requested by this local-file preview. The user must explicitly
start capture and understand that other audible applications can influence the visualizer.

## References

- [Tauri macOS bundles](https://v2.tauri.app/distribute/macos-application-bundle/)
- [Tauri signing and notarization](https://v2.tauri.app/distribute/sign/macos/)
- [Tauri transparency restriction](https://v2.tauri.app/reference/javascript/api/namespacewebview/)
- [Apple Core Audio taps sample and permission requirements](https://developer.apple.com/documentation/coreaudio/capturing-system-audio-with-core-audio-taps)
