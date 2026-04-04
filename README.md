# README

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
