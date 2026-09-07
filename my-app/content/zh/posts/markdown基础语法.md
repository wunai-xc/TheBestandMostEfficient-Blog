---
title: "Markdown 基本语法"
date: 2026-08-03
draft: false
tags: ["Markdown", "教程", "写作"]
categories: ["技术"]
summary: "Markdown 是一种轻量级标记语言，排版语法简洁，让人们更多地关注内容本身而非排版。本文压缩整理自 markdown.com.cn 官方教程，涵盖标题、段落、强调、引用、列表、代码、链接、图片、分隔线与转义字符等全部基本语法。"
author: ""

---

## 什么是 Markdown

Markdown 是一种轻量级标记语言，排版语法简洁，让人们更多地关注内容本身而非排版。它使用易读易写的纯文本格式编写文档，可与 HTML 混编，可导出 HTML、PDF 以及本身的 `.md` 格式文件。因简洁、高效、易读、易写，Markdown 被大量使用，如 GitHub、Wikipedia、简书等。

> 本文内容压缩整理自 [markdown.com.cn 基本语法](https://markdown.com.cn/basic-syntax/)。

---
## 速查表

| 语法 | 元素 | 说明 |
|---|---|---|
| `#`~`######` | 标题 | 1-6 级 |
| 空白行分隔 | 段落 | — |
| 行尾两空格 或 `<br>` | 换行 | — |
| `**text**` 或 `__text__` | 粗体 | — |
| `*text*` 或 `_text_` | 斜体 | — |
| `***text***` | 粗体+斜体 | — |
| `> text` | 引用块 | 可嵌套 `>>` |
| `1. item` | 有序列表 | 数字+句点 |
| `- item` / `* item` / `+ item` | 无序列表 | 三选一 |
| `` `code` `` | 行内代码 | — |
| 缩进 4 空格 | 代码块 | 或用 ` ``` ` 围栏 |
| `***` / `---` / `___` | 分隔线 | 独占一行 |
| `[text](url "title")` | 链接 | title 可选 |
| `![alt](url "title")` | 图片 | — |
| `\char` | 转义字符 | 转义特殊符号 |

---

## 1. 标题语法

在单词或短语前面添加井号 `#`，`#` 的数量代表标题的级别。

| Markdown 语法 | HTML | 预览效果 |
|---|---|---|
| `# Heading level 1` | `<h1>Heading level 1</h1>` | <h1>Heading level 1</h1> |
| `## Heading level 2` | `<h2>Heading level 2</h2>` | <h2>Heading level 2</h2> |
| `### Heading level 3` | `<h3>Heading level 3</h3>` | <h3>Heading level 3</h3> |
| `#### Heading level 4` | `<h4>Heading level 4</h4>` | <h4>Heading level 4</h4> |
| `##### Heading level 5` | `<h5>Heading level 5</h5>` | <h5>Heading level 5</h5> |
| `###### Heading level 6` | `<h6>Heading level 6</h6>` | <h6>Heading level 6</h6> |

### 可选语法

还可以在文本下方添加任意数量的 `==` 号来标识一级标题，或者 `--` 号来标识二级标题：

```markdown
Heading level 1
===============

Heading level 2
---------------
```

### 最佳实践

请在 `#` 和标题之间用一个空格分隔，以兼容不同的 Markdown 应用程序。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `# Here's a Heading` | `#Here's a Heading` |

---

## 2. 段落语法

使用空白行将一行或多行文本进行分隔，即可创建段落。

```markdown
I really like using Markdown.

I think I'll use it to format all of my documents from now on.
```

### 最佳实践

不要用空格或制表符缩进段落，保持左对齐。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| 保持段落左对齐 | 在段落前添加空格或制表符 |

---

## 3. 换行语法

在一行的末尾添加**两个或多个空格**，然后按回车键，即可创建一个换行(`<br>`)。

```markdown
This is the first line.  
And this is the second line.
```

### 最佳实践

结尾空格的方式有争议（编辑器中难以直接看到空格），推荐使用 HTML 的 `<br>` 标签来实现换行。CommonMark 还支持在行尾添加反斜杠 `\` 实现换行，但兼容性不佳，不推荐。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `First line with two spaces after.  ` | `First line with a backslash after.\` |
| `First line with the HTML tag after.<br>` | `First line with nothing after.` |

---

## 4. 强调语法

通过将文本设置为粗体或斜体来强调其重要性。

### 4.1 粗体（Bold）

在单词或短语前后各添加两个星号 `**` 或下划线 `__`。

| Markdown 语法 | HTML | 预览效果 |
|---|---|---|
| `I just love **bold text**.` | `I just love <strong>bold text</strong>.` | I just love **bold text**. |
| `I just love __bold text__.` | `I just love <strong>bold text</strong>.` | I just love **bold text**. |
| `Love**is**bold` | `Love<strong>is</strong>bold` | Love**is**bold |

### 4.2 斜体（Italic）

在单词或短语前后各添加一个星号 `*` 或下划线 `_`。

| Markdown 语法 | HTML | 预览效果 |
|---|---|---|
| `Italicized text is the *cat's meow*.` | `Italicized text is the <em>cat's meow</em>.` | Italicized text is the *cat's meow*. |
| `Italicized text is the _cat's meow_.` | `Italicized text is the <em>cat's meow</em>.` | Italicized text is the *cat's meow*. |
| `A*cat*meow` | `A<em>cat</em>meow` | A*cat*meow |

### 4.3 粗体和斜体

在单词或短语前后各添加三个星号 `***` 或下划线 `___`。

| Markdown 语法 | HTML | 预览效果 |
|---|---|---|
| `This text is ***really important***.` | `This text is <strong><em>really important</em></strong>.` | This text is ***really important***. |
| `This text is ___really important___.` | `This text is <strong><em>really important</em></strong>.` | This text is ***really important***. |
| `This is really***very***important text.` | `This is really<strong><em>very</em></strong>important text.` | This is really***very***important text. |

### 最佳实践

Markdown 应用程序在处理单词中间的下划线时并不一致，为兼容考虑，在单词中间加粗或斜体时请使用**星号**。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `Love**is**bold` | `Love__is__bold` |
| `A*cat*meow` | `A_cat_meow` |

---

## 5. 引用语法

在段落前添加一个 `>` 符号即可创建块引用。

```markdown
> Dorothy followed her through many of the beautiful rooms in her castle.
```

渲染效果：

> Dorothy followed her through many of the beautiful rooms in her castle.

### 5.1 多个段落的块引用

在段落之间的空白行也添加一个 `>` 符号。

```markdown
> Dorothy followed her through many of the beautiful rooms in her castle.
>
> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.
```

### 5.2 嵌套块引用

在要嵌套的段落前添加 `>>` 符号。

```markdown
> Dorothy followed her through many of the beautiful rooms in her castle.
>
>> The Witch bade her clean the pots and kettles and sweep the floor and keep the fire fed with wood.
```

### 5.3 带有其它元素的块引用

块引用可以包含其他 Markdown 格式的元素。

```markdown
> #### The quarterly results look great!
>
> - Revenue was off the chart.
> - Profits were higher than ever.
>
> *Everything* is going according to **plan**.
```

---

## 6. 列表语法

可以将多个条目组织成有序或无序列表。

### 6.1 有序列表

在每个列表项前添加数字并紧跟一个英文句点。数字不必按数学顺序排列，但列表应当以数字 1 起始。

```markdown
1. First item
2. Second item
3. Third item
4. Fourth item
```

渲染效果：

1. First item
2. Second item
3. Third item
4. Fourth item

嵌套列表：

```markdown
1. First item
2. Second item
3. Third item
    1. Indented item
    2. Indented item
4. Fourth item
```

### 6.2 无序列表

在每个列表项前面添加破折号 `-`、星号 `*` 或加号 `+`。缩进一个或多个列表项可创建嵌套列表。

```markdown
- First item
- Second item
- Third item
- Fourth item
```

渲染效果：

- First item
- Second item
- Third item
- Fourth item

### 6.3 在列表中嵌套其他元素

要在保留列表连续性的同时添加另一种元素，请将该元素缩进四个空格或一个制表符。

```markdown
* This is the first list item.
* Here's the second list item.

    I need to add another paragraph below the second list item.

* And here's the third list item.
```

还可以嵌套引用块、代码块（缩进八个空格或两个制表符）、图片等。

### 最佳实践

- 有序列表：请只使用句点 `.`，不要用右括号 `)`
- 无序列表：不要在同一个列表中混合使用多种分隔符

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `1. First item` | `1) First item` |
| `- First item`（统一用 `-`） | 混合使用 `+`、`*`、`-` |

---

## 7. 代码语法

要将单词或短语表示为代码，请将其包裹在反引号 `` ` `` 中。

| Markdown 语法 | HTML | 预览效果 |
|---|---|---|
| ``At the command prompt, type `nano`.`` | `At the command prompt, type <code>nano</code>.` | At the command prompt, type `nano`. |

### 7.1 转义反引号

如果要表示为代码的单词或短语中包含一个或多个反引号，则可以通过将单词或短语包裹在双反引号 ` `` ` 中。

```markdown
``Use `code` in your Markdown file.``
```

### 7.2 代码块

要创建代码块，请将代码块的每一行缩进至少四个空格或一个制表符。

```text
    <html>
      <head>
      </head>
    </html>
```

> **提示**：要创建不用缩进的代码块，请使用**围栏式代码块**（用三个反引号 ` ``` ` 包裹），并支持语法高亮。

---

## 8. 分隔线语法

在单独一行上使用三个或多个星号 `***`、破折号 `---` 或下划线 `___`，且不能包含其他内容。

```markdown
---

***

_________________
```

以上三个渲染效果看起来都一样，会生成一条水平分隔线。

### 最佳实践

请在分隔线的前后均添加空白行。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `Try to put a blank line before...`<br>`---`<br>`...and after a horizontal rule.` | `Without blank lines, this would be a heading.`<br>`---`<br>`Don't do this!` |

---

## 9. 链接语法

链接文本放在中括号内，链接地址放在后面的括号中，链接 title 可选。

**语法**：`[超链接显示名](超链接地址 "超链接title")`

```markdown
这是一个链接 [Markdown语法](https://markdown.com.cn "最好的markdown教程")。
```

渲染效果：这是一个链接 [Markdown语法](https://markdown.com.cn/ "最好的markdown教程")。

### 9.1 网址和 Email 地址

使用尖括号可以方便地把 URL 或 email 变成可点击的链接。

```markdown
<https://markdown.com.cn>
<fake@example.com>
```

### 9.2 带格式化的链接

在链接语法前后增加星号可强调链接，在方括号中添加反引号可将链接表示为代码。

```markdown
I love supporting the **[EFF](https://eff.org)**.
This is the *[Markdown Guide](https://www.markdownguide.org)*.
See the section on [`code`](#code).
```

### 9.3 引用类型链接

引用样式链接使 URL 在 Markdown 中更易于显示和阅读，分为两部分：

**第一部分**（与文本保持内联）：

```markdown
[hobbit-hole][1]
```

**第二部分**（放在文档中任意位置）：

```markdown
[1]: https://en.wikipedia.org/wiki/Hobbit#Lifestyle "Hobbit lifestyles"
```

### 最佳实践

URL 中间有空格时，请使用 `%20` 代替。

| ✅ 推荐写法 | ❌ 避免写法 |
|---|---|
| `[link](https://www.example.com/my%20great%20page)` | `[link](https://www.example.com/my great page)` |

---

## 10. 图片语法

使用感叹号 `!`，然后在方括号增加替代文本，图片链接放在圆括号里，括号里的链接后可以增加一个可选的图片标题文本。

**语法**：`![图片alt](图片链接 "图片title")`

```markdown
![这是图片](https://markdown.com.cn/assets/img/philly-magic-garden.jpg "Magic Gardens")
```

### 链接图片

给图片增加链接，请将图片的 Markdown 括在方括号中，然后将链接添加在圆括号中。

```markdown
[![沙漠中的岩石图片](https://markdown.com.cn/assets/img/shiprock.jpg "Shiprock")](https://markdown.com.cn)
```

---

## 11. 转义字符语法

要显示原本用于格式化 Markdown 文档的字符，请在字符前面添加反斜杠 `\`。

```markdown
\* Without the backslash, this would be a bullet in an unordered list.
```

渲染效果：

\* Without the backslash, this would be a bullet in an unordered list.

### 可做转义的字符

| 字符 | 名称 |
|---|---|
| `\` | backslash（反斜杠） |
| `` ` `` | backtick（反引号） |
| `*` | asterisk（星号） |
| `_` | underscore（下划线） |
| `{ }` | curly braces（花括号） |
| `[ ]` | brackets（方括号） |
| `( )` | parentheses（圆括号） |
| `#` | pound sign（井号） |
| `+` | plus sign（加号） |
| `-` | minus sign（减号/连字符） |
| `.` | dot（点） |
| `!` | exclamation mark（感叹号） |
| `|` | pipe（竖线） |

---


## 结语

Markdown 的核心语法就这些——不超过十个标记符号，却能达到「心中无尘，码字入神」的境界，让你**优雅地沉浸式记录，专注内容而不是纠结排版**。

掌握了基本语法后，还可以进一步学习[扩展语法](https://markdown.com.cn/extended-syntax/)（表格、任务列表、脚注、定义列表、删除线、自动链接等），以及使用你喜爱的 Markdown 编辑器高效写作。

> **参考资料**：[markdown.com.cn 基本语法](https://markdown.com.cn/basic-syntax/)
