---
title: "先利其器｜Hugo 博客搭建小记📝"
date: 2024-11-07
lastmod: 2024-11-08
description: "换电脑后的一些记录！"
tags: ["Tools","unfinished"]
categories: '先利其器'
type: 'post'
cascade:
  heroStyle: "background"
---

新手入门搭建博客，在这里简要记录一下。
<!--more-->

## 框架与主题选择
搭建前检索到了各种各样的搭建博客方式和框架，感觉大致有动态/静态网站和托管方式几种区分方法。看到好像不少人都会用 Notion 来分享，但我因为不喜欢不保存在本地的笔记应用所以一直用Obsidian 记 markdown 格式的笔记，对 Notion 一直很无感。又由于感觉 Wordpress 和 Medium 的可定制性看起来似乎不够好，平时也比较常用GitHub，所以选择用 Github Pages来建站，同时也顺便部署到 Netlify 上（也可以用 Vercel，好像都差不多）。同时又搜到几个常用的静态网站框架里 Hugo 比 Hexo速度快不少，所以就很随意地选了 Hugo（毕竟我对 Go 和 Node.js 的不了解程度是类似的XD）。

在 [Hugo Themes](https://themes.gohugo.io/) 里大致逛了一下，之前最开始尝试搭建博客的时候想选一个比较学术风格的，于是选了 [Flat](https://themes.gohugo.io/themes/hugo-theme-flat/)，后来感觉看起来还是有点单调，所以重新捡起来之后重新选了 [Blowfish](https://themes.gohugo.io/themes/blowfish/)，因为示例网站看起来很好看，而且教程也写得特别详细。

具体安装和部署过程就不赘述了，因为看到已经有使用同样主题的博主详细写过，而且官方中英文教程都很详细。不过需要注意 GitHub Actions 那里不要用默认提供的 pages-build-deployment，因为默认是用的 Jekyll 来生成，在 <kbd>New workflow</kbd> 里新增一个 Deploy Hugo site to Pages，并且在 Settings - Pages 里面设置一下就可以了。
  

## 装修记录

尽管 Blowfish 的教程已经写得很全面，但在部署过程中还是（因为没有仔细看）遇到了各种各样的小问题，因此在这里记录一下。

### 基础 config 设置和一些细节

- 语言：
	- 在 `hugo.toml` 将中文设置为默认语言，英文设置为第二语言，这样中文 post 无需额外修改命名格式，所有英文 post 的命名格式都改为形如`index.en.md`；
	- 注意作者的头像简介什么的也是在语言设置里面改。
- 菜单栏：
	- 分成 main、subnavigation 和 footer 三类，分别填进去想要的网站分类名称就可以，（发现 Tag 和 Categories 不需要额外手动分类，很赞）；
	- 如果是多语言的网站，需要额外给英文或其他文版用 `menus.en.toml` 也设置一遍，复制粘贴修改的时候注意要把 `pageRef` 改到英文的文件夹里。
- `markup.toml`：
  - 有需要的话可以改一下目录的 `startLevel` 或者 `endLevel`;
  - 可以参照 [Goldmark](https://gohugo.io/getting-started/configuration-markup/#goldmark) 修改各种 `[goldmark]` 参数；
    - 要在网页的 Markdown 文件中使用 $\LaTeX$ 或 $\TeX$ 语法，可以参照 [Mathematics in Markdown](https://gohugo.io/content-management/mathematics/) ，启用Hugo Goldmark Extensions之后在配置文件中添加相应内容；
      - 注意：如果你的主题设置有单独的 `markup.toml` 、`params.toml` 文件，需要分别添加到这两个文件中并去掉 `[markup]` 和 `[params]` 开头，因为官网提供的代码是用于添加在 `config.toml` 或者 `hugo.toml` 中的；
    - If you add the `$...$` delimiter pair to your configuration and JavaScript, you must double-escape the `$` when outside of math contexts, regardless of whether mathematical rendering is enabled on the page.
- `hugo.toml`：
	- 需要手动增添一行 `hasCJKLanguage = true`，否则在记录字数的时候会默认只记录英文字符；
	- 其他选项看个人需要改成 true 或 false 即可，我是开着 `hugo server` 一直改来改去试着看来确定的效果。
- `params.toml`：几乎所有需要改的属性都在这个文件里，已经按照作用域分类，基本也是按需修改即可
	- 注意 `mainSections = ["section1", "section2"]` 里的 section 对应的是所有 article 的 **Front Matter** 的 type 属性，会在例如 showRecent 等功能里用到；
	- 其他需要调整的细节见下。

### 视图调整

可以在`params.toml` 里设置诸如 page, profile, hero, card, background 等格式，也可以自定义。

#### 缩略图设置与调整

如教程所说，添加缩略图的方法是在文章的文件夹下添加 feature 开头的文件（一般命名为featured.png 之类的，注意如果本来的文件是单独的 .md 文件的话需要重新命名为 index。此外要添加缩略图还需要在 `params.toml` 把 `showHero` 属性改为true。注意有多个作用于不同区域的 `showHero`，可以按需修改。不过我发现修改之后我的文章列表不管是 card 还是 list 格式都并没有显示缩略图，所以额外在部分分区的 `_index.md` 的Front matter 里增加了

```
cascade:
  hideFeatureImage: false
```

来取消隐藏 FeatureImage。除此之外也可以用 cascade 单独给相应文章进行设置，例如使其显示 summary、使没有单独设置 feature 缩略图的文章不显示缩略图（因为我设置了 `heroStyle = "thumbAndBackground"`，所以如果没有手动设置缩略图的话缩略图的区域会显示背景图片）等。

### 增加评论功能

  Blowfish 主题默认提供的评论功能是基于 Disqus 的，似乎在国内并不好用而且收费较高，因此我采用了 [Twikoo](https://twikoo.js.org/) 来部署评论功能。具体来说，选择的云函数部署方法是 Netlify 部署，然后通过 CDN 引入的方法来部署在前端，对于前者网站的教程都写得很详细，因此不再赘述；后者需要自己手动复制网址提供的代码到 `layouts/partials/comments.html` 并填写相关参数。
  
```html
  <!-- twikoo -->
  {{- if .Site.Params.twikoo.enable}}
  <div id="tcomment"></div>
  <script src="https://cdn.staticfile.org/twikoo/{{ .Site.Params.twikoo.version }}/twikoo.all.min.js"></script>
  <script>
    twikoo.init({
      envId: '{{ .Site.Params.twikoo.env }}', // 腾讯云环境填 envId；Vercel 环境填地址（https://xxx.vercel.app）
      el: '#tcomment', // 容器元素
      region: '{{ .Site.Params.twikoo.region }}', // 环境地域，默认为 ap-shanghai，腾讯云环境填 ap-shanghai 或 ap-guangzhou；Vercel 环境不填
      // path: location.pathname, // 用于区分不同文章的自定义 js 路径，如果您的文章路径不是 location.pathname，需传此参数
      lang: 'zh-CN', // 用于手动设定评论区语言，支持的语言列表 https://github.com/twikoojs/twikoo/blob/main/src/client/utils/i18n/index.js
    })
  </script>

  {{- end }}
```

然后在hugo.toml里面添加：
```toml
[params.twikoo]
  enable = true
  env = "https://xxx.netlify.app/.netlify/functions/twikoo"
  region = ""
```
一开始我设置完后评论会显示评论发送失败，后来发现是 `env` 填成 netlify 提供的网址了，但实际后面还需要加上 `.netlify/functions/twikoo`！

### 增加浏览量和点赞功能

  Blowfish 已经支持了对 Firebase 的集成，因此可以比较方便地增加浏览量和点赞功能。
  
  首先修改 `showViews`、`showLikes` 等参数，之后注册 [Firebase](https://firebase.com/) 账户、添加项目（web应用），在SDK 设置和配置里选择“从 CDN（内容分发网络）加载 Firebase JavaScript SDK 库”，然后将给出的脚本里的数值复制粘贴在 `params.toml` 的 `[firebase]` 部分。之后在左侧菜单栏选择 Firestore Database 并注册数据库，创建好之后在“规则”栏粘贴刚才网页提供的代码：
  
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

然后在左侧菜单栏的 Authentication 添加匿名访问，推送所有修改之后就应该可以正常显示了。

### 增加随机笔记功能

因为平时偶尔会用一下 obsidian 里面的“漫游笔记”功能，所以也想给网站加上。检索了一下最接近的教程是 [给 Hugo 博客添加随机文章入口 | 椒盐豆豉](https://blog.douchi.space/hugo-random-post/#gsc.tab=0)，因此主要是在此基础上稍微修改了一下：

在`/layouts/partials/random.html`里添加：

```html
<!-- 漫游笔记 -->
<script>
  function goToRandomPost() {
    const pages = [
      {{ range (where .Site.RegularPages "Type" "in" (slice "post" "thought")) -}} // 选择在漫游笔记范围内的文章类型
      "{{ .RelPermalink | safeJS }}",
      {{ end -}}
    ];
    const rand = Math.floor(Math.random() * pages.length);
    window.location.href = pages[rand];
  }
</script>
```

在 `/layouts/shortcodes/random.html` 里添加：

```go
{{- if eq (index .Params 1) "button"}}
  <a onclick='goToRandomPost()' class="book-btn">{{ index .Params 0}}</a>
{{- else -}}
  <a onclick='goToRandomPost()' style="cursor: pointer;">{{ index .Params 0}}</a>
{{- end -}}
```

不过由于我想在菜单栏的 subnavigation 部分添加漫游笔记功能，而该部分默认是在 `menu.toml` 的  `[[subnavigation]]` 下用 `pageRef` 来链接跳转的，所以我直接修改了 `layouts/partials/header/basic.html` 里的代码，简单粗暴地将原来的部分修改为：

```html
{{ if or (eq .Name "漫游笔记") (eq .Name "Random note") }}
  <!-- 如果是 "漫游笔记"，使用 onclick="goToRandomPost()" -->
  <a href="javascript:void(0);" onclick="goToRandomPost()" class="flex items-center">
{{ else }}
  <a href="{{ .URL }}" {{ if or (strings.HasPrefix .URL "http:" ) (strings.HasPrefix .URL "https:" ) }}
  target="_blank" {{ end }} class="flex items-center">
{{ end }}
```

这样中英文都可以有漫游笔记功能了。

### Shortcodes

#### 插入 bilibili、Spotify 等应用的播放块（是叫这个名字吗？）

可以在 Hugo 通过增加 [Shortcodes](https://gohugo.io/content-management/shortcodes/) 的方法来插入，一般来说可以想到的应用都已经有人写过 shortcodes 发布过了，直接在 GitHub 或者搜索引擎搜相应关键词+shortcodes就可以找到。复制下来以 .html 文件的格式放在 `layouts/shortcodes/` 里即可，之后可以在正文中随时调用。

效果是这样：

{{< spotify type="album" id="1aCpHSQE5ghxibsQ5gkBe0" width="100%" height="200" >}}

{{< typeit 
  speed=150
  breakLines=false
  loop=true
  lifeLike=true
>}}
来都来了听会儿再走吧 |´・ω・)ノ
{{< /typeit >}}

#### 增加外链预览块功能
使用 [LinkPreview API](https://www.linkpreview.net/) 来提供预览功能。

在 `/layouts/shortcodes/external_link.html` 中添加（注意需要替换为自己的API Key）：

```html
<!--
Parameters:
  external_link - (Required) The URL of the external link, e.g. "https://example.com"
  width - (Optional) width, default "100%"
  height - (Optional) height, default "auto"
-->
<div class="external-link-preview" 
     data-url="{{ .Get 0 }}" 
     data-width="{{ .Get "width" | default "100%" }}" 
     data-height="{{ .Get "height" | default "auto" }}">
  <div class="loading">Loading preview...</div>
</div>

<style>
/* 修改预览图片的大小和位置 */
.post-preview{
  margin: 1em auto;
  position: relative;
  border-radius: 15px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .25), 0 0 2px rgba(0, 0, 0, .25);
}
.post-preview img {
  width: 100%; /* 设置图片宽度为100% */
  height: auto; /* 自动调整高度 */
  object-fit: cover; /* 保持图片的比例并裁剪以适应容器 */
  border-radius: 15px 15px 15px 15px !important; /* 设置图片的圆角 */
}
/* 修改预览块的样式 */
.post-preview--meta {
  display: flex;
  flex-direction: column;
  height: auto; /* 设置高度自适应 */
  overflow: hidden;
}
</style>

<script>
document.addEventListener("DOMContentLoaded", function() {
  const previewElements = document.querySelectorAll('.external-link-preview');

  previewElements.forEach(element => {
    const url = element.getAttribute('data-url');
    const width = element.getAttribute('data-width');
    const height = element.getAttribute('data-height');

    fetch(`https://api.linkpreview.net/?key=YOUR_API_KEY&q=${encodeURIComponent(url)}`)
      .then(response => response.json())
      .then(data => {
        element.innerHTML = `
          <div class="post-preview" style="width: ${width}; height: ${height};">
            <div class="post-preview--meta">
              <div class="post-preview--middle">
                <h4 class="post-preview--title">
                  <a target="_blank" href="${data.url}">${data.title}</a>
                </h4>
                <p>${data.description}</p>
                <img src="${data.image}" alt="${data.title}" style="max-width:100%; width: ${width}; height: ${height};">
              </div>
            </div>
          </div>
        `;
      })
      .catch(error => {
        element.innerHTML = `<p>Failed to load preview.</p>`;
        console.error('Error fetching link preview:', error);
      });
  });
});
</script>
```

#### 其他

Blowfish 也提供了很多有用的shortcodes，详见[简码](https://blowfish.page/zh-cn/docs/shortcodes/)。

---

暂时就是这些！以后如果有修改再慢慢更新。


## TO DO

- [x] 修改缩略图设置
- [x] 增加评论功能
- [x] 增加浏览量和点赞功能
- [x] 增加随机笔记功能
- [ ] 增加友链——已经添加了shortcode和css！等待愿意和我添加的友邻中，可以在评论区或者通过邮件联系我 ;）
- [ ] 修改网站图标和背景
- [ ] 增加热力图
- [ ] 修改部分文章的字体
- [ ] 很喜欢 [Books | Christian B. B. Houmann](https://bagerbach.com/books) 和 [我的阅读 - Elizen](https://elizen.me/books/) 这种界面，看看能不能弄一个类似的
- [ ] 增加订阅功能（暂时不准备）