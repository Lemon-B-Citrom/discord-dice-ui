# Discord Dice UI - AI Agent Instructions

## Project Overview

This is a React + TypeScript web application that provides an advanced dice rolling interface for tabletop RPG systems with Discord webhook integration. The app serves as a simpler alternative to VTTs and a more advanced alternative to command-driven Discord bots.

**Version**: 16.1.1  
**Tech Stack**: React 16.14.0, TypeScript 3.9.7, Redux, Bootstrap 4, React Bootstrap

## Architecture Patterns

### State Management
- **Redux**: Primary state management for application-wide state (rolls, modals, results)
- **Zustand**: Used in `DiceModuleOptions/store.ts` for form-specific state
- **Redux Middleware**: Extensive use of middleware for roll processing, message generation, and Discord integration

### Project Structure
```
src/
├── actions/          # Redux action creators (one file per game system)
├── reducers/         # Redux reducers (one file per feature/system)
├── middleware/       # Redux middleware for roll processing & messaging
├── components/       # React components (organized by feature/system)
├── selectors/        # Redux selectors for state extraction
├── utils/            # Utility functions (dice rolling, calculations, etc.)
├── consts/           # Constants (dice definitions, symbols, URLs)
├── locale/           # Localization/tooltip content
└── img/              # Images and assets
```

### Component Organization
- Components are organized by feature or game system (e.g., `ConanModal/`, `CthulhuModal/`)
- Each major feature has its own folder with related components
- Container pattern used minimally (e.g., `HeaderContainer`)
- Most components are functional with hooks

## Game Systems Supported

1. **Call of Cthulhu 7e** (`cthulhu-*` files)
2. **Warhammer 2e/4e/Dark Heresy II** (`warhammer-*` files)
3. **Wrath & Glory** (`WrathAndGloryPoolBuilder`)
4. **Conan 2d20** (`conan-*` files)
5. **Infinity 2d20** (`infinity-*` files)
6. **Dune 2d20** (`dune-*` files)
7. **Legend of the Five Rings 1e** (`rollAndKeep-*` files)
8. **Legend of the Five Rings 5e** (`l5r-*` files)
9. **Narrative Dice** (`narrativeDice-*` files) - Star Wars FFG
10. **Fate** (fate-* files)
11. **The One Ring 2e** (`tor/` directory)

## Key Concepts

### Modes
The app switches between different "modes" for each game system. Mode state is managed in `src/components/DiceModuleOptions/store.ts` using Zustand.

### Roll Flow
1. User configures dice in UI
2. Action dispatched (e.g., `ROLL_REQUESTED`)
3. Middleware intercepts action
4. Dice rolled using `random-js` library
5. Results calculated
6. Message generated (local display + Discord webhook)
7. State updated with results
8. Results modal displayed

### Middleware Pattern
Each middleware function follows this pattern:
```typescript
const middleware = (store: any) => (next: any) => (action: any) => {
  if (action.type === 'SPECIFIC_ACTION') {
    // Process action
    // Dispatch other actions if needed
  }
  return next(action);
};
```

### Message Generation
- **Local messages**: HTML/JSX for in-app display
- **Request messages**: Plain text for Discord webhooks
- Separate middleware for each type (e.g., `getLocalMsg`, `getRequestMsg`)

## Coding Conventions

### TypeScript
- Strict mode enabled
- Use explicit types, avoid `any` (except in legacy code)
- Interface for component props
- Type for action payloads

### React Components
- Functional components with hooks
- Props interface named `<ComponentName>Props`
- Use `React.FC<Props>` or direct function syntax
- Keep components focused and single-responsibility

### Redux
- Action creators in `actions/<system>.actions.ts`
- Action types as string constants
- Reducers are pure functions
- Use middleware for side effects

### File Naming
- Components: PascalCase (e.g., `DiceModule.tsx`)
- Actions: kebab-case with `.actions.ts` suffix
- Reducers: kebab-case with `-reducer.ts` suffix
- Middleware: kebab-case with `.middleware.ts` suffix
- Utils: camelCase (e.g., `getDiceSet.ts`)

### Imports
- React/external libraries first
- Actions/reducers/types
- Components
- Utils/consts
- Styles last

## Common Tasks

### Adding a New Game System
1. Create action file: `src/actions/<system>.actions.ts`
2. Create reducer: `src/reducers/<system>-reducer.ts`
3. Add reducer to `src/reducers/index.ts`
4. Create middleware: `src/middleware/<system>/`
5. Add middleware to store: `src/store.ts`
6. Create modal component: `src/components/<System>Modal/`
7. Create results component: `src/components/<System>ResultsModal/`
8. Add mode to `DiceModuleOptions/store.ts`
9. Update `App.tsx` to render new components

### Adding a New Dice Type
1. Define dice constants in `src/consts/diceConstants.ts` or `src/consts/diceSets.ts`
2. Add images if needed in `src/img/`
3. Create utility functions in `src/utils/` if needed
4. Update relevant components

### Working with Discord Integration
- Discord webhooks configured via query params or settings
- Messages sent via `sendRequestMsg.middleware.ts`
- Message formatting in `getRequestMsg` middleware variants

## Testing
- Jest configured via `react-scripts`
- Run tests: `npm test`
- Test files: `*.test.tsx`

## Development Workflow
- **Dev server**: `npm run dev` (starts on port 3000)
- **Production build**: `npm run build` (outputs to `build/`)
- **Serve production**: `npm start` (serves build folder)
- **Format code**: `npm run prettier`

## Important Files
- `src/App.tsx` - Main app component, mode routing
- `src/store.ts` - Redux store configuration
- `src/reducers/index.ts` - Root reducer
- `src/components/DiceModuleOptions/store.ts` - Mode state (Zustand)
- `src/middleware/handleRoll.middleware.ts` - Core roll handler

## State Shape
```typescript
{
  diceSelected: { /* selected dice configuration */ },
  lastRollOptions: { /* last roll parameters */ },
  msg: { localMsg, requestMsg }, // Roll results messages
  modals: { /* modal visibility state */ },
  narrativeDice: { /* narrative dice pool state */ },
  l5r: { /* L5R 5e state */ },
  rollAndKeep: { /* L5R 1e state */ },
  cthulhu: { /* Call of Cthulhu state */ },
  warhammer: { /* Warhammer state */ },
  conan: { /* Conan 2d20 state */ },
  infinity: { /* Infinity 2d20 state */ },
  dune: { /* Dune 2d20 state */ },
  userSettings: { /* user preferences */ },
  rerollCount: number
}
```

## Best Practices for AI Assistance

1. **Understand the mode** - Check which game system the user is asking about
2. **Follow existing patterns** - Look at similar systems for consistency
3. **Middleware for logic** - Roll calculations and message generation belong in middleware
4. **Type safety** - Always add proper TypeScript types
5. **Component isolation** - Keep components small and reusable
6. **Test locally** - Suggest running dev server to test changes
7. **Discord formatting** - Remember local (HTML) vs request (plain text) messages
8. **Random generation** - Use `random-js` library, not `Math.random()`
9. **Bootstrap components** - Use react-bootstrap for UI consistency
10. **Query params** - Many features configured via URL params

## Common Pitfalls

- Don't mix HTML in request messages (Discord webhooks need plain text)
- Remember to update both middleware arrays in `store.ts`
- Mode changes require updating multiple files (store, App.tsx, etc.)
- Dice images referenced by name must exist in `src/img/`
- Redux state is immutable - always return new objects
- Some legacy code uses `any` - prefer adding proper types when modifying

## Dependencies Note
- React 16.14 (not latest) - be aware of compatibility
- TypeScript 3.9.7 (older version) - some newer TS features unavailable
- Bootstrap 4 (not 5)
- Node 14.7.0 required
