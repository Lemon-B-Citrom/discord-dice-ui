import { applyMiddleware, combineReducers, createStore, Store } from "redux";
import { saveUserSettings } from "../../actions";
import { requestWarhammerAttackerDamage } from "../../actions/warhammerAttackerDamage.actions";
import {
  WarhammerAttackerDamageInput,
  WarhammerAttackerDamageResult,
} from "../../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import sendRequestMsg from "../sendRequestMsg.middleware";
import userSettings from "../../reducers/user-settings-reducer";
import warhammerState from "../../reducers/warhammer-reducer";
import warhammerAttackerDamage from "../../reducers/warhammer-attacker-damage-reducer";
import { createWarhammerAttackerDamageRollRequestedMiddleware } from "./warhammerAttackerDamageRollRequested.middleware";
import warhammerAttackerDamageSendResults from "./warhammerAttackerDamageSendResults.middleware";

const reducer = combineReducers({
  userSettings,
  warhammerState,
  warhammerAttackerDamage,
});

const attack: WarhammerAttackerDamageInput = {
  hits: 1,
  damageDice: 1,
  damageModifier: 0,
  penetration: 0,
  felling: 0,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  tearing: "none",
};

function attackResult(damage: number): WarhammerAttackerDamageResult {
  return {
    input: attack,
    damages: [damage],
    hitDetails: [
      {
        attempts: [
          {
            baseRolls: [{ roll: damage, damage }],
            righteousFuryRolls: [],
            damage,
          },
        ],
        selectedAttemptIndex: 0,
      },
    ],
  };
}

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
      createWarhammerAttackerDamageRollRequestedMiddleware(() => attackResult(12)),
      warhammerAttackerDamageSendResults,
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

test("sends one message for each successful attack completion after saving the result", () => {
  let resultWasSavedAtSend = false;
  fetchMock.mockImplementation(() => {
    resultWasSavedAtSend =
      store.getState().warhammerAttackerDamage.results?.damages[0] === 12 &&
      store.getState().warhammerAttackerDamage.isResultsModalOpen;
    return Promise.resolve({ ok: true, status: 204 } as Response);
  });

  store.dispatch(requestWarhammerAttackerDamage(attack));
  store.dispatch(requestWarhammerAttackerDamage(attack));

  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(resultWasSavedAtSend).toBe(true);
  const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(sentBody.username).toBe("Dice Roller");
  expect(sentBody.embeds[0].title).toBe(
    "Alex performed an attack. `1d10` + `0` x `1`"
  );
  expect(sentBody.embeds[0].fields[0].value).toContain(
    "#1: :arrow_right: **12**"
  );
  expect(store.getState().warhammerAttackerDamage.error).toBe("");
});

test("does not send a message when attack calculation fails", () => {
  const failingStore = createStore(
    reducer,
    applyMiddleware(
      createWarhammerAttackerDamageRollRequestedMiddleware(() => {
        throw new Error("Calculation failed");
      }),
      warhammerAttackerDamageSendResults,
      sendRequestMsg
    )
  );
  failingStore.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );

  failingStore.dispatch(requestWarhammerAttackerDamage(attack));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(failingStore.getState().warhammerAttackerDamage.error).toBe(
    "Calculation failed"
  );
  expect(failingStore.getState().warhammerAttackerDamage.results).toBeNull();
});

test("does not resend retained results when a later attack calculation fails", () => {
  let calculationCount = 0;
  const rerollStore = createStore(
    reducer,
    applyMiddleware(
      createWarhammerAttackerDamageRollRequestedMiddleware(() => {
        calculationCount += 1;
        if (calculationCount === 2) {
          throw new Error("Reroll failed");
        }
        return attackResult(12);
      }),
      warhammerAttackerDamageSendResults,
      sendRequestMsg
    )
  );
  rerollStore.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );

  rerollStore.dispatch(requestWarhammerAttackerDamage(attack));
  rerollStore.dispatch(requestWarhammerAttackerDamage(attack));

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(
    rerollStore.getState().warhammerAttackerDamage.results?.damages
  ).toEqual([12]);
  expect(rerollStore.getState().warhammerAttackerDamage.error).toBe(
    "Reroll failed"
  );
});

test("uses the established fallback when no display name is configured", () => {
  store.dispatch(
    saveUserSettings({ username: "", hookUrl: "https://example.test/hook" })
  );

  store.dispatch(requestWarhammerAttackerDamage(attack));

  const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
  expect(sentBody.embeds[0].title).toBe(
    "USERNAME\\_MISSING performed an attack. `1d10` + `0` x `1`"
  );
});

test("keeps successful local results when a webhook request is rejected", async () => {
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockRejectedValue(new Error("network details"));

  store.dispatch(requestWarhammerAttackerDamage(attack));
  await Promise.resolve();
  await Promise.resolve();

  expect(store.getState().warhammerAttackerDamage.results?.damages).toEqual([
    12,
  ]);
  expect(store.getState().warhammerAttackerDamage.isResultsModalOpen).toBe(
    true
  );
  expect(store.getState().warhammerAttackerDamage.error).toBe("");
  expect(logError).toHaveBeenCalledWith("Discord webhook request failed.");
  expect(logError).not.toHaveBeenCalledWith(
    expect.stringContaining("network details")
  );
});

test("preserves local results and reports non-success HTTP statuses without parsing a body", async () => {
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockResolvedValue({ ok: false, status: 503 });

  store.dispatch(requestWarhammerAttackerDamage(attack));
  await Promise.resolve();

  expect(logError).toHaveBeenCalledWith(
    "Discord webhook request failed with status 503."
  );
  expect(store.getState().warhammerAttackerDamage.results?.damages).toEqual([
    12,
  ]);
  expect(store.getState().warhammerAttackerDamage.error).toBe("");
});

test("skips delivery when no webhook URL is configured", () => {
  store.dispatch(saveUserSettings({ username: "Alex", hookUrl: "" }));

  store.dispatch(requestWarhammerAttackerDamage(attack));

  expect(fetchMock).not.toHaveBeenCalled();
  expect(store.getState().warhammerAttackerDamage.results?.damages).toEqual([
    12,
  ]);
});

test("contains a synchronous transport exception without failing the attack", () => {
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockImplementation(() => {
    throw new Error("network details");
  });

  expect(() => store.dispatch(requestWarhammerAttackerDamage(attack))).not.toThrow();
  expect(store.getState().warhammerAttackerDamage.results?.damages).toEqual([
    12,
  ]);
  expect(store.getState().warhammerAttackerDamage.error).toBe("");
  expect(logError).toHaveBeenCalledWith("Discord webhook request failed.");
});
