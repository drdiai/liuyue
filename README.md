# 小学数学 · liuyue

北师大版 5/6 年级数学 · 单元复习 / 期末复习 / 错题周周清 一页纸合集

部署: GitHub Pages · https://www.drdongai.com/liuyue/

## 目录约定

每个小学数学一页纸放在 `onepage-<slug>/index.html`,slug 命名:
- 单元复习: `onepage-position-u6` / `onepage-equation-u7` / `onepage-statistical-charts`
- 期末复习: `onepage-final-exam-g5-2026spring` / `onepage-final-keypoints-glass-g5-2026spring`
- 错题周周清: `onepage-grade5-class5-error-test` / `onepage-grade5-error-test`

## 添加新一页纸流程

1. 写 HTML 到 `onepage-<slug>/index.html`(单文件,内联 CSS,无外部依赖)
2. `vision_analyze` 截图验证渲染
3. 在 `index.html` 导航页的 ul.day-items 里追加 `<li><a href="onepage-<slug>/">...<span class="badge">NEW</span></a></li>`
4. `git add` 精确提交:
   ```bash
   cd ~/liuyue
   git add index.html onepage-<new>/
   git status  # 确认只有这 2 条路径
   git commit -m "feat: add onepage-<topic> (标题 · 一页纸)"
   git push
   ```

## 相关仓库

- `xingbod/auto` — 教学 slides 与其他 onepage 合集 (https://www.drdongai.com/auto/)
- `xingbod/liuyue` — **本仓库** · 小学数学专用
