import create from "zustand";
import localStoreModeManager from "../../utils/localStoreModeManager";

export type Mode =
  | "none"
  | "warhammerMode"
  | "cthulhuMode"
  | "conanMode"
  | "infinityMode"
  | "duneMode"
  | "narrativeDice"
  | "rollAndKeepMode"
  | "l5rMode"
  | "fateMode"
  | "wrathAndGloryMode"
  | "torMode";

export const modes: Mode[] = [
  "none",
  "warhammerMode",
  "cthulhuMode",
  "conanMode",
  "infinityMode",
  "duneMode",
  "narrativeDice",
  "rollAndKeepMode",
  "l5rMode",
  "fateMode",
  "wrathAndGloryMode",
  "torMode",
];

export const disallowModifierFor: Mode[] = [
  "l5rMode",
  "torMode",
  "narrativeDice",
  "rollAndKeepMode",
  "wrathAndGloryMode",
];

type State = {
  useModifier: boolean;
  preserveDiceOrder: boolean;
  mode: Mode;
  toggleMode: (mode: Mode) => void;
  toggleModifier: () => void;
  togglePreserveDiceOrder: () => void;
};

const useStore = create<State>((set, get) => ({
  useModifier: false,
  preserveDiceOrder: false,
  mode: "none",
  toggleMode: (mode) => {
    if (mode && modes.includes(mode)) {
      set({ mode });
      localStoreModeManager.save(mode);
    }

    if (mode && disallowModifierFor.includes(mode)) {
      set({ useModifier: false });
    }
  },
  toggleModifier: () => {
    const state = get();
    set({ useModifier: !state.useModifier });
  },
  togglePreserveDiceOrder: () => {
    const state = get();
    set({ preserveDiceOrder: !state.preserveDiceOrder });
  },
}));

export default useStore;
