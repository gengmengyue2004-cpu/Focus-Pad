<img width="2048" height="2732" alt="4" src="https://github.com/user-attachments/assets/2ada9000-22a1-4ca4-b2f6-365339484b98" />
# Focus Pad

Focus Pad 是一款为拖延症用户设计的轻量桌面专注组件，通过可视化注意力曲线、最小专注时长和三任务管理，帮助用户降低开始门槛、进入专注状态，并自动记录任务完成情况与专注时间。

Focus Pad is a quiet desktop productivity widget designed to make starting easier.

- 桌面端：Electron 悬浮小组件 + 陪伴窗口（Windows x64）
- 白天有太阳，入夜有月亮，随真实时间与月相自动切换
- 支持专注曲线自定义、任务专注、专注历史留存
- 网页版：交互展示站，无需安装即可体验核心交互

## 在线体验

- 交互展示页：<https://gengmengyue2004-cpu.github.io/Focus-Pad/>
- 应用交互预览：<https://gengmengyue2004-cpu.github.io/Focus-Pad/source/app/index.html>

## 下载

Windows x64 安装包（v2.0.8，约 107 MB）：

<https://github.com/gengmengyue2004-cpu/Focus-Pad/releases/latest>

## Run locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm start
```

## Project structure

- `main.js` creates the Electron desktop window.
- `preload.js` exposes a small bridge API to the renderer.
- `app/index.html` contains the app markup.
- `app.js`, `styles.css`, `task-queue.js`, `task-history.js`, and `window-size.js` contain the widget UI and behavior.
- `night.js` / `companion.js` / `companion-core.js` handle the day-night theme and the moon companion view.
- `compact-editor.js` / `widget-panels.css` implement the compact rhythm editor.
- `guide-demo/` is a standalone web preview of the onboarding flow.
- `smoke-runner.js` runs UI regression checks against the packaged app.

## Publishing note

Do not commit the installed app folder or the `.runtime/` Electron bundle. They contain Electron/Chromium runtime binaries, including files larger than GitHub's normal file-size limit. The Windows installer is distributed as a release asset instead.

## License

MIT
