---
title: "先利其器｜部分中文自然语言处理工具功能汇总"
date: 2023-05-29T12:52:44+08:00
tags: ["Tools"]
categories: '先利其器'
type: 'post'
cascade:
  heroStyle: "background"
---

本文包含对五种中文自然语言处理工具的一些基础用法的简要介绍。内容基本均来自各工具官方网页的介绍页面，仅供个人备忘使用。
<!--more-->

---

## Jieba
https://github.com/fxsjy/jieba

### 特点
支持四种分词模式：
- 精确模式，试图将句子最精确地切开，适合文本分析；
- 全模式，把句子中所有的可以成词的词语都扫描出来, 速度非常快，但是不能解决歧义；
- 搜索引擎模式，在精确模式的基础上，对长词再次切分，提高召回率，适合用于搜索引擎分词。
- paddle模式，利用PaddlePaddle深度学习框架，训练序列标注（双向GRU）网络模型实现分词。同时支持词性标注。
- 支持繁体分词
- 支持自定义词典
- MIT 授权协议

```python
import jieba
import paddle
```
#### 中文分词

```python
test_case="北京大学生前来应聘。"
# 全模式  
seg_list = jieba.cut(test_case, cut_all=True)  
print("Full Mode: " + "/ ".join(seg_list))  
  
# 精确模式  
seg_list = jieba.cut(test_case, cut_all=False)  
print("Default Mode: " + "/ ".join(seg_list))

# 搜索引擎模式
seg_list = jieba.cut_for_search(test_case)  
print("Search Engine Mode: " + ", ".join(seg_list))

# 支持繁体分词
text = "您好，我是大陸北方網友，我對您發的图片很感興趣，還有更多更詳細一些的图片嗎？如果有，請加我的line，我們私聊中詳細討論討論。"

# 加载繁体字典jieba.set_dictionary("D:\\apps\\anaconda3\\pkgs\\jieba-0.42.1-pyhd8ed1ab_0\\site-packages\\jieba\\dict.txt.big")
text = "/".join(jieba.cut(text))
print(text)

# 支持新词发现
seg_list = jieba.cut("他来到了网易杭研大厦")
print(", ".join(seg_list))
```
#### 词性标注
```python
# 结合规则和统计的方法，在词性标注的过程中，词典匹配和HMM共同作用。

import jieba.posseg as pseg  

print('-'*10,'非paddle模式','-'*10)
words = pseg.cut("北京大学生前来应聘。")
for word, flag in words:  
    print('%s %s' % (word, flag))

# 启动paddle模式
print('-'*10,'paddle模式','-'*10)
paddle.enable_static()
jieba.enable_paddle()

words = pseg.cut("北京大学生前来应聘。",use_paddle=True)
for word, flag in words:  
    print('%s %s' % (word, flag))
```

#### 命名实体识别
```python
import jieba.posseg as pseg  
text = "王小明说，北京奥运会是一个盛大的赛事。"  
words = pseg.cut(text)  
for word, flag in words:  
    if flag in ['ns', 'nt', 'nr',]:  
        print(word, flag)
```

#### 关键词抽取：
```python
# 基于 TF-IDF 算法进行关键词抽取
print('-'*10,'TF-IDF','-'*10)
import jieba.analyse

text = """然而吊诡的是，我从你的个体表征中窥见一种后现代式的身份流动性，却又难以解构其滥觞所在，
或许是你的这种化后设为先验式的脱域，导致了我的经验视景与想象集合的矛盾，这也形成了你超克于建构之外的张力，
我想此刻我对你作符号化的悬置——抑或是规训下的擅自让渡——无疑是一种亵渎，你是否愿意言述你嬗变与重构的版图与视阈，
让我得以透视你隐藏在现代性话语深处的复调意志底色？
"""

keywords1 = jieba.analyse.extract_tags(text, topK=10, withWeight=True, allowPOS=('n', 'ns'))
for keyword, weight in keywords1:
    print(keyword, weight)

# 基于 TextRank 算法的关键词抽取
print('-'*10,'TextRank','-'*10)
keywords2 = jieba.analyse.textrank(text, topK=10, withWeight=True, allowPOS=('ns', 'n', 'vn', 'v'))
for k, w in keywords2:
    print('%s %s' % (k, w))
```
---
## LTP
LTP（Language Technology Platform） 提供了一系列中文自然语言处理工具，用户可以使用这些工具对于中文文本进行分词、词性标注、句法分析等等工作。
https://github.com/HIT-SCIR/ltp

```python
import torch
from ltp import LTP
```

#### 中文分词、词性标注、命名实体识别
```python
# 命名实体识别有NER标记功能

ltp = LTP("LTP/small")  # 默认加载 Small 模型，还有Base、Base1、Base2和Tiny深度学习模型

# 将模型移动到 GPU 上
if torch.cuda.is_available():
    # ltp.cuda()
    ltp.to("cuda")

output = ltp.pipeline(["他叫汤姆去拿外衣。"], tasks=["cws", "pos", "ner", "srl", "dep", "sdp"])
# 使用字典格式作为返回结果
print(output.cws)  # print(output[0]) / print(output['cws']) # 也可以使用下标访问
print(output.pos)
print(output.sdp)

# 使用感知机算法Legacy实现的分词、词性和命名实体识别，速度比较快，但是精度略低

ltp = LTP("LTP/legacy")
# cws, pos, ner = ltp.pipeline(["他叫汤姆去拿外衣。"], tasks=["cws", "ner"]).to_tuple() # error: NER 需要 词性标注任务的结果
cws, pos, ner = ltp.pipeline(["他叫汤姆去拿外衣。"], tasks=["cws", "pos", "ner"]).to_tuple()  # to tuple 可以自动转换为元组格式
# 使用元组格式作为返回结果
print(cws, pos, ner)
```
---
## snownlp
### Features
-   中文分词（[Character-Based Generative Model](http://aclweb.org/anthology//Y/Y09/Y09-2047.pdf)）
-   词性标注（[TnT](http://aclweb.org/anthology//A/A00/A00-1031.pdf) 3-gram 隐马）
-   情感分析（现在训练数据主要是买卖东西时的评价，所以对其他的一些可能效果不是很好，待解决）
-   文本分类（Naive Bayes）
-   转换成拼音（Trie树实现的最大匹配）
-   繁体转简体（Trie树实现的最大匹配）
-   提取文本关键词（[TextRank](https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf)算法）
-   提取文本摘要（[TextRank](https://web.eecs.umich.edu/~mihalcea/papers/mihalcea.emnlp04.pdf)算法）
-   tf，idf
-   Tokenization（分割成句子）
-   文本相似（[BM25](http://en.wikipedia.org/wiki/Okapi_BM25)）
-   支持python3（感谢[erning](https://github.com/erning)）

```python
from snownlp import SnowNLP
```

#### 中文分词
```python
text = "北京大学生前来应聘。"
s = SnowNLP(text)
seg_list = s.words
print(list(seg_list))
```
#### 词性标注
```python
for w,t in s.tags:
    print(w,t)
```

#### 命名实体识别
```python
text = "宝玉还欲看时，那仙姑知他天分高明，性情颖慧，恐把天机泄漏，遂掩了卷册，笑向宝玉道:“且随我去游顽奇景，何必在此恍恍惚惚，不觉弃了卷册，又随了警幻"
s = SnowNLP(text)

for entity in s.tags:
    if entity[1] in ['ntc', 'nt', 'nr', 'ns']:
        print(entity[0], entity[1])
```
#### 情感分析
```python
s.sentiments
```

#### 繁简转换
```python
s = SnowNLP(u'「繁體字」「繁體中文」的叫法在臺灣亦很常見。')
s.han
```

#### 关键词提取
```python
text = u'''
自然语言处理是计算机科学领域与人工智能领域中的一个重要方向。
它研究能实现人与计算机之间用自然语言进行有效通信的各种理论和方法。
自然语言处理是一门融语言学、计算机科学、数学于一体的科学。
因此，这一领域的研究将涉及自然语言，即人们日常使用的语言，
所以它与语言学的研究有着密切的联系，但又有重要的区别。
自然语言处理并不是一般地研究自然语言，
而在于研制能有效地实现自然语言通信的计算机系统，
特别是其中的软件系统。因而它是计算机科学的一部分。
'''

s = SnowNLP(text)
s.keywords(3)

# 文本摘要
s.summary(3)

s = SnowNLP([[u'这篇', u'文章'],
             [u'那篇', u'论文'],
             [u'这个']])

# tf,idf
s.tf
s.idf
# 文本相似度
s.sim([u'文章'])
```
---
## Hanlp

### 功能
- 分词
- 词性标注
- 命名实体识别
- 成分句法分析
- 语义依存分析
- 语义角色标注
- 抽象意义表示
- 指代消解
- 语义文本相似度
- 文本风格转换
- 关键词短语提取
- 抽取式自动摘要
- 生成式自动摘要
- 文本语法纠错
- 文本分类
- 情感分析
- 语种检测

### Hanlp1.x
https://github.com/hankcs/HanLP/blob/1.x/README.md （主项目）

https://github.com/hankcs/pyhanlp （HanLP1.x的Python接口，支持自动下载与升级HanLP1.x，兼容Python<=3.8）

```python
from pyhanlp import *
```

#### 中文分词
```python
# 能够自定义词典、极速词典分词、索引分词、CRF分词、感知机词法分析，详见https://github.com/hankcs/pyhanlp/tree/master/tests/demos

test_cases=['结婚的和尚未结婚的','北京大学生前来报到','研究生命科学','阿美首脑会议将讨论巴以和平等问题','Once recovered, he again devoted himself into work.']

for sentence in test_cases:
    print(HanLP.segment(sentence))
```
#### 关键词提取和自动摘要
```python
document = "水利部水资源司司长陈明忠9月29日在国务院新闻办举行的新闻发布会上透露，" \
           "根据刚刚完成了水资源管理制度的考核，有部分省接近了红线的指标，" \
           "有部分省超过红线的指标。对一些超过红线的地方，陈明忠表示，对一些取用水项目进行区域的限批，" \
           "严格地进行水资源论证和取水许可的批准。"
print(HanLP.extractKeyword(document, 2))
print(HanLP.extractSummary(document, 3))
```
#### 依存句法分析
```python
print(HanLP.parseDependency("徐先生还具体帮助他确定了把画雄鹰、松鼠和麻雀作为主攻目标。"))
```
#### 繁简转换
```python
# 也支持拼音转换，且不仅支持基础的汉字转拼音，还支持声母、韵母、音调、音标和输入法首字母首声母功能

print(HanLP.convertToTraditionalChinese("“以后等你当上皇后，就能买草莓庆祝了”。发现一根白头发"))
print(HanLP.convertToSimplifiedChinese("憑藉筆記簿型電腦寫程式HanLP"))
# 简体转台湾繁体
print(HanLP.s2tw("她在台湾写代码"))
# 台湾繁体转简体
print(HanLP.tw2s("她在臺灣寫程式碼"))
# 简体转香港繁体
print(HanLP.s2hk("她在香港写代码"))
# 香港繁体转简体
print(HanLP.hk2s("她在香港寫代碼"))
# 香港繁体转台湾繁体
print(HanLP.hk2tw("她在臺灣寫代碼"))
# 台湾繁体转香港繁体
print(HanLP.tw2hk("她在香港寫程式碼"))

# 香港/台湾繁体和HanLP标准繁体的互转
print(HanLP.t2tw("她在臺灣寫代碼"))
print(HanLP.t2hk("她在臺灣寫代碼"))

print(HanLP.tw2t("她在臺灣寫程式碼"))
print(HanLP.hk2t("她在台灣寫代碼"))
```
---

### Hanlp2.1

https://github.com/hankcs/HanLP

```python
# 创建客户端
from hanlp_restful import HanLPClient

# auth不填则匿名，zh中文，mul多语种
HanLP = HanLPClient('https://www.hanlp.com/api', auth='...', language='zh')
```
#### 词性标注
```python
# CTB词性标注集（pos/ctb）（默认）、PKU词性标注集（pos/pku）、863词性标注集（pos/863）
HanLP.parse('我的希望是希望张晚霞的背影被晚霞映红。', tasks='pos/ctb').pretty_print()

# 命名实体识别：基于HMM角色标注的命名实体识别+基于线性模型的命名实体识别

# MSRA规范
HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks='ner/msra').pretty_print()

# PKU规范
HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks='ner/pku').pretty_print()

# OntoNotes规范
HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks='ner/ontonotes').pretty_print()
```
#### 语言学结构可视化
```python
HanLP(['2021年HanLPv2.1为生产环境带来次世代最先进的多语种NLP技术。', '阿婆主来到北京立方庭参观自然语义科技公司。']).pretty_print()
```
#### 情感分析
```python
text = '''“这是一部男人必看的电影。”人人都这么说。但单纯从性别区分，就会让这电影变狭隘。
《肖申克的救赎》突破了男人电影的局限，通篇几乎充满令人难以置信的温馨基调，而电影里最伟大的主题是“希望”。
当我们无奈地遇到了如同肖申克一般囚禁了心灵自由的那种囹圄，我们是无奈的老布鲁克，灰心的瑞德，还是智慧的安迪？
运用智慧，信任希望，并且勇敢面对恐惧心理，去打败它？
经典的电影之所以经典，因为他们都在做同一件事——让你从不同的角度来欣赏希望的美好。'''
HanLP.sentiment_analysis(text)
```
#### 关键词提取（TextRank）
```python
HanLP.keyphrase_extraction('自然语言处理是一门博大精深的学科，掌握理论才能发挥出HanLP的全部性能。 '
                            '《自然语言处理入门》是一本配套HanLP的NLP入门书，助你零起点上手自然语言处理。', topk=3)
```
#### 文本摘要
```python
# 抽取式自动摘要
text1 = '''
据DigiTimes报道，在上海疫情趋缓，防疫管控开始放松后，苹果供应商广达正在逐步恢复其中国工厂的MacBook产品生产。
据供应链消息人士称，生产厂的订单拉动情况正在慢慢转强，这会提高MacBook Pro机型的供应量，并缩短苹果客户在过去几周所经历的延长交货时间。
仍有许多苹果笔记本用户在等待3月和4月订购的MacBook Pro机型到货，由于苹果的供应问题，他们的发货时间被大大推迟了。
据分析师郭明錤表示，广达是高端MacBook Pro的唯一供应商，自防疫封控依赖，MacBook Pro大部分型号交货时间增加了三到五周，
一些高端定制型号的MacBook Pro配置要到6月底到7月初才能交货。
尽管MacBook Pro的生产逐渐恢复，但供应问题预计依然影响2022年第三季度的产品销售。
苹果上周表示，防疫措施和元部件短缺将继续使其难以生产足够的产品来满足消费者的强劲需求，这最终将影响苹果6月份的收入。
'''
HanLP.extractive_summarization(text1, topk=3)

# 生成式自动摘要
text2 = '''
每经AI快讯，2月4日，长江证券研究所金属行业首席分析师王鹤涛表示，2023年海外经济衰退，美债现处于历史高位，
黄金的趋势是值得关注的；在国内需求修复的过程中，看好大金属品种中的铜铝钢。
此外，在细分的小品种里，建议关注两条主线，一是新能源，比如锂、钴、镍、稀土，二是专精特新主线。（央视财经）
'''
HanLP.abstractive_summarization(text2)
```
#### 文本分类
```python
text = '''
然而吊诡的是，我从你的个体表征中窥见一种后现代式的身份流动性，却又难以解构其滥觞所在，
或许是你的这种化后设为先验式的脱域，导致了我的经验视景与想象集合的矛盾，这也形成了你超克于建构之外的张力，
我想此刻我对你作符号化的悬置——抑或是规训下的擅自让渡——无疑是一种亵渎，你是否愿意言述你嬗变与重构的版图与视阈，
让我得以透视你隐藏在现代性话语深处的复调意志底色？
'''
HanLP.text_classification(text, model='news_zh')
#print('-'*20,'\n终究是错付了')
```
```python
# 依存句法分析
doc = HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks='dep')
print(doc)
# 成分句法分析
doc = HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks=['pos', 'con'])
print(doc)
# 语义依存分析
doc = HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks='sdp')
print(doc)
# 语义角色标注
doc = HanLP.parse('晓美焰来到北京立方庭参观自然语义科技公司。', tasks=['srl'])
print(doc)
# 抽象意义表示
HanLP.abstract_meaning_representation('男孩希望女孩相信他。')
# 指代消解
HanLP.coreference_resolution('我姐送我她的猫。我很喜欢它。')
# 语义文本相似度
HanLP.semantic_textual_similarity([
    ('看图猜一电影名', '看图猜电影'),
    ('无线路由器怎么无线上网', '无线上网卡和无线路由器怎么用'),
    ('北京到上海的动车票', '上海到北京的动车票'),
])
# 文本风格转换
HanLP.text_style_transfer(['国家对中石油抱有很大的期望.', '要用创新去推动高质量的发展。',],
                            target_style='gov_doc')
```

---
## jiagu
Jiagu使用大规模语料训练而成。将提供中文分词、词性标注、命名实体识别、情感分析、知识图谱关系抽取、关键词抽取、文本摘要、新词发现、情感分析、文本聚类等常用自然语言处理功能。https://github.com/ownthink/Jiagu

```python
import jiagu
import os
os.chdir("your\\path")
```

#### 中文分词
```python
text = "北京大学生前来应聘。"
seg_list = jiagu.seg(text)
print(seg_list)
```

#### 词性标注
```python
text = "这是一个中文分词的例子。"
seg_list = jiagu.seg(text)
pos_list = jiagu.pos(seg_list)
for word, pos in zip(seg_list, pos_list):
    print(word, pos)
```

#### 命名实体识别（BIO标记）
```python
text = '宝玉还欲看时，那仙姑知他天分高明，性情颖慧，恐把天机泄漏，遂掩了卷册，笑向宝玉道：且随我去游顽奇景，何必在此恍恍惚惚？不觉弃了卷册，又随了警幻'
words = jiagu.seg(text) # 需要先分词
ner = jiagu.ner(words) # 命名实体识别
for n,w in zip(words,ner):
    print(n,w)
```
#### 情感分析
```python
text = '我虽野鸡本科，在此也读书多年，常言道，野本门前论文多，论文写不出，同学发c刊，所以只能身居野本，眼观清北，脚踩水课，心怀核心，我说的对吗？'
sentiment = jiagu.sentiment(text)
print(sentiment)
```
#### 知识图谱关系抽取
```python
# 仅用于测试用，可以pip3 install jiagu==0.1.8，只能使用百科的描述进行测试。效果更佳的后期将会开放api。

text = '姚明1980年9月12日出生于上海市徐汇区，祖籍江苏省苏州市吴江区震泽镇，前中国职业篮球运动员，司职中锋，现任中职联公司董事长兼总经理。'
knowledge = jiagu.knowledge(text)
print(knowledge)
```
#### 关键词抽取
```python
text = '''
我们一般认为，抓住了问题的关键，其他一切则会迎刃而解。一般来讲，我们都必须务必慎重的考虑考虑。 这是不可避免的。
一般来说，生活中，若学习自然语言处理出现了，我们就不得不考虑它出现了的事实。在这种困难的抉择下，本人思来想去，寝食难安。
洛克曾经说过，学到很多东西的诀窍，就是一下子不要学很多。这启发了我。要想清楚，学习自然语言处理，到底是一种怎么样的存在。
学习自然语言处理的发生，到底需要如何做到，不学习自然语言处理的发生，又会如何产生。马尔顿说过一句著名的话，坚强的信心，
能使平凡的人做出惊人的事业。这句话把我们带到了一个新的维度去思考这个问题：学习自然语言处理似乎是一种巧合，但如果我们从一个更大的角度看待问题，
这似乎是一种不可避免的事实。 爱迪生在不经意间这样说过，失败也是我需要的，它和成功对我一样有价值。带着这句话，我们还要更加慎重的审视这个问题：
经过上述讨论，要想清楚，学习自然语言处理，到底是一种怎么样的存在。这是不可避免的。了解清楚学习自然语言处理到底是一种怎么样的存在，
是解决一切问题的关键。
'''				

keywords = jiagu.keywords(text, 10) 
print(keywords)
print('-'*20,'\n这关键词提取得也太差了！')
```
#### 文本摘要
```python
fin = open('input.txt', 'r')
text = fin.read()
fin.close()

summarize = jiagu.summarize(text, 3) # 摘要
print(summarize)
```
#### 新词发现
```python
jiagu.findword('input.txt', 'output.txt') # 根据文本，利用信息熵做新词发现。
```
#### 文本聚类
```python
docs = [
        "百度深度学习中文情感分析工具Senta试用及在线测试",
        "情感分析是自然语言处理里面一个热门话题",
        "AI Challenger 2018 文本挖掘类竞赛相关解决方案及代码汇总",
        "深度学习实践：从零开始做电影评论文本情感分析",
        "BERT相关论文、文章和代码资源汇总",
        "将不同长度的句子用BERT预训练模型编码，映射到一个固定长度的向量上",
        "自然语言处理工具包spaCy介绍",
        "现在可以快速测试一下spaCy的相关功能，我们以英文数据为例，spaCy目前主要支持英文和德文"
    ]
cluster = jiagu.text_cluster(docs)	
print(cluster)
```

以上。