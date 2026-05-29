# Module: Rust (CLIs)

Conventions for Rust command-line tools.

- **CLI**: `clap` with derive macros. Always provide `--help`, `--version`, and a `--dry-run` for
  any destructive operation.
- **Errors**: `anyhow` for application code, `thiserror` for library error types. No `unwrap()` in
  paths that can fail at runtime — propagate with `?` and add context.
- **Serialization**: `serde` (+ `serde_json`). Time via `chrono`.
- **Safety**: prefer hardlinks/atomic renames over copy+delete; back up before mutating user data.
- **Output**: clear, color-coded status logging; respect `--quiet`. Exit codes are meaningful.
- **Versioning**: SemVer in `Cargo.toml`; document platform/target support.
- **Tests**: unit-test the logic; keep IO behind small testable seams.
