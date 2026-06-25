# AGENTS.md instructions for /Users/uncle/github/FeHelper

## UI Taste Gate

- For any FeHelper extension UI, popup, options page, devtools surface, website, landing page, or other Web UI implementation/redesign, use the project-local `design-taste-frontend` skill first.
- Skill path: `.agents/skills/design-taste-frontend/SKILL.md`.
- Treat `design-taste-frontend` / `taste-skill` as the default quality gate for FeHelper product tone. Any future code change that affects visible UI, interaction polish, layout density, or cross-tool consistency should explicitly apply this skill before editing.
- Treat this skill as the aesthetic decision gate: infer the design read, set the variance/motion/density dials, then choose the design system or visual language before editing UI code.
- Apply the skill pragmatically for FeHelper: preserve browser extension constraints, accessibility, performance, bundle size, and existing repo conventions ahead of decorative motion or unnecessary dependencies.
- Before finishing UI work, run the relevant build/lint/tests and use browser or screenshot QA when the changed surface can be exercised locally.

## Chrome Extension Context

- Treat every FeHelper `apps/*` tool page, popup, options page, devtools page, and content-script surface as part of a Chrome extension, not as a generic standalone website.
- Before changing a tool page, identify the tool's actual user job, entry path, runtime APIs, permissions, asset-loading path, and whether it runs as `chrome-extension://`, injected content script, popup, options page, or devtools UI.
- Preserve extension constraints while coding: Chrome extension CSP, `chrome.runtime` APIs, packaged relative assets, offline/local execution, bundle size, browser compatibility, and permissions boundaries.
- Validation should match the surface. For extension pages, prefer `npm run build` plus loading/testing the built unpacked extension output in Chrome, or an extension-equivalent browser QA path. A plain localhost/static-server run is useful for fast layout checks only and should not be the only proof when Chrome extension APIs, asset paths, permissions, or CSP matter.
- When a test uses stubs for `chrome.*` APIs, state that it is a supplemental local harness and still verify the affected extension behavior in the corresponding extension context when the change depends on those APIs.
