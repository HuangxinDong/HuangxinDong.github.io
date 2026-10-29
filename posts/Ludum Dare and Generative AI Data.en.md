---
title: "Data: Generative AI at Ludum Dare"
created: 2026-10-29
tags:
  - video_game
  - ai
  - data_analysis
description: Every interactive figure from LD50 to LD60 — game comments, forum posts, ratings, itch.io AI declarations, a community poll, and off-the-shelf sentiment tools compared with manual coding.
draft: true
---

This page collects the figures behind [Thoughts on Making Games in the Age of AI: Generative AI at Ludum Dare](/posts/ludum-dare-and-generative-ai.html). The data cover LD50 (April 2022) to LD60 (October 2026).

>[!note]
> **Data sources**: game pages, game comments, ratings and forum posts come from the public [ldjam.com](https://ldjam.com) API; itch.io AI declarations for LD59 and LD60 come from [ludum-dare.foon.uk](https://ludum-dare.foon.uk); the rules poll comes from [@Jezzamon](https://ldjam.com/users/jezzamon)'s [ld-votes](https://jezzamon.com/ld-votes/). Game comments and forum posts were collected on 26 October 2026, while LD60 was still in its rating period. Unless stated otherwise, this applies throughout.


## Overview

### The events

:::: ldai-figure
<div class="ldf" data-ldf="events">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: **Comments mentioning AI** counts game comments that mention generative AI, per 1,000 comments, after removing replies by the game's authors and keyword false positives. **Posts mentioning AI** is the share of forum posts about AI. LD60 was still being rated when the data were collected, so it has only about a third of the usual number of comments.
:::
::::

### How often AI comes up

Game comments (per 1,000) and forum posts (percent) that mention generative AI, by event.

:::: ldai-figure
<div class="ldf" data-ldf="attention">Loading the interactive figure… (JavaScript required)</div>
::::

### What "AI" refers to in comments

:::: ldai-figure
<div class="ldf" data-ldf="referent">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: by default, the figures on judgements below use only the first three kinds: AI used to make the game, AI running inside the game, and AI-written comments or posts.
:::
::::

## How people comment

<div class="ldf ldf-shared" data-ldf="shared"></div>

### How comments judge the AI use

:::: ldai-figure
<div class="ldf" data-ldf="evalmix">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Click a segment to list its comments below the figure.

Note: **Points out AI, no judgement**: only notes signs of AI or guesses that AI was used ("The text has that familiar LLM flavor"), with no evaluative words. **Praise with a concession**: "it's AI, but…". **Softened criticism**: negative, but hedged with a disclaimer, softening words, a condition or an apology.
:::
::::

### How the shares of each stance change

Several shares over time. You can show more than one line. Follows the shared filter above.

:::: ldai-figure
<div class="ldf" data-ldf="trend">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: shading is the 95% Wilson confidence interval. A hollow point means the denominator is below the selected minimum sample size.
:::
::::

### What comments do

:::: ldai-figure
<div class="ldf" data-ldf="acts">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Click a cell to list its comments below the table; click a row label to list them for all events.

Note: the column header gives the number of comments in that column. Columns below the selected minimum sample size are greyed out, and their colours no longer stand for the values.
:::
::::

### Comments on different uses of AI

The share of criticism in comments about each use (art, music, code and so on).

:::: ldai-figure
<div class="ldf" data-ldf="byuse">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: a comment can concern several uses, so the rows overlap.
:::
::::

### Which uses get talked about

Among comments about AI use, the share that mention each use.

:::: ldai-figure
<div class="ldf" data-ldf="usemix">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: a comment can mention several uses.
:::
::::

## Ratings and declarations

### Declared AI use and how games did

Each dot is a game, grouped by its AI declaration on itch.io.

:::: ldai-figure
<div class="ldf" data-ldf="strip">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: LD59 covers the 1,142 ranked games, grouped by the itch.io declarations collected by foon (games that ticked only "code" are **AI: code only**; games that ticked graphics, audio or text are **AI: art / audio / text**). LD60 was still being rated, so it has only rating counts and comment measures.

**Ratings received** is the number of people who rated Overall; **Ratings given** is how many games the authors rated (weighted, LD uses it to decide how often a game is shown to raters); **Comments** excludes replies by the authors and their teammates.
:::
::::

### Comments on games, by declaration

Non-author comments on game pages: comments per rating, comment length, and how many comments mention AI.

:::: ldai-figure
<div class="ldf" data-ldf="talk">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: **Comments per rating** and **Median length** are medians across games; length is in characters. **Comments mentioning AI** pools all comments in the group and uses the same keyword rules as elsewhere, without manual removal of false positives (such as AI opponents in a game). **Games with an AI comment** is the share of games with at least one comment that mentions AI.
:::
::::

### LD59 scatter plot

Pick any two measures. Click the legend to hide a group.

:::: ldai-figure
<div class="ldf" data-ldf="scatter">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: with Group medians ticked, the large ringed dots mark each group's median on both measures; the values are listed in the table below the plot.
:::
::::

### Games opting out of rating categories

Since LD51, Ludum Dare has advised games with AI-generated assets to opt out of the matching categories. This is the share of games whose authors chose not to be rated in a category.

:::: ldai-figure
<div class="ldf" data-ldf="optout">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: games without audio often opt out of Audio too, so its baseline is high. For LD60, "AI used" includes games that used AI only for code.
:::
::::

### Share of games declaring AI use

Among games with an explicit declaration on itch.io (used or not used), the share that declared using AI.

:::: ldai-figure
<div class="ldf" data-ldf="decl">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: horizontal lines are 95% confidence intervals.
:::
::::

## Poll, vocabulary and likes

### Rules poll

An unofficial poll started by [@Jezzamon](https://ldjam.com/users/jezzamon) after LD59, with 201 valid responses. Results are also public at [ld-votes](https://jezzamon.com/ld-votes/).

:::: ldai-figure
<div class="ldf" data-ldf="poll">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: for the two "Continue if…" questions, 1 = would stop entering, 3 = no difference, 5 = more likely to enter. Respondents chose to take part, so they do not represent all participants.
:::
::::

### Vocabulary

Number of AI-related texts (posts and comments) per 100 that contain each term.

:::: ldai-figure
<div class="ldf" data-ldf="vocab">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: LD50 has only a few dozen texts, too few to read on its own.
:::
::::

### Likes on comments

Likes received by each comment, grouped by judgement.

:::: ldai-figure
<div class="ldf" data-ldf="hearts">Loading the interactive figure… (JavaScript required)</div>
::::

## Automatic sentiment analysis

### How the automatic methods work

Besides the manual coding, the same comments were scored with five off-the-shelf automatic methods. Here is how each one works.

:::: ldf-expl
::: item
**Manual coding (the reference)**

Claude read each comment against the codebook and assigned its judgement of the AI use to one of seven categories (see the legend of "How comments judge the AI use"). Only the literal text counts; no reading between the lines by period. I blind-coded 40 of them independently; agreement with Claude on judgement is κ = 0.72.

All automatic methods below are compared against this coding. The comparison uses only comments coded as directional: praise and praise with a concession count as positive, softened and direct criticism as negative, 477 comments in all.
:::

::: item
**Extracting the sentences that mention AI**

Comments are split into sentences at full stops, question marks, exclamation marks and line breaks; the sentences containing AI keywords (AI, ChatGPT, Claude, Midjourney, generated, vibe coding, slop and so on) are kept and joined. If a comment praises the art and music and ends with "the AI text felt off", only the last sentence is kept. The aim is to score the attitude to AI, not to the whole game. Methods marked "AI sentences" read only this part; those marked "whole comment" read the full comment.
:::

::: item
**VADER (lexicon)**

VADER is a sentiment lexicon built in 2014 for social media text. It gives several thousand English words a prior score ("great" +3.1, "bad" −2.5 and so on) and adjusts them with a few rules: "not" flips the sign, "very" strengthens it, as do exclamation marks and capitals, and the part after "but" weighs more. The word scores in a sentence are summed and squashed to between −1 and +1, the compound score.

Reading: ≥ 0.05 is positive, ≤ −0.05 negative, in between neutral.

It cannot use context. "familiar LLM flavor" contains no negative word and scores about 0, though it may well imply criticism.
:::

::: item
**TextBlob (lexicon)**

TextBlob uses another lexicon (from the Pattern library) that mainly scores adjectives. It averages the scores of the adjectives in a sentence, again giving −1 to +1, with the same thresholds as VADER. It shares VADER's weakness, and because it looks only at adjectives it finds no attitude in a sentence like "I closed the tab".
:::

::: item
**RoBERTa sentiment model**

A neural network trained on about 124 million tweets (cardiffnlp/twitter-roberta-base-sentiment-latest). It reads the whole sentence and outputs three probabilities, positive, neutral and negative, summing to 1. The score is positive minus negative, from −1 to +1.

Reading: > 0.2 is positive, < −0.2 negative, between −0.2 and 0.2 neutral. It handles some context, such as praise after "even though it's AI". But it judges the mood of the sentence, not the attitude to AI: a cheerful "I used AI for the music too!" also comes out positive.
:::

::: item
**Zero-shot stance (NLI)**

This model (facebook/bart-large-mnli) was trained to judge whether one sentence follows from another. It is given two candidate conclusions, "The writer disapproves of using AI in this game." and "The writer approves of using AI in this game.", and outputs how strongly the comment supports each, as two probabilities summing to 1.

Reading: a probability of disapproval > 0.5 is negative, otherwise positive. There is no neutral option. Because it asks about the attitude to AI rather than mood, it is closer to what is being measured than the three methods above.
:::

::: item
**Politeness features (regular expressions)**

Not a score: it only checks whether the sentences mentioning AI contain certain kinds of words. Simplified from the politeness strategies of Danescu-Niculescu-Mizil et al. (2013):

**Softening words** I think, maybe, probably, might, seems, a bit, kind of, imo…; **apology** sorry, no offense, I hate to…; **thanks** thanks, appreciate; **disclaimer** I don't mind, nothing against, not trying to…; **contrast** but, though, although, however, even if, despite, still; **condition** if it's / if you used…; **question** a question mark; **second person** you, your; **praise outside the AI sentences** great, nice, love, cool, fun… elsewhere in the comment (praise first, criticism after).
:::
::::

### Scores against manual coding

Each dot is a comment: the horizontal axis is the selected method's score, and rows follow the manual coding. Click a dot to see its AI sentences and the scores from every method. Drag the threshold and the agreement tables below update.

:::: ldai-figure
<div class="ldf" data-ldf="mscore">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: **AUC**: take one comment manually coded as criticism and one coded as praise at random; AUC is the probability that the method scores the first more negatively. 0.5 is chance, 1 is perfect separation; it does not depend on the threshold. **κ** (Cohen's kappa): agreement with the manual coding once the scores are cut at the current threshold, corrected for chance. 0 is chance, 1 is perfect agreement.
:::
::::

### The trend the automatic methods find

The share judged critical in each period, by manual coding and by each automatic method. The denominator is always the comments manually coded as directional. Below: the share of critical comments showing each politeness feature.

:::: ldai-figure
<div class="ldf" data-ldf="mtrend">Loading the interactive figure… (JavaScript required)</div>

::: ldai-note
Note: politeness features are found with regular expressions in the sentences mentioning AI (word lists in the last item of "How the automatic methods work"). They are approximate: "might", for instance, counts as softening whatever its role in the sentence.
:::
::::

## Search the data

### Comment search

The 805 coded comments, with the keyword centred. Follows the shared filter above.

:::: ldai-figure
<div class="ldf" data-ldf="conc">Loading the interactive figure… (JavaScript required)</div>
::::

### Forum posts

The 357 forum posts about AI (LD50 to LD60).

:::: ldai-figure
<div class="ldf" data-ldf="posts">Loading the interactive figure… (JavaScript required)</div>
::::
