---
created: "2026-04-03"
title: Making of this blog
tags:
  - tool
  - programming
  - en
---

## Stack

- **Hakyll** — Haskell static site generator (library, not framework)
- **Pandoc** — document compiler, called via `unixFilter`
- Two Lua filters: `highlight.lua`, `obsidian-callouts.lua`
- `pandoc-latex-environment` filter (for $\LaTeX$-style environments in Markdown)
- A small companion executable: `Formatter.hs`

## Why Hakyll

I tried Hugo, Quartz, Next.js, and a working Python/Pandoc/Jinja2 pipeline to build my blog website before this. They all did the job and were good in their own ways, but somehow I'm just not satisfied. The problem was that working with them rarely felt like *designing* — mostly it was modifying other people's configs and hoping the result was close enough to what I actually wanted. 

I've been learning *Functional Programming* for a while, and I thought it would be a good idea to use it to build my own blog: it allows you to describe a solution rather than commanding a sequence of steps. Top-down design, pattern matching, no hidden state, no side effects you didn't ask for, and so on.

For example, `site.hs` *is* the build system. There's no hidden convention underneath it. Every route, every compiler, every dependency is explicit code I wrote and can read back. 

The other reason is types. When I wire up a compiler pipeline, GHC tells me immediately if the pieces don't fit. Refactoring a route is less scary when the type errors are caught before I check the output in a browser.

I don't know enough Haskell to do anything fancy. For now, `site.hs` is mostly combinators from the Hakyll API glued together. But that's already enough for me.

Essentially, it's not about which tool or which language I'm using, but how I'm using it to convey my thoughts and design my own logic of blogging.

## site.hs

Based on the template provided by Hakyll, I added a few more features:

- **Draft system**: Posts can have `draft: true` in frontmatter. `isPublished` checks for this and filters drafts out of all listings. The compiled HTML is still accessible by direct URL tho, which is useful for previewing before publishing.

- **Smart dates**: Hakyll's default date system requires a specific filename convention (`YYYY-MM-DD-title.md`). I didn't want to be locked into that, so `getSmartDate` tries metadata keys in order (`date`, then `created`), then falls back to the file's modification time from the filesystem. This means any file can have a date without encoding it in the filename. I also added `modified` field to the frontmatter to display the modification time of the post.

- **`safeCompiler`**: Wraps a compiler in `catchError` so a single broken post doesn't abort the entire build. Instead, the failed page renders a styled error div with the error message. Useful during drafting when a post might have broken syntax or malformed LaTeX.

## Pandoc pipeline

The compiler calls Pandoc as an external process via `unixFilter`:
```haskell
getResourceBody >>= withItemBody (unixFilter "pandoc" args)
```
The args passed to Pandoc:
```
--from markdown+wikilinks_title_after_pipe-yaml_metadata_block
--to html
--lua-filter filters/highlight.lua
--lua-filter filters/obsidian-callouts.lua
--filter pandoc-latex-environment
--number-sections
--mathjax
```

### Lua filters

In Obsidian, I use [obsidian-pandoc](https://github.com/OliverBalfour/obsidian-pandoc) to export my notes to PDF files through $\LaTeX$ (See [HuangxinDong/Eisvogel-for-Obsidian](https://github.com/HuangxinDong/Eisvogel-for-Obsidian) for more). It supports custom lua filters, so I use it to add some custom filters to my markdown files. 

I currently use one filter:

- `obsidian-callouts.lua`: Converts Obsidian callout blocks to styled divs for HTML or \begin{quote} for LaTeX.

## Formatter.hs

I write most of my notes and articals in Obsidian, although they can be rendered normally in most markdown viewers, some of them does not work in Pandoc. For example, if there's no blank line before a heading, Pandoc will render it as a normal text. Inspired by prettier, I though it would be convient to have a tool that automatically formats the markdown files. I know prettier can also format markdown files, but it's a nice practice to write it in Haskell, and custom it to my needs.

`Formatter.hs` is a separate executable in the same cabal file. It walks the project directory, finds all `.md` and `.markdown` files, and applies a set of typography fixes
in-place before the Hakyll build runs:

- CJK/Latin spacing: inserts a space between Chinese characters and Latin

  text/digits (e.g. `中文和English` -> `中文和 English`), but skips inline code spans.

- Heading formatting: ensures `##title` becomes `## title` meanwhile ignore `#title` since sometimes it can also be a `#tag` (and I don't really use H1 a lot in my notes anyway).
- Blank line insertion around headings and list blocks.
- Ignore frontmatter in the start of the file, and ignore files with `formatter: false` in frontmatter.

To run the formatter:

```bash
cabal run formatter
cabal run formatter -- --dry-run # print diff without writing
```

During the development of the formatter, I realised there're much more edge cases than I thought. The dry-run mode turned out to be really useful because the formatter can be a bit aggressive, and it's always a good idea to check the diff before applying the changes, before I can 100% trust my code.


## What's next

- Tags are implemented but the tag pages are unstyled.
- `--number-sections` should probably be opt-in per post, not global.
- The `series/` concept is half-baked — I'm still not sure how to use it.
- I'm calling Pandoc as an external process rather than using the Haskell Pandoc library directly. This works fine but means the Lua filters and the `pandoc-latex-environment` filter need to be installed separately. At some point I'll probably switch to the library API to make the build more self-contained.
- css is still pretty basic: no support for dark mode, no responsive design, etc.
- Write more posts rather than just playing with the blog!
- Maybe add some interesting gadgets...