---
tags:
  - tool
modified: 2025-01-18
title: Pandoc
created: 2025-01-17
---

[Pandoc](https://pandoc.org/) is a free-software document converter. It can convert between numerous markup and word processing formats, including, but not limited to, various flavors of [[Markdown Cheatsheet|Markdown]], [[HTML]], [[LaTeX|LaTeX]] , PDF and [Word docx](https://en.wikipedia.org/wiki/Office_Open_XML).

安装后不仅可以在终端用命令行操作，也可以借助Obsidian的 [Pandoc-Plugin](obsidian://show-plugin?id=obsidian-pandoc) 插件来将markdown文件转换为由 $\LaTeX$ 生成的PDF。


## 命令行
详见 [Pandoc User’s Guide](https://pandoc.org/MANUAL.html) 和 `pandoc --help`

## Pandoc template
下载了 [pandoc-latex-template](https://github.com/Wandmalfarbe/pandoc-latex-template)，相关文件位于 `/Users/username/.local/share/pandoc/templates`

### 修改字体
对于CJK用户，需要额外修改`.latex`文件的这个部分以配置字体：
```latex
\else % if not pdftex
  $if(mainfont)$
  $else$
  \usepackage[fallback]{xeCJK}
  \setCJKmainfont{Noto Serif SC}[BoldFont=Noto Sans SC, ItalicFont=Kai] %配置中文字体
  \setCJKfallbackfamilyfont{rm}{Noto Serif SC}
  \setmainfont{Source Serif 4}
  \usepackage{sourcecodepro}
```

可以在`\begin{document}`之前这样修改，添加首行缩进：
```latex
\usepackage{ctex} %调用中文字体宏包
\usepackage{indentfirst} %调用首行缩进宏包
\setlength{\parindent}{2em} %设置首行缩进为2字符

\begin{document}
```

### 使用方法

基本的页面属性模版，用于调整header & footer以及titlepage等：
```
---
title: "Example PDF"
author: [Author]
date: "2017-02-20"
subject: "Markdown"
keywords: [Markdown, Example]
header-left: "\\hspace{1cm}"
header-center: "\\leftmark"
header-right: "Page \\thepage"
footer-left: "\\thetitle"
footer-center: "This is \\LaTeX{}"
footer-right: "\\theauthor"
titlepage: true
titlepage-color: "3C9F53"
titlepage-text-color: "FFFFFF"
titlepage-rule-color: "FFFFFF"
titlepage-rule-height: 2
titlepage-background: "background.pdf"
page-background: "backgrounds/background1.pdf"
toc: true
toc-own-page: true
...
```

最简单的调用模版的方法：
```bash
pandoc example.md -o example.pdf --template eisvogel --listings
```

包含我常用选项的方法：
```bash
pandoc

sourcefile  
-o outputfile.pdf  
--from markdown
--toc
--template eisvogel  
--listings
--number-sections
--pdf-engine=xelatex
```

其中`--toc`用来生成目录（也可以直接在属性里面添加`toc: true`），`--number-sections`用来给标题添加数字小节。

除此之外，还有其他一些之后可能会用到的选项：

生成 beamer：

```bash
pandoc "document.md" -o "document.pdf" --from markdown --to beamer --template "../../dist/eisvogel.beamer" --listings
```

生成接近书本的样式：
（详见[typesetting-a-book](https://github.com/Wandmalfarbe/pandoc-latex-template?tab=readme-ov-file#typesetting-a-book)）

```bash
pandoc "document.md" -o "document.pdf" --from markdown --template "../../dist/eisvogel.latex" --listings --top-level-division="chapter"
```

Syntax Highlighting Without Listings:

```bash
pandoc example.md -o example.pdf --template eisvogel --highlight-style pygments
pandoc example.md -o example.pdf --template eisvogel --highlight-style kate
pandoc example.md -o example.pdf --template eisvogel --highlight-style espresso
pandoc example.md -o example.pdf --template eisvogel --highlight-style tango
```


## 使用测试

> [!note]
> This is an Obsidian Callout.


>这是一段quote

这是一个中文段落，带有**加粗**和*斜体*的内容。测试==高亮==部分

注意内部链接格式需要为[测试](#标题2)

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam aliquet libero
quis lectus elementum fermentum.

| table | a   | 中文   | what |
| ----- | --- | ---- | ---- |
| 12    | 20  | 安静   | a    |
| haha  | 中文  | test | 209  |


This is an strange English, sentence.

This is an English sentence mixed with 中文内容。

- 列表项 1
- 列表项 2

1. 有序
2. 列表

[外部链接](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/)

用几何方法推导了幂函数求导公式（Power rule）：$\frac{d(x^n)} {dx}=nx^{n-1}$

---


啊啊啊啊这是一段中文接下来是英文Laudat ille auditi; vertitur iura tum nepotis causa; motus. Diva virtus! Acrota destruitis vos iubet quo et classis excessere Scyrumve spiro subitusque mente Pirithoi abstulit, lapides.

### 标题2

啊啊啊哈

```html
<!DOCTYPE html>
<html>
  <head>
    <title>This is the title of the page.</title>
  </head>
  <body>
    <a href="http://example.com">This is a link.</a>
    <img src="./image.jpg" alt="This is an image.">
  </body>
</html>
```

#### 标题3

我是谁who are you

```python
lambda arguments: expression
a = 1 # test 注释
if a > 1: # 测试中文注释
	print("Hi")
```