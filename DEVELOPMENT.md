# Development Guide

## Getting Started

### Prerequisites
- Node.js 24.22.1 or a later Node 24 patch
- npm 11.19.1 or a later npm 11 release (bundled with the Node.js version above)

### Installation
```bash
npm ci
```

Use the same npm commands on Windows 10 and Debian 12. The project launcher is
Node-based and keeps the legacy OpenSSL workaround scoped to the CRA
development/build processes; do not add shell-specific environment assignments.

### Development Server
```bash
npm run dev
```
Application runs on http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

## Project Structure

### Source Directory (`src/`)

#### Core Files
- `index.tsx` - Application entry point
- `App.tsx` - Root component with mode routing
- `store.ts` - Redux store configuration
- `index.css` - Global styles

#### Actions (`src/actions/`)
Redux action creators organized by feature:
- `roll.actions.ts` - Standard dice rolls
- `modals.ts` - Modal show/hide actions
- `combatTracker.actions.ts` - Initiative tracking
- Game-specific: `cthulhu.actions.ts`, `warhammer.actions.ts`, `conan.actions.ts`, etc.

**Pattern:**
```typescript
// Action type constant
export const ACTION_TYPE = 'FEATURE_ACTION_TYPE';

// Action creator
export function actionName(payload: PayloadType) {
  return { type: ACTION_TYPE, payload };
}
```

#### Reducers (`src/reducers/`)
Pure functions that update state:
- `index.ts` - Combines all reducers
- `dice-selected-reducer.ts` - Selected dice configuration
- `msg-reducer.ts` - Roll result messages
- `modals-reducer.ts` - Modal visibility states
- Game-specific: `cthulhu-reducer.ts`, `warhammer-reducer.ts`, etc.

**Pattern:**
```typescript
const initialState = { /* ... */ };

export default function reducer(state = initialState, action: any) {
  switch (action.type) {
    case ACTION_TYPE:
      return { ...state, ...action.payload };
    default:
      return state;
  }
}
```

#### Middleware (`src/middleware/`)
Business logic and side effects:

**Core Middleware:**
- `handleRoll.middleware.ts` - Main roll processing
- `rollRequested.middleware.ts` - Standard roll handler
- `rerollRequested.middleware.ts` - Reroll logic
- `sendRequestMsg.middleware.ts` - Discord webhook sender

**Message Generation:**
- `getMsg/getLocalMsg.middleware.ts` - HTML messages for app display
- `getMsg/getRequestMsg.middleware.ts` - Text messages for Discord
- Similar pairs for each game system

**Game System Middleware:**
- `cthulhu/` - Call of Cthulhu roll processing
- `warhammer/` - Warhammer success levels
- `l5r/` - L5R 5e dice manipulation
- `rollAndKeep/` - L5R 1e roll and keep
- `2d20/` - 2d20 system (Conan, Infinity, Dune)

**Pattern:**
```typescript
const middleware = (store: any) => (next: any) => (action: any) => {
  if (action.type === SPECIFIC_ACTION) {
    // Get state
    const state = store.getState();
    
    // Process action
    // ...
    
    // Dispatch other actions if needed
    store.dispatch(anotherAction());
  }
  
  return next(action);
};

export default middleware;
```

#### Components (`src/components/`)

**Layout Components:**
- `Header/` - App header with title and GitHub link
- `DiceModuleOptions/` - Mode selector and dice picker

**Pool Builders:**
- `DiceModule/` - Standard polyhedral dice
- `NarrativeDicePoolBuilder/` - Star Wars FFG narrative dice
- `L5rDicePoolBuilder/` - L5R 5e custom dice
- `RollAndKeepPoolBuilder/` - L5R 1e roll and keep
- `WrathAndGloryPoolBuilder/` - Wrath & Glory d6 pools

**Modals:**
- `Modals/` - Modal orchestrator
- `ResultsModal/` - Standard dice results
- `ConanModal/`, `CthulhuModal/`, `WarhammerModal/` - System-specific input
- `*ResultsModal/` - System-specific results display
- `SettingsModal/` - User preferences
- `CopyrightModal/` - License information

**Utility Components:**
- `LocalStorageManager/` - Auto-save to localStorage
- `InfoTooltip/` - Help text tooltips
- `XCard/` - Safety tool
- `CombatTracker/` - Initiative and HP tracking
- `InputRange/` - Custom range input
- `CodeSpan/` - Formatted code display

#### Utilities (`src/utils/`)
Pure helper functions:
- `getDiceSet.ts` - Dice set configurations
- `getRandom.ts` - Random number generation using random-js
- `getSuccessLevels.ts` - Calculate Warhammer success levels
- `getWarhammer*HitLocation.ts` - Hit location tables
- `getColor.ts` - Color utilities
- `queryParamsManager.ts` - URL parameter handling
- `localStorageUserSettingsManager.ts` - Settings persistence

#### Constants (`src/consts/`)
Configuration and data:
- `diceConstants.ts` - Standard dice definitions
- `diceSets.ts` - Predefined dice sets
- `l5rDice.ts` - L5R custom dice
- `l5rSymbols.ts` - L5R dice symbols
- `narrativeDice.ts` - Star Wars dice
- `narrativeSymbols.ts` - Star Wars symbols
- `torDice.ts` - The One Ring dice
- `fateConsts.ts` - Fate dice
- `urls.ts` - External URLs

#### Selectors (`src/selectors/`)
State extraction functions:
- Compute derived data
- Decouple components from state shape
- Memoize expensive calculations

## Common Development Tasks

### Add a New Standard Dice Type (d16, d30, etc.)

1. **Add to dice constants** (`src/consts/diceConstants.ts`):
```typescript
export const DIE_16 = 'd16';
```

2. **Update dice set** (`src/consts/diceSets.ts`):
```typescript
export const diceSet = {
  // ...
  d16: { name: 'd16', color: '#someColor', faces: 16 }
};
```

3. **Add to DiceModule** component if needed

### Add a New Game System

#### 1. Create Actions
Create `src/actions/mysystem.actions.ts`:
```typescript
export const MYSYSTEM_ROLL_REQUESTED = 'MYSYSTEM_ROLL_REQUESTED';
export const MYSYSTEM_RESULTS_SAVED = 'MYSYSTEM_RESULTS_SAVED';

export function requestMySystemRoll(payload: any) {
  return { type: MYSYSTEM_ROLL_REQUESTED, payload };
}
```

#### 2. Create Reducer
Create `src/reducers/mysystem-reducer.ts`:
```typescript
import { MYSYSTEM_RESULTS_SAVED } from '../actions/mysystem.actions';

const initialState = {
  results: null,
};

export default function mySystemReducer(state = initialState, action: any) {
  switch (action.type) {
    case MYSYSTEM_RESULTS_SAVED:
      return { ...state, results: action.payload };
    default:
      return state;
  }
}
```

Add to `src/reducers/index.ts`:
```typescript
import mySystem from './mysystem-reducer';

export default combineReducers({
  // ...
  mySystem,
});
```

#### 3. Create Middleware
Create `src/middleware/mysystem/mySystemRollRequested.middleware.ts`:
```typescript
import { MYSYSTEM_ROLL_REQUESTED } from '../../actions/mysystem.actions';

const mySystemRollRequested = (store: any) => (next: any) => (action: any) => {
  if (action.type === MYSYSTEM_ROLL_REQUESTED) {
    // Process roll
    const results = processMySystemRoll(action.payload);
    
    // Save results
    store.dispatch({ 
      type: MYSYSTEM_RESULTS_SAVED, 
      payload: results 
    });
  }
  
  return next(action);
};

export default mySystemRollRequested;
```

Register in `src/store.ts`:
```typescript
import mySystemRollRequested from './middleware/mysystem/mySystemRollRequested.middleware';

const rollMiddleware = [
  // ...
  mySystemRollRequested,
  // ...
];
```

#### 4. Create Components
Create `src/components/MySystemModal/MySystemModal.tsx`:
```typescript
import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { requestMySystemRoll } from '../../actions/mysystem.actions';

interface MySystemModalProps {
  show: boolean;
  onHide: () => void;
}

const MySystemModal: React.FC<MySystemModalProps> = ({ show, onHide }) => {
  const dispatch = useDispatch();
  
  const handleRoll = () => {
    dispatch(requestMySystemRoll({ /* params */ }));
    onHide();
  };
  
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>My System Roll</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Configuration UI */}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleRoll}>
          Roll
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MySystemModal;
```

#### 5. Add Mode
Update `src/components/DiceModuleOptions/store.ts`:
```typescript
export const modes = [
  // ...
  'mySystemMode',
] as const;

export type Mode = typeof modes[number];
```

#### 6. Update App Routing
Update `src/App.tsx`:
```typescript
import MySystemBuilder from './components/MySystemBuilder/MySystemBuilder';

function App() {
  const { mode } = useDiceModuleFormStore((state) => state);
  
  return (
    <div className="App">
      {/* ... */}
      {mode === 'mySystemMode' && <MySystemBuilder />}
      {/* ... */}
    </div>
  );
}
```

### Add a Modal

1. Create modal component in `src/components/MyModal/`
2. Add modal state to `src/reducers/modals-reducer.ts`
3. Create show/hide actions in `src/actions/modals.ts`
4. Import and include in `src/components/Modals/Modals.tsx`

### Add Local Storage Persistence

1. Create manager in `src/utils/`:
```typescript
const KEY = 'myFeatureData';

export const myFeatureStorageManager = {
  save: (data: any) => {
    localStorage.setItem(KEY, JSON.stringify(data));
  },
  load: () => {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : null;
  },
  clear: () => {
    localStorage.removeItem(KEY);
  },
};
```

2. Use in component or middleware

### Add Discord Message Support

1. Create local message middleware:
```typescript
// src/middleware/mysystem/getLocalMySystemMsg.middleware.ts
const getLocalMySystemMsg = (store: any) => (next: any) => (action: any) => {
  if (action.type === MYSYSTEM_RESULTS_SAVED) {
    const localMsg = generateHTMLMessage(action.payload);
    store.dispatch(saveLocalMsg(localMsg));
  }
  return next(action);
};
```

2. Create request message middleware:
```typescript
// src/middleware/mysystem/getRequestMySystemMsg.middleware.ts
const getRequestMySystemMsg = (store: any) => (next: any) => (action: any) => {
  if (action.type === MYSYSTEM_RESULTS_SAVED) {
    const requestMsg = generatePlainTextMessage(action.payload);
    store.dispatch(saveRequestMsg(requestMsg));
  }
  return next(action);
};
```

3. Register both middleware in store

## Debugging

### Redux DevTools
Redux DevTools Extension supported. Install browser extension to:
- Inspect state
- Track action dispatches
- Time-travel debugging

### Console Logging in Middleware
```typescript
const debugMiddleware = (store: any) => (next: any) => (action: any) => {
  console.log('Action:', action.type);
  console.log('State before:', store.getState());
  const result = next(action);
  console.log('State after:', store.getState());
  return result;
};
```

### React DevTools
Use React DevTools browser extension to:
- Inspect component tree
- View props and state
- Profile performance

## Testing

### Run Tests
```bash
npm test
```

### Write Component Test
```typescript
import { render, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

test('should handle click', () => {
  const { getByText } = render(<MyComponent />);
  const button = getByText('Click Me');
  fireEvent.click(button);
  // Assert result
});
```

### Write Reducer Test
```typescript
import reducer from './my-reducer';
import { MY_ACTION } from '../actions/my.actions';

test('should update state', () => {
  const initialState = { value: 0 };
  const action = { type: MY_ACTION, payload: { value: 5 } };
  const newState = reducer(initialState, action);
  expect(newState.value).toBe(5);
});
```

## Code Style

### Formatting
```bash
npm run prettier
```

### Linting
ESLint configured via react-scripts (extends react-app)

### TypeScript
- Strict mode enabled
- Use explicit types
- Avoid `any` when possible

## Common Pitfalls

1. **Forgetting to register middleware** - Always add new middleware to `store.ts`
2. **Mixing message formats** - Keep HTML for local, plain text for Discord
3. **Mutating state** - Always return new objects in reducers
4. **Wrong mode check** - Verify mode before rendering system-specific UI
5. **Missing action types** - Define as constants, don't use strings directly
6. **Not testing locally** - Always run dev server and test manually

## Performance Tips

1. Use React.memo() for expensive components
2. Memoize selectors with reselect
3. Avoid unnecessary re-renders with useCallback/useMemo
4. Keep middleware chains efficient
5. Lazy load images if needed

## Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Serve production build locally
npm start

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Format code
npm run prettier

# Check TypeScript
npx tsc --noEmit
```

## Resources

- [React Documentation](https://reactjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Redux Documentation](https://redux.js.org/)
- [React Bootstrap](https://react-bootstrap.github.io/)
- [random-js](https://github.com/ckknight/random-js)
