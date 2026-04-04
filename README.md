# README
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Content: CC BY-NC 4.0](https://img.shields.io/badge/Content-CC--BY--NC--4.0-blue.svg)](https://creativecommons.org/licenses/by-nc/4.0/)
  

This repo contains my personal blog built with Hakyll.

## Requirements

- GHC and Cabal
- `pandoc`

## Getting Started

Build the site:

```bash
cabal run site build
```

Start the local preview server:

```bash
cabal run site watch
```

Clean generated files:

```bash
cabal run site clean
```

The generated site is written to `_site/`.

## Formatter

This repo includes a small formatter for Markdown files:

```bash
cabal run formatter
```

Preview changes without writing:

```bash
cabal run formatter -- --dry-run
```

## Notes

- The site build calls `pandoc` as an external process from `site.hs`.
- Custom Pandoc Lua filters live in `filters/`.

## License

- Source code is licensed under the MIT License.
- All blog content (including posts, images, and other assets) is licensed under CC BY-NC 4.0 unless otherwise noted.
