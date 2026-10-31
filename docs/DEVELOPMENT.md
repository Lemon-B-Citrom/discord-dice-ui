# Development Guide

## Getting started

### Requirements and installation

- Node.js `>=24.22.1 <25`
- npm `>=11.19.1 <12` (bundled with the required Node.js release)

Install the locked dependencies with:

```bash
npm ci
```

Use the same commands on Windows 10 and Debian 12. The Node-based launcher in [`scripts/react-scripts-wrapper.js`](../scripts/react-scripts-wrapper.js) scopes the legacy OpenSSL workaround to the CRA development and build processes.

### Run and build

```bash
npm run dev       # Development server at http://localhost:3000
npm run build     # Create production build
npm start         # Serve the production build
```

## Project structure and architecture

- [`src/index.tsx`](../src/index.tsx) mounts the app; [`src/App.tsx`](../src/App.tsx) selects the active mode, renders its builder, and includes the modal and local-storage managers.
- [`src/actions/`](../src/actions) contains Redux action creators, [`src/reducers/`](../src/reducers) contains Redux reducers, and [`src/middleware/`](../src/middleware) contains roll processing and side effects. [`src/store.ts`](../src/store.ts) combines the reducers and registers middleware.
- State is hybrid, not exclusively Redux: the app uses Redux, `redux-form`, Zustand stores, and local React state. Relevant Zustand stores include [`src/components/DiceModuleOptions/store.ts`](../src/components/DiceModuleOptions/store.ts) (mode and dice options), [`src/components/CombatTracker/store.ts`](../src/components/CombatTracker/store.ts), [`src/components/XCard/store.ts`](../src/components/XCard/store.ts), and stores for Wrath & Glory and The One Ring. Check the owning feature before choosing where new state belongs.
- [`src/components/`](../src/components) contains dice builders, forms, and modals. [`src/consts/`](../src/consts) contains dice definitions and system data; [`src/utils/`](../src/utils) contains shared helpers.
- [`src/components/LocalStorageManager/LocalStorageManager.tsx`](../src/components/LocalStorageManager/LocalStorageManager.tsx) hydrates Call of Cthulhu sheet skills and attributes into Redux on mount. It does not automatically save Redux state. Other features have separate persistence helpers/stores.

## Common development tasks

### Add a standard die

Standard die identifiers are exported constants such as `D10` from [`src/consts/diceConstants.ts`](../src/consts/diceConstants.ts). Dice sets in [`src/consts/diceSets.ts`](../src/consts/diceSets.ts) are arrays of entries such as `{ diceType, label }`, not a map with a `faces` property. Add a constant and add an entry to the applicable set (for example, `commonDice` if it belongs in the common set). If the die uses an image, place its asset in `src/img/`; the dice component loads image names dynamically with `require`.

### Add a game system or mode

Treat the existing system implementations as the source of truth; integration differs by mode. First decide whether the system fits the shared tile-based `DiceModule`/pool-builder flow or needs a dedicated pool-builder component. A dedicated builder is not just a new dice set.

For a mode integrated with the shared dice module, use this checklist and compare the closest existing system:

1. Add/register the mode in the Zustand mode store and its radio control in [`src/components/DiceModuleOptions/DiceModuleForm.tsx`](../src/components/DiceModuleOptions/DiceModuleForm.tsx).
2. Define dice constants and a dice-set array. Add the mode/dice-set lookup where the component selects a set, using [`src/utils/getDiceSet.ts`](../src/utils/getDiceSet.ts) where appropriate.
3. Update [`src/App.tsx`](../src/App.tsx) if the mode requires its own builder or conditional rendering.
4. Follow the flow from the UI's `handleRoll` into the relevant action and middleware. Register middleware in [`src/store.ts`](../src/store.ts), and add or update reducers/reducer registration only when the feature needs Redux state.
5. Add a modal through the existing action/reducer pattern and register its component in [`src/components/Modals/Modals.tsx`](../src/components/Modals/Modals.tsx), if the feature uses a modal.

Use the actual feature's action and payload shapes rather than copying a generic implementation: those shapes and rendering paths vary across systems.

### Add result messages

Message middleware is feature-specific. The general message path uses the `localMsgReady` and `requestMsgReady` actions from [`src/actions/roll.actions.ts`](../src/actions/roll.actions.ts). Request messages are webhook embed data (for example, `msgTitle`, `description`, `color`, and `fields`), not a plain text string. Follow the matching message-generation middleware and Discord sender for the feature. Some systems display results in dedicated result modals and do not need local-message middleware; add message paths only when the feature requires them.

## Debugging

Use browser React DevTools to inspect components and their props/state. Redux DevTools extension integration is not configured in [`src/store.ts`](../src/store.ts). For middleware debugging, temporary logging can inspect `action.type` and `store.getState()`; remove unnecessary logs before committing.

## Testing

Run the test suite interactively with `npm test`, or once without watch mode with:

```bash
npm test -- --watchAll=false
```

The project uses React Testing Library 9 and Jest. JSX examples must import React for the configured classic JSX transform:

```tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("handles a click", () => {
  const { getByText } = render(<MyComponent />);
  fireEvent.click(getByText("Click Me"));
});
```

Use the query and render APIs available in the installed Testing Library version; do not assume `screen` or `redux-mock-store` is available. The scaffold in [`src/App.test.tsx`](../src/App.test.tsx) is stale: it expects the removed Create React App “learn react” content and renders `App` without the Redux Provider required by the application. Treat it as an outdated scaffold, not a working app-level example; this guide does not modify it.

## Code style and useful commands

- Format files with `npm run prettier` (the script runs Prettier across the repository).
- ESLint is configured through `react-scripts` with the `react-app` preset.
- TypeScript strict mode is enabled, but this legacy codebase also contains `// @ts-nocheck` and `// @ts-ignore` suppressions. Do not interpret a clean check as evidence that every file is fully type-checked.
- `getSuccessLevels.ts` handles Call of Cthulhu success levels; Warhammer uses `getWarhammerSuccessLevels.ts`.
- [`src/selectors/l5rSelectors.ts`](../src/selectors/l5rSelectors.ts) contains plain, unmemoized helpers. `reselect` is not an installed dependency; do not rely on it without deliberately adding and integrating it.

```bash
npm run prettier
npx tsc --noEmit
npm test -- --watchAll=false
```

## Resources

- [React documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Redux documentation](https://redux.js.org/)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [random-js](https://github.com/ckknight/random-js)
