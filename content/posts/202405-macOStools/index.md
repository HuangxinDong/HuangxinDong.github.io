---
title: "先利其器｜一些 macOS 实用工具记录🧑‍💻"
date: 2024-05-27
lastmod: 2024-01-13
description: "换电脑后的一些记录！"
tags: ["Tools","unfinished"]
categories: '先利其器'
type: 'post'
cascade:
  heroStyle: "background"
---

纠结了好久之后终于换了新电脑，多年 Windows 用户刚开始用 macOS 感觉很多地方都很陌生，因此在这里整理、记录、备忘一下。本文中的多数软件/功能仅适用于 macOS，也有部分软件适用于其他操作系统。
<!--more-->

初步配置参考：
- [OCD's Guide to Setting up Mac](https://github.com/macdao/ocds-guide-to-setting-up-mac)
- [Introduction · macOS Setup Guide](https://sourabhbajaj.com/mac-setup/)

---


## macOS 实用快捷键
[Mac 键盘快捷键](https://support.apple.com/zh-cn/102650)

可以用 cheatsheet 软件来快速了解每个软件的快捷键，但是有些软件的似乎不太全……

- 最小化窗口：<kbd>command</kbd>+<kbd>m</kbd>
- 最大化窗口：双击应用顶部（再次双击可以恢复之前的大小）
	- 按住<kbd>option ⌥</kbd>将鼠标移动到绿色按钮处即可看到最大化`+`标识，可以将窗口调整到适应屏幕最大，双击应用顶部也可达到同样效果。
- 全屏化窗口：<kbd>control</kbd>+<kbd>command</kbd>+<kbd>f</kbd>
- 关闭窗口：<kbd>command</kbd>+<kbd>w</kbd>
- 关闭当前软件：<kbd>command</kbd>+<kbd>q</kbd>
- 强制退出软件：
- 隐藏窗口：<kbd>command</kbd>+<kbd>h</kbd>（很少用）
- 切换应用:
	- <kbd>command</kbd>+<kbd>tab</kbd>，但是特别难用，只能点开已经打开的软件，最小化了的都打不开
- 锁屏：<kbd>Control</kbd>+<kbd>Command</kbd>+<kbd>Q</kbd>
- 在当前 App 的多个窗口间切换：<kbd>Command</kbd>+<kbd>重音符 (`)</kbd>
- 强制退出应用程序
  - 普通直接关闭窗口和退出程序是<kbd>command</kbd>+<kbd>Q</kbd>
  - <kbd>command</kbd>+<kbd>option</kbd>+<kbd>esc</kbd>
  - 如果这个也没有用可以直接长按电源键关机重启

### 我的自定义快捷键
新建txt文件：<kbd>control</kbd>+<kbd>option</kbd>+<kbd>n</kbd>

#### 快捷键分屏
在 Windows 上直接通过将窗口拖动到屏幕边缘，或使用 <kbd>Win 键</kbd> + <kbd>←→↑↓</kbd>就可以快速实现分屏操作。在 macOS 可以进行一些简单的系统设置来弥补这个缺陷：
在“设置”中检索“快捷键”，选择“键盘”下面的“键盘快捷键”，点开选择“APP 快捷键”，分别添加“缩放”、“将窗口移到屏幕左侧”、“将窗口移到屏幕右侧”，并选择相应快捷键。

我目前用的快捷键组合分别是：<kbd>option</kbd>+<kbd>↑</kbd>、<kbd>option</kbd>+<kbd>←</kbd>、<kbd>option</kbd>+<kbd>→</kbd>。这个设置和少量 app 会有快捷键冲突（特别是缩放那个按键），多数好像都可以。

rectangle app 的快捷键组合是 <kbd>control</kbd>+<kbd>option</kbd>+<kbd>←→↑↓</kbd>，以及<kbd>control</kbd>+<kbd>option</kbd>+<kbd>-</kbd>和<kbd>control</kbd>+<kbd>option</kbd>+<kbd>=</kbd>来缩放，优点是有上下分屏缺点是没有动画，不如原生的好看。

*更新: macOS15 之后已经内置了类似的分屏操作。*

#### 触发角快捷键
在系统检索即可调整，目前左下角是调度中心右下角是桌面。

---

## 实用工具
### 软件下载安装管理
主要用 [Homebrew](https://formulae.brew.sh/analytics/) 或者从官网下载，偶尔用 App Store。

为了安装 Game Porting Toolkit，也安装了 x86_64 version of Homebrew（`/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`）。

#### 切换 Homebrew 环境变量

- 使用 Apple Silicon 版本的 Homebrew：
    `export PATH=/opt/homebrew/bin:$PATH`
- 使用 Intel 版本的 Homebrew：
    `export PATH=/usr/local/bin:$PATH`

##### 设置`brew`环境自动切换
```bash
cat << 'EOF' >> ~/.zshrc
if [ "$(arch)" = "arm64" ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
else
    eval "$(/usr/local/bin/brew shellenv)"
fi
EOF
source ~/.zshrc
```

后续只需要在终端先执行`arch -x86_64 zsh`，就能自动切换到`x86`，不执行这段命令就会默认用`arm`版本。

### Office和LaTeX
Office：在学校的正版化平台下载了 Microsoft Office，同时也看推荐下载了 [LibreOffice](https://www.libreoffice.org/) 和 Only Office 备用。尝试使用发现后者虽然界面和微软的几件套很像，但是似乎打开其他人的 docx 文件还是可能会出错，所以卸载了。

$\LaTeX$ 编辑器：在线用 [Overleaf](https://www.overleaf.com/)，本地使用 MacTex，编辑器先尝试了 [Texifier](https://www.texifier.com/)，之后改用 VSCode + [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop)，不过一般来说 Latex Workshop 最好额外修改一些设置，可以检索搜到不少相关教程。

### 浏览器
平时一般用 Safari+Google Chrome，偶尔用 tor 和 Safari 内置的 DuckDuckGo。之前看到很多人在推荐 [Arc](https://arc.net/)，感觉虽然很好看但有点没有 get 到好用之处在哪里，所以试了一下就卸载了。

#### Safari 插件
- AdBlocker: 屏蔽广告，免费版已经够用
- [Hush](https://oblador.github.io/hush/): 屏蔽 cookie 弹窗
- URL Linker: 方便地在右键菜单复制 markdown 格式的当前网页链接

#### Chrome 插件
- 油猴（[Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/)）：不必多说
- Zotero: 看文献必备
- Copy Markdown Link: 方便地复制 markdown 格式的网页链接
- Hypothesis: 可以用来标注一些网页内容，支持添加注释和跳转，**很好用强烈安利**（Safari 其实也支持用但不是以插件形式）
- Obsidian Web Clipper: obsidian 新出的抓取网页内容的插件
- SteamDB: 查看游戏历史价格，偶尔可以用来临时工入库
- Webrecorder ArchiveWeb.page: 可以把网页内容下载保存下来
- 豆伴：豆瓣账号备份工具，已经很久没有更新，目前（2024-01-13）书影音都无法爬取，只能备份游戏、豆列等
- Bionic Reading: 通过加粗单词前一两个字母的方式帮助实现量子速读（误）
- 尝试过一些 Chrome 插件商店里的番茄钟软件，感觉都一般


### 时间追踪与任务管理
目前正在尝试使用 [ActivityWatch](https://activitywatch.net/)，一款开源免费的时间追踪软件。<strike>同时也使用 Toggl（用来做任务、日程管理和设备同步）。</strike>

*更新：不再用 toggl，改用 [Session](https://www.stayinsession.com/) 当番茄钟专注软件*

每日的任务管理主要在 [Obsidian](https://obsidian.md/)，同时用 reminder 搭配[reminders-menubar](https://github.com/DamascenoRafael/reminders-menubar)来记录即时任务，**特别好用强烈推荐**！因为我脑子里总是会突然各种灵光一闪，可以先都紧急记在这里以后再做。

### 媒体播放器
搜了一下主流选择有：
- [Elmedia Player](https://www.elmedia-video-player.com/)
- [IINA](https://iina.io/)
- [mpv.io](https://mpv.io/)
- [VLC](https://www.videolan.org/)
- [Infuse 7](https://firecore.com/infuse)
- [nPlayer](https://nplayer.com/)
- [Fig Player (Renamed from PotPlayer X to Fig Player since version 1.1.0) - Oka Apps](https://okaapps.com/product/1612400976)

我目前选 IINA 播放本地视频，Infuse 用来连 emby（不常用）。

#### 音乐
Apple Music + Spotify + YouTube Music，后两个只是偶尔会用。

🤔发现 Apple Music 可以在播放歌曲时按下 Option 键，然后点按播放控制中的妙选随机播放按钮。

### 笔记
平时几乎所有笔记、日记都会用 [Obsidian](https://obsidian.md/)，看论文用 zotero +各种插件，偶尔也用备忘录和 Goodnotes 胡乱写。

浏览网页时用 [Hypothesis](https://web.hypothes.is/) 插件进行注释：支持 Markdown 和跳转，同时可以导入 Obsidian，很好用！

有点想学：
- [How I draw figures for my mathematical lecture notes using Inkscape | Gilles Castel](https://castel.dev/post/lecture-notes-2/)
- neovim

### 阅读

- 图书 app：多设备同步，highlight和记笔记方便，阅读时间有记录+可以每日打卡；
- 微信读书：epub支持良好，记笔记和导出笔记都很方便，阅读时间有记录，缺点是书架有上线，而且很多之前能读的书籍已经被下架；
- Zotero：文献，引用方便，支持 Markdown 和跳转，缺点是占用内存太大，但笔记可以通过插件导出到 Obsidian；
- 格式转换：Calibre（各种电子书格式）、简悦（网页转 Markdown）、[Pandoc](https://pandoc.org/)
- 稍后阅读：Omnivore（支持各种设备同步、导出到 Obsidian，还支持高亮、笔记和RSS）
  - 不过说起来我发现自己并没有养成稍后阅读的习惯……如果不立刻解决以后肯定会忘记！
- RSS：最近很少用


### 卸载和清理
- [OnyX](https://www.titanium-software.fr/en/onyx.html)
- 如果是 App Store 下载的软件，可以长按后点击左上角❎卸载软件
- 如果是 homebrew 安装的软件，可以用 `brew uninstall` 卸载
- 其他可以用 [AppCleaner](https://freemacsoft.net/appcleaner/) 或者 [PrettyClean](https://www.prettyclean.cc/en)，后者也可以用于系统清理
- 如果想清理近似的或重复的图片，可以用 [PhotoSweeper](https://overmacs.com/)


### 其他
- 录制终端 session 的小工具：[Record and share your terminal sessions, the simple way - asciinema.org](https://asciinema.org/)
- 很好用的开源免费划词翻译[Easydict](https://github.com/tisfeng/Easydict)
- 很好用的开源免费剪贴板管理：[Maccy](https://maccy.app/)

---

## 系统设置与自带软件
### 电源管理
一开始尝试了[AlDente](https://apphousekitchen.com/)，但是它功能太花里胡哨而且收费，遂卸载之。之后安装了 BCLM

```
brew tap zackelia/formulae
brew install bclm
```

实际设置最大充电：
```bash
sudo bclm write 80
bclm read
```
（最大问题就是只能设置为80或100，不过也够用了反正）

设置持久化：（关闭就是改成unpersisit）
```bash
sudo bclm persist
```


### 输入法
由于日常会输入ipa，所以额外下载了rime的鼠须管。需要在“设置”-“键盘”-“文字输入”-“输入法”的左下角通过➕号添加。

### 美化
- 平时在Finder很常用图标视图，所以从[macosicons.com](https://macosicons.com/#/)下载了很多实用的文件夹图标，复制之后点击相应的文件夹右键“显示简介”，选中左上角文件夹图标粘贴即可；
- 在不开启台前调度的时候用[HazeOver](https://hazeover.com/)，可以更方便地专注当前窗口，而且如果通过了 GitHub 的学生认证可以在[GitHub Student Developer Pack](https://education.github.com/pack#namecheap)里免费领取；
- 我的 MacBook 是屏幕上方有 notch 的机型，虽然并不觉得很碍眼但有时候会挡住 menu bar 的一些图标，所以用开源免费的[Ice](https://icemenubar.app/) 来管理

---

## 效率与文件管理
### 窗口管理
[一篇文章让你透彻认识 Mac 应用切换和窗口切换的逻辑](https://www.abxm2.com/mac-switch-app-or-windows)

平时我就只是使用普通的视图，但如果想快速地切换应用的话我会临时开启台前调度模式。

### 文件管理
有看到一些Finder的插件或者其他很高端的文件管理软件，但我觉得Finder已经很好用，特别是检索起来特别快（之前用win的文件管理还不得不额外装一个everything来专门检索），而且标签系统也很好用。

用brew安装了tree，可以递归目录列表命令，生成文件深度缩进列表。
用法：
```bash
tree -L 1
```

### 文件传输
苹果设备之间直接隔空投送就可以，和非苹果设备为一般用 [Resilio Sync](https://www.resilio.com/sync/) 来共享文件，好用且安全。由于我的鼠标还支持 [Logitech Flow](https://support.logi.com/hc/zh-cn/articles/1500005634742-%E4%BB%80%E4%B9%88%E6%98%AF-Logitech-Flow-%E5%A6%82%E4%BD%95%E8%AE%BE%E7%BD%AE%E5%92%8C%E6%8E%92%E9%99%A4%E6%95%85%E9%9A%9C) 功能，所以也可以直接在两台都配对了同一个鼠标的电脑直接复制粘贴。

如果是要给其他人发送文件，总觉得让人额外下载一个软件太过麻烦，而且也不是所有人都有每个网盘的账号/网盘仍然有剩余空间，而且网盘的审查和限速也很恶心，所以我平时用 [Transfer.zip](https://transfer.zip/) 来分享文件。如果是临时传输，可以在不关闭网页的情况下传任意大小的文件；也可以选择注册账号传输，会有 11 GB的免费空间，传后即删的情况下这个空间绰绰有余，接受者无需注册账号直接点击链接下载即可，而且国内好像没有墙。总之很好用**强烈安利**！同类型的网站搜一下还有很多，例如 [FilePizza](https://file.pizza/)，不过大多只支持临时传输。

以上所有这些只因为我不想再用 QQ、微信或者网盘传输文件……

### 硬盘空间管理

除了设置里自带的硬盘空间管理之外，也可以用 [DaisyDisk](https://daisydiskapp.com/) 或者开源免费的 [GrandPerspective](https://grandperspectiv.sourceforge.net/) 来更详细地可视化和管理（之前在 Windows 我会用个人使用免费的 [WizTree](https://diskanalyzer.com/)，优点是速度特别快）。

---

## Bug、水土不服与解决
### 程序坞与托盘
在win中，不是所有正在运行的程序都显示在下方程序坞里面，而是可以只显示在托盘里。我一般只让程序坞显示自己最常用的几个软件和当前正在运行的软件。

而Mac中仅有少数正在运行的软件可以**不显示**在程序坞里，难免让人觉得眼花缭乱……

*更新：已经看习惯。*

###  FaceTime 声音问题
发现在 FaceTime 通话的时候如果打开别的播放声音的软件，Mac 会自动降低那些软件的声音，而且我没有找到可以调节的选项。之前用 Windows 系统电脑的时候我一般会用 [EarTrumpet](https://eartrumpet.app/) 来调整不同应用的音量，在 Mac 目前没有找到特别合适的开源软件，暂时用 SoundSource 来控制音量。不过发现 SoundSource 虽然可以调节，但是在开启 FaceTime 通话之后对方的声音会有重（chÓng）音，感觉可能是声道设置的问题，暂时没找到解决方案。

### 修复 steam 游戏图标
[macOS下修复Steam游戏图标](https://all2h.com/post/blog/ruan-ying-jian-zhe-teng/macosxia-geng-xin-steamyou-xi-tu-biao)

不同游戏修复方法可能不一样，能改的都改一遍就行。不过最好的办法其实是下载游戏的时候不要创建快捷方式，因为不然卸载的时候还要手动删……


### 在 macOS 上快速新建 txt 文本文件
- 已解决，参见上文快捷键部分。
- 也可以改变思路，看到很多人说会先打开编辑软件再考虑保存问题（但我懒得改）
	- 解决保存文件时隐藏路径不显示：可以直接`Command + Shift + G`，然后复制粘贴相应路径
- 也可以用`touch`命令，形如`touch ~/Desktop/newfile.txt`

### Mac 输入法如何打出command和option等符号
fn，点右上角放大之后在自定符号里面增加“技术符号”即可。

### 键盘屏幕清理
说是键盘很容易油什么的，感觉就擦吧无所谓了。屏幕我直接用相机的清理套装的喷雾喷在眼镜布上擦。

### 游戏
感觉 steam、GOG、itch 和 Epic 的 macOS 版本都依托答辩……所以现在用[Heroic Games Launcher](https://heroicgameslauncher.com/)来替代 GOG 和 Epic。

#### Good Old Games
提供 Good Old Games 的不仅有 GOG，[My Abandonware](https://www.myabandonware.com/)等网站也提供不少老游戏的下载资源。除此以外，也有少数经典游戏已经有了开源重制版，例如 [OpenRA](https://www.openra.net/)、[OpenRCT2](https://openrct2.io/)、[OpenTTD](https://www.openttd.org/) 等。

DOS 游戏可以用 [DOSBox-X](https://dosbox-x.com/) 或者 [Boxer](http://boxerapp.com/) 模拟器运行，一些多年以前的主机端游戏的 ROMs 可以用 [OpenEmu](http://openemu.org/) 模拟器运行。

#### Wine and Whisky
Whisky is a modern Wine wrapper for macOS built with SwiftUI

新建容器、选择容器配置（Windows版本）之后就可以使用。可以通过winetricks命令安装一些基础应用程序、dlls、设置和字体（cjkfonts、corefonts）什么的。之后双击点击exe程序就已经可以运行，也可以点击右下角“运行...”来运行特定程序。

{{< alert  d>}}
Whisky 并不能让 macOS 运行所有 Win 游戏，相关内容在其官方文档的“常见问题”章节有说明如下：
>1. **游戏因“指令无效”而崩溃**：您的游戏可能正在使用 AVX 指令。这些在控制台端口中更为常见。AVX 指令是特定于 x86 的，Rosetta 不会翻译它们。除非你能找到一种方法来禁用或绕过它们（在线检查），否则你的游戏将无法运行。
>2. **无法加载某些竞争激烈的多人游戏**：竞争性多人游戏，尤其是大逃杀和其他 FPS 游戏（如 PUBG、Fortnite、Apex Legends、Valorant），通常具有某种形式的驱动程序级反作弊。这些在 Wine 下不起作用。
{{< /alert >}}

#### CrossOver
[Run Microsoft Windows software on Mac and Linux | CodeWeavers](https://www.codeweavers.com/crossover)

折腾完一通后的心情——算了还是玩ns吧！