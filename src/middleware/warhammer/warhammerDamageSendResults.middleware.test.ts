import { applyMiddleware, combineReducers, createStore, Store } from "redux";
import { saveUserSettings } from "../../actions";
import {
  backToWarhammerDamageForm,
  changeWarhammerDamageDraft,
  clearWarhammerDamageDraft,
  requestWarhammerDamage,
  saveWarhammerDamageResults,
} from "../../actions/warhammerDamageCalculator.actions";
import {
  WarhammerDamageDraft,
  WarhammerDamageResult,
} from "../../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import warhammerDamageCalculator from "../../reducers/warhammer-damage-calculator-reducer";
import userSettings from "../../reducers/user-settings-reducer";
import modalsState from "../../reducers/modals-reducer";
import reducers from "../../reducers";
import sendRequestMsg from "../sendRequestMsg.middleware";
import { createWarhammerDamageCalculationRequestedMiddleware } from "./warhammerDamageCalculationRequested.middleware";
import warhammerDamageCalculationRequested from "./warhammerDamageCalculationRequested.middleware";
import warhammerDamageSendResults from "./warhammerDamageSendResults.middleware";
import { rollMiddleware } from "../../store";

const reducer = combineReducers({
  userSettings,
  warhammerDamageCalculator,
  modalsState,
});

const draft: WarhammerDamageDraft = {
  attackSummaryString: "Pen 0, Fel 0: 12, 8",
  toughnessBonus: "2",
  fortitude: "",
  armorHead: "",
  armorBody: "",
  armorArms: "",
  armorLegs: "",
  firstHitLocation: "Head",
  trueHits: "",
  magPer: "",
  devastating: "",
  woundsPer: "",
};

const originalFetch = (global as typeof global & { fetch?: jest.Mock }).fetch;
let fetchMock: jest.Mock;
let store: Store<ReturnType<typeof reducer>>;

beforeEach(() => {
  fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, status: 204 } as Response)
  );
  (global as typeof global & { fetch?: jest.Mock }).fetch = fetchMock;
  store = createStore(
    reducer,
    applyMiddleware(
      createWarhammerDamageCalculationRequestedMiddleware(),
      warhammerDamageSendResults,
      sendRequestMsg
    )
  );
  store.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );
});

afterEach(() => {
  (global as typeof global & { fetch?: jest.Mock }).fetch = originalFetch;
  jest.restoreAllMocks();
});

test("sends one aggregate message per successful calculation after saving results", () => {
  let resultSavedAtSend = false;
  fetchMock.mockImplementation(() => {
    resultSavedAtSend =
      store.getState().warhammerDamageCalculator.results !== null &&
      store.getState().modalsState.isWarhammerDamageResultsModalOpen;
    return Promise.resolve({ ok: true, status: 204 } as Response);
  });

  store.dispatch(requestWarhammerDamage(draft));
  store.dispatch(requestWarhammerDamage(draft));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(resultSavedAtSend).toBe(true);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.username).toBe("Dice Roller");
  expect(body.embeds).toHaveLength(1);
  expect(body.embeds[0].title).toBe("Alex calculated damage. Single target");
  expect(body.embeds[0].fields[0].value).toContain("#1: :arrow_right: **10**\n-# Head");
  expect(body.embeds[0].fields[body.embeds[0].fields.length - 1].value).toContain(
    "Total Damage:"
  );
  expect(store.getState().warhammerDamageCalculator.errors).toEqual({});
});

test("does not send for invalid or failed calculations and does not resend retained results", () => {
  store.dispatch(requestWarhammerDamage(draft));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  store.dispatch(
    requestWarhammerDamage({ ...draft, attackSummaryString: "not a summary" })
  );
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(store.getState().warhammerDamageCalculator.results).not.toBeNull();
});

test("skips delivery without a webhook while preserving a successful local result", () => {
  store.dispatch(saveUserSettings({ username: "Alex", hookUrl: "" }));
  store.dispatch(requestWarhammerDamage(draft));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(store.getState().warhammerDamageCalculator.results).not.toBeNull();
  expect(store.getState().modalsState.isWarhammerDamageResultsModalOpen).toBe(
    true
  );
});

test("draft edits, Clear, and Back do not send or resend saved results", () => {
  store.dispatch(requestWarhammerDamage(draft));
  expect(fetchMock).toHaveBeenCalledTimes(1);

  store.dispatch(changeWarhammerDamageDraft("toughnessBonus", "3"));
  store.dispatch(changeWarhammerDamageDraft("fortitude", "2"));
  store.dispatch(clearWarhammerDamageDraft());
  expect(store.getState().warhammerDamageCalculator.draft.fortitude).toBe("");
  store.dispatch(backToWarhammerDamageForm());

  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("sends Fortitude results once and does not send invalid Fortitude", () => {
  store.dispatch(requestWarhammerDamage({ ...draft, attackSummaryString: "Pen 0, Fel 2: 20, 20,", toughnessBonus: "6", fortitude: "1" }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(body.embeds[0].fields[0].value).toContain("Toughness (`6` × `2` − `2` = `10`)");
  store.dispatch(requestWarhammerDamage({ ...draft, fortitude: "-1" }));
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(store.getState().warhammerDamageCalculator.errors.fortitude).toBeTruthy();
});

test("keeps saved local state after asynchronous delivery failure", async () => {
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockRejectedValue(new Error("private webhook URL details"));

  store.dispatch(requestWarhammerDamage(draft));
  await Promise.resolve();
  await Promise.resolve();

  expect(store.getState().warhammerDamageCalculator.results).not.toBeNull();
  expect(store.getState().warhammerDamageCalculator.errors).toEqual({});
  expect(store.getState().modalsState.isWarhammerDamageResultsModalOpen).toBe(
    true
  );
  expect(logError).toHaveBeenCalledWith("Discord webhook request failed.");
  expect(logError).not.toHaveBeenCalledWith(
    expect.stringContaining("private webhook URL details")
  );
});

test("notification preparation failures do not replace the saved result with a calculation error", () => {
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  const malformedResult = {
    draft,
    request: { mode: "single" },
    entries: [],
    totals: { damage: 0 },
  } as unknown as WarhammerDamageResult;
  store.dispatch(saveWarhammerDamageResults(malformedResult));

  expect(store.getState().warhammerDamageCalculator.results).toBe(malformedResult);
  expect(store.getState().warhammerDamageCalculator.errors).toEqual({});
  expect(logError).toHaveBeenCalledWith(
    "Unable to prepare a Warhammer damage webhook message."
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test("the production middleware chain sends the damage result and opens the results modal", () => {
  // Compose the same middleware chain and root reducer that `src/store.ts` ships,
  // but into an isolated store so no shared production state is touched.
  const productionStore = createStore(
    reducers,
    applyMiddleware(...rollMiddleware)
  );
  productionStore.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );
  let resultSavedAtSend = false;
  fetchMock.mockImplementation(() => {
    resultSavedAtSend =
      productionStore.getState().warhammerDamageCalculator.results !== null &&
      productionStore.getState().modalsState.isWarhammerDamageResultsModalOpen;
    return Promise.resolve({ ok: true, status: 204 } as Response);
  });

  productionStore.dispatch(requestWarhammerDamage(draft));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(resultSavedAtSend).toBe(true);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://example.test/hook");
  expect(init.method).toBe("POST");
  expect(init.headers["content-type"]).toBe("application/json");
  const body = JSON.parse(init.body);
  expect(body.username).toBe("Dice Roller");
  expect(body.embeds).toHaveLength(1);
  expect(body.embeds[0].title).toBe("Alex calculated damage. Single target");
  expect(body.embeds[0].fields[0].value).toContain("#1: :arrow_right: **10**\n-# Head");
  expect(productionStore.getState().warhammerDamageCalculator.results).not.toBeNull();
  expect(productionStore.getState().warhammerDamageCalculator.errors).toEqual({});
  expect(
    productionStore.getState().modalsState.isWarhammerDamageResultsModalOpen
  ).toBe(true);
});

test("the production middleware chain registers Damage completion notifications", () => {
  expect(rollMiddleware).toContain(warhammerDamageCalculationRequested);
  expect(rollMiddleware).toContain(warhammerDamageSendResults);
});
