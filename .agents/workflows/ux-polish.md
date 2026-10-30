---
name: ux-polish
description: Launch /browser http://localhost:5173, check desktop and mobile viewports, verify zero broken <img> elements (naturalWidth > 0), and test dark/light theme contrast.
tools:
  - run_command
---

# UX Polish & Quality Assurance Workflow (`/ux-polish`)

This workflow launches the live browser environment on `http://localhost:5173`, audits responsive layouts across desktop and mobile viewports, verifies that zero broken `<img>` elements exist in the DOM, and tests dark/light theme contrast and accessibility.

## Workflow Execution Steps

### 1. Launch Browser & Set Viewports
1. Ensure the Vite dev server is running on `http://localhost:5173`.
2. Launch `/browser http://localhost:5173`.
3. Test primary viewport sizes:
   - **Desktop**: 1440 × 900
   - **Mobile**: 390 × 844 (iPhone 14 / modern smartphone)

### 2. Zero-Broken-Image DOM Audit
Run the in-page JavaScript evaluation to ensure all rendered photos have loaded and decoded successfully:
```js
(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  const broken = imgs.filter(img => !img.complete || img.naturalWidth === 0);
  const loaded = imgs.filter(img => img.complete && img.naturalWidth > 0);
  return {
    totalImages: imgs.length,
    loadedImages: loaded.length,
    brokenImages: broken.length,
    brokenSources: broken.map(img => img.src)
  };
})();
```
**Acceptance Criteria**: `brokenImages === 0`.

### 3. Theme Contrast & Visual Validation
1. Verify dark theme (`dark` class on root/html):
   - Background: Deep slate/obsidian (`#0B0F0E`, `#121917`).
   - Text: Off-white/cream (`#F4F1EA`, slate-100/200).
   - Accents: Emerald (`#10B981`) and Amber (`#F59E0B`).
   - Check contrast ratio against WCAG AA requirements (minimum 4.5:1 for normal text).
2. Switch to light theme and verify readability of taxonomy cards, botanical shimmer skeletons, and IUCN badges.

### 4. Interactive Surface Verification
1. Click on an animal card to trigger `AnimalProfileModal.tsx`. Confirm hero image and related taxa thumbnails load crisp photos.
2. Add 2+ animals to the comparison drawer and open `ComparisonMatrix.tsx`. Confirm comparison cards render with no layout shifting.
3. Switch view mode to Ledger in `ExploreSection.tsx` and scroll virtualized rows to confirm thumbnails load smoothly.
