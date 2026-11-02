import { applyMiddleware, combineReducers, createStore, Store } from "redux";
import {
  requestWarhammerCritical,
  WARHAMMER_CRITICAL_REQUESTED,
} from "../../../src/actions/warhammerCriticals.actions";
import warhammerCriticals from "../../../src/reducers/warhammer-criticals-reducer";
import modalsState from "../../../src/reducers/modals-reducer";
import { createWarhammerCriticalsRequestedMiddleware } from "../../../src/middleware/warhammer/warhammerCriticalsRequested.middleware";
import { lookupWarhammerCritical } from "../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";

const reducer = combineReducers({ warhammerCriticals, modalsState });
type RootState = ReturnType<typeof reducer>;
const createCriticalStore = (
  lookup = lookupWarhammerCritical,
  forwarded: any[] = [],
  rollDie = () => 1
): Store<RootState> =>
  createStore(
    reducer,
    applyMiddleware(
      createWarhammerCriticalsRequestedMiddleware(lookup, rollDie),
      () => (next) => (action) => {
        forwarded.push(action);
        return next(action);
      }
    )
  );

test("opens the humanoid damage-type sub-selector without looking up or saving", () => {
  const lookup = jest.fn(lookupWarhammerCritical);
  const store = createCriticalStore(lookup);
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "4",
      family: "humanoid",
      location: "head",
    })
  );

  expect(lookup).not.toHaveBeenCalled();
  expect(store.getState().warhammerCriticals.selectedLocation).toEqual({
    family: "humanoid",
    location: "head",
  });
  expect(store.getState().warhammerCriticals.results).toBeNull();
  expect(store.getState().warhammerCriticals.errors).toEqual({});
});

test("rejects invalid input on either location or type selection", () => {
  const store = createCriticalStore();
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "",
      family: "humanoid",
      location: "head",
    })
  );
  expect(store.getState().warhammerCriticals.errors.damage).toBe(
    "Input critical damage before selecting a location"
  );
  expect(store.getState().warhammerCriticals.results).toBeNull();

  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "4",
      family: "humanoid",
      location: "head",
      damageType: "Unknown" as any,
    })
  );
  expect(store.getState().warhammerCriticals.errors.form).toBeTruthy();
  expect(store.getState().warhammerCriticals.results).toBeNull();
});

test("resolves a humanoid selected type and a vehicle location as one result each", () => {
  const lookup = jest.fn(lookupWarhammerCritical);
  const store = createCriticalStore(lookup);
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "10",
      family: "humanoid",
      location: "body",
      damageType: "Rending",
    })
  );

  expect(store.getState().warhammerCriticals.results?.effect.damageType).toBe(
    "Rending"
  );
  expect(store.getState().warhammerCriticals.results?.effect.rowLabel).toBe(
    "10+"
  );

  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "1",
      family: "vehicle",
      location: "turret",
    })
  );
  expect(store.getState().warhammerCriticals.results?.effect.text).toContain(
    "Each character within the vehicle’s turret"
  );
  expect(lookup).toHaveBeenCalledTimes(2);
});

test("rolls eligible status dice once after validating a final selection", () => {
  const rollDie = jest.fn(() => 4);
  const store = createCriticalStore(lookupWarhammerCritical, [], rollDie);
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "3",
      family: "vehicle",
      location: "hull",
    })
  );

  expect(rollDie).toHaveBeenCalledTimes(1);
  expect(rollDie).toHaveBeenCalledWith(5);
  expect(store.getState().warhammerCriticals.results?.resolvedSections[0].statusRolls[0]).toEqual(
    expect.objectContaining({ expression: "1d5", result: 4 })
  );

  const invalidRoll = jest.fn(() => 1);
  const invalidStore = createCriticalStore(lookupWarhammerCritical, [], invalidRoll);
  invalidStore.dispatch(
    requestWarhammerCritical({
      rawDamage: "0",
      family: "vehicle",
      location: "hull",
    })
  );
  expect(invalidRoll).not.toHaveBeenCalled();
});

test("forwards unrelated actions once and reports lookup failures without results", () => {
  const forwarded: any[] = [];
  const throwingLookup = jest.fn(() => {
    throw new Error("lookup unavailable");
  });
  const store = createCriticalStore(throwingLookup, forwarded);
  const unrelated = { type: "UNRELATED" };
  store.dispatch(unrelated);
  expect(forwarded.filter((action) => action === unrelated)).toHaveLength(1);

  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "1",
      family: "vehicle",
      location: "hull",
    })
  );
  expect(store.getState().warhammerCriticals.errors.form).toBe(
    "lookup unavailable"
  );
  expect(store.getState().warhammerCriticals.results).toBeNull();
  expect(
    forwarded.filter((action) => action.type === WARHAMMER_CRITICAL_REQUESTED)
  ).toHaveLength(1);
});
