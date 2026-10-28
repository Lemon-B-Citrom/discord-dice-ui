# Component Reference

## Layout Components

### App
**Location:** `src/App.tsx`  
**Purpose:** Root component that handles mode-based routing  
**State:** Subscribes to mode from Zustand store  
**Renders:** Conditional rendering based on current mode

```typescript
// Usage: Entry point (used in index.tsx)
<App />
```

### Header
**Location:** `src/components/Header/`  
**Purpose:** Application header with title and links  
**Features:**
- App branding
- GitHub repository link
- Copyright modal trigger
- Settings modal trigger

### DiceModuleOptions
**Location:** `src/components/DiceModuleOptions/`  
**Purpose:** Mode selector and dice configuration  
**State:** Zustand store for mode management  
**Features:**
- Game system mode dropdown
- Dice type selectors for standard mode
- Modifier inputs

## Pool Builder Components

### DiceModule
**Location:** `src/components/DiceModule/`  
**Purpose:** Standard polyhedral dice rolling interface  
**Dice Types:** d4, d6, d8, d10, d12, d20, d100  
**Features:**
- Select quantity of each die type
- Modifiers (+/-)
- Advantage/disadvantage for d20
- Drop highest/lowest options

### NarrativeDicePoolBuilder
**Location:** `src/components/NarrativeDicePoolBuilder/`  
**Purpose:** Star Wars FFG narrative dice system  
**Dice Types:** Boost, Setback, Ability, Difficulty, Proficiency, Challenge, Force  
**Features:**
- Add/remove narrative dice
- Display pool before rolling
- Token management for Story Points
- Reroll capabilities

### L5rDicePoolBuilder
**Location:** `src/components/L5rDicePoolBuilder/`  
**Purpose:** Legend of the Five Rings 5th Edition custom dice  
**Dice Types:** Ring dice, Skill dice  
**Features:**
- Build dice pool
- Keep selection interface
- Reroll options
- Exploding dice
- Add/remove individual dice

### RollAndKeepPoolBuilder
**Location:** `src/components/RollAndKeepPoolBuilder/`  
**Purpose:** Legend of the Five Rings 1st-4th Edition roll and keep  
**Mechanics:** Roll XkY (roll X dice, keep Y highest)  
**Features:**
- Configure roll count and keep count
- Exploding tens
- Results sorting
- Keep selection interface

### WrathAndGloryPoolBuilder
**Location:** `src/components/WrathAndGloryPoolBuilder/`  
**Purpose:** Warhammer 40K Wrath & Glory d6 pools  
**Features:**
- Configure pool size
- Wrath dice (special d6)
- Icon counting
- Reroll all/selected
- Increase pool after roll

## Modal Components

### Modals (Orchestrator)
**Location:** `src/components/Modals/Modals.tsx`  
**Purpose:** Render all modal components based on Redux state  
**Pattern:** Single component that includes all modals

```typescript
const Modals = () => (
  <>
    <ResultsModal />
    <ConanModal />
    <CthulhuModal />
    {/* ... all other modals */}
  </>
);
```

### ResultsModal
**Location:** `src/components/ResultsModal/`  
**Purpose:** Display standard dice roll results  
**Props:**
```typescript
interface ResultsModalProps {
  show: boolean;
  onHide: () => void;
}
```
**Features:**
- Dice results display
- Total calculation
- Roll breakdown
- Reroll button

### ConanModal
**Location:** `src/components/ConanModal/`  
**Purpose:** Conan 2d20 skill test configuration  
**Features:**
- Target number input
- Focus checkbox
- Difficulty slider
- Number of d20s
- Momentum/Doom tracking

### CthulhuModal
**Location:** `src/components/CthulhuModal/`  
**Purpose:** Call of Cthulhu skill test  
**Features:**
- Skill value input
- Bonus/penalty dice
- Auto-calculated success levels
- Push roll option

### CthulhuSheetModal
**Location:** `src/components/CthulhuSheetModal/`  
**Purpose:** Call of Cthulhu character sheet  
**Features:**
- Skill list storage
- Quick skill selection for rolls
- Local storage persistence

### WarhammerModal
**Location:** `src/components/WarhammerModal/`  
**Purpose:** Warhammer/Dark Heresy skill test  
**Features:**
- Skill value input
- Success level calculation (SL = tens digit of roll - tens digit of skill)
- Dramatic success/failure detection
- Reroll option

### WarhammerMoneyModal
**Location:** `src/components/WarhammerMoneyModal/`
**Purpose:** Warhammer currency calculator
**Features:**
- Gold Crowns, Silver Shillings, Brass Pennies
- Add/subtract amounts
- Automatic conversion

### WarhammerAttackerDamageModal
**Location:** `src/components/WarhammerAttackerDamageModal/`
**Purpose:** Roll Warhammer damage dice and keep every Tearing attempt
**Features:**
- Hits, damage dice, modifier, Penetration, Felling, Devastating and Proven
- Tearing / Triple Tearing attempt comparison
- Righteous Fury threshold and confirmation, including Always Confirm
- Results modal with per-attempt equations, re-roll and clipboard summary

### WarhammerDefenderDamageModal
**Location:** `src/components/WarhammerDefenderDamageModal/`
**Purpose:** Apply Warhammer defenses to an attack summary
**Features:**
- Parses the `Pen X, Fel Y, Dev Z: damage, ...` attack summary
- Body-diagram First Hit Location selector and hit sequencing
- Simple armor slots or per-location Advanced armor and Toughness overrides
- Optional Horde mode with Magnitude, bonus hits and kill count
- Results modal showing the damage and Magnitude equations

### DamageNumericField
**Location:** `src/components/DamageNumericField/`
**Purpose:** One whole-number form field with its own error message
**Features:**
- Rejects negative keystrokes and reports invalid values inline
- Row and stacked layouts
- `aria-invalid` / `aria-describedby` wiring

### InfinityModal
**Location:** `src/components/InfinityModal/`  
**Purpose:** Infinity 2d20 skill test configuration  
**Features:** Similar to ConanModal with Infinity-specific rules

### dune-modal
**Location:** `src/components/dune-modal/`  
**Purpose:** Dune 2d20 skill test configuration  
**Features:** Similar to ConanModal with Dune-specific rules

### ModifierModal
**Location:** `src/components/ModifierModal/`  
**Purpose:** Configure roll modifiers  
**Features:**
- Add bonus
- Add penalty
- Advantage/disadvantage

### SettingsModal
**Location:** `src/components/SettingsModal/`  
**Purpose:** User preferences  
**Features:**
- Discord webhook URL configuration
- Display preferences
- Theme options (future)

### CopyrightModal
**Location:** `src/components/CopyrightModal/`  
**Purpose:** Display license and attribution information

## Results Display Components

### L5rResultsModal
**Location:** `src/components/L5rResultsModal/`  
**Purpose:** L5R 5e roll results with interaction  
**Features:**
- Display rolled dice
- Keep/discard selection
- Reroll interface
- Exploding dice indication
- Success/opportunity counting

### RollAndKeepResultsModal
**Location:** `src/components/RollAndKeepResultsModal/`  
**Purpose:** L5R 1e-4e roll results  
**Features:**
- All dice displayed
- Keep selection interface
- Sorted results
- Total calculation

### CthulhuResultsModal
**Location:** `src/components/CthulhuResultsModal/`  
**Purpose:** CoC roll results with push option  
**Features:**
- d100 result
- Success level (Critical/Extreme/Hard/Regular/Fail/Fumble)
- Push roll button
- Luck spending suggestion

### WarhammerResultsModal
**Location:** `src/components/WarhammerResultsModal/`
**Purpose:** Warhammer success level results
**Features:**
- d100 result
- Success level calculation
- Dramatic result indication
- Hit location (optional)
- Reroll option

### WarhammerAttackerDamageResultsModal
**Location:** `src/components/WarhammerAttackerDamageResultsModal/`
**Purpose:** Per-hit damage results for an attack
**Features:**
- Attack profile (dice, modifier, traits)
- Every Tearing attempt, selected first, with its equation
- Proven adjustments and Righteous Fury labels
- Re-roll, Copy summary and Back to the form

### WarhammerDefenderDamageResultsModal
**Location:** `src/components/WarhammerDefenderDamageResultsModal/`
**Purpose:** Damage taken per hit after armor and Toughness
**Features:**
- Canonical attack summary header
- Damage and Magnitude equations per hit
- Overkill classifications and Bonus Devastating entry
- Damage, Magnitude and kill-count totals

### NarrativeTokensModal
**Location:** `src/components/NarrativeTokensModal/`  
**Purpose:** Manage narrative dice Story Points  
**Features:**
- Light side/dark side tokens
- Increment/decrement
- Flip tokens
- Persistent state

### ConanTokensModal
**Location:** `src/components/ConanTokensModal/`  
**Purpose:** Manage Conan 2d20 Momentum/Doom  
**Features:** Similar to NarrativeTokensModal for Conan system

### InfinityTokensModal
**Location:** `src/components/InfinityTokensModal/`  
**Purpose:** Manage Infinity 2d20 Heat/resources

### dune-tokens-modal
**Location:** `src/components/dune-tokens-modal/`  
**Purpose:** Manage Dune 2d20 resources

## Utility Components

### LocalStorageManager
**Location:** `src/components/LocalStorageManager/`  
**Purpose:** Automatic persistence of user settings  
**Pattern:** No UI, listens to Redux state changes and saves to localStorage

```typescript
// Usage: Included in App.tsx
<LocalStorageManager />
```

### InfoTooltip
**Location:** `src/components/InfoTooltip/`  
**Purpose:** Contextual help tooltips  
**Props:**
```typescript
interface InfoTooltipProps {
  id: string;
  content: string | JSX.Element;
  placement?: 'top' | 'right' | 'bottom' | 'left';
}
```

**Usage:**
```tsx
<InfoTooltip 
  id="skill-test-help" 
  content="Enter your skill value"
  placement="right"
/>
```

### InputRange
**Location:** `src/components/InputRange/`  
**Purpose:** Custom range slider with labels  
**Props:**
```typescript
interface InputRangeProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  step?: number;
}
```

### CodeSpan
**Location:** `src/components/CodeSpan/`  
**Purpose:** Display inline code or formulas  
**Props:**
```typescript
interface CodeSpanProps {
  children: React.ReactNode;
  className?: string;
}
```

### XCard
**Location:** `src/components/XCard/`  
**Purpose:** Safety tool for signaling discomfort in game  
**Features:**
- Floating button
- Click to display X-Card message
- Sends to Discord if configured

### CombatTracker
**Location:** `src/components/CombatTracker/`  
**Purpose:** Track initiative order and HP  
**Features:**
- Add/remove combatants
- Initiative values
- HP tracking
- Current turn indicator
- Send to Discord

## Specialized Components

### 2d20 Components
**Location:** `src/components/2d20/`  
**Purpose:** Shared 2d20 system components  
**Components:**
- Pool configuration
- Success counting
- Complication handling

### tor Components
**Location:** `src/components/tor/`  
**Purpose:** The One Ring 2e system  
**Features:**
- Feat die (d12 with special faces)
- Success dice (d6)
- Tengwar/rune display

### torModals
**Location:** `src/components/torModals/`  
**Purpose:** The One Ring modals  
**Components:**
- Roll configuration modal
- Results display modal

### HitLocations
**Location:** `src/components/HitLocations/`  
**Purpose:** Display hit location results  
**Systems:** Warhammer 2e, 4e, Dark Heresy II  
**Features:**
- Reverse d100 for location
- Body diagram (future)

### DerivedResults
**Location:** `src/components/DerivedResults/`  
**Purpose:** Display calculated results  
**Use Cases:**
- Success levels
- Damage calculations
- Icon counting

### SuccessLevelLadder
**Location:** `src/components/SuccessLevelLadder/`  
**Purpose:** Visual representation of Warhammer success levels  
**Features:**
- Scale from dramatic failure to dramatic success
- Current result indicator
- Color-coded

### ResultVsSkillRow
**Location:** `src/components/ResultVsSkillRow/`  
**Purpose:** Compare roll result to skill value  
**Features:**
- Side-by-side display
- Visual success/fail indicator

### PoolBuilder
**Location:** `src/components/PoolBuilder/`  
**Purpose:** Generic dice pool building interface  
**Used by:** Various game system builders

### PoolBuilderModal
**Location:** `src/components/PoolBuilderModal/`  
**Purpose:** Modal wrapper for pool builders

### DropdownRoller
**Location:** `src/components/DropdownRoller/`  
**Purpose:** Quick dice roller dropdown  
**Features:**
- Select die type
- Roll without opening modal
- Quick results

### Reroll
**Location:** `src/components/Reroll/`  
**Purpose:** Reroll interface component  
**Features:**
- Select dice to reroll
- Reroll all button
- Reroll count tracking

### Or
**Location:** `src/components/Or/`  
**Purpose:** Visual "or" separator  
**Usage:** Between alternative options in UI

## Component Patterns

### Modal Pattern
Most modals follow this pattern:
```typescript
interface MyModalProps {
  show: boolean;
  onHide: () => void;
}

const MyModal: React.FC<MyModalProps> = ({ show, onHide }) => {
  const dispatch = useDispatch();
  
  const handleAction = () => {
    dispatch(someAction());
    onHide();
  };
  
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Title</Modal.Title>
      </Modal.Header>
      <Modal.Body>{/* Content */}</Modal.Body>
      <Modal.Footer>
        <Button onClick={handleAction}>Action</Button>
      </Modal.Footer>
    </Modal>
  );
};
```

### Redux Connected Component Pattern
```typescript
const MyComponent: React.FC = () => {
  const dispatch = useDispatch();
  const data = useSelector((state: any) => state.feature.data);
  
  const handleAction = () => {
    dispatch(myAction(data));
  };
  
  return <div onClick={handleAction}>{data}</div>;
};
```

### Zustand Component Pattern
```typescript
const MyComponent: React.FC = () => {
  const { value, setValue } = useStore((state) => state);
  
  return (
    <input 
      value={value} 
      onChange={(e) => setValue(e.target.value)} 
    />
  );
};
```

## Styling

Most components use:
- Bootstrap utility classes
- React Bootstrap components
- Component-specific CSS modules (occasional)
- Global styles from `index.css`

## Accessibility

Components should include:
- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader text where appropriate

## Testing Components

Example component test:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import MyComponent from './MyComponent';

const mockStore = configureStore([]);

test('renders and handles interaction', () => {
  const store = mockStore({ feature: { data: 'test' } });
  
  render(
    <Provider store={store}>
      <MyComponent />
    </Provider>
  );
  
  const button = screen.getByRole('button');
  fireEvent.click(button);
  
  const actions = store.getActions();
  expect(actions[0].type).toBe('EXPECTED_ACTION');
});
```
