---
title: "Ludum Dare 中的生成式 AI"
created: 2026-10-29
tags:
  - video_game
  - ai
  - data_analysis
description: 抓取 LD50 到 LD60 的游戏评论、论坛帖子与评分数据，分析 Ludum Dare 社区对游戏创作中生成式 AI 的态度变化。
lang: zh
---

<link rel="stylesheet" href="/assets/ld-ai/ldai.css?v=4">

>[!note]
> 本文的全部交互图（以及更多没有放进正文的图）位于[《数据分析：Ludum Dare 里的生成式 AI》](/posts/ludum-dare-and-generative-ai-data.html)里。数据来源：游戏页面、游戏评论、评分和论坛帖子来自 [ldjam.com](https://ldjam.com) 的公开 API；LD59 和 LD60 各游戏的 itch.io AI 声明来自 [ludum-dare.foon.uk](https://ludum-dare.foon.uk)；规则投票来自 [@Jezzamon](https://ldjam.com/users/jezzamon) 的 [ld-votes](https://jezzamon.com/ld-votes/)。

## 前言

今年十月，我第一次参与了久仰大名的Ludum Dare Game Jam（下文简称ldjam）。和几个队员几乎是毫无规划地就开始了制作，多数设计全靠灵光乍现或者梦游天姥，幸好在最后一刻提交上去了一份还算完整的作品。不过这次我想重点讨论的是游戏创作结束后的部分：作者们进入为期18天的互相评分环节（只有收到超过20个评分才能进入最终的排名）后，我注意到在我们自己和其他游戏的评论区、ldjam论坛的posts、Discord论坛，产生了大量关于游戏创作中的生成式AI的讨论，而且这类讨论是核心的、持续了好几届的、横跨几乎所有游戏的（如[图1](#fig-1)）。如今，参与gamejam的所有创作者几乎都必须要面对这个问题：我要使用AI创作游戏吗？我要如何给使用AI创作的游戏打分？

:::: {#fig-1 .ldai-figure}
<div class="ldai" data-ldai="attention">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 1]{.ldai-no} LD50–LD60 中提及生成式 AI 的游戏评论（每千条）和论坛帖子（百分比）
:::

::: ldai-note
注：长期线性趋势：评论不显著（拟二项回归 p = 0.15），帖子 p = 0.03。
:::

::::

>[!sidenote]
> 需要注意的是，LD60 抓取时还在评分期（游戏评论和论坛帖子抓取于 2026 年 10 月 26 日），下文如果没有额外说明也都适用此限制。

因此在这篇文章中，我抓取了LD50到LD60的数据，试图通过对近五年间Ludum Dare中生成式 AI的应用、人们对使用和没有使用AI的游戏的打分与评论、人们在论坛中具体的讨论内容进行趋势、态度与情感分析，来从宏观到具体地把握人们对于游戏创作中的生成式 AI的态度变化，以及可能的启发。


选择Ludum Dare的数据当然首先因为我最近高强度浏览了大量帖文，其次也因为其数据相对公开透明，并且包含游戏页面、评论页面、评分和post等多个数据源，作为业界闻名的老牌活动参加者、讨论声量和数据量相对比较大，同时因为缺乏 mod 和与时俱进的公约，其内容也很能够反映当前的真实情况。


## 当我们在谈论AI的时候，我们在谈论什么

AI本身就是一个复杂的概念，从最早的符号推理与专家系统到机器学习和深度学习，从游戏里驱动敌人的寻路算法与行为树到如今能写代码、画图、作曲的大语言模型与扩散模型，宏观意义上都属于AI的范畴。具体到游戏制作领域，并且考虑到Ludum Dare中出现的实际种种情况，大致可以归类为：使用AI制作游戏、游戏内运行的AI、AI撰写的评论或帖文、作为游戏主题的AI、作为敌人或NPC的AI、其他/无关（这些评论被关键词捕获，但经过筛查发现实际上是无关的）. 

:::: {#fig-2 .ldai-figure}
<div class="ldai" data-ldai="referent">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 2]{.ldai-no} 从LD50到60，Ludum Dare 评论里的“AI”分别指什么
:::

<details class="ldai-more">
<summary>抓取时使用的全部关键词</summary>

使用正则表达式来表达条件，不区分大小写，满足其一即可：

- 工具和公司名：`chat ?gpt`、`\bgpt-?\d`、`\bLLMs?\b`、`\bclaude\b`、`copilot`、`midjourney`、`stable ?diffusion`、`dall-?e`、`\bsuno\b`、`elevenlabs`、`gemini`、`\bopenai`、`anthropic`
- 概念：`generative`、`gen-?ai\b`、`vibe[- ]?cod`、`artificial intelligence`、`\bA\.I\.`
- “AI + 名词”：`AI[- ](generated|assisted|art|artists?|tools?|slop|use[ds]?|usage|games?|content|music|assets?|code|coding|declarations?|disclosure|policy|rules?|images?|voices?|models?|agents?)`
- “动词 + AI”：`(using|used|use of|with|no|without|against|ban|banned|allow|allowed|disclose|declare) AI\b`
- AI 前后 30 个字符内出现 `ethic|cheat|ban|rule|slop|generat|assist|disclos|declar`

只含单独的 `AI`、不满足以上任何一条的文本不进入分析（多数指游戏里的敌人 AI）。去掉了游戏作者本人的回复，剩下的 805 条评论逐条人工编码；其中约 13% 实际与生成式 AI 无关，归入 “Other or unrelated”。

</details>

::::

从图中不难发现，使用AI制作游戏和游戏运行时内部的AI一直都是人们主要讨论的内容。除了对于AI撰写的评论或帖文的讨论，一个明显的趋势是“使用AI制作游戏”占比从 38% 升到 83%，“游戏里运行的 AI”降到 5%。对于不同的情况、不同位置和程度的使用、即使背后都是同样的LLM，人们也可能产生截然不同的态度，因此需要对不同的具体案例进行分析。对于Ludum Dare还有一个比较独特的情况：其有多个提交类别：jam，compo，extra，unfinished。其中LD51的[欢迎帖](https://ldjam.com/events/ludum-dare/51/paid-vacation/welcome-to-ludum-dare-51)指出AI不应当用于compo，应该提交到jam或者extra类别中；2024 年的 FAQ 补充说 AI 助手和 co-pilot 类工具"can be used without restriction"。因此我们也将jam和compo的情况分开来讨论。

除此之外，值得注意的是，仅仅是“使用AI制作游戏”一条就可以根据AI不同用途（美术、音乐、代码……）继续细分。从[图3](#fig-3)中我们可以看出，除了比较general的AI提及以外，人们往往在相关评论中最常提及游戏美术，其次是writing，Music and sound。值得注意的是，游戏编程经历了明显的增长态势，这和2024年左右AI编程的大幅兴起很可能存在联系[^so2024]，也和ludumdare社区缺乏对游戏编程相关的条例与引起的争执有关。

:::: {#fig-3 .ldai-figure}
<div class="ldai" data-ldai="usemix">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 3]{.ldai-no} 从LD50到60，关于“使用AI制作游戏”和“游戏内运行的AI”的评论中，提到每种用途的评论所占比例
:::

::: ldai-note
注：一条评论可以提到多种用途（A comment can mention several uses），所以同一列加起来可以超过 100%。表头的 n 指这一届里这两类评论的总条数。LD60 的数据不全，抓取截至 2026 年 10 月 26 日。
:::

::::

## How do I rate AI games?

我个人认为最给我启发的帖文是[I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games) 和 [How do you rate Claude games?](https://ldjam.com/events/ludum-dare/60/granny-tech-support/how-do-you-rate-claude-games). 这两篇帖文都激起了不小的讨论，因为这个话题不仅反映了一种普遍的、对于具体的“评分”这个行为的困惑，每个参与者的评论也都潜在地引出不少与之相关而交错的议题与立场。

不过在回答这个问题之前，我们可以先宏观地看LudumDare参与者对AI使用的态度如何，看看人们整体上是如何打分和评论的。

首先，可以不考虑AI是以什么形式被提及的、具体是指什么，只按字面归类每条评论对 AI 使用的评价态度（从Praise到Direct criticism分为七个层级），来描摹整体的社区讨论趋势。

:::: {#fig-4 .ldai-figure}
<div class="ldai" data-ldai="evalmix">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 4]{.ldai-no} 从LD50到60，涉及到AI的评论中每条评论对AI使用的整体态度。
:::

::: ldai-note
注：*Points out AI, no judgement*：只指出 AI 痕迹或猜测用了 AI（"The text has that familiar LLM flavor"），没有评价词。*Praise with a concession*："虽然是 AI，但……"。*Softened criticism*：有负面评价，但加了免责、缓和语、条件句或道歉。

LD60 的数据不全，抓取截至 2026 年 10 月 26 日。
:::

::::

那么，涉及到AI的评论具体都是如何评论的呢？纵观ldjam的评论数据，我们大致可以为其归为如下图所示的10类，很显然，不同的类别都可能有其各自的态度倾向，例如“Praises not using AI”往往代表对AI使用反感的态度，而这类评论在compo类中多于jam类，而“Points out AI traces”背后蕴藏的态度可能更复杂，并且在不同时期可能不一样。例如，在LD52的时候询问或指出游戏中某个部分是否由AI制作可能出于单纯的好奇或技术探讨，但是在LD60中这可能变成了一种隐含的批评。特别地，对于选择不使用匿名来进行评价的评论者，多数人选择用更礼貌、客气的话语进行评分，一部分原因也是担心自己的游戏被报复性地打低分，因此背后隐藏的态度很可能是模糊的。从[图5](#fig-5)可以看出，“使用AI制作游戏”，“游戏内运行的AI”， “AI撰写的评论或帖文”三者收获了完全不同的评论：“使用AI制作游戏”是最普遍、最多样的一种讨论，但是Says AI was used and not admitted、Praises not using AI、Thanks for disclosing or opting out这类具有对AI生成作品整体反对态度的评论集中在最近几届，尤其 LD60；对于“游戏内运行的AI”，批评的声音几乎没有，多数停留在评价效果与技术讨论，只有少数讨论涉及到规则是否允许；对于“AI撰写的评论或帖文”，整体数据都非常少，而且主要在LD60才出现，属于比较新兴的现象。具体来说，是一些用户利用系统规则使用AI批量、快速地给大量游戏评价，并且提升自己游戏的热度、吸引这些作者去给自己的游戏评分。尽管用户普遍对此表示反感，但目前的规则没有办法禁止这一行为。

:::: {#fig-5 .ldai-figure}
<div class="ldai" data-ldai="acts">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 5]{.ldai-no} 从LD50到60，涉及到AI的评论中每条评论具体在评论内容分类表
:::

::: ldai-note
注：一条评论可以同时做几件事。格子里是做这件事的评论所占比例；颜色在每一行内部比较，越亮表示这一行里越高。评论数低于所选最小样本量的列不上色。点击格子可以在表格下方直接看到对应的评论。
:::

::::

那么，具体到AI在游戏制作中的不同用途（[图3](#fig-3)），每种用途是分别如何被评价的呢？我们分析了这部分评论中批评的评论所占的比例。由于数据量比较有限，因此以Writing为代表的类别无法从数据中得到有统计意义的偏好。不过，从图中依旧可以明显辨认出整体的趋势：对于几乎所有有数据的类别，评论中对于使用AI的批评呈现出先增加后维持在比较高水平位置的趋势。

:::: {#fig-6 .ldai-figure}
<div class="ldai" data-ldai="byuse">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 6]{.ldai-no} 从LD50到60，涉及到AI的评论中针对AI在游戏制作的不同用途（美术、音乐、代码……）的批评比例
:::

::: ldai-note
注：每个格子只看这一届里、提到这种用途、并且对 AI 使用表达了明确好恶的评论（称赞、让步式称赞、委婉批评、直接批评四类；"没有评价""只指出 AI 痕迹""褒贬参半"不计入）。格子里的百分比是其中批评（委婉批评 + 直接批评）所占的比例，下面的小字是"批评条数 / 表达了明确好恶的条数"。蓝色表示批评少，红色表示批评多。

样本少于 5 条的格子没有颜色。一条评论可以涉及多种用途，各行不互斥。
:::

::::

在讨论AI使用与评分中的关系前，首先需要想办法确定如何判断一个游戏是否使用了AI。最简单的方法是通过游戏创作者的声明，但是其未必诚实，且并不是每个人都进行了声明。如果要进行人工判断，那么标准是难以确定的；特别是对于游戏代码来说，在不是所有代码库都开源的情况下，有些时候几乎无法判断。此外值得一提的是，“AI声明”似乎有一种很微妙的作用，它也允许作者解释自己为什么要使用AI，例如一个只擅长美术与写作的人可能会采用AI来辅助编程，否则就没办法在三天内做出一个完整的游戏来进行自身的表达。就算仅仅看itch中的tag，不同的玩家可能会对不同的声明有不同的态度，例如与art / audio / text相关的tag使用就可能引发更多讨论。

:::: {#fig-7 .ldai-figure}
<div class="ldai" data-ldai="talk">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 7]{.ldai-no} LD59与LD60中游戏评论区的非作者评论与AI声明情况
:::

::: ldai-note
注：*Comments per rating* 和 *Median length* 是各游戏数值的中位数；长度按字符计。*Comments mentioning AI* 是把这一组所有评论合在一起算的比例，关键词规则和其他组件相同，没有人工剔除不相关的案例（例如游戏里的 AI 对手）。*Games with an AI comment* 是至少有一条评论提到 AI 的游戏所占比例。

LD59 的数字是评分期结束后的；LD60 抓取时（2026 年 10 月 29 日）还在评分期。
:::

::::

尽管ldjam在机制上鼓励用户多评论，以此换取更高的“Karma”来为自己的游戏提高热度，往往是非匿名的评论和一定是匿名的评分在数量和态度上都很可能存在不小的差异。特别地，有些时候只有对AI态度比较明确好恶的人才会在评论中提及，而态度比较模糊或者中立的人可能不会提及或者参与相关讨论。对于评分，我们以LD59的游戏评分数据进行分析，其中包含1,142 个有排名的游戏，分组和设计来自 [@rogual](https://ludum-dare.foon.uk/events/59) 整理的 itch.io 声明。从[图8](#fig-8)可以看出，与评论所展示的态度不同，声明了AI使用的作品得分并没有明显低于声明未使用AI或者未声明的作品。相反，仅仅使用AI辅助编程的游戏没有明显区别（平均分都是 3.55）甚至得分的中位数表现更好。这其中也包含compo组的winner，[Boba's Love Story](https://ldjam.com/events/ludum-dare/59/bobas-love-story) ，尽管在compo中的AI的使用被大量玩家质疑，这款游戏仍然在评分中胜出，赢得了第一名。考虑到声明可能不实的情况，如果简单从这个角度来看的话，游戏创作者如果想要得到高分，理论上可以使用AI进行代码辅助、进行不实的声明或者干脆不声明，尽管这对其他参赛者很可能是不公平的情况。

:::: {#fig-8 .ldai-figure}
<div class="ldai" data-ldai="strip">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-caption
[图 8]{.ldai-no} LD59中Declared AI use与游戏实际得分的关系
:::

::: ldai-note
注：每个点是一个游戏，竖线和左侧的数字是各组中位数。分组来自 [foon](https://ludum-dare.foon.uk/events/59) 整理的 itch.io 声明。注意这是观察性数据，声明可能不实。
:::

::::

## What should we do?

通过以上的数据，我们已经可以对游戏开发中的AI的使用情况、评论与评分的情况、社区整体的态度有一个大致的概览。大略地来说，AI参与到游戏的制作中的比例逐届都在增加，并且从最初的美术、音乐、文本扩展到了代码和整体设计；AI作为NPC或者讨论的对象更多出现在早期，随着人们对AI的习以为常反而不再那么高频地作为讨论的题材了；人们用AI来批量spam评论的现象开始出现，spam评论一直都有，以前可能更多是复制粘贴一些同质化的general的评论，但是直到LD60才主要以AI驱动。人们在这10届对AI的讨论从未停止，而且具体的话题也不断在变化。在态度上，我们很明显地可以看到评论中对游戏开发中的生成式AI越来越讨厌，但是在评分上似乎看不到很明显的这个倾向。

当然，即使有了这些数据，我依旧无法对 [I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games) 帖子中每个人的观点进行评价，也没办法说自己支持谁，因为似乎每个人都在真诚地讨论和真诚地困惑。而且，看似大家都在讨论“如何为AI辅助设计的游戏打分”这件事，实则又涵盖了不同而复杂的子议题，例如：AI在游戏开发中的本质角色是什么（作为工具、一种盗窃的手段，还是同事？）、游戏设计与开发的核心在哪里、评分本质上是用来干什么的、这场比赛是否公平、规则来自于哪里……每个人在各自的立场上可能都保持着一部分的正确。

目前来讲，可能争议最聚集的地方之一在于AI辅助编程，因为与AI生成的美术、文本不同，AI生成的代码虽然也具备特定的明显特征，但是往往无法直接作用在游戏界面中，因此不查看源码几乎无法识别，在ldjam中也没有专门的为代码评分的通道。而且这是一个相对比较新兴和缺少讨论的问题，因为在此之前AI编程水平还没有发展到可以独立制作出一个完整游戏的地步，自然也缺乏相应的规则。

作为计算机科学学生，我可以理解编程之美，但我也清楚绝大多数游戏是无法将其体现出来的——游戏流畅、优化得好当然是代码的功劳，可是玩家在体验的时候并不会因此想到“这个游戏背后一定有很optimised的代码吧！”而且编程之美也分成很多层次，例如一个小function可能空间时间复杂度很低、很聪明、很美，又或者整体的system design做得很好，很难判断究竟怎么样才算是好。对于我个人来说，编程是一种智力挑战，我在编程的过程中和结尾享受到这种乐趣，可是很难想象使用我程序的人也能感受到那种快乐。作为中文系出身的人，我也能理解没有足够的技术来表达自身想法的苦恼。AI的发展无疑对这样的人是有帮助的——即使是对已经很有编程经验的人，AI辅助编程也可能很有帮助，因为可以帮助你把精力放到更宏观的orchestration和游戏设计中。正如论坛中的评论：“使用人工智能并不意味着我突然忘记了如何编程。我的知识和经验仍然存在。我只是让开发过程的一部分更快、更容易，同时仍然控制我正在创建的内容。”[^geckoo]

问题是，游戏设计的本质是什么？用户@Willops说，“给这个敌人多少速度？给玩家多少跳跃高度？喷气背包的动力应该持续多久？对我来说，这些问题是游戏设计的本质”[^willops]，这话没错，可是游戏设计的本质对不同的人、不同的游戏体裁来说很可能是不一样的。而且如果一个人是从YouTube之类的地方学到要怎么设计敌人速度，那这和从AI对话学来“建议的敌人速度”有什么区别呢？我认为重点是人在整个创作过程中发挥的作用，例如对于每个具体的操作手感，你在Godot或者unity里面会打开进行测试、验证、调整；对于整体的设计，你按部就班把所有条件与触发机制写出来。但是这个边界太模糊了，如果一个人不坚守好底线，很容易就会let AI decide everything，制作出一个根本不属于你自己，却由你署名甚至让你赢得奖项的作品。

在社区缺乏mod和公约的情况下，规则来自于哪里？ld用户[@Jezzamon](https://ldjam.com/users/jezzamon)发起了投票并将目前结果展示在[ld-votes](https://jezzamon.com/ld-votes/)。有趣的是，目前的结果接近于平手。考虑到[ldjam即将结束](https://ldjam.com/events/ludum-dare/59/%24424396/ludum-dare-59-lives-me-too-countdown-to-64)，我很怀疑之后是否会公布新的规则，以及人们是否会遵守那些规则。一直以来都是如此，单纯依靠道德约束的时候，违反规则者总会很容易赢。

不过说到底，ldjam不是一个以竞赛和得分为目的的比赛（也很难说世界上存在真正公平的比赛）。尽管一定会有人拿在其中获得的名次当噱头，多数人真正的目的还是给自己一点动力和限制，在有限的时间和题材内去尽量好地完成一款游戏，这是对自己能力的挑战，也是表达自我的机会。游戏互相评价本质也是尽可能多的让自己的游戏被看到、来收获评价，同时也是游玩其他游戏来扩充自己视野、丰富灵感的机会。用不用AI、如何用AI，是被AI推动着完成整个设计、被侵蚀失去自己的想法，还是让AI完成底层工作来用更多时间进行核心设计，在目前来看，本质还是个人的选择。

当然，游戏开发与ldjam中的相关使用与讨论不过是当前AI的诸多使用及其影响的一个微小的缩影。真正令人担心的，是生产力与生产关系变化后新的规则、理论的建立，以及那个模糊的，创意力的边缘。

<script src="/assets/ld-ai/ldai.js?v=4" data-src="/assets/ld-ai/ldai-data.json" defer></script>

[^so2024]: Stack Overflow 2024 年开发者调查：62% 的受访者表示当年已在开发中使用 AI 工具（2023 年为 44%），其中 82% 用它来写代码。见 [2024 Developer Survey: AI](https://survey.stackoverflow.co/2024/ai)。

[^geckoo]: @Geckoo1337 在 [I don't know how to rate "AI-assisted" games](https://ldjam.com/events/ludum-dare/60/old-specs/i-dont-know-how-to-rate-ai-assisted-games) 下的评论，原文：“Using AI doesn't mean I've suddenly forgotten how to program. My knowledge and experience are still there. I'm simply making part of the development process faster and easier, while remaining in control of what I'm creating.”

[^willops]: @Willops 在同一讨论串下的评论，原文：“How much speed to give this enemy? How much jump height to give the player? How long should the jetpack power last? These questions are the essence of game design to me, but if you let the AI code for you and don't circle back to edit these values yourself, you're essentially offloading the design work as well without knowing it.”
