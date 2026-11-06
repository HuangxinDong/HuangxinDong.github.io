---
title: "数据分析：Ludum Dare 里的生成式 AI"
created: 2026-10-29
tags:
  - video_game
  - ai
  - data_analysis
description: LD50 到 LD60 的全部交互图：游戏评论、论坛帖子、评分、itch.io AI 声明、社区投票，以及现成情感分析工具和人工编码的对照。
lang: zh
draft: true
---

<link rel="stylesheet" href="/assets/ld-ai/ldai.css?v=4">
<link rel="stylesheet" href="/assets/ld-ai/ldai-full.css?v=2">

这是[《浅谈AI时代的游戏创作：Ludum Dare 里的生成式 AI》](/posts/ludum-dare-and-generative-ai.html)的补充图表分析，数据爬取范围为 LD50（2022 年 4 月）到 LD60（2026 年 10 月）。

>[!note]
> **数据来源**：游戏页面、游戏评论、评分和论坛帖子来自 [ldjam.com](https://ldjam.com) 的公开 API；LD59 和 LD60 各游戏在 itch.io 上的 AI 声明来自 [ludum-dare.foon.uk](https://ludum-dare.foon.uk) 的整理；关于 AI 写代码规则的投票来自 [@Jezzamon](https://ldjam.com/users/jezzamon) 的 [ld-votes](https://jezzamon.com/ld-votes/)。游戏评论和论坛帖子抓取于 2026 年 10 月 26 日，当时 LD60 还在评分期，下文如果没有额外说明也都适用此限制。


## 概况

### 各届概况

:::: ldai-figure
<div class="ldf" data-ldf="events">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：**Comments mentioning AI** 是游戏评论里提到生成式 AI 的条数，已去掉游戏作者本人的回复和关键词误报，按每千条评论计。**Posts mentioning AI** 是论坛帖子里以 AI 为主题的比例。LD60 抓取时还在评分期，评论总数只有往届的三分之一左右。
:::
::::

### AI 被提及的频率

每一届里提到生成式 AI 的游戏评论（每千条）和论坛帖子（百分比）

:::: ldai-figure
<div class="ldf" data-ldf="attention">交互图加载中……（需要启用 JavaScript）</div>
::::

### 评论中的“AI”指什么

:::: ldai-figure
<div class="ldf" data-ldf="referent">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：后面关于评价的几张图默认只用前三类：做游戏时用了 AI、游戏里运行的 AI、AI 写的评论或帖子。
:::
::::

## 人们如何评论

<div class="ldf ldf-shared" data-ldf="shared"></div>

### 人们如何评价 AI 的使用

:::: ldai-figure
<div class="ldf" data-ldf="evalmix">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
点击色块，图下方会列出这一组评论。

注：**Points out AI, no judgement**：只指出 AI 痕迹或猜测用了 AI（“The text has that familiar LLM flavor”），没有评价词。**Praise with a concession**：“虽然是 AI，但……”。**Softened criticism**：有负面评价，但加了免责、缓和语、条件句或道歉。
:::
::::

### 不同态度倾向的评论比例的变化

几种比例随时间的变化，可以同时选多条线。受上方共用筛选影响。

:::: ldai-figure
<div class="ldf" data-ldf="trend">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：阴影为 95% Wilson 置信区间。空心点表明分母小于所选最小样本量。
:::
::::

### 评论的话语类型

:::: ldai-figure
<div class="ldf" data-ldf="acts">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
点击格子，图下方会列出对应的评论；点击行名列出所有届的。

注：表头里是这一列的评论数。评论数低于所选最小样本量的列整列变灰，颜色不再代表数值。
:::
::::

### 针对AI不同用途的评论

针对不同用途（美术、音乐、代码……）的评论里，批评所占的比例。

:::: ldai-figure
<div class="ldf" data-ldf="byuse">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：一条评论可以涉及多种用途，所以各行不互斥。
:::
::::

### 哪些用途被谈论

关于 AI 使用的评论里，提到每种用途的比例。

:::: ldai-figure
<div class="ldf" data-ldf="usemix">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：一条评论可以提到多种用途。
:::
::::

## 评分与声明

### AI 声明与游戏表现

每个点是一个游戏，按 itch.io 上的 AI 声明分组。

:::: ldai-figure
<div class="ldf" data-ldf="strip">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：LD59 是 1,142 个有排名的游戏，分组来自 foon 整理的 itch.io 声明（只勾“代码”的归入 **AI: code only**，勾了图像、音频或文本的归入 **AI: art / audio / text**）。LD60 抓取时还在评分期，所以只有评分人数和评论类指标。

**Ratings received** 是给 Overall 打分的人数；**Ratings given** 是作者给别人打的分数（加权后，LD 用它决定游戏被推给评分者的优先级）；**Comments** 不含作者和队友的回复。
:::
::::

### 按声明分组的游戏评论

游戏下的非作者评论：每个评分对应多少条评论、评论有多长、多少评论提到 AI。

:::: ldai-figure
<div class="ldf" data-ldf="talk">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：**Comments per rating** 和 **Median length** 是各游戏数值的中位数，长度按字符计。**Comments mentioning AI** 是把这一组所有评论合在一起算的比例，关键词规则和其他图相同，没有人工剔除误报（例如游戏里的 AI 对手）。**Games with an AI comment** 是至少有一条评论提到 AI 的游戏所占比例。
:::
::::

### LD59 自由散点图

任选两个指标做散点。点击图例可以隐藏某一组。

:::: ldai-figure
<div class="ldf" data-ldf="scatter">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：勾选 Group medians 后，带黑圈的大点是每一组在横纵两个指标上的中位数，具体数值列在图下方的表里。
:::
::::

### 主动退出评分类别的游戏比例

ldjam 从 LD51 起建议用了 AI 生成素材的作品退出相应类别。这是作者主动选择“不参与某个类别评分”的游戏比例。

:::: ldai-figure
<div class="ldf" data-ldf="optout">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：没做音频的游戏也常常退出 Audio，所以 Audio 的基线本来就高。LD60 的“AI used”包括只用于代码的游戏。
:::
::::

### 声明使用 AI 的游戏比例

在 itch.io 上做了明确声明（用了或没用）的游戏里，声明用了 AI 的比例。

:::: ldai-figure
<div class="ldf" data-ldf="decl">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：横线是 95% 置信区间。
:::
::::

## 投票、词汇与点赞

### 规则投票

[@Jezzamon](https://ldjam.com/users/jezzamon) 在 LD59 之后发起的非官方投票，201 份有效回答，结果也公开在 [ld-votes](https://jezzamon.com/ld-votes/)。

:::: ldai-figure
<div class="ldf" data-ldf="poll">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：“Continue if…”两题的选项：1 = 完全不再参加，3 = 无所谓，5 = 更可能参加。这是自愿参加的样本，不代表全体参赛者。
:::
::::

### 词汇

每百篇 AI 相关文本（帖子加评论）中出现某个词的篇数。

:::: ldai-figure
<div class="ldf" data-ldf="vocab">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：LD50 只有几十篇文本，样本量不足。
:::
::::

### 评论收到的赞

每条评论收到的赞，按评价类别分组。

:::: ldai-figure
<div class="ldf" data-ldf="hearts">交互图加载中……（需要启用 JavaScript）</div>
::::

## 自动情感分析

### 自动方法的原理

“人工”编码之外，还用五种现成的自动方法给同一批评论进行了打分。以下是具体实现方法。

:::: ldf-expl
::: item
**人工编码（参照标准）**

每条评论由 Claude 按编码手册读一遍，判断它对 AI 使用的评价属于七类中的哪一类（见“人们如何评价 AI 的使用”的图例）。只看字面，不按年份猜测言外之意。我独立盲标了其中 40 条，评价这一项和 Claude 的一致性 κ = 0.72。

下面所有自动方法都拿这份编码当作“正确答案”来比较。比较时只用人工判为有方向的评论：称赞和让步式称赞算“正面”，委婉批评和直接批评算“负面”，共 477 条。
:::

::: item
**如何提取提及 AI 的语句**

先把评论按句号、问号、感叹号和换行切成句子，再挑出含有 AI 关键词（AI、ChatGPT、Claude、Midjourney、generated、vibe coding、slop 等）的句子，拼在一起。例如一条评论先夸了画面和音乐，最后一句说 “the AI text felt off”，那么只取最后一句。这样做是为了让方法评价的是“对 AI 的态度”，而不是“对整个游戏的态度”。下面标着 “AI sentences” 的方法都只读这部分，标着 “whole comment” 的读整条评论。
:::

::: item
**VADER（词典方法）**

VADER 是 2014 年为社交媒体文本设计的情感词典。它给几千个英文词预先标了好坏分数（“great” +3.1，“bad” −2.5 之类），再用几条规则调整：前面有 “not” 就反转，有 “very” 就加强，感叹号和全大写也会加强，“but” 后面的部分权重更高。把一句话里所有词的分数加起来，压缩到 −1 到 +1 之间，叫 compound 分数。

换算：≥ 0.05 算正面，≤ −0.05 算负面，中间算中性。

缺点是，这种方法无法考虑上下文。例如，“familiar LLM flavor” 里没有一个负面词，所以得 0 分左右，但实际上可能隐含着负面含义。
:::

::: item
**TextBlob（词典方法）**

TextBlob 用的是另一部情感词典（来自 Pattern 库），主要给形容词标分。它找出句子里的形容词，取它们分数的平均，同样得到 −1 到 +1 的分数。换算阈值和 VADER 一样。和 VADER 的缺点相同，而且由于只看形容词，“I closed the tab” 这样的句子它也读不出态度。
:::

::: item
**RoBERTa 情感模型**

这是一个用约 1.24 亿条推文训练过的神经网络（cardiffnlp/twitter-roberta-base-sentiment-latest）。输入整句话，输出三个概率：正面、中性、负面，三者之和为 1。用“正面概率 − 负面概率”作为分数，范围是 −1 到 +1。

解读方法：> 0.2 算正面，< −0.2 算负面，−0.2～0.2之间间算中性。它能读懂一些语境，比如 “even though it's AI” 后面跟称赞。但它只能整句话的情绪，而难以专门判断“对 AI 的态度”。例如，一句开心地说 “I used AI for the music too!” 也会被判为正面。
:::

::: item
**零样本立场判断（NLI）**

这个模型（facebook/bart-large-mnli）原本是训练来判断“一句话能不能推出另一句话”的。给它两个候选结论：“The writer disapproves of using AI in this game.” 和 “The writer approves of using AI in this game.”，让它判断评论更支持哪一个，输出两个加起来等于 1 的概率。

解读方法：反对的概率 > 0.5 算负面，否则算正面。它没有“中性”选项。因为问的是“对 AI 的态度”而不是“情绪”，它比前三种方法更贴近。
:::

::: item
**礼貌特征（正则表达式）**

不是打分，只是检查“提到 AI 的句子”里有没有某类词。参考 Danescu-Niculescu-Mizil 等人 2013 年的礼貌策略表做了简化：

**缓和语** I think, maybe, probably, might, seems, a bit, kind of, imo…；**道歉** sorry, no offense, I hate to…；**致谢** thanks, appreciate；**免责** I don't mind, nothing against, not trying to…；**转折** but, though, although, however, even if, despite, still；**条件** if it's / if you used…；**提问** 问号；**第二人称** you, your；**AI 句子以外有称赞词** great, nice, love, cool, fun… 出现在评论的其他句子里（“先夸再批”）。
:::
::::

### 分数与人工编码的对照

每个点是一条评论，横轴是所选方法给的分数，纵向按人工编码的类别分行。点击一个点，下方会显示这条评论里提到 AI 的句子和全部方法的分数。拖动阈值，下方的一致性表格会跟着变。

:::: ldai-figure
<div class="ldf" data-ldf="mscore">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：**AUC**：随机抽一条人工判为批评的评论和一条人工判为称赞的评论，方法给前者的分数更“负”的概率。0.5 等于瞎猜，1 是完全分开，它不依赖阈值。**κ**（Cohen's kappa）：按当前阈值把分数切成正负之后，和人工编码的一致程度，已扣除碰巧一致的部分。0 等于碰巧，1 是完全一致。
:::
::::

### 自动方法读出的趋势

每个时期里被判为批评的比例：人工编码和各自动方法。分母均为人工判为“有方向”的评价。下方是批评性评论里各种礼貌特征的比例。

:::: ldai-figure
<div class="ldf" data-ldf="mtrend">交互图加载中……（需要启用 JavaScript）</div>

::: ldai-note
注：礼貌特征是用正则表达式在“提到 AI 的句子”里找特定词语（列表见“自动方法的原理”的最后一项），只是近似，例如 “might” 会被算成缓和语，不管它在句子里的实际作用。
:::
::::

## 原始数据检索

### 评论检索

805 条编码评论，关键词居中显示。受上方共用筛选影响。

:::: ldai-figure
<div class="ldf" data-ldf="conc">交互图加载中……（需要启用 JavaScript）</div>
::::

### 论坛帖文

357 篇以 AI 为主题的论坛帖文（LD50 到 LD60）。

:::: ldai-figure
<div class="ldf" data-ldf="posts">交互图加载中……（需要启用 JavaScript）</div>
::::

<script src="/assets/ld-ai/ldai-full.js?v=2" data-src="/assets/ld-ai/ldai-full-data.json?v=1" defer></script>
