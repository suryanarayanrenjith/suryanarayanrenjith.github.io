## Website

🌐 Welcome to my awesome website! This repository hosts the source code for my portfolio website hosted on GitHub Pages.

## Description

📝 This website showcases my projects, social media links and my skills. Feel free to contact me if you have any questions or feedback!

## Building

🛠️ This project is configured for **production builds only** - there is no dev server, no preview, and no test mode. Vite bundles, minifies, and content-hashes the website source from `src/` into a `dist/` directory that GitHub Actions deploys to GitHub Pages.

### Prerequisites

- Node.js **20+**
- npm 10+

### Commands

```bash
npm install        # one-time — installs Vite and the build dependencies
npm run build     # builds the site into ./dist
npm run clean     # removes the dist/ directory
```

### Project layout

```
.
├── src/                  ← website source (HTML, JS, CSS, sub-routes, assets)
├── scripts/              ← build tooling (clean / refusal scripts)
├── vite.config.js        ← Vite build config
├── package.json
├── README.md
├── LICENSE
├── static/Screenshot.png ← README screenshot only
└── dist/                 ← build output (gitignored, deployed by Pages)
```

## License

🔒 This project is licensed under a custom **All Rights Reserved License**.

⛔ You may not copy, modify, redistribute, or use the code in any way without explicit written permission from the copyright holder!

See the [LICENSE](LICENSE) file for full terms and details.

## Screenshot

![Screenshot](static/Screenshot.png)

## Website Uptime

[![Uptime](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/suryanarayanrenjith/suryanarayanrenjith/main/.github/status.json&label=Website%20Uptime)](https://surya.is-a.dev)
