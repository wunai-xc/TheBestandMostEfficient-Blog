---
title: "Math, Chemistry & Code Blocks Demo"
date: 2026-08-03
draft: false
tags: ["Tutorial", "KaTeX", "Hugo"]
categories: ["Notes"]
summary: "Demonstrates KaTeX math, mhchem chemistry notation, and syntax-highlighted code blocks with copy buttons."
author: "AI"

---

This article demonstrates three new features: **left sidebar post navigation**, **math & chemistry rendering**, and **beautified code blocks with one-click copy**.

## 1. Math Formulas (KaTeX)

KaTeX supports inline and display math modes with standard LaTeX syntax.

### 1.1 Inline Formulas

Use single `$...$` for inline math, e.g. the mass-energy equivalence $E = mc^2$, the quadratic formula $x = \dfrac{-b \pm \sqrt{b^2 - 4ac}}{2a}$, and Euler's identity $e^{i\pi} + 1 = 0$.

Custom number sets: the reals $\RR$, the complexes $\CC$, the integers $\ZZ$.

### 1.2 Display Formulas

Use `$$...$$` for centered, standalone display math.

**Gaussian integral:**

$$
\int_{-\infty}^{+\infty} e^{-x^2} dx = \sqrt{\pi}
$$

**3×3 matrix determinant:**

$$
\begin{vmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{vmatrix}
= a(ei - fh) - b(di - fg) + c(dh - eg)
$$

**Taylor series of $e^x$:**

$$
e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots
$$

---

## 2. Chemistry Notation (mhchem)

Use `\ce{}` inside math delimiters for elegant chemical equations.

### 2.1 Formulas & Ions

Common species: water $\ce{H2O}$, carbon dioxide $\ce{CO2}$, sulfuric acid $\ce{H2SO4}$, ethanol $\ce{C2H5OH}$, glucose $\ce{C6H12O6}$.

Ions: $\ce{Na+}$, $\ce{Ca^2+}$, sulfate $\ce{SO4^2-}$, ammonium $\ce{NH4+}$.

### 2.2 Reaction Equations

**Photosynthesis:**

$$
\ce{6 CO2 + 6 H2O ->[light][chloroplast] C6H12O6 + 6 O2}
$$

**Neutralization:**

$$
\ce{HCl + NaOH -> NaCl + H2O}
$$

**Haber-Bosch (reversible):**

$$
\ce{N2 + 3 H2 <=>[high T, high P][catalyst] 2 NH3}
$$

**Precipitate and gas:**

$$
\ce{AgNO3 + NaCl -> AgCl v + NaNO3}
$$

$$
\ce{Zn + 2 H+ -> Zn^2+ + H2 ^}
$$

### 2.3 Isotopes & Bonding

Isotopes: carbon-14 $\ce{^{14}\_{6}C}$, uranium-235 $\ce{^{235}\_{92}U}$.

Bond order: methane $\ce{CH4}$, ethylene $\ce{H2C=CH2}$, acetylene $\ce{HC#CH}$.

---

## 3. Code Blocks (Highlight + Copy)

All code blocks use Chroma syntax highlighting. Hover the top-right corner to reveal the copy button.

### 3.1 Python

```python
def quicksort(arr):
    """Recursive quicksort implementation."""
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left  = [x for x in arr if x < pivot]
    mid   = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + mid + quicksort(right)

if __name__ == "__main__":
    data = [3, 6, 1, 8, 2, 9, 4, 7, 5]
    print(quicksort(data))
```

### 3.2 JavaScript

```javascript
// Fetch user posts via async/await
async function fetchUserPosts(userId) {
  const base = 'https://jsonplaceholder.typicode.com';
  const resp = await fetch(`${base}/posts?userId=${userId}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

fetchUserPosts(1)
  .then(posts => posts.forEach(p => console.log(p.title)))
  .catch(err  => console.error('Failed:', err));
```

### 3.3 Go

```go
package main

import (
	"fmt"
	"sync"
)

// Concurrent squares using goroutines + WaitGroup
func main() {
	nums := []int{1, 2, 3, 4, 5}
	results := make([]int, len(nums))
	var wg sync.WaitGroup

	for i, v := range nums {
		wg.Add(1)
		go func(i, v int) {
			defer wg.Done()
			results[i] = v * v
		}(i, v)
	}
	wg.Wait()
	fmt.Println("Squares:", results)
}
```

### 3.4 Rust

```rust
// Rust ownership & borrowing demo
fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);
    println!("The length of '{}' is {}.", s1, len);
}

fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope; since it's a borrow, nothing is dropped.
```

### 3.5 Bash

```bash
#!/usr/bin/env bash
# Prefix all .md files in CWD with today's date
DATE=$(date +%Y-%m-%d)
for file in *.md; do
  [ -f "$file" ] || continue
  newname="${DATE}-${file}"
  mv -v "$file" "$newname"
done
```

### 3.6 Inline Code

Inline code is also styled, e.g. set `enableEmoji = true` or call `renderMathInElement(document.body, options)`.

---

## 4. Three-Column Layout

On screens **≥ 1280 px**, the page auto-switches to three columns:

| Column | Content | Description |
|--------|---------|-------------|
| Left   | All posts list | Quick switch, current post highlighted |
| Middle | Article body | Main reading area, fluid width |
| Right  | In-page TOC | Live scroll highlight, click-to-jump |

On smaller screens the layout gracefully falls back to PaperMod's single-column view.

---

## 5. More Headings (TOC Scroll-Spy Test)

Additional headings to demonstrate the right-side TOC scroll-spy behavior.

### 5.1 Section One

Scroll here and watch the TOC highlight update.

### 5.2 Section Two

#### 5.2.1 Sub-section A

Nested headings are indented and highlighted with distinct styling.

#### 5.2.2 Sub-section B

Keep scrolling to observe highlight transitions.

### 5.3 Section Three

### 5.4 Section Four

### 5.5 Wrap-Up

All features demonstrated — push to production when ready 🎉
