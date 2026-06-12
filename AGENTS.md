# AGENTS.md instructions for /Users/uncle/github/FeHelper

## UI Taste Gate

- For any FeHelper extension UI, popup, options page, devtools surface, website, landing page, or other Web UI implementation/redesign, use the project-local `design-taste-frontend` skill first.
- Skill path: `.agents/skills/design-taste-frontend/SKILL.md`.
- Treat `design-taste-frontend` / `taste-skill` as the default quality gate for FeHelper product tone. Any future code change that affects visible UI, interaction polish, layout density, or cross-tool consistency should explicitly apply this skill before editing.
- Treat this skill as the aesthetic decision gate: infer the design read, set the variance/motion/density dials, then choose the design system or visual language before editing UI code.
- Apply the skill pragmatically for FeHelper: preserve browser extension constraints, accessibility, performance, bundle size, and existing repo conventions ahead of decorative motion or unnecessary dependencies.
- Before finishing UI work, run the relevant build/lint/tests and use browser or screenshot QA when the changed surface can be exercised locally.
