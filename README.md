<img width="2048" height="2732" alt="1" src="https://github.com/user-attachments/assets/af09fad9-8016-4a0c-8f61-2ca3cb1168e1" />
# Focus Pad

Focus Pad 是一款为拖延症用户设计的轻量桌面专注组件，通过可视化注意力曲线、最小专注时长和三任务管理，帮助用户降低开始门槛、进入专注状态，并自动记录任务完成情况与专注时间。

Focus Pad is a quiet desktop productivity widget designed to make starting easier.

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

## Publishing note

This repository contains the app source extracted from the installed Electron app package:

```text
C:\Users\梦月\AppData\Local\Programs\Focus Pad\resources\app.asar
```

Do not publish the installed app folder directly. It contains Electron/Chromium runtime binaries, including files larger than GitHub's normal file-size limit.

## License

Choose a license before publishing this repository as open source.
