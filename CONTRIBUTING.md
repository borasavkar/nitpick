# Contributing to NitPick

Thanks for helping make monitors look better for everyone!

## Ways to help

- **Report bugs.** Include your OS, monitor model, resolution, scaling and refresh rate.
- **Improve advice.** Monitor menus use many different names for the same setting. If the advice didn't match your monitor, tell us what your menu calls it.
- **Add test patterns.** Patterns live in `src/patterns/`. Drawing code goes in `draw.ts`; registration and instructions go in `index.tsx`.
- **Translate.** NitPick ships in English and Turkish. Every text is an `{ en, tr }` object next to the code that uses it (see `src/i18n.tsx`); to add a language, add its code to `Lang` and fill in the new key everywhere TypeScript asks for it.

## Development setup

1. Install [Node.js](https://nodejs.org/) 20+, [Rust](https://rustup.rs/) and the [Tauri prerequisites](https://tauri.app/start/prerequisites/).
2. `npm install`
3. `npm run tauri dev` for the desktop app, or `npm run dev` for the web version.

Before opening a pull request, make sure this passes:

```bash
npm run build
```

## Guidelines

- Keep the UI simple and the wording plain. NitPick is for everyone, not just display enthusiasts.
- Patterns must stay pixel-exact: draw in physical pixels via `PixelCanvas` and avoid anti-aliased edges in line patterns.
- Keep the app chrome neutral gray. Colored UI next to a pattern skews what people see.
- One feature or fix per pull request, with a short description of what changed and why.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
