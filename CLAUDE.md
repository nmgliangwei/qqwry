# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository maintains a mirror of the 纯真 (CZ88/QQWry) IPv4 IP geolocation database in the legacy `qqwry.dat` binary format. It downloads the source CZDB file from cz88.net, decodes it, and repacks it into the widely-compatible `qqwry.dat` format (simplified Chinese) and `qqwry_zh-hant.dat` (traditional Chinese).

## Build Command

```bash
pnpm install
pnpm run build
```

The build requires two environment variables: `DOWNLOAD_TOKEN` and `CZDB_TOKEN` (secrets from cz88.net). It downloads the CZDB file, extracts IP records, and generates both `.dat` files in `./dist/`.

## Architecture

The pipeline runs in `src/build.js` through three stages:

1. **Download** — Fetches the encrypted CZDB file from cz88.net API and unzips it
2. **Extract** — Uses `@ipdb/czdb` decoder to dump all IPv4 records, then feeds them into `QQWryPacker` (one for simplified Chinese, one for traditional Chinese via `opencc-js`). Outputs `qqwry.dat` and `qqwry_zh-hant.dat` to `./dist/`
3. **Release** — Reads `version.json`, compares against the embedded version in the dat file, and updates `version.json` and `version` if a new version is detected. The git push and GitHub release creation are currently commented out in build.js; the actual publishing happens in the GitHub Actions workflow.

`src/packer.js` (`QQWryPacker` class) handles the binary encoding: it builds the record area (endIP + country/area strings in GBK encoding via `iconv-lite`) and the index area, with string deduplication through `stringCache`. The output format is the classic qqwry binary format (8-byte header → record area → index area).

`qqwry.py` is an older standalone Python script for scraping the download URL from WeChat articles — it is not part of the current Node.js pipeline.

## CI/CD

GitHub Actions workflow (`.github/workflows/newqqwry.yml`) runs on schedule (5 times daily), on manual dispatch, and on pushes to main. It runs `pnpm run build`, then if a new version tag doesn't already exist, creates a GitHub Release with both dat files and commits updated `qqwry.dat`, `qqwry_zh-hant.dat`, `version`, and `version.json` back to the repo.

Required secrets: `DOWNLOAD_TOKEN`, `CZDB_TOKEN`, `GIT_USERNAME`, `GIT_EMAIL`, `QQWRY` (GitHub token for release creation).

## Key Files

- `qqwry.dat` / `qqwry_zh-hant.dat` — The published data files (~27MB each, tracked in git)
- `version.json` — Version history with record counts and unique entry counts per release date
- `version` — Single-line file with the latest version date
