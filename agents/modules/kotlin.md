# Module: Kotlin (JVM, Android, Compose)

Conventions for Kotlin projects — Android apps, Compose desktop, Gradle builds.

- **Toolchain**: pin the JDK in `mise.toml` / `.sdkrc` and set `jvmToolchain(21)`. Gradle itself
  must run on that JDK: the Kotlin compile daemon dies with `IllegalArgumentException: 25.0.4.1`
  on newer ones, because it cannot parse a four-part version string.
- **Layout**: a plain JVM `shared/` module (jvmTarget 17 — D8 on Android rejects newer class
  files) consumed by `android/` and `desktop/`. Domain, API and storage code stays out of the
  platform modules.
- **Compose**: `org.jetbrains.compose` (Compose Multiplatform) with the Jetpack artifacts pulled in
  through it, so the same `compose.material` code serves Android and desktop.
- **UI state**: `StateFlow` in the engine layer; a value read from another thread (audio, render)
  is `@Volatile` rather than lock-guarded, so the audio path never waits on a disk write.
- **Release signing**: keystore path and passwords come from environment variables
  (`<APP>_RELEASE_KEYSTORE_PATH|_PASSWORD|_KEY_ALIAS|_KEY_PASSWORD`), never the repo. With them
  unset the signing config is simply absent, so another machine produces an *unsigned* build
  instead of failing. PKCS12 has no separate key password: `keypass` must equal `storepass`, or
  `keytool` fails with "Given final block not properly padded".
- **Versions**: `versionCode` from `git rev-list --count HEAD`, `versionName` from
  `git describe --tags --always` with the `v` stripped, both overridable by env var. A literal
  `versionCode = 1` makes in-place updates impossible.
- **Artifacts**: name APKs `<app>-<versionName>.apk` and keep AGP's `-unsigned` marker when nothing
  signed them — a file that cannot be installed should not look like one that can.
  `VariantOutputImpl.outputFileName` is the only hook for the name.
- **Releases**: local `mise` / Gradle tasks, not CI. Publishing refuses a dirty tree or an untagged
  commit and verifies the signature before uploading, so a release page never carries a build that
  cannot be traced to a commit or installed.
- **Tests**: JUnit 5 (`useJUnitPlatform()`) in the JVM modules; keep the pure logic (parsers,
  mappings, maths) out of the platform modules so it can be tested without a device.
