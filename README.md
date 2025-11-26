# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Recent Codebase Refinements

I reviewed and polished the codebase with focused, low-risk changes (Dev-friendly) including:

- Replaced production console.log usage with debug-only logging (using `import.meta.env.DEV`).
- Improved accessibility: added `alt` for images, `aria-label` for interactive elements, and explicit `type="button"` on non-submit buttons.
- Fixed React hook dependency warnings and potential audio ref bugs by copying `audioRefs.current` inside effects and ensuring cleanup logic.
- Added `loading="lazy"` to large images and cleaned up audio ref lifecycle in grid and detail views.
- Removed duplicate or stray JSX issues and fixed lint errors.
- Added `lint:fix` script to `package.json` for convenience.

### Next Suggestions
- Implement the `Save` functionality in `App.jsx` (TODO remains).
- Add more unit/integration tests, especially around audio sync and upload flows.
- Add Prettier and a pre-commit hook (lint-staged) to maintain consistency.
- Consider migrating to TypeScript for better developer ergonomics.
