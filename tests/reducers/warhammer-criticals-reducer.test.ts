import {
  backToWarhammerCriticalsForm,
  changeWarhammerCriticalDamage,
  failWarhammerCritical,
  saveWarhammerCriticalResults,
  selectWarhammerCriticalLocation,
  warnWarhammerCriticalSend,
} from "../../src/actions/warhammerCriticals.actions";
import { openWarhammerCriticalsModal } from "../../src/actions/modals";
import warhammerCriticalsReducer from "../../src/reducers/warhammer-criticals-reducer";
import { lookupWarhammerCritical } from "../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";
import { resolveWarhammerCriticalResult } from "../../src/utils/WarhammerCustom/criticals/resolveWarhammerCritical";

test("starts with a blank draft and preserves it while clearing transient feedback on open", () => {
  let state = warhammerCriticalsReducer(undefined, { type: "@@init" });
  expect(state.damage).toBe("");
  expect(state.selectedLocation).toBeNull();

  state = warhammerCriticalsReducer(
    state,
    changeWarhammerCriticalDamage("07")
  );
  state = warhammerCriticalsReducer(
    state,
    selectWarhammerCriticalLocation({ family: "humanoid", location: "arm" })
  );
  state = warhammerCriticalsReducer(
    state,
    failWarhammerCritical({ damage: "invalid" })
  );
  state = warhammerCriticalsReducer(state, openWarhammerCriticalsModal());

  expect(state.damage).toBe("07");
  expect(state.selectedLocation).toBeNull();
  expect(state.errors).toEqual({});
});

test("stores lookup snapshots and non-destructive preparation warnings", () => {
  const result = resolveWarhammerCriticalResult(lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 10,
  }), () => 1);
  let state = warhammerCriticalsReducer(undefined, { type: "@@init" });
  state = warhammerCriticalsReducer(state, saveWarhammerCriticalResults(result));
  state = warhammerCriticalsReducer(
    state,
    warnWarhammerCriticalSend("Could not prepare webhook")
  );

  expect(state.results).toBe(result);
  expect(state.sendWarning).toBe("Could not prepare webhook");
  state = warhammerCriticalsReducer(state, backToWarhammerCriticalsForm());
  expect(state.results).toBe(result);
});
