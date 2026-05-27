# Changelog

All notable changes to this project will be documented in this file.

## 1.3.1-next.1 - 2026-05-03

### Added

- Add OpenCC-style mmseg segmentation for built-in converters so multi-stage conversions preserve official phrase boundaries.
- Add explicit package exports for `opencc-js/core`, `opencc-js/preset`, `opencc-js/preset/cn2t`, and `opencc-js/preset/t2cn`.
- Add CommonJS conditional exports for `opencc-js/cn2t` and `opencc-js/t2cn`.
- Add default ESM exports for the bundled package entry points.
- Add TypeScript declaration files for the public package entry points.
- Add `THIRD_PARTY_LICENSES.md` documenting the use of `opencc-data` (Apache 2.0) and include it in the published package.

### Changed

- Adapt dictionary generation and OpenCC test cases to `opencc-data` 1.3.1-next.1.
- Publish only built artifacts, type declarations, README files, changelog, and license files to npm.
- Mark the package as side-effect-free for bundlers.

## 1.3.0 - 2026-04-29

Changes since 1.0.5.

### Added

- Sync dictionary generation with [`opencc-data`](https://www.npmjs.com/package/opencc-data) 1.3.0 and bundle the generated data at build time so browser usage does not fetch dictionary text files at runtime.
- Add OpenCC upstream test cases to `npm test` and the publish lifecycle.
- Add a Node benchmark for OpenCC-style workloads.
- Convert `placeholder` and `aria-label` attributes in `HTMLConverter`.

### Changed

- Minify Rollup bundles with terser.
- Restore [`opencc-data`](https://www.npmjs.com/package/opencc-data) as the source for generated dictionary data.

### Fixed

- Fix the GitHub Actions test workflow Node.js version configuration.
