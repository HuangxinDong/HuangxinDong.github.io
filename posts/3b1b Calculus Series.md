---
title: Notes on 3b1b Calculus Series (test post for math)
tags:
  - math
created: 2023-11-04
modified: 2023-11-04
description: 对 3Blue1Brown 微积分系列视频的简短中文笔记与重点整理。
lang: zh
draft: true
---

本篇笔记是对 3b1b 微积分系列视频的简短重点摘要。由于课程内容比较基础（基本全都是高中知识）所以没有详细记笔记，主要是温习一遍并且学习他的思路。

系列网站：[3Blue1Brown | Calculus](https://www.3blue1brown.com/topics/calculus)，b 站有双语视频。
除此之外，3b1b 也在 Khan Academy 录制了多元微积分课程 [Multivariable Calculus ](https://www.khanacademy.org/math/multivariable-calculus)。

其他相关课程：

- [Single Variable Calculus|MIT](https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/)
- [Multivariable Calculus|MIT](https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/)

*** 

### The Essence of Calculus

- argument: 论证
- derivative：导数

*** 

### [The paradox of the derivative](https://www.3blue1brown.com/lessons/derivatives)

**导数的悖论**

推荐书籍：[Art of Problem Solving](https://artofproblemsolving.com/)

- Using "d" announces that d->0
- “瞬时变化率”（Instantaneous rate of change）是一个矛盾的概念，因为严格意义上“瞬时”时不存在变化。
	- 更严谨的说法是“最佳常数近似”（Best constant approximation）

*** 

### Power Rule through geometry & Trig Derivatives through geometry

**用几何方式求导**

>Tiny nudges are the heart of derivatives.

用几何方法推导了幂函数求导公式（**Power rule**）：$\frac{d(x^n)} {dx}=nx^{n-1}$

幂函数 $u^n$ 对 $x$ 求导（u 是关于 x 的函数）的一般规则：$\frac{d(u^n)} {dx}=nu^{n-1}·\frac{du}{dx}$

%%在第 2 个公式中，链式法则用来处理复合函数，而在第 1 个公式中没有复合函数的情况。%%

*** 

### Visualizing the chain rule and product rule

**直观的方式呈现链式法则和乘积。**

- 链式法则是微积分中的一条规则，用于求解复合函数的导数。

理解对于更复杂的组合（加减 sum、乘除 product、嵌套 composition）如何求导：

- 对于 $f(x)=g(x)+h(x)$，$f'(x)=g'(x)=h'(x)$.
- 对于 $f(x)=g(x)h(x)$，$\frac{df}{dx}=g(x)\frac{dh}{dx}+h(x)\frac{dg}{dx}$，也就是 $f'(x)=g(x)h'(x)+h(x)g'(x)$.
- 对于 $f(x)=g(h(x))$，$\frac {d}{dx}g(h(x))=\frac{dg}{dh}(h(x))\frac{dh}{dx}(x)$，也就是 $f'(x)=h'(x)g'(h(x))$.

*** 

### What's so special about Euler's number e?

**指数函数求导。**

对于 $f(t)=e^{ct}$，$\frac{d(e^{ct})}{dt}=ce^{ct}$.
又因为对于任何常数 $n$，有 $n=e^{ln(n)}$.
所以 $n^t=e^{ln(n)t}$
所以 $n^t$ 的导数为 $ln(n)e^{ln(n)t}$，也就是 $ln(n)n^t$.

事实上，在微积分的整个应用中，你很少看到指数被写成基数 $t$ 的幂。相反，你几乎总是把指数写成某个常数乘以 $t$。这都是等价的；任何类似 $2^t$ 的函数都可以写成 $e^{ct}$。不同之处在于，根据指数函数构建事物在导数过程中要顺利得多。

(The difference is that framing things in terms of the exponential function plays much more smoothly with the process of derivatives.)

*** 

### Implicit differentiation, what's going on here?

**隐函数求导**

隐函数：是由隐式方程所隐含定义的函数，比如 $y={\sqrt{1-x^{2}}}$ 是由 $x^{2}+y^{2}-1=0$ 确定的函数。

求导方式：等式两边同时求导。

这节课与多元微积分入门有关。

*** 

### Limits and the definition of derivatives

**极限**

- 导数的正式**定义**，形如：

$$
\lim_{h\to0} \frac{f(2+h)-f(2)}{h} 
$$

- 或者：

$$
\lim_{t\to x} \frac{f(t)-f(x)}{t-x} 
$$

- 无穷小量（infinitesmalls）：上述式子中，$h$ 是否是无穷小量？（为什么引入一个新的符号？）$dx$ 应该被解释为无穷小量还是仅仅是一个符号？
	- 3b1b 认为，应该将之理解为一个“**有限小的变化量**”（concrete-finitely-small-nudge）。

*** 

### (ε, δ) "epsilon delta" definitions of limits

**极限的 ε-δ 定义**

$$\lim_{x\to p} {f(x)}=L $$
[ 如何能更好地理解（ε-δ）语言极限的定义？](https://www.zhihu.com/question/35804945)

*** 

### L'Hôpital's rule

**洛必达法则**

当出现 $\lim_{x\to c}{f(x)}=\lim_{x\to c}g(x)=0$ 或者 $\lim_{x\to c}{f(x)}=\lim_{x\to c}g(x)=\left|\infty\right|$ 的情况，也就是 $\frac 0 0$ 或者 $\frac{\infty}{\infty}$ 类型的极限时，称 $\lim_{c\to0} \frac{f(x)}{g(x)}$ 为未定式。可以分别对分子分母求导，再把那个数代入。

Funfact: 洛必达法则其实是伯努利发明的。

*** 

### Integration and the fundamental theorem of calculus

**积分与微积分基本定理**

积分是求导的逆运算。

- 知道速度 $v$ 与时间 $T$ 求距离，可以写成：$s(T)=\int_0^T v(t)dt$，英语是 integral of $v(t)$.
	- 为什么不使用 $\sum$ 符号？因为这个表达式并不是任何特定 $dt$ 的准确总和；它的目的是表达**dt 趋近于 0 时总和接近的值**。
- 如何求解 $s(T)=\int_0^T v(t)dt$ 呢？
	- 求 $v(t)$ 原函数即可。具体方式跟求导恰好相反，可以得到一系列原函数（形如 $f(x)+C$，因为常数求导等于 0）。由于 $\int_0^0$ 一定为 0，所以最后可以减去原函数在 0 时的值来求出唯一的原函数。
	- 实际运算中，$\int_a^b$ 在 a 和 b 代入相减中可以把常数消掉。
- 微积分基本定理：

$$
\int_a^bf(x)dx=F(b)-F(a)
$$

*** 

### What does area have to do with slope?

**面积与斜率的关系**

通过求 f(x)（连续曲线）均值，从另一个视角揭示为什么积分和求导是互逆运算。

*** 

### Higher order derivatives

**高阶导数**

主要是展示二阶导数在图形和运动背景下的样子，并借此思考更高阶的类比。

- 二阶导数：导数的导数，用来展现一阶导数是如何变化的。可以用符号写成：$\frac {d^2f}{dx^2}$，这是 $\frac{d(\frac{df}{dx})}{dx}$ 的缩写
	- One of the most useful things about higher order derivatives is how they help in approximating functions, which is the topic of the next chapter on Taylor series

*** 

### [Taylor series](https://www.3blue1brown.com/lessons/taylor-series)

**泰勒级数（及其几何阐释视角）**

这一集讲得很好！值得反复观看。

- 泰勒级数：在数学中，无限和被称为“级数（series）”，因此虽然具有有限多项的近似值之一被称为函数的“泰勒多项式（Taylor polynomial）”，将所有无限多项相加就得到了所谓的“泰勒级数”。

>The study of Taylor series is largely about taking non-polynomial( 非多项式 ) functions, and finding polynomials( 多项式 ) that approximate them near some input. 
>The motive is that polynomials tend to be much easier to deal with than other functions: They're easier to compute, easier to take derivatives, easier to integrate... they're just all around friendly.

正如这段 quote 中所说的，我们会想将非多项式函数用近似为多项式的方法表达出来，以易于接下来可能的一系列运算。显然，如果要求某个函数（比如 $f(x)$）在 $0$ 处的近似值，相应的近似多项式可以写成：
$$
P(x)=c_0+c_1x+c_2x^2+\dots+c_nx^n
$$

首先，我们想让 $x=0$ 时，$P(x)=f(x)$，所以 $c_0=f(0)$.

接着，我们想让 $x=0$ 处两个函数斜率相同，即 $P'(x)=f'(x)$. 由于 $P'(0)$ 里不带 $x$ 的只有 $c_1$ 一项，所以很显然 $c_1=f'(0)$.

再接下来，我们还想让 $x=0$ 处两个函数斜率的变化也接近，即 $P''(x)=f''(x)$. 所以 $2c_2=f''(0)$.

以此类推，$1\times2\times3c_3=f'''(0)$，$1\times2\times3\times\dots\times nc_n=n!c_n=\frac{d^3f}{dx^n}(0)$.

因此，有：
$$
f(x)\approx P(x)=f(0)+\frac{df}{dx}(0)\frac{x^1}{1!}+\dots+\frac{d^3f}{dx^n}(0)\frac{x^n}{n!}
$$

这个式子的巧妙之处在于，想求到任意一个指数的精度都没有问题，不会改变前面的 $c$ 值，而且由于一次次求导，$c_n$ 恰好可以写成阶乘。

如果是要求 $x=a$ 处的值，只需要把上式中的 $x$ 替换为 $(x-a)$ 即可。

关于 Taylor series，一个特殊的例子是 $e^x$：由于 $e^x$ 的导数还是 $e^x$，而且 $x=0$ 处 $e^x=1$，所以此时近似函数可以写成：
$$
e^x\approx 1+\frac{x^1}{1!}+\frac{x^2}{2!}+\dots+\frac{x^n}{n!}
$$

不仅如此，$cos(x)$、$ln(x)$ 等函数的泰勒级数也有着很明确、好记的规律。

- convergence (or "**converge**s to")：**收敛**。
	- "It's a mouthful to always say "The partial sums of the series converge to such and such value", so instead mathematicians often think about it more compactly by extending the definition of equality to include this kind of series convergence. That is, you'd say this infinite sum _equals_ the value its partial sums converge to."
	- 对于 $e^x$ 来说，不仅在 $x=0$ 处，如果用更大的数值代入检验，都可以发现数值趋近于 $e^x$，这意味着有关该函数的所有信息都以某种方式纯粹由单个输入（即 $x=0$）的高阶导数捕获。
- **diverge**：**发散**。有时这些级数仅在我们的输入周围的一定范围内收敛，比如 $ln(x)$。当 $x>2$ 时，近似多项式会反复横跳，慢慢远离原函数。
- radius of convergence：收敛半径，指最初的 input 和实际上最多能收敛的点的距离。

关于泰勒级数、它们的许多用例、对这些近似值的误差设置界限的策略、理解这些级数何时收敛和不收敛的测试，还有更多需要了解。

*** 

### The other way to visualize derivatives

**可视化导数的另一种方式**

i didn't really get it...有时间可以再看看。

*** 

3b1b 的其他课程笔记，参见：
[[3b1b Neural Networks Series 笔记 ]]
[[3b1b Multivariable Calculus]]
[[3b1b Probability Series 笔记 ]]
线性代数课程笔记目前在 Goodnotes 上。
