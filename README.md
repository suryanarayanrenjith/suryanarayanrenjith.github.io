<div align="center">

# <img src="static/logo.svg" alt="SR Logo" width="38" style="vertical-align: text-bottom; margin-right: 4px;"> Surya Website

[![Uptime](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/suryanarayanrenjith/suryanarayanrenjith/main/.github/status.json&style=flat-square&label=Website%20Uptime)](https://surya.is-a.dev)
[![Bundled & Minified with Vite](https://img.shields.io/badge/Bundled_&_Minified_with-Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: Custom (All Rights Reserved)](https://img.shields.io/badge/License-Custom_(All_Rights_Reserved)-red?style=flat-square)](LICENSE)

*Welcome to my awesome website! This repository hosts the source code for my portfolio website hosted on GitHub Pages.*

<br>
<img src="static/Screenshot.png" alt="Website Screenshot" width="800" style="border-radius: 8px;">

</div>

---

## <img src="static/icon-description.svg" alt="Description" width="30" style="vertical-align: text-bottom; margin-right: 4px;"> Description

This website showcases my projects, social media links, and my skills. Feel free to contact me if you have any questions or feedback!

## <img src="static/icon-building.svg" alt="Building" width="30" style="vertical-align: text-bottom; margin-right: 4px;"> Building

This project is configured strictly for **production builds only** - there is no dev server, no preview, and no test mode (blocked natively). A custom Vite configuration aggressively bundles, minifies (using proprietary plugins for HTML, CSS verbatim mapping, and internal branding), and content-hashes the website source from `src/` into a highly-optimized `dist/` directory that GitHub Actions deploys to GitHub Pages.

### Prerequisites

- **Node.js** `20+`
- **npm** `10+`

### Commands

| Command | Description |
|:---|:---|
| `npm install` | **One-time** - installs Vite and the build dependencies |
| `npm run validate` | Validates the HTML structure |
| `npm run build` | Builds the site into `./dist` |
| `npm run clean` | Removes the `dist/` directory |

### Project layout

```text
.
├── src/                  ← website source (HTML, JS, CSS, assets)
├── scripts/              ← build tooling
├── static/               ← static files
├── dist/                 ← build output
├── vite.config.js        ← Vite build config
├── package.json          ← project metadata and scripts
├── README.md             ← this file
└── LICENSE               ← license terms
```

## <img src="static/icon-license.svg" alt="License" width="30" style="vertical-align: text-bottom; margin-right: 4px;"> License

This project is licensed under a custom **All Rights Reserved License**.

> ⛔ **WARNING**  
> You may not copy, modify, redistribute, or use the code in any way without explicit written permission from the copyright holder!

See the [LICENSE](LICENSE) file for full terms and details.

