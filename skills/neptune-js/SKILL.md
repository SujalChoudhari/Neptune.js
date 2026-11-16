---
name: neptune-js
description: Continue Sujal's Neptune.js engine, Triton editor and Emberfall ARPG work with project preferences, past mistakes, verified workflows and parallel TODO execution. Use for Neptune.js development or an explicit request to resume this project.
---

# Neptune.js

Resume the actual repository state rather than asking Sujal to repeat the project. On this machine the checkout is `D:/Software/Neptune.js`, remote `https://github.com/SujalChoudhari/Neptune.js`. Locate the checkout if it moves. Read its current `AGENTS.md`, README TODOs, `docs/ROADMAP.md`, git status and recent commits first; read [project-context.md](references/project-context.md) for prior decisions and mistakes. Treat dated notes as historical evidence, not a guarantee the current tree passes.

## Product and collaboration

Finish the existing 2D entity-component engine and Triton editor, demonstrated by a real playable ARPG. No 3D until that works. Preserve Entity/components/children, Transform, Scene/SceneManager and Behaviour composition. Keep game content in projects and native/editor dependencies out of runtime.

When Sujal says to go work, choose useful unfinished TODOs from the ordered roadmap and implement a bounded batch. He explicitly prefers several independent issues handled by subagents, but asks for cheaper models and strong scoped prompts to preserve his usage allowance. Prefer the available economical model (currently gpt-6-luna) for bounded implementation, documentation and test tasks; start with concise context, exact file ownership, acceptance checks and a stopping point. Use higher-cost delegation only when complexity warrants it. Keep integration and end-to-end verification with the primary agent, and do not let agents overwrite each other. Avoid redundant audits and repeated broad test runs without a new reason. If delegation is unavailable, proceed sequentially. Finish small useful tasks alongside a larger task without expanding into speculative subsystems.

Give brief progress and concrete results. Avoid repeated permission questions, prolonged analysis, fake working controls and declarations of completion without interaction evidence. Current instructions and authorization govern remote changes; this skill alone does not authorize publishing, releasing or sending messages. When asked to push, integrate the tested changes into `main` as requested, not merely a feature branch; inspect remote divergence and preserve others' work.

## Visual contract

Sujal wants **modern dark neumorphism with compact desktop-editor density**. Inspect [the visual reference](assets/dark-neumorphic-reference.png) when changing appearance. Preserve raised beveled buttons, inset fields, subtle gradients and light/dark shadow pairs. Improve contrast, spacing, colors, corners and interaction states without flattening or replacing that style. The reference conveys material/depth, not oversized music-player layout or circular buttons everywhere. Small viewport icon buttons are 24px squares; size other controls to their purpose and label. Keep usable hit areas, clear focus/active/disabled states and readable scene content.

## Verify and preserve context

Use the repository's current verification commands and platform instructions. Real browser interactions matter; native-command stubs cannot establish native persistence. Never claim full transform support, engine completeness or benchmark results from narrower tests. Keep unchecked blockers visible.

At a meaningful handoff, update the roadmap and [project-context.md](references/project-context.md) with dated implemented behavior, evidence, remaining limitations and any new user correction. Distinguish preferences, historical bugs and current blockers. Keep this skill focused; the repo owns the backlog. If installed globally, synchronize this project's updated skill files to the installed copy after validation. This is durable written context, not automatic access to every previous chat.
