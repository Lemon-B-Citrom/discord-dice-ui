import { applyMiddleware, createStore } from "redux";
import { saveUserSettings } from "../../../src/actions";
import {
  backToWarhammerCriticalsForm,
  closeWarhammerCriticalsResultsModal,
  requestWarhammerCritical,
  saveWarhammerCriticalResults,
} from "../../../src/actions/warhammerCriticals.actions";
import { openWarhammerCriticalsModal } from "../../../src/actions/modals";
import reducers from "../../../src/reducers";
import sendRequestMsg from "../../../src/middleware/sendRequestMsg.middleware";
import { rollMiddleware } from "../../../src/store";
import { getCriticalPresentation } from "../../../src/utils/WarhammerCustom/criticals/criticalPresentation";
import { formatCriticalTextForDiscord } from "../../../src/utils/WarhammerCustom/criticals/formatCriticalText";
import { getWarhammerCriticalRequestMsg } from "../../../src/utils/WarhammerCustom/criticals/getWarhammerCriticalRequestMsg";
import {
  warhammerCriticalsSendResults,
} from "../../../src/middleware/warhammer/warhammerCriticalsSendResults.middleware";
import warhammerCriticalsRequested from "../../../src/middleware/warhammer/warhammerCriticalsRequested.middleware";
import { WARHAMMER_CRITICAL_RESULTS_SAVED } from "../../../src/actions/warhammerCriticals.actions";

const originalFetch = (global as typeof global & { fetch?: jest.Mock }).fetch;
let fetchMock: jest.Mock;

beforeEach(() => {
  fetchMock = jest.fn(() =>
    Promise.resolve({ ok: true, status: 204 } as Response)
  );
  (global as typeof global & { fetch?: jest.Mock }).fetch = fetchMock;
});

afterEach(() => {
  (global as typeof global & { fetch?: jest.Mock }).fetch = originalFetch;
  jest.restoreAllMocks();
});

function createStoreWithProductionMiddleware() {
  return createStore(reducers, applyMiddleware(...rollMiddleware));
}

test("sends the same selected result after it is saved and visible", () => {
  const store = createStoreWithProductionMiddleware();
  store.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );
  store.dispatch(openWarhammerCriticalsModal());
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "10",
      family: "humanoid",
      location: "body",
    })
  );
  expect(fetchMock).not.toHaveBeenCalled();

  let resultVisibleAtSend = false;
  fetchMock.mockImplementation(() => {
    const state = store.getState();
    resultVisibleAtSend =
      state.warhammerCriticals.results !== null &&
      state.modalsState.isWarhammerCriticalsResultsModalOpen;
    return Promise.resolve({ ok: true, status: 204 } as Response);
  });

  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "10",
      family: "humanoid",
      location: "body",
      damageType: "Energy",
    })
  );

  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(resultVisibleAtSend).toBe(true);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://example.test/hook");
  expect(init.method).toBe("POST");
  expect(init.headers["content-type"]).toBe("application/json");
  const body = JSON.parse(init.body);
  expect(body.username).toBe("Dice Roller");
  expect(body.embeds).toHaveLength(1);
  const result = store.getState().warhammerCriticals.results;
  if (!result) throw new Error("Expected the critical result to be saved");
  const presentation = getCriticalPresentation(result);
  expect(body.embeds[0].title).toBeUndefined();
  expect(body.embeds[0].description).toContain(
    "**Alex rolled a critical effect**\n:skull_crossbones: Body, Energy – 10\n\n"
  );
  expect(body.embeds[0].description).toContain(
    presentation.sections
      .map((section) => formatCriticalTextForDiscord(section.text))
      .join("\n\n")
  );
  expect(body.embeds[0].description).not.toContain("Source:");
  expect(body.embeds[0].fields).toEqual([]);
});

test("no webhook is required for local success; Back, Close, and reopen do not resend", () => {
  const store = createStoreWithProductionMiddleware();
  store.dispatch(saveUserSettings({ username: "Alex", hookUrl: "" }));
  store.dispatch(openWarhammerCriticalsModal());
  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "1",
      family: "vehicle",
      location: "weapon",
    })
  );

  expect(fetchMock).not.toHaveBeenCalled();
  expect(store.getState().warhammerCriticals.results).not.toBeNull();
  expect(store.getState().modalsState.isWarhammerCriticalsResultsModalOpen).toBe(
    true
  );

  store.dispatch(backToWarhammerCriticalsForm());
  store.dispatch(closeWarhammerCriticalsResultsModal());
  store.dispatch(openWarhammerCriticalsModal());
  expect(fetchMock).not.toHaveBeenCalled();
  expect(store.getState().warhammerCriticals.results).not.toBeNull();
});

test("preparation and delivery failures preserve the local result", async () => {
  const store = createStoreWithProductionMiddleware();
  store.dispatch(
    saveUserSettings({ username: "@everyone", hookUrl: "https://example.test/hook" })
  );
  fetchMock.mockRejectedValue(new Error("private hook details"));
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});

  store.dispatch(
    requestWarhammerCritical({
      rawDamage: "10",
      family: "vehicle",
      location: "turret",
    })
  );
  await Promise.resolve();
  await Promise.resolve();

  expect(store.getState().warhammerCriticals.results).not.toBeNull();
  expect(store.getState().modalsState.isWarhammerCriticalsResultsModalOpen).toBe(
    true
  );
  expect(logError).toHaveBeenCalledWith("Discord webhook request failed.");
  expect(logError).not.toHaveBeenCalledWith(
    expect.stringContaining("private hook details")
  );

  const result = store.getState().warhammerCriticals.results;
  if (!result) throw new Error("Expected the critical result to be saved");
  const message = getWarhammerCriticalRequestMsg(result, "x".repeat(2000));
  expect(message.msgTitle).toBeUndefined();
  expect(message.description.length).toBeLessThanOrEqual(4096);
  expect(message.fields).toEqual([]);
});

test("message preparation failure preserves the result and reports a warning", () => {
  const store = createStoreWithProductionMiddleware();
  store.dispatch(
    saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
  );
  const logError = jest.spyOn(console, "error").mockImplementation(() => {});
  const malformedResult = {
    request: { family: "vehicle", location: "turret", severity: 1 },
  } as any;

  store.dispatch(saveWarhammerCriticalResults(malformedResult));

  expect(store.getState().warhammerCriticals.results).toBe(malformedResult);
  expect(store.getState().modalsState.isWarhammerCriticalsResultsModalOpen).toBe(
    true
  );
  expect(store.getState().warhammerCriticals.sendWarning).toBe(
    "The result is shown here, but its webhook message could not be prepared."
  );
  expect(fetchMock).not.toHaveBeenCalled();
  expect(logError).toHaveBeenCalledWith(
    "Unable to prepare a Warhammer damage webhook message."
  );
});

test.each(["synchronous fetch throw", "non-success HTTP response"])(
  "local critical result survives a %s",
  async (failure) => {
    const store = createStoreWithProductionMiddleware();
    store.dispatch(
      saveUserSettings({ username: "Alex", hookUrl: "https://example.test/hook" })
    );
    const logError = jest.spyOn(console, "error").mockImplementation(() => {});

    if (failure === "synchronous fetch throw") {
      fetchMock.mockImplementation(() => {
        throw new Error("private hook details");
      });
    } else {
      fetchMock.mockResolvedValue({ ok: false, status: 503 } as Response);
    }

    store.dispatch(
      requestWarhammerCritical({
        rawDamage: "1",
        family: "vehicle",
        location: "turret",
      })
    );
    await Promise.resolve();
    await Promise.resolve();

    expect(store.getState().warhammerCriticals.results).not.toBeNull();
    expect(store.getState().modalsState.isWarhammerCriticalsResultsModalOpen).toBe(
      true
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(logError).toHaveBeenCalledWith(
      failure === "synchronous fetch throw"
        ? "Discord webhook request failed."
        : "Discord webhook request failed with status 503."
    );
    expect(logError).not.toHaveBeenCalledWith(
      expect.stringContaining("private hook details")
    );
  }
);

test("critical sender is registered after the request processor", () => {
  expect(rollMiddleware).toContain(warhammerCriticalsSendResults);
  expect(rollMiddleware.indexOf(warhammerCriticalsSendResults)).toBeGreaterThan(
    rollMiddleware.indexOf(warhammerCriticalsRequested)
  );
  expect(rollMiddleware.indexOf(warhammerCriticalsSendResults)).toBeLessThan(
    rollMiddleware.indexOf(sendRequestMsg)
  );
  expect(rollMiddleware).toContain(sendRequestMsg);
  expect(WARHAMMER_CRITICAL_RESULTS_SAVED).toBeTruthy();
});
