# Architecture

## Overview

Discord Dice UI is a React and TypeScript single-page application. It supports several tabletop game systems and can send roll results to a Discord webhook. The application runs client-side. It uses mode-based rendering, not URL routing.

## Core technologies

- React and TypeScript provide the UI and application code.
- Redux manages shared application state and middleware workflows. `redux-form` stores form state in Redux.
- Five Zustand stores manage feature state: DiceModuleOptions, Combat Tracker, Wrath & Glory, The One Ring, and XCard.
- Some components also use local React state.
- `random-js` provides a non-cryptographic pseudorandom number generator (PRNG). [`src/utils/getRandom.ts`](../src/utils/getRandom.ts) seeds its Mersenne Twister with [`autoSeed()`](../src/utils/getRandom.ts:10).

## State and data flow

Redux state includes modal state, game-specific data, user settings, the last-roll options, and the reroll count. It does not keep a roll history. Redux also contains the `redux-form` state.

Zustand stores hold feature state beyond form state. For example, the Combat Tracker store persists its data to localStorage, and Wrath & Glory keeps and updates roll results locally. The DiceModuleOptions store holds the selected mode and dice options. Components use local React state for some UI details.

The application persists these data in localStorage where the corresponding code supports it:

- Combat Tracker state
- Cthulhu character-sheet skills and attributes
- User settings
- Selected mode
- Warhammer success-level mode

The main roll flow is:

1. A component dispatches a roll submission action.
2. [`handleRoll`](../src/middleware/handleRoll.middleware.ts:55) routes the action. It can request a calculation, open a modal, or invoke a Zustand feature directly.
3. Roll-request middleware performs calculations and dispatches result actions. Some Zustand features calculate locally and use Redux only to request a Discord message.
4. Message middleware builds local or Discord output. The send middleware posts the Discord embed when a webhook is configured.

## Middleware and output

[`src/store.ts`](../src/store.ts) registers the middleware chain. It includes general and game-specific roll, result, message, and send middleware.

- [`src/middleware/handleRoll.middleware.ts`](../src/middleware/handleRoll.middleware.ts) routes submitted rolls and opens the required modals. It is not the general calculation layer.
- Roll-request middleware performs calculations. Examples include [`src/middleware/rollRequested.middleware.ts`](../src/middleware/rollRequested.middleware.ts) and game-specific request middleware.
- [`src/middleware/getMsg/getLocalMsg.middleware.tsx`](../src/middleware/getMsg/getLocalMsg.middleware.tsx) builds local output as React/JSX data.
- [`src/middleware/getMsg/getRequestMsg.middleware.ts`](../src/middleware/getMsg/getRequestMsg.middleware.ts) builds Discord embed data, not plain text.
- [`src/middleware/sendRequestMsg.middleware.ts`](../src/middleware/sendRequestMsg.middleware.ts) sends the embed payload as JSON to the configured webhook.

Local output uses React elements and styling. Discord output uses an embed payload with `title`, `description`, `color`, and `fields`, with Discord formatting in its text. The optional `q` query parameter supplies the webhook ID/token suffix, not a full webhook URL. Other query values can set the initial mode, username, and Warhammer success-level mode.

## Components and modules

[`src/App.tsx`](../src/App.tsx) renders components under [`src/components/`](../src/components/). Both legacy containers that use [`connect()`](../src/components/ConanModal/ConanModalContainer.tsx:24) and components that use Redux hooks are present. Components can also read Zustand stores and local React state.

Actions are split between [`src/actions.ts`](../src/actions.ts) and files under [`src/actions/`](../src/actions/). The files are not all game-specific, and the repository does not apply one strong typing pattern to every action. Reducers are combined in [`src/reducers/index.ts`](../src/reducers/index.ts). [`src/selectors/l5rSelectors.ts`](../src/selectors/l5rSelectors.ts) is the only selector module; its selectors are not memoized.

## Tests

The repository has focused unit and integration tests, especially for Warhammer damage workflows and related utilities. It also has sparse legacy test coverage. Tests use the React Scripts/Jest setup and React Testing Library.

## Build

[`package.json`](../package.json) declares Node `>=24.22.1 <25` and npm `>=11.19.1 <12`. The development and production scripts call [`scripts/react-scripts-wrapper.js`](../scripts/react-scripts-wrapper.js), which invokes the corresponding React Scripts entry point.

The wrapper sets `GENERATE_SOURCEMAP=false`. For Node 17 or later, it adds `--openssl-legacy-provider` to `NODE_OPTIONS` for the child process when that option is not already present. This works around the OpenSSL compatibility issue between the project's React Scripts 3/Webpack 4 toolchain and newer Node versions. The wrapper does not change the environment of the parent process.

## Extension checklist

When adding a mode or feature, check the relevant central wiring points:

- Add a mode option in [`src/components/DiceModuleOptions/DiceModuleForm.tsx`](../src/components/DiceModuleOptions/DiceModuleForm.tsx) and its mode data in the DiceModuleOptions store.
- Add mode-based rendering in [`src/App.tsx`](../src/App.tsx).
- Define or update dice sets through [`getDiceSet`](../src/utils/getDiceSet.ts) and the dice-set definitions.
- Route roll submissions in [`src/middleware/handleRoll.middleware.ts`](../src/middleware/handleRoll.middleware.ts) and implement calculations in the appropriate roll-request middleware.
- Register middleware in [`src/store.ts`](../src/store.ts) and reducers in [`src/reducers/index.ts`](../src/reducers/index.ts) when needed.
- Register new modal components in [`src/components/Modals/Modals.tsx`](../src/components/Modals/Modals.tsx) when needed.

## Security notes

The random number generator is not cryptographically secure. Webhook settings are user-provided and used by the client to send requests. The application has no authentication system, and its logic runs in the browser.
