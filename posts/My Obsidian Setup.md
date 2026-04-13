---
title: My Obsidian Setup
created: 2025-01-20
tags:
  - tool
modified: 2026-04-13
---

>[!question]
>Why Obsidian?

Obsidian stores notes as local markdown files — lightweight, portable, and fully under your control. You can organise, back up, and sync them in any way you like.

But any markdown editor can do that. What sets Obsidian apart is its refined note-taking experience and bidirectional linking, which turns isolated notes into a connected knowledge graph. On top of that, it offers a rich plugin ecosystem that covers everything from automation to the smallest quality-of-life tweaks, with css customisation, vim keybindings, and queryable note databases.

Below are some of the plugins and settings I use:

---

## Plugins

- [Advanced Tables](https://github.com/tgrosinger/advanced-tables-obsidian)
- [Calendar](https://github.com/liamcain/obsidian-calendar-plugin): a nice and simple calendar widget, suitable for daily notes.
- [Clear Unused Images](https://github.com/ozntel/oz-clear-unused-images-obsidian): clear the images that are not used in note files anymore.
- [Commander](https://github.com/jsmorabito/obsidian-commander): it can add commands everywhere in the Obsidian UI, I don't really use it a lot but still find it useful.
- ~~[Contribution Graph](https://github.com/vran-dev/obsidian-contribution-graph)~~: it can generate interactive heatmap for your notes, but I don't use it anymore as I prefer to sync my notes to GitHub and view the contribution graph on it.
- ~~[Dataview](https://github.com/blacksmithgu/obsidian-dataview)~~: you can create a database from your obsidian vault, but Obsidian has its own database system now.
- [Enhanced editing](https://github.com/obsidian-canzi/Enhanced-editing): bulk edit for obsidian
- [GDScript Syntax Highlighting](https://github.com/RobTheFiveNine/obsidian-gdscript): It adds GDScript syntax highlighting.
- [Git](https://github.com/Vinzent03/obsidian-git): add Git and other features in Obsidian. ==It's the best!==
- [ibook](https://github.com/bingryan/obsidian-ibook-plugin): the built-in solution to export iBook notes can be painful, and this plugin is a good alternative to export mac ibook annotations/hightlights to markdown.
- ~~[Kanban](https://github.com/obsidian-community/obsidian-kanban)~~: it does the job, but I'm not a big fan of any kanban.
- [Latex Suite](https://github.com/artisticat1/obsidian-latex-suite): it makes typesetting LaTeX faster, and saves me time on memorizing some LaTeX commands.
- [Lazy Plugin Loader](https://github.com/alangrainger/obsidian-lazy-plugins): it makes obsidian startup faster by loading some plugins with a delay.
- [Linter](https://github.com/platers/obsidian-linter): it lints your markdown files.
- ~~[Local GPT](https://github.com/pfrankov/obsidian-local-gpt)~~: I really like the concept of ollama + personal vault of notes, but the performance is not good enough.
- [Mindmap NextGen](https://github.com/james-tindal/obsidian-mindmap-nextgen): Create mind maps.
- ~~[QuickAdd](https://github.com/chhoumann/quickadd)~~: it's seems like a good plugin but I don't think I can make use of it.
- [Pandoc Plugin](https://github.com/OliverBalfour/obsidian-pandoc): I use this plus customised template to export my notes to PDF through LaTeX.
- ~~[Smart Connections](https://github.com/brianpetro/obsidian-smart-connections)~~: I like the idea but... I guess I just want to keep obsidian as a note-taking & thinking zone, and I prefer to think and connect my notes with less help from AI.
- [Tag Wrangler](https://github.com/pjeby/tag-wrangler): bulk edit for tags.
- [Templater](https://github.com/SilentVoid13/Templater): it allows you to insert variables into your templates.
- [Terminal](https://github.com/polyipseity/obsidian-terminal): it integrates terminal to obsidian, which is quite helpful for many tasks that involve running commands.
- [TaskGenius](https://github.com/taskgenius/taskgenius-plugin): it used to be a simple task progress bar, but now it's some kind of comprehensive task management plugin. I prefer the old version tbh.
- [TODO | Text-based GTD](https://github.com/larslockefeer/obsidian-plugin-todo): it generates a GTD task list from your notes, but I don't use it that often (though I should).
- [Word Splitting for Simplified Chinese in Edit Mode and Vim Mode](https://github.com/aidenlx/cm-chs-patch): quite useful for Chinese word splitting.


## CSS

These are some of the css snippets I use in obsidian:

- [Change comment rendering style (`%%`)](../assets/files/ob-comment-rendering-style.css)
- [Faded emoji in task](../assets/files/ob-faded-emoji-in-task.css)
- [Heading indicators](../assets/files/ob-heading-indicators.css)
- [sidenote auto adjust](https://github.com/crnkv/obsidian-sidenote-auto-adjust-module)


## Fonts

- UI Font:
  - SF Pro
  - Gentium Book Plus

- Body Font:
  - Source Serif 4
  - Source Han Serif CN VF
  - Gentium Plus

- Code Font:
  - Source Code Pro