---
date: 2026-04-02
title: "Fixing My Zsh Setup: Autosuggestions & History Search"
tags:
  - tool
---

I use macOS Terminal with [ohmyzsh](https://github.com/ohmyzsh/ohmyzsh), since I’m not a power user and just want the simplest and most convenient setup. For a while my shell config had two problems I kept ignoring:

1. Pressing `→` did nothing useful with autosuggestions - I couldn't accept a single word from the grey hint
2. After typing a prefix like `npm run` and pressing `↓` through history matches, hitting `↓` at the bottom just got stuck. But I want it to go back to a clean line

## The original setup

I had both `zsh-autocomplete` and `zsh-autosuggestions` installed at the same time, and didn't notice they conflict. `zsh-autocomplete` is quite heavy and takes over ZLE widget registration at load time, quietly breaking anything that relies on the standard completion machinery. Removing it and relying solely on `zsh-autosuggestions` fixed several ghost issues I hadn't even consciously noticed.

But the more interesting problem was the key bindings.

## The `^I` trap

I had this line in my config:

```zsh
bindkey '^I' autosuggest-accept  # ^I is Tab
```

Binding it to `autosuggest-accept` meant Tab would accept the entire suggestion instead of triggering completion - reasonable on its face, but it also caused a side effect: in macOS Terminal, `→` shares some input handling with Tab in certain contexts, so pressing `→` was silently triggering `autosuggest-accept` (whole line) rather than the word-by-word behaviour I wanted.

Btw, the way to confirm what any key actually sends is:

```zsh
cat -v  # press the key, then Ctrl+C to abort
```

Once removed the `^I` binding, `→` behaved as expected :)

## Accepting one word at a time

`zsh-autosuggestions` doesn't have a built-in "accept one word" widget. Instead, it has a mechanism called `ZSH_AUTOSUGGEST_PARTIAL_ACCEPT_WIDGETS`. Any widget listed there will, when executed, absorb the corresponding portion of the suggestion into the real buffer.

Meanwhile, `forward-word` moves the cursor one word to the right. So by adding it to the list, bind `→` to it, and pressing `→` will pull one word out of the suggestion each time. And that's exactly what I always wanted.

Note that two things matter here:

- **The variable must be set before sourcing the plugin.** It's read once at initialisation. Setting it afterwards has no effect.
- **The binding must be set after `oh-my-zsh.sh` is sourced.** Oh My Zsh will overwrite bindings set before it loads. Anything you want to stick goes at the bottom of `.zshrc`

## History substring search

`zsh-history-substring-search` filters history by whatever you have already typed. For example, type `npm run`, press `↑`, and you cycle only through commands that start with `npm run`. With nothing typed, it behaves like normal history navigation.

```zsh
source $(brew --prefix)/share/zsh-history-substring-search/zsh-history-substring-search.zsh
HISTORY_SUBSTRING_SEARCH_ENSURE_UNIQUE=1

bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
bindkey '^P'   history-substring-search-up    # fallback for tmux / SSH
bindkey '^N'   history-substring-search-down
```

The remaining problem was the *stuck-at-bottom* behaviour. When you reach the most recent match and press `↓` again, the plugin sets `HISTORY_SUBSTRING_SEARCH_RESULT` to an empty string. That's the signal to clear the line:

```zsh
_history_substring_search_down_then_clear() {
  if [[ $HISTORY_SUBSTRING_SEARCH_RESULT == '' ]]; then
    zle .kill-whole-line
  else
    zle history-substring-search-down
  fi
}
zle -N _history_substring_search_down_then_clear
bindkey '^[[B' _history_substring_search_down_then_clear
```

## Plugin source order

All three plugins must be sourced in this order:

```
zsh-syntax-highlighting
zsh-autosuggestions
zsh-history-substring-search
```

`zsh-syntax-highlighting` wraps every registered ZLE widget at load time to apply colouring. If `zsh-autosuggestions` loads first, the widgets it creates won't be wrapped, and highlighting breaks for those interactions. Source highlighting first, and it captures everything that comes after.

## fzf

One addition worth mentioning: I currently use `fzf` to replace the default `Ctrl+R` history search with a full-screen fuzzy finder. Install it with `brew install fzf`, then add this to `.zshrc`:

```zsh
eval "$(fzf --zsh)"
```

This also enables `Ctrl+T` (fuzzy file picker, inserts path into command line) and `Alt+C` (fuzzy `cd`). The history search alone makes it worth installing — typing `np ru d` will match `npm run dev`.

## Final config

Check [my final zshrc](/files/zshrc.txt)