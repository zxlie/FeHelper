# FeHelper - Frontend Helper

<div align="center">

![FeHelper Logo](https://user-images.githubusercontent.com/865735/75407628-7399c580-594e-11ea-8ef2-00adf39d61a8.jpg)

**30+ developer tools | Chrome / Edge / Firefox browser extension**

[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pkgccpejnmalmdinmhkkfafefagiiiad?label=Chrome&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/pkgccpejnmalmdinmhkkfafefagiiiad?label=Users&logo=googlechrome&color=3b82f6&style=for-the-badge)](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad)
[![GitHub Stars](https://img.shields.io/github/stars/zxlie/FeHelper?style=for-the-badge&color=8b5cf6&logo=github)](https://github.com/zxlie/FeHelper)
[![History](https://img.shields.io/badge/since-2012-f59e0b?style=for-the-badge&logo=calendar&logoColor=white)](https://github.com/zxlie/FeHelper)
[![CI](https://img.shields.io/github/actions/workflow/status/zxlie/FeHelper/ci.yml?style=for-the-badge&label=CI&logo=githubactions&logoColor=white)](https://github.com/zxlie/FeHelper/actions)

**[中文](README.md) | [日本語](README_JA.md) | [한국어](README_KO.md)**

[Website](https://fehelper.com) · [Online docs](https://fehelper.com/docs.html) · [Feedback](https://github.com/zxlie/FeHelper/issues)

</div>

---

## Feature overview

### JSON
| Feature | Description |
|---------|-------------|
| JSON formatter | Auto/manual format, syntax highlighting, fold/unfold, node path, lossless BigInt precision |
| JSON diff | Structured diff between two JSON documents with highlighted differences |
| JSON to Excel | One-click export of JSON data to Excel |

### Encode/Decode
| Feature | Description |
|---------|-------------|
| Unicode | Chinese ↔ `\uXXXX` conversion |
| URL / UTF-8 / UTF-16 | `%XX` / `\xXX` encode and decode |
| Base64 | Encode and decode |
| Hex | String ↔ hexadecimal |
| MD5 / SHA1 | Digest |
| Gzip | Compress/decompress via CompressionStream API |
| JWT | Decode Header + Payload + Sign |
| Cookie | Format as JSON |
| HTML entities | Normal/deep encode and decode |
| String escaping | Escape/unescape `\n` `\t` `\"`, etc. |

### Development & debugging
| Feature | Description |
|---------|-------------|
| Code beautifier | Format JavaScript / CSS / HTML / XML / SQL |
| Code minify | Minify HTML / JS / CSS |
| Regular expressions | Live match and replace |
| Simple Postman | GET / POST / HEAD API debugging |
| WebSocket | Connection testing and message analysis |
| Userscript | Page script injection |

### Converters
| Feature | Description |
|---------|-------------|
| Timestamp | Unix ↔ date, multi-timezone world clock, Windows FILETIME conversion |
| Radix conversion | Base 2/4/8/10/16 with BigInt for large integers without loss |
| Color | HEX / RGB / HSL / HSV with alpha |

### Images & generation
| Feature | Description |
|---------|-------------|
| QR code | Generate (optional logo, colors, size) and scan/decode |
| Barcode | Code128 / Code39 / EAN-13 / EAN-8 / UPC / ITF-14 |
| UUID / ID generator | UUID v4, Snowflake ID (generate + parse), NanoID |
| Image Base64 | Image ↔ Base64 |
| Page screenshot | Viewport / full-page scrolling capture |
| Color picker | Pick colors from any element |
| SVG conversion | SVG ↔ PNG and other formats |

### Other tools
| Feature | Description |
|---------|-------------|
| AI assistant | Code optimization, design, research |
| Mock data | Names, phones, IDs, addresses, etc. |
| Random password | Length and character sets |
| Sticky notes | Categories, import/export |
| Markdown | HTML → Markdown, PDF download |
| Poster | Multi-template posters |
| Charts | Multiple chart types and visualization |
| Page performance | Load timing analysis |

---

## Recent updates

### v2026.04 — major improvements

**New**
- Barcode generation (Code128 / EAN-13 / UPC and six formats)
- UUID v4 / Snowflake ID / NanoID generator (new tool page)
- Windows FILETIME ↔ date conversion
- String escape/unescape encode/decode
- Radix conversion BigInt support (large integers without loss)

**Security**
- Replaced project-wide `evalCore` dynamic execution with safer approaches
- Fixed Toast / innerHTML XSS
- Improved Content Script injection (`insertCSS` instead of misused APIs)
- `_codeBeautify` `fileType` allowlist validation

**Fixes**
- Lossless JSON BigInt handling (pure module `json-utils.js`)
- Service Worker sleep (`chrome.alarms` instead of `setTimeout`)
- Content Script: `document_idle` + `all_frames: false` to fix crashes on sites like Google Meet
- Timestamp `0` validation
- Code beautifier `let`/`const` compatibility

**Engineering**
- Unit tests: Vitest + 79 cases
- CI/CD: GitHub Actions
- ESLint
- Removed dead dependencies and code
- Babel target Chrome 58 → 100

---

## Installation

### Browser stores (recommended)

| Browser | Install |
|---------|---------|
| Chrome | [Chrome Web Store](https://chrome.google.com/webstore/detail/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Edge | [Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/fehelper%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/pkgccpejnmalmdinmhkkfafefagiiiad) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fehelper-%E5%89%8D%E7%AB%AF%E5%8A%A9%E6%89%8B/) |

### From source

```bash
git clone https://github.com/zxlie/FeHelper.git
cd FeHelper
npm install
npm test        # run tests
```

Open `chrome://extensions/` → Developer mode → Load unpacked → select the `apps` directory.

### Offline install

Download CRX or ZIP from [Chrome-Stats](https://chrome-stats.com/d/pkgccpejnmalmdinmhkkfafefagiiiad) and drag onto `chrome://extensions/`.

---

## Development

```bash
npm install          # dependencies
npm test             # Vitest unit tests
npm run test:watch   # watch mode
npm run test:coverage # coverage
npx eslint apps/     # lint
```

### Project layout

```
FeHelper/
├── apps/                    # Extension source
│   ├── manifest.json        # Chrome Extension MV3 manifest
│   ├── background/          # Service Worker
│   ├── popup/               # Popup
│   ├── options/             # Settings + tool marketplace
│   ├── json-format/         # JSON formatter
│   ├── en-decode/           # Encode/decode
│   ├── timestamp/           # Timestamp
│   ├── trans-radix/         # Radix conversion
│   ├── qr-code/             # QR code + barcode
│   ├── uuid-gen/            # UUID / Snowflake ID
│   ├── code-beautify/       # Code beautifier
│   └── ...                  # More tools
├── test/                    # Vitest tests
├── .github/workflows/       # CI/CD
├── vitest.config.js
├── eslint.config.js
└── package.json
```

### Contributing

1. Fork the repo
2. Branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'Add some feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## Contact

- Website: [fehelper.com](https://fehelper.com)
- Email: xianliezhao@foxmail.com
- WeChat: 398824681
- Issues: [GitHub Issues](https://github.com/zxlie/FeHelper/issues)

## License

[MIT License](LICENSE)

---

<div align="center">

**If FeHelper helps you, please give it a Star!**

[![Star History Chart](https://api.star-history.com/svg?repos=zxlie/FeHelper&type=Date)](https://star-history.com/#zxlie/FeHelper&Date)

</div>
