# Component Reference

This guide describes the main UI boundaries and state patterns. It is a selective guide, not a complete component inventory. See the linked source when you need implementation details.

## Application shell and roll input

### Application shell

- [`App`](../src/App.tsx) selects the main interface from the mode in the Zustand dice-options store.
- [`Header`](../src/components/Header/Header.tsx) provides navigation, settings, and attribution entry points.
- [`Modals`](../src/components/Modals/Modals.tsx) is a Redux-connected modal host. It reads modal-related Redux state and mounts the application’s modal containers and result modals. It does not implement one universal modal state pattern.

### Roll options and dice tiles

- [`DiceModuleOptions`](../src/components/DiceModuleOptions/DiceModuleOptions.tsx) is the collapsible **Roll Options** accordion. Its form uses mode radio buttons and the **Use Modifier** and **Preserve Dice Order** checkboxes. The selected mode and these options use the local Zustand store. This component is not a dice picker or numeric modifier form.
- [`DiceModule`](../src/components/DiceModule/DiceModule.tsx) selects dice tiles for the active mode. [`Dice`](../src/components/DiceModule/Dice.tsx) renders a tile with a direct roll action and, where available, a quantity dropdown. The selected sets include standard dice, game-specific dice, Fate, and The One Ring dice. Available sets include d5 and feature tiles such as skill tests. Do not infer unsupported game mechanics from the tile set.
- [`PoolBuilder`](../src/components/PoolBuilder/PoolBuilder.tsx) supplies shared pool controls. [`L5rDicePoolBuilder`](../src/components/L5rDicePoolBuilder/L5rDicePoolBuilder.tsx), [`NarrativeDicePoolBuilder`](../src/components/NarrativeDicePoolBuilder/NarrativeDicePoolBuilder.tsx), and [`WrathAndGloryPoolBuilder`](../src/components/WrathAndGloryPoolBuilder/WrathAndGloryPoolBuilder.tsx) are primarily thin wrappers that select pool types, limits, and submit actions. They build input pools; result interactions belong to their results views.
- The narrative dice set includes d100. The roll-and-keep builder submits a dice pool and modifier. It does not ask for a keep count before the roll. The results modal asks the user to select dice to keep after rolling.

## Results and game-specific modals

Results views own interactions with rolled dice. For example, the L5R results modal handles keep/drop selection, rerolls, added dice, and derived symbol counts. The roll-and-keep results modal handles post-roll keep selection. Wrath and Glory results handle icon counts and rerolls. These are not pool-builder features.

- [`ResultsModal`](../src/components/ResultsModal/ResultsModal.tsx) displays standard roll messages and provides the shared reroll interaction. Its actual component props are [`ResultsModalPropTypes`](../src/components/ResultsModal/ResultsModalTypes.ts): [`hideMsg`](../src/components/ResultsModal/ResultsModalTypes.ts:4), [`msgData`](../src/components/ResultsModal/ResultsModalTypes.ts:5), and [`showModal`](../src/components/ResultsModal/ResultsModalTypes.ts:10). The container type also includes [`diceSelected`](../src/components/ResultsModal/ResultsModalTypes.ts:6). It does not use the generic visibility and dismissal prop names.
- [`L5rResultsModal`](../src/components/L5rResultsModal/L5rResultsModal.tsx) manages the L5R 5e result interactions, including keep/drop and reroll choices, with derived success, opportunity, and strife counts.
- [`RollAndKeepResultsModal`](../src/components/RollAndKeepResultsModal/RollAndKeepResultsModal.tsx) lets the user choose dice to keep after the roll and displays the resulting total and modifier.
- [`WrathAndGloryResultsModal`](../src/components/WrathAndGloryPoolBuilder/WrathAndGloryResultsModal.tsx) displays pool results, icon totals, and reroll actions. The builder and results view share a feature directory, but have separate responsibilities.
- [`ResultsModal2d20`](../src/components/2d20/results-modal-2d20/results-modal-2d20.tsx) presents 2d20 result details, including focus, difficulty, fortune or determination, assistance, complications, and momentum where applicable.
- [`CthulhuResultsModal`](../src/components/CthulhuResultsModal/CthulhuResultsModal.tsx) displays Call of Cthulhu success levels and push options. A push is a results interaction, not an input-form option.
- [`WarhammerResultsModal`](../src/components/WarhammerResultsModal/WarhammerResultsModal.tsx) displays Warhammer test results, hit locations, and reroll interaction. Warhammer rule modes are selected in [`WarhammerModalForm`](../src/components/WarhammerModal/WarhammerModalForm.tsx). The default 4e SL formula is tens(skill) minus tens(roll); the form also exposes Fast SL, 2e DoS, Dark Heresy II DoS, and Only War DoS modes.
- Conan and Infinity share the 2d20 form structure. Focus is numeric, and difficulty uses the radio ladder. Conan and Infinity support Fortune, assistance, and untrained tests; Dune labels Fortune as Determination, uses a complication range, and omits assistance and untrained tests. The precise options are selected by each modal, so inspect [`ConanModal`](../src/components/ConanModal/ConanModal.tsx), [`InfinityModal`](../src/components/InfinityModal/InfinityModal.tsx), and [`DuneModal`](../src/components/dune-modal/dune-modal.tsx) before changing shared fields.
- Warhammer defender damage uses [`WarhammerDefenderDamageModal`](../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageModal.tsx) for input and [`WarhammerDefenderDamageResultsModal`](../src/components/WarhammerDefenderDamageResultsModal/WarhammerDefenderDamageResultsModal.tsx) for results. The first-hit-location control is a keyboard-navigable grid, not a body diagram. [`AdvancedDefenseModal`](../src/components/WarhammerDefenderDamageModal/AdvancedDefenseModal.tsx) edits armor and Toughness overrides by body part.
- [`HitLocations`](../src/components/HitLocations/HitLocations.tsx) displays hit-location information for Warhammer 4e, Warhammer 2e, Dark Heresy II, Conan, and Infinity. Do not describe its coverage as Warhammer-only.
- [`SuccessLevelLadder`](../src/components/SuccessLevelLadder/SuccessLevelLadder.tsx) displays the Call of Cthulhu 7e success ladder, not Warhammer SL.
- [`DerivedResultsItem`](../src/components/DerivedResults/DerivedResultsItem.tsx) displays a symbol image, its count, and associated label/tooltip. It is used for derived symbol counts, not as a generic damage calculator.

## Shared controls and tools

- [`InfoTooltip`](../src/components/InfoTooltip/InfoTooltip.tsx) accepts required [`content`](../src/components/InfoTooltip/InfoTooltip.tsx:12) of type [`any`](../src/components/InfoTooltip/InfoTooltip.tsx:12); optional [`type`](../src/components/InfoTooltip/InfoTooltip.tsx:13), React Bootstrap [`placement`](../src/components/InfoTooltip/InfoTooltip.tsx:14), [`className`](../src/components/InfoTooltip/InfoTooltip.tsx:15), and [`containerClassName`](../src/components/InfoTooltip/InfoTooltip.tsx:16). It does not require an identifier prop. Placement defaults to [`top`](../src/components/InfoTooltip/InfoTooltip.tsx:22).
- [`InputRange`](../src/components/InputRange/InputRange.tsx) accepts optional [`id`](../src/components/InputRange/InputRange.tsx:7), [`hidePercent`](../src/components/InputRange/InputRange.tsx:9), [`min`](../src/components/InputRange/InputRange.tsx:10), [`max`](../src/components/InputRange/InputRange.tsx:11), and [`value`](../src/components/InputRange/InputRange.tsx:12). Its required [`onChange`](../src/components/InputRange/InputRange.tsx:8) receives a React change event for an input element. Defaults are minimum 1 and maximum 100. It does not accept a label or numeric callback value.
- [`CodeSpan`](../src/components/CodeSpan/CodeSpan.tsx) accepts [`children`](../src/components/CodeSpan/CodeSpan.tsx:13) as a string, number, or React element, plus optional [`className`](../src/components/CodeSpan/CodeSpan.tsx:11) and [`type`](../src/components/CodeSpan/CodeSpan.tsx:12). The recognized type values are [`failure`](../src/components/CodeSpan/CodeSpan.tsx:5), [`success`](../src/components/CodeSpan/CodeSpan.tsx:6), [`complication`](../src/components/CodeSpan/CodeSpan.tsx:8), and [`inactive`](../src/components/CodeSpan/CodeSpan.tsx:7).
- [`Reroll`](../src/components/Reroll/Reroll.tsx) renders selectable results and reroll actions. It does not track a reroll count; callers and Redux state provide count behavior where needed.
- [`DropdownRoller`](../src/components/DropdownRoller/DropdownRoller.tsx) is used inside the Combat Tracker. It opens a dice dropdown and starts roll or modal flows, rather than displaying an immediate inline result.
- [`CombatTrackerModal`](../src/components/CombatTracker/CombatTrackerModal.tsx) uses a local Zustand store and organizes combatants into zones, including a Waiting Room. It supports clear and Discord send actions. It does not show a current-turn indicator.
- [`SettingsModal`](../src/components/SettingsModal/SettingsModal.tsx) exposes username and Discord webhook settings. The webhook form includes **Copy App Link**, and the modal title displays the application version. The UI does not provide theme or display settings.
- [`LocalStorageManager`](../src/components/LocalStorageManager/LocalStorageManager.tsx) loads saved Call of Cthulhu skills and attributes on mount and dispatches Redux update requests. It does not subscribe to Redux or automatically save Redux state.

## Modal and state patterns

Use the state pattern that the feature already uses. Do not introduce a generic visibility/dismissal contract across all modals.

- Many Redux-backed views use [`connect()`](../src/components/Modals/Modals.tsx:107) containers to select state, bind action creators, and pass a [`showModal`](../src/components/SettingsModal/SettingsModalContainer.tsx:49) value plus a feature-specific close callback to a presentational modal. Examples include [`ConanModalContainer`](../src/components/ConanModal/ConanModalContainer.tsx) and [`SettingsModalContainer`](../src/components/SettingsModal/SettingsModalContainer.tsx). [`Modals`](../src/components/Modals/Modals.tsx) wires these containers into the app.
- Some modals use React Redux hooks directly in the view. For example, [`WarhammerResultsModal`](../src/components/WarhammerResultsModal/WarhammerResultsModal.tsx) reads Redux state and dispatches actions itself.
- Other modals use Zustand state. [`CombatTrackerModal`](../src/components/CombatTracker/CombatTrackerModal.tsx) reads its open state and actions from a feature store. [`TorModal`](../src/components/torModals/TorModal.tsx) and its results view use the The One Ring flow rather than the generic Redux container pattern.
- Token modal containers are wrappers around the shared [`TokensModal`](../src/components/tokens-modal/tokens-modal.tsx). Each wrapper maps feature state and update callbacks for its token type. Do not assume a shared flip control or persistence behavior from the wrapper names.
- The [`tor`](../src/components/tor/store.ts) area contains state and formatting logic. The React user interface is in [`torModals`](../src/components/torModals/TorModal.tsx).
- [`XCard`](../src/components/XCard/XCardModal.tsx) code is currently unmounted/dead code. Do not document it as an active floating button.

## Testing and styling

The project uses React 16 and [`@testing-library/react`](../package.json:17) 9.3.2. That release returns query functions from `render`; it does not provide the newer screen API. The project does not install redux-mock-store. Follow the existing test setup in [`setupTests`](../tests/setupTests.ts) and tests under [`tests/components/`](../tests/components). For a simple component test, import React when using JSX and destructure the query from `render`:

```tsx
import React from "react";
import { fireEvent, render } from "@testing-library/react";
import MyComponent from "./MyComponent";

test("handles a button click", () => {
  const onClick = jest.fn();
  const { getByRole } = render(<MyComponent onClick={onClick} />);

  fireEvent.click(getByRole("button"));
  expect(onClick).toHaveBeenCalled();
});
```

Most components use React Bootstrap and shared CSS. Some feature areas use CSS modules. Follow the local component and test conventions when changing either.
