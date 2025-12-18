# Architecture Documentation

## Overview
Discord Dice UI is a single-page application built with React and TypeScript that provides dice rolling functionality for multiple tabletop RPG systems with Discord webhook integration.

## Core Technologies
- **React 16.14.0**: UI library
- **TypeScript 3.9.7**: Type safety
- **Redux**: Application state management
- **Zustand**: Form-specific state management
- **React Bootstrap**: UI components
- **random-js**: Cryptographically secure random number generation

## Application Architecture

### Data Flow
```
User Interaction
    ↓
React Component
    ↓
Redux Action Dispatch
    ↓
Middleware Chain (Process Roll, Calculate Results, Generate Messages)
    ↓
Reducer (Update State)
    ↓
React Component Re-render (Display Results)
```

### State Management Strategy

#### Redux State (src/store.ts)
Used for:
- Dice roll results
- Modal visibility states
- Game system-specific data (tokens, character sheets)
- Roll history
- User settings

#### Zustand State (DiceModuleOptions/store.ts)
Used for:
- Current mode/game system selection
- Form state that doesn't need global access
- Lightweight, fast updates for UI interactions

#### Local Storage
Used for:
- Persisting user preferences
- Character sheet data (Cthulhu)
- Mode selection
- Warhammer success level type preference

### Middleware Architecture

The application heavily relies on Redux middleware for business logic. Middleware is organized by concern:

1. **Roll Processing**
   - `handleRoll.middleware.ts`: Core dice rolling logic
   - `rollRequested.middleware.ts`: Standard roll requests
   - `rerollRequested.middleware.ts`: Reroll handling

2. **Game System Specific**
   - `cthulhu/cthulhuRollRequested.middleware.ts`
   - `warhammer/warhammerRollRequested.middleware.ts`
   - `l5r/l5rRollRequested.middleware.ts`
   - etc.

3. **Message Generation**
   - `getLocalMsg.middleware.ts`: HTML/JSX for in-app display
   - `getRequestMsg.middleware.ts`: Plain text for Discord webhooks
   - System-specific variants for each game

4. **Token/Resource Management**
   - `narrativeDiceUpdateTokensState.middleware.ts`
   - `conan-update-tokens-state.middleware.ts`
   - `infinity-update-tokens-state.middleware.ts`
   - `dune-update-tokens-state.middleware.ts`

5. **Communication**
   - `sendRequestMsg.middleware.ts`: Sends messages to Discord webhook

### Component Architecture

#### Component Categories

1. **Layout Components**
   - `App.tsx`: Root component, mode routing
   - `Header/`: Top navigation and branding
   - `DiceModuleOptions/`: Mode selector and dice configuration

2. **Dice Pool Builders** (Mode-specific entry points)
   - `DiceModule/`: Standard dice rolling (d4, d6, d8, d10, d12, d20, d100)
   - `NarrativeDicePoolBuilder/`: Star Wars FFG dice system
   - `L5rDicePoolBuilder/`: L5R 5e custom dice
   - `RollAndKeepPoolBuilder/`: L5R 1e roll-and-keep system
   - `WrathAndGloryPoolBuilder/`: Wrath & Glory d6 pools

3. **System Modals** (Configuration/Input)
   - `ConanModal/`: 2d20 roll configuration
   - `CthulhuModal/`: Skill test with push mechanics
   - `WarhammerModal/`: Success level rolling
   - `InfinityModal/`: 2d20 roll configuration
   - `dune-modal/`: 2d20 roll configuration

4. **Results Modals** (Output Display)
   - `ResultsModal/`: Standard dice results
   - `CthulhuResultsModal/`: CoC results with push option
   - `WarhammerResultsModal/`: Success level display
   - `L5rResultsModal/`: L5R 5e with keep/reroll options
   - `RollAndKeepResultsModal/`: L5R 1e keep selection

5. **Utility Components**
   - `Modals/`: Modal orchestration
   - `LocalStorageManager/`: Persistence manager
   - `InfoTooltip/`: Help text display
   - `XCard/`: Safety tool
   - `CombatTracker/`: Initiative and HP tracking

#### Component Communication Patterns

1. **Props Down**
   - Parent components pass data and callbacks to children
   - Prefer explicit props over implicit context

2. **Redux Connect**
   - Components that need global state use Redux hooks
   - `useSelector` for reading state
   - `useDispatch` for dispatching actions

3. **Event Handlers**
   - User interactions trigger action dispatches
   - Middleware handles side effects
   - State updates trigger re-renders

## Module System

### Actions Module (src/actions/)
- One file per game system
- Exports action type constants and action creator functions
- TypeScript interfaces for action payloads

### Reducers Module (src/reducers/)
- One reducer per feature/system
- Combined in `index.ts` using `combineReducers`
- Pure functions that return new state objects

### Selectors Module (src/selectors/)
- Functions to extract/compute derived state
- Memoization for expensive computations
- Keep components decoupled from state shape

### Utils Module (src/utils/)
- Pure utility functions
- Dice rolling helpers
- Calculation functions (success levels, hit locations)
- Formatting and display helpers

### Constants Module (src/consts/)
- Dice definitions (faces, colors, symbols)
- Game system constants
- URLs and configuration

## Routing Strategy

The app uses **mode-based routing** rather than URL routing:
- No react-router (single-page, single-route)
- Mode stored in Zustand
- `App.tsx` conditionally renders based on mode
- Query parameters can set initial mode

## Discord Integration

### Webhook Flow
1. User configures Discord webhook URL (settings or query param)
2. Roll is performed
3. `getRequestMsg` middleware generates plain text message
4. `sendRequestMsg` middleware posts to webhook
5. Message appears in Discord channel

### Message Format
- **Local**: Rich HTML with images, colors, formatting
- **Discord**: Plain text with Unicode symbols
- Both generated simultaneously by parallel middleware

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: None currently (small app size)
2. **Memoization**: Selectors use memoization where appropriate
3. **Component Optimization**: Functional components with hooks
4. **State Shape**: Normalized where possible
5. **Middleware Ordering**: Most common actions processed first

### Bundle Size
- Bootstrap CSS is relatively large
- FontAwesome icons included
- Consider code splitting for future expansion

## Testing Strategy

### Current Test Coverage
- Minimal test coverage (setup files present)
- Jest configured via react-scripts
- React Testing Library available

### Recommended Test Approach
1. **Unit Tests**: Utils, selectors, reducers (pure functions)
2. **Integration Tests**: Middleware chains
3. **Component Tests**: User interactions
4. **E2E Tests**: Full roll workflows (future)

## Build & Deployment

### Development Build
```bash
npm run dev
```
- Webpack dev server
- Hot module replacement
- Source maps enabled

### Production Build
```bash
npm run build
```
- Optimized bundle
- Minified and compressed
- Static files in `build/` directory

### Hosting
- Static site hosting (Netlify, Vercel, GitHub Pages)
- No backend required
- Discord webhooks for server communication

## Extension Points

### Adding a New Game System
1. Define mode in `DiceModuleOptions/store.ts`
2. Create action creators in `actions/`
3. Create reducer in `reducers/`
4. Create middleware for roll processing
5. Create middleware for message generation
6. Create UI components (modal, results)
7. Update `App.tsx` routing
8. Add system constants
9. Update documentation

### Adding New Dice Types
1. Define in `consts/diceConstants.ts`
2. Add images in `src/img/`
3. Update relevant components
4. Create utility functions if needed

### Adding New Features
1. Follow existing patterns
2. Add middleware for side effects
3. Keep components presentational
4. Use TypeScript for type safety
5. Update state shape in reducers

## Security Considerations

- No sensitive data stored
- Discord webhooks are user-provided (user responsibility)
- No authentication system
- All logic runs client-side
- random-js provides cryptographically secure randomness

## Accessibility

- Semantic HTML structure
- Bootstrap provides basic ARIA attributes
- Keyboard navigation support
- Color contrast (Bootstrap defaults)
- Screen reader considerations (room for improvement)

## Future Architectural Considerations

1. **State Management**: Consider Redux Toolkit for simplified Redux
2. **Routing**: Add react-router if multi-page needed
3. **Code Splitting**: Implement lazy loading for game systems
4. **TypeScript**: Upgrade to latest version
5. **React**: Upgrade to React 18+
6. **Testing**: Increase test coverage
7. **Build**: Consider Vite for faster builds
8. **Internationalization**: Add i18n support
9. **PWA**: Enhance service worker for offline support
10. **Backend**: Optional backend for saved characters/campaigns
