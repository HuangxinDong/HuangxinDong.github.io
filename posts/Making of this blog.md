---
created: "2026-04-03"
modified: "2026-04-19"
title: Making of this blog
tags:
  - tool
  - programming
lang: en
description: Why I built this blog with Hakyll, how it works, and what I want to improve next.
---

## Stack

- **Hakyll** — Haskell static site generator (library, not framework)
- **Pandoc** — document compiler, now used as a library dependency inside the site build
- A small Pandoc AST transform for Obsidian-style callouts and sidenotes
- A small companion executable: `Formatter.hs`

## Why Hakyll

I tried Hugo, Quartz, Next.js, and a working Python/Pandoc/Jinja2 pipeline to build my blog website before this. They all did the job and were good in their own ways, but somehow I'm just not satisfied. The problem was that working with them rarely felt like *designing* — mostly it was modifying other people's configs and hoping the result was close enough to what I actually wanted. 

I've been learning *Functional Programming* for a while, and I thought it would be a good idea to use it to build my own blog: it allows you to describe a solution rather than commanding a sequence of steps. Top-down design, pattern matching, no hidden state, no side effects you didn't ask for, and so on.

For example, `site.hs` *is* the build system. There's no hidden convention underneath it. Every route, every compiler, every dependency is explicit code I wrote and can read back. The other reason is types. When I wire up a compiler pipeline, GHC tells me immediately if the pieces don't fit. Refactoring a route is less scary when the type errors are caught before I check the output in a browser. I don't know enough Haskell to do anything fancy. For now, `site.hs` is mostly combinators from the Hakyll API glued together. But that's already enough for me.

Essentially, it's not about which tool or which language I'm using, but how I'm using it to convey my thoughts and design my own logic of blogging.

## site.hs

Based on the template provided by Hakyll, I added a few more features:

- **Draft system**: Posts can have `draft: true` in frontmatter. `isPublished` checks for this and filters drafts out of all listings. The compiled HTML is still accessible by direct URL tho, which is useful for previewing before publishing.

- **Smart dates**: Hakyll's default date system requires a specific filename convention (`YYYY-MM-DD-title.md`). I didn't want to be locked into that, so `getSmartDate` tries metadata keys in order (`date`, then `created`), then falls back to the file's modification time from the filesystem. This means any file can have a date without encoding it in the filename. I also added `modified` field to the frontmatter to display the modification time of the post.

- **`safeCompiler`**: Wraps a compiler in `catchError` so a single broken post doesn't abort the entire build. Instead, the failed page renders a styled error div with the error message. Useful during drafting when a post might have broken syntax or malformed LaTeX.


## Pandoc pipeline

Originally, the compiler called Pandoc as an external process via `unixFilter`:
```haskell
getResourceBody >>= withItemBody (unixFilter "pandoc" args)
```

The args I passed to Pandoc were:
```
--from markdown+mark+wikilinks_title_after_pipe-yaml_metadata_block
--to html
--lua-filter filters/obsidian-callouts.lua
--number-sections
--mathjax
```

That version worked fine for quite a while, and it matched the way I already used Pandoc elsewhere, especially in Obsidian. But it build depended on a separately installed `pandoc` binary, which made the build contract less explicit than I wanted. It also meant that version drift could affect the output in ways cabal itself did not really know about.

So I eventually rewrote this part. Now the site uses Pandoc through Hakyll's library integration instead of shelling out to the executable. In `Site.Utils`, the compiler now does three things in sequence:

1. Read markdown into a Pandoc AST with custom reader options.
2. Transform the AST in Haskell.
3. Write it back to HTML with custom writer options.

It's more complicated than the old way, I had to add explicit `pandoc`, `pandoc-types`, and `text` dependencies to the cabal file. But in return, the site build no longer depends on a external `pandoc` executable to render posts.

### Replacing Lua filters

In [Obsidian](https://obsidian.md), I use [obsidian-pandoc](https://github.com/OliverBalfour/obsidian-pandoc) to export my notes to PDF files through $\LaTeX$ (See [HuangxinDong/Eisvogel-for-Obsidian](https://github.com/HuangxinDong/Eisvogel-for-Obsidian) for more). It supports custom lua filters, so I use it to add some custom filters to my markdown files. 

The legacy setup used [`filters/obsidian-callouts.lua`](../assets/files/obsidian-callouts.lua.txt) to turn Obsidian-style blockquotes like this:

```md
> [!note] title
> some text

> [!sidenote]
> some text
```

into styled callouts and sidenotes.

While refactoring the Pandoc Pipeline, I realised I was not really using the more complicated parts like folded callouts or type aliases, so I decided to move the transformation into Haskell without turning it into a huge rewrite.

As part of the refactoring, I added a `Site.Pandoc.Callouts` module that walks the Pandoc AST and rewrites matching `BlockQuote`s into the HTML structure used by the site. Unknown callout types are left alone and rendered as ordinary blockquotes, which felt like a nicer failure mode than trying to be too clever.

I moved `obsidian-callouts.lua` to the `assets/files` folder to keep it as a reference, but the website itself no longer depends on that filter during the build.

## Formatter.hs

I write most of my notes and articles in Obsidian, although they can be rendered normally in most markdown viewers, some of them does not work in Pandoc. For example, if there's no blank line before a heading, Pandoc will render it as a normal text. Inspired by [Prettier](https://prettier.io/), I though it would be convient to have a tool that automatically formats the markdown files. I know prettier can also format markdown files, but it's a nice practice to write it in Haskell, and custom it to my needs.

`Formatter.hs` is a separate executable in the same cabal file. It finds all `.md` and `.markdown` files in the project directory, and applies a set of typography fixes
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

## Data Integration: Douban Archive

I wanted to have a place to keep track of the books I've read and movies I've watched, without relying on a third-party service. Since I've been using [Douban](https://www.douban.com/) for years, I decided to import my data from there.

The implementation is split into a few parts:

- **Ingestion**: Using Hakyll's `preprocess`, the site-building process loads CSV exports from `assets/douban/`.
- **`Douban.Records`**: A Haskell module that handles the heavy lifting of CSV parsing (dealing with BOM, multi-line fields, and weird encoding quirks). It normalises the data into a common `DoubanRecord` format.
- **Dynamic Routing**: Instead of creating a markdown file for every category, `site.hs` uses `createRecordStatusPages` to programmatically generate pages for Books, Movies, Music, and Games, including separate "Read/Watched/etc." and "Wishlist" views.

This keeps my "Records" section automatically updated whenever I drop a new CSV export into the folder and rebuild the site.

## What's next

- [ ] Tags are implemented but the tag pages are unstyled.
- [x] `--number-sections` should probably be opt-in per post, not global. -> it can be controlled by frontmatter now.
- [ ] It should probably become more deliberate per post, rather than just "on by default unless disabled".
- [ ] The `series/` concept is half-baked — I'm still not sure how to use it.
- [x] css is still pretty basic: no support for dark mode, no responsive design, etc.
- [x] Integrate reading/watching/listening/gaming records.
- [ ] Add a search function.
- [x] Add a comment area. -> I added a comment section using giscus.
- [ ] Write more posts rather than just playing with the blog!

---

The [source code](https://github.com/HuangxinDong/HuangxinDong.github.io) of this blog is available on GitHub. Feel free to check it out if you're interested or have any suggestions! 
