---
title: "Thoughts on Making Games in the Age of AI: Generative AI at Ludum Dare"
created: 2026-10-29
tags:
  - video_game
  - ai
  - data_analysis
description: Scraping game comments, forum posts and ratings from LD50 to LD60 to see how the Ludum Dare community's attitudes towards generative AI in game-making have changed.
---

>[!note]
> All the interactive figures in this post, plus more that did not make it into the text, are collected [here](/posts/ludum-dare-and-generative-ai-data.html). Data sources: game pages, game comments, ratings and forum posts come from the public [ldjam.com](https://ldjam.com) API; itch.io AI declarations for LD59 and LD60 come from [ludum-dare.foon.uk](https://ludum-dare.foon.uk); the rules poll comes from [@Jezzamon](https://ldjam.com/users/jezzamon)'s [ld-votes](https://jezzamon.com/ld-votes/).

## Preface

This October I took part for the first time in the Ludum Dare game jam (ldjam from here on). My teammates and I started making things with almost no plan at all. Most of the design came from sudden flashes of inspiration or something close to daydreaming, and luckily we managed to submit a reasonably complete game at the very last minute. But what I want to talk about here is what came after the jam. Once the 18 days peer-rating period began (a game needs more than 20 ratings to get a final ranking), I noticed a huge amount of discussion about gen AI in game-making: in the comment sections of our own game and other people's, in posts on the ldjam forum, and on ldjam Discord. This discussion has taken center stage across several events and touches almost every game ([Figure 1](#fig-1)). By now, almost everyone who joins a game jam has to face two questions: should I use AI to make my game? And how should I rate games made with AI?

:::: {#fig-1 .ldai-figure}
<div class="ldai" data-ldai="attention">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 1]{.ldai-no} Game comments (per 1,000) and forum posts (percent) that mention generative AI, LD50 to LD60
:::

::: ldai-note
Note: long-term linear trend: not significant for comments (quasi-binomial regression, p = 0.15); p = 0.03 for posts.
:::

::::

>[!sidenote]
> Note that LD60 was still in its rating period when I scraped the data (game comments and forum posts were collected on 26 October 2026). Unless stated otherwise, this applies to everything below as well.

So in this post I scraped data from LD50 to LD60. Through trend, stance and sentiment analysis of how generative AI has been used at Ludum Dare over the past 5 years, how people rated and commented on games that did or did not use AI, and what exactly people argued about on the forum, I try to get a grip on how attitudes towards generative AI in game-making have changed, from the big picture down to specific cases, and on what we might learn from it.

I chose Ludum Dare first of all because I have been binge-reading its posts lately. It also helps that its data are relatively open and transparent, and come from several sources: game pages, comment pages, ratings and posts. As a long-running event that is well known in the industry, it has many participants and a lot of discussion and data. And because it lacks moderators and community guidelines that keep up with the times, what people say there reflects fairly well what is actually going on right now.

## What We Talk About When We Talk About AI

AI is a complicated concept in itself. From early symbolic reasoning and expert systems to machine learning and deep learning, from the pathfinding algorithms and behaviour trees that drive enemies in games to today's LLMs and diffusion models that write code, generate images and compose music, all of these broadly count as AI. In game-making specifically, and based on what actually appears at Ludum Dare, mentions of AI broadly fall into these categories: using AI to make the game, AI running inside the game, AI-written comments or posts, AI as the theme of the game, AI as an opponent or NPC, and other or unrelated (comments that the keywords caught but that turned out to have nothing to do with genAI).

:::: {#fig-2 .ldai-figure}
<div class="ldai" data-ldai="referent">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 2]{.ldai-no} What "AI" refers to in Ludum Dare comments, LD50 to LD60
:::

<details class="ldai-more">
<summary>All keywords used in the scrape</summary>

The conditions are regular expressions, case-insensitive; matching any one of them is enough:

- Tools and companies: `chat ?gpt`, `\bgpt-?\d`, `\bLLMs?\b`, `\bclaude\b`, `copilot`, `midjourney`, `stable ?diffusion`, `dall-?e`, `\bsuno\b`, `elevenlabs`, `gemini`, `\bopenai`, `anthropic`
- Concepts: `generative`, `gen-?ai\b`, `vibe[- ]?cod`, `artificial intelligence`, `\bA\.I\.`
- "AI + noun": `AI[- ](generated|assisted|art|artists?|tools?|slop|use[ds]?|usage|games?|content|music|assets?|code|coding|declarations?|disclosure|policy|rules?|images?|voices?|models?|agents?)`
- "Verb + AI": `(using|used|use of|with|no|without|against|ban|banned|allow|allowed|disclose|declare) AI\b`
- `ethic|cheat|ban|rule|slop|generat|assist|disclos|declar` within 30 characters of AI

Texts that contain only a bare `AI` and match none of the above are left out (most of them are about enemy AI in games). After removing replies by the game's own authors, the remaining 805 comments were coded by hand, one by one; about 13% of them turned out to have nothing to do with generative AI and went under "Other or unrelated".

</details>

::::

It is easy to see from the figure that *using AI to make the game* and *AI running inside the game* have always been the main things people talk about. Besides the discussion of *AI-written comments and posts*, one clear trend is that the share of "using AI to make the game" rose from 38% to 83%, while "AI running inside the game" fell to 5%. Different applications and extents of use can draw completely different reactions even when the same LLM sits behind them, so specific cases need to be looked at one by one. Ludum Dare has one more peculiarity: it has more than one submission categories: Jam, Compo, Extra and Unfinished. The LD51 [welcome post](https://ldjam.com/events/ludum-dare/51/paid-vacation/welcome-to-ludum-dare-51) said that AI should not be used in the Compo and that such games should be submitted to the Jam or Extra instead; the 2024 FAQ added that AI assistants and co-pilot tools "can be used without restriction". So we also need to discuss the Jam and the Compo separately.

It is also worth noting that "using AI to make the game" alone can be broken down further by what the AI was used for (art, music, code and so on). [Figure 3](#fig-3) shows that, apart from fairly general mentions of AI, the related comments most often mention art, followed by writing and then music and sound. Notably, programming has clearly been on the rise. This is very likely connected to the boom in AI coding around 2024[^so2024], and also to the LD community's lack of rules about programming and the arguments that has caused.

:::: {#fig-3 .ldai-figure}
<div class="ldai" data-ldai="usemix">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 3]{.ldai-no} Among comments about using AI to make the game or AI running inside the game, the share that mention each use, LD50 to LD60
:::

::: ldai-note
Note: a comment can mention several uses, so a column can add up to more than 100%. The n in each column header is the total number of these two kinds of comments in that event. LD60 data are incomplete.
:::

::::

## How do I rate AI games?

The posts that got me thinking the most were [I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games) and [How do you rate Claude games?](https://ldjam.com/events/ludum-dare/60/granny-tech-support/how-do-you-rate-claude-games). Both sparked a lot of discussion, because the topic reflects more than just widespread confusion over the mechanics of rating. Each reply subtly introduces a complex web of underlying issues and stances."

But before answering that question, let's first take a broad look at how Ludum Dare participants feel about AI use, and at how people rate and comment overall.

To start with, we can set aside what form the AI takes and what exactly it refers to, and simply classify each comment's stance on the AI use at face value (seven levels, from Praise to Direct criticism), to sketch the overall trend of the community's discussion.

:::: {#fig-4 .ldai-figure}
<div class="ldai" data-ldai="evalmix">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 4]{.ldai-no} The overall stance of each AI-related comment on the AI use, LD50 to LD60
:::

::: ldai-note
Note: *Points out AI, no judgement*: only points out traces of AI or guesses that AI was used ("The text has that familiar LLM flavor"), with no evaluative words. *Praise with a concession*: "it's AI, but…". *Softened criticism*: negative, but with a disclaimer, a hedge, a conditional or an apology.

LD60 data are incomplete; scraped up to 26 October 2026.
:::

::::

So what exactly do the AI-related comments say? Looking across the ldjam comment data, we can roughly sort them into the ten kinds shown in the figure below. Obviously, each kind may lean its own way. "Praises not using AI", for example, usually signals a dislike of AI use, and such comments are more common in the Compo than in the Jam. The attitude behind "Points out AI traces" can be more complicated, and it may change over time. Back in LD52, asking or pointing out whether some part of a game was made with AI might have been plain curiosity or technical interest, but by LD60 it often carried an undertone of implicit criticism. In particular, commenters who choose not to be anonymous when giving feedback mostly use polite, courteous wording, partly out of fear of retaliatory ratings, resulting in deliberately vague or neutral phrasing.

[Figure 5](#fig-5) shows that "using AI to make the game", "AI running inside the game" and "AI-written comments or posts" received completely different kinds of comments. "Using AI to make the game" is the most common and the most varied topic, but comments that oppose AI-generated work as a whole, such as Says AI was used and not admitted, Praises not using AI and Thanks for disclosing or opting out, are concentrated in the last few events, especially LD60. For "AI running inside the game" there is almost no criticism; most comments stay at judging how well it works or talking about the technology, and only a few ask whether the rules allow it. For "AI-written comments or posts" there is very little data overall, and it mostly shows up only in LD60, so it is a fairly new phenomenon. Concretely, some users exploit the system's rules by using AI to comment on large numbers of games quickly and in bulk, which boosts their own game's visibility and baits other developers into rating theirs. People generally resent this, but the current rules have no way of forbidding it.

:::: {#fig-5 .ldai-figure}
<div class="ldai" data-ldai="acts">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 5]{.ldai-no} What AI-related comments do, LD50 to LD60
:::

::: ldai-note
Note: a comment can do several things at once. Each cell shows the share of comments that do this thing; colours are compared within each row, and brighter means higher within that row. Columns with fewer comments than the selected minimum sample are left uncoloured. Click a cell to read the comments behind it, right below the table.
:::

::::

So, for the different uses of AI in game-making ([Figure 3](#fig-3)), how is each one judged? We looked at the share of criticism among these comments. Because the data are limited, categories such as *Writing* show no statistically meaningful preference. Still, an overall trend is easy to see: for almost every category with data, criticism of AI use first rises and then stays at a fairly high level.

:::: {#fig-6 .ldai-figure}
<div class="ldai" data-ldai="byuse">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 6]{.ldai-no} Share of criticism in AI-related comments, by what the AI was used for in making the game (art, music, code and so on), LD50 to LD60
:::

::: ldai-note
Note: each cell only counts comments from that event that mention this use and express a clear stance on the AI use (Praise, Praise with a concession, Softened criticism and Direct criticism; "No judgement", "Points out AI, no judgement" and "Mixed" are left out). The percentage is the share of criticism (softened plus direct) among them, and the small numbers below it are "critical comments / comments with a clear stance". Blue means little criticism, red means a lot.

Cells with fewer than 5 comments are not coloured. A comment can involve several uses, so the rows are not mutually exclusive.
:::

::::

Before discussing how AI use relates to ratings, we also need some way of deciding whether a game used AI at all. The simplest way is the creator's own declaration, but it's not necessarily honest, and not everyone makes one. It's also hard to setup a criteria for people to judge manually; for code in particular, since not every codebase is open source, it is sometimes nearly impossible to tell. It is also worth mentioning that the "AI declaration" seems to play a subtle role: it lets authors explain why they used AI. For example, someone who is only good at art and writing might use AI to help with the programming, because otherwise they could not finish a complete game within three days and say what they wanted to say. Even if we look only at the tags on itch.io, different players may react differently to different declarations; and tags related to art, audio or text may draw more discussion.

:::: {#fig-7 .ldai-figure}
<div class="ldai" data-ldai="talk">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 7]{.ldai-no} Non-author comments on game pages and AI declarations, LD59 and LD60
:::

::: ldai-note
Note: *Comments per rating* and *Median length* are medians across games; length is counted in characters. *Comments mentioning AI* pools all the comments in the group, with the same keyword rules as the other figures and without manually removing unrelated cases (such as AI opponents in games). *Games with an AI comment* is the share of games with at least one comment that mentions AI.

LD59 figures are from after the rating period; LD60 was still in its rating period when scraped (29 October 2026).
:::

::::

Although ldjam's mechanics encourage people to comment a lot, in exchange for more "karma" that makes their own game more visible, the comments, which are usually not anonymous, and the ratings, which always are, may well differ quite a lot in both number and attitude. In particular, sometimes only people with clear likes or dislikes about AI mention it in their comments, while people with vaguer or neutral views may not bring it up or join the discussion at all. For ratings, we analysed the LD59 rating data, which covers 1,142 ranked games, grouped by the itch.io declarations compiled by [@rogual](https://ludum-dare.foon.uk/events/59). [Figure 8](#fig-8) shows that, unlike what the comments suggest, games that declared AI use did not score noticeably lower than games that declared no AI use or made no declaration. On the contrary, games that used AI only to help with coding are no different (both groups average 3.55), and their median score is even slightly higher. This group also includes the Compo winner, [Boba's Love Story](https://ldjam.com/events/ludum-dare/59/bobas-love-story). Although many players questioned its use of AI in the Compo, the game still came out on top in the ratings and took first place. Given that declarations may be untrue, if we look at it simply from this angle, a creator who wants a high score could in theory use AI to help with code, and then declare falsely or not declare at all, even though this is likely to be unfair to the other entrants.

:::: {#fig-8 .ldai-figure}
<div class="ldai" data-ldai="strip">Loading the interactive figure… (JavaScript required)</div>

::: ldai-caption
[Figure 8]{.ldai-no} Declared AI use and how games actually scored, LD59
:::

::: ldai-note
Note: each dot is a game; the vertical line and the number on the left are each group's median. Groups follow the itch.io declarations compiled by [foon](https://ludum-dare.foon.uk/events/59): games that ticked only "code" go under **AI: code only**, and games that ticked images, audio or text go under **AI: art / audio / text**. When you switch to LD60, the declarations only say whether AI was used or not, and the event was still in its rating period, so only rating counts and comment metrics are available (scraped on 29 October 2026).

Observational data: declarations may be untrue, and teams that used AI for assets may simply have been short of an artist or a sound person.
:::

::::

## What should we do?

From the data above, we now have a rough overview of how AI is used in game development, what the comments and ratings look like, and how the community feels overall. Broadly speaking, the share of games made with AI's help has grown with every event, and it has spread from art, music and text at first to code and overall design. AI as an NPC or as a subject of discussion appeared more in the early events; as people got used to AI, it stopped being such a frequent topic. People have started using AI to spam comments in bulk. Spam comments have always existed, previously as copy-pasted, generic text, but it is only in LD60 that they became mainly AI-driven. Over these ten events the discussion about AI never stopped, and its specific topics kept changing. In terms of attitude, the comments clearly show a growing dislike of generative AI in game development, but the ratings do not seem to show this tendency very clearly.

Of course, even with all this data, I still cannot pass judgement on the views of everyone in the [I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games) thread. Nor can I say whose side I am on, because everyone there seems to be discussing in good faith and to be genuinely puzzled. And although everyone appears to be talking about the same thing, "how to rate AI-assisted games", the thread actually covers several different sub-questions. What is AI's real role in game development: a tool, a means of theft, or a colleague? Where does the core of game design and development lie? What are ratings really for? Is this competition fair? Where do the rules come from? Everyone is probably partly right from where they stand.

For now, one of the places where the controversy gathers most is AI-assisted programming. Unlike AI-generated art and text, AI-generated code, although it has its own telltale features, usually does not show up directly in what you see on screen, so it is almost impossible to spot without reading the source, and ldjam has no rating category for code. It is also a fairly new and little-discussed problem, because until recently AI coding was not good enough to build a complete game on its own, so naturally there were no rules for it either.

As a computer science student, I can appreciate the beauty of programming, but I also know that most games cannot show it. A game that runs smoothly and is well optimised owes that to its code, of course, but players do not think "this game must have some really optimised code behind it!" while playing. And the beauty of code comes in many layers. A small function can be clever and beautiful, with low time and space complexity, or the overall system design can be very good, and it is hard to say what exactly counts as good. For me personally, programming is an intellectual challenge, and I enjoy it both during the process and at the end, but it is hard to imagine the people who use my programs feeling that same joy. As someone who came to computing from a degree in Chinese language and literature, I also understand the frustration of not having enough technical skill to express your own ideas. AI clearly helps people like that. Even for people who already have plenty of programming experience, AI-assisted coding can be very useful, because it lets you put your energy into higher-level orchestration and game design. As one forum comment puts it: "Using AI doesn't mean I've suddenly forgotten how to program. My knowledge and experience are still there. I'm simply making part of the development process faster and easier, while remaining in control of what I'm creating."[^geckoo]

The question is, what is the essence of game design? Willops says: "How much speed to give this enemy? How much jump height to give the player? How long should the jetpack power last? These questions are the essence of game design to me."[^willops] That is true, but the essence of game design may well be different for different people and different genres. And if someone learns how to set an enemy's speed from YouTube or somewhere like that, how is that different from getting a "suggested enemy speed" from AI? I think what matters is the role the human plays in the whole creative process. For the feel of each specific control, you open Godot or Unity and test, check and tweak it; for the overall design, you write out all the conditions and triggers step by step. But this line is very blurry. If you don't establish clear creative boundaries, it is very easy to let AI decide everything and end up with a work that does not really belong to you at all, yet carries your name and may even win you a prize.

Where do the rules come from when a community has no moderators and no shared guidelines? The ldjam user [@Jezzamon](https://ldjam.com/users/jezzamon) started a poll and shows the results so far at [ld-votes](https://jezzamon.com/ld-votes/). Interestingly, the results so far are close to a tie. Given that [ldjam is coming to an end](https://ldjam.com/events/ludum-dare/59/%24424396/ludum-dare-59-lives-me-too-countdown-to-64), I rather doubt that new rules will be announced, or that people would follow them if they were. It has always been this way: When the only deterrent is the honor system, rule-breakers easily gain the upper hand.

But in the end, ldjam is not a contest about competing and scores, and it is hard to say that a truly fair competition exists anywhere in the world. Some people will surely use their ranking as a selling point, but what most people are really after is a bit of motivation and some constraints, to finish a game as well as they can within limited time and a given theme. It is a test of your own ability, and a chance to express yourself. Rating each other's games is, at heart, about getting your game seen and getting as much feedback as possible, and also a chance to play other people's games, broaden your horizons and find new inspiration. Whether to use AI and how to use it, whether you let AI push you through the whole design until it erodes your own ideas, or let AI do the groundwork so that you can spend more time on the core design, is, for now, essentially a personal choice.

Both ldjam and game development are only a tiny microcosm of how AI is used today and of its effects. What is truly worrying is the making of new rules and theories once the forces and relations of production change, and that blurry edge of creativity.

[^so2024]: Stack Overflow's 2024 Developer Survey: 62% of respondents said they were already using AI tools in their development work that year (44% in 2023), and 82% of those used them to write code. See [2024 Developer Survey: AI](https://survey.stackoverflow.co/2024/ai).

[^geckoo]: Comment by @Geckoo1337 under [I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games).

[^willops]: Comment by @Willops in the same thread. It goes on: "but if you let the AI code for you and don't circle back to edit these values yourself, you're essentially offloading the design work as well without knowing it."
