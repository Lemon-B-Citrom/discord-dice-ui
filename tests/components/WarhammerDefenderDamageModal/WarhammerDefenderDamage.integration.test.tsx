import React from "react";
import { applyMiddleware, createStore } from "redux";
import { Provider } from "react-redux";
import { fireEvent, render } from "@testing-library/react";
import reducers from "../../../src/reducers/index";
import {
  changeWarhammerDefenderDamageDraft,
  requestWarhammerDefenderDamage,
} from "../../../src/actions/warhammerDefenderDamage.actions";
import { openWarhammerDefenderDamageModal } from "../../../src/actions/modals";
import { saveWarhammerAttackerDamageResults } from "../../../src/actions/warhammerAttackerDamage.actions";
import { createWarhammerDefenderDamageCalculationRequestedMiddleware } from "../../../src/middleware/warhammer/warhammerDefenderDamageCalculationRequested.middleware";
import WarhammerDefenderDamageResultsModal from "../../../src/components/WarhammerDefenderDamageResultsModal/WarhammerDefenderDamageResultsModal";
import WarhammerAttackerDamageResultsModal from "../../../src/components/WarhammerAttackerDamageResultsModal/WarhammerAttackerDamageResultsModal";
import formatWarhammerAttackerDamageSummary from "../../../src/utils/formatWarhammerAttackerDamageSummary";
import calculateWarhammerAttackerDamage from "../../../src/utils/calculateWarhammerAttackerDamage";
import calculateWarhammerDefenderDamage from "../../../src/utils/calculateWarhammerDefenderDamage";
import { HIT_LOCATION_CYCLES } from "../../../src/utils/damageLocations";
import { WarhammerAttackerDamageInput } from "../../../src/components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";
import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
  WarhammerHumanoidDamageHit,
} from "../../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

const draft: WarhammerDefenderDamageDraft = {
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  attackSummaryString: "Pen 0, Fel 0, @body: 12 8",
  toughnessBonus: "2",
};

const createDamageStore = () =>
  createStore(
    reducers,
    applyMiddleware(
      createWarhammerDefenderDamageCalculationRequestedMiddleware()
    )
  );

test("returns to the form when the side of the results modal is clicked", () => {
  const store = createDamageStore();
  store.dispatch(openWarhammerDefenderDamageModal());
  store.dispatch(requestWarhammerDefenderDamage({ ...draft }));
  render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(
    store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen
  ).toBe(true);
  const modalRoot = document.querySelector(".modal") as HTMLElement;
  fireEvent.click(modalRoot);

  expect(
    store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen
  ).toBe(false);
  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(
    true
  );
  expect(store.getState().warhammerDefenderDamage.results).not.toBeNull();
});

test("Back returns to the exact raw draft without recalculating", () => {
  const draftWithFortitude = {
    ...draft,
    fortitude: "02",
    attackSummaryString: "Pen 0, Fel 0, @body: 12 8 ",
  };
  const store = createDamageStore();
  store.dispatch(openWarhammerDefenderDamageModal());
  Object.keys(draftWithFortitude).forEach((key) => {
    const field = key as keyof WarhammerDefenderDamageDraft;
    store.dispatch(
      changeWarhammerDefenderDamageDraft(field, draftWithFortitude[field])
    );
  });
  store.dispatch(requestWarhammerDefenderDamage(draftWithFortitude));
  const savedSnapshot = store.getState().warhammerDefenderDamage.results;
  const savedDraft = { ...store.getState().warhammerDefenderDamage.draft };

  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );
  fireEvent.click(getByRole("button", { name: "Back" }));

  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(
    true
  );
  expect(
    store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen
  ).toBe(false);
  expect(store.getState().warhammerDefenderDamage.draft).toEqual(savedDraft);
  expect(store.getState().warhammerDefenderDamage.results).toBe(savedSnapshot);
});

test("rendering and Back do not consume vehicle locations; a new calculation does", () => {
  let draws = 0;
  const vehicleDraft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, @hull: 10 10 10",
    facing: "Front",
  };
  const store = createStore(
    reducers,
    applyMiddleware(
      createWarhammerDefenderDamageCalculationRequestedMiddleware((request) =>
        calculateWarhammerDefenderDamage(request, () => {
          draws += 1;
          return 50;
        })
      )
    )
  );
  store.dispatch(requestWarhammerDefenderDamage(vehicleDraft));
  expect(draws).toBe(2);
  store.dispatch(
    saveWarhammerAttackerDamageResults({
      input: {
        hits: 1,
        damageDice: 1,
        damageModifier: 0,
        penetration: 0,
        felling: 0,
        devastating: 0,
        proven: 0,
        rfOn: 10,
        rfConfirmsOn: 0,
        alwaysConfirm: false,
        tearing: "none",
        firstHitLocation: "Hull",
      },
      damages: [10],
      hitDetails: [
        {
          attempts: [
            {
              baseRolls: [{ roll: 10, damage: 10 }],
              righteousFuryRolls: [],
              damage: 10,
            },
          ],
          selectedAttemptIndex: 0,
        },
      ],
    })
  );
  const originalClipboard = navigator.clipboard;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
  const attackerResults = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );
  fireEvent.click(attackerResults.getByRole("button", { name: "Copy" }));
  expect(draws).toBe(2);
  attackerResults.unmount();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );
  fireEvent.click(getByRole("button", { name: "Back" }));
  expect(draws).toBe(2);
  store.dispatch(requestWarhammerDefenderDamage(vehicleDraft));
  expect(draws).toBe(4);
});

test("renders doubled Toughness before Felling only on protected hits", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 0, Fel 2, @body: 20 20 ",
      toughnessBonus: "6",
      fortitude: "1",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );
  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "10 = 20 − Toughness (6 × 2 − 2 = 10)"
  );
  expect(getByRole("group", { name: "Hit 2" })).toHaveTextContent(
    "16 = 20 − Toughness (6 − 2 = 4)"
  );
});

test("renders the independent Horde Fortitude quotas in damage equations", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 0, Fel 2, @body: 20 20 20 20 20 ",
      toughnessBonus: "6",
      fortitude: "1",
      hordeEnabled: true,
      bonusHits: "3",
      magPer: "6",
      woundsPer: "20",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );
  [1, 3, 4].forEach((number) =>
    expect(getByRole("group", { name: `Hit ${number}` })).toHaveTextContent(
      "Damage: 10 = 20 − Toughness (6 × 2 − 2 = 10)"
    )
  );
  [2, 5].forEach((number) =>
    expect(getByRole("group", { name: `Hit ${number}` })).toHaveTextContent(
      "Damage: 16 = 20 − Toughness (6 − 2 = 4)"
    )
  );
});

test("middleware rejects a direct invalid request and keeps the input open", () => {
  const store = createDamageStore();
  store.dispatch(openWarhammerDefenderDamageModal());
  store.dispatch(
    requestWarhammerDefenderDamage({ ...draft, attackSummaryString: "bad" })
  );
  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(
    true
  );
  expect(
    store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen
  ).toBe(false);
  expect(
    store.getState().warhammerDefenderDamage.errors.attackSummaryString
  ).toBeTruthy();
});

test("Horde modal labels the damage and magnitude equations after the hit heading", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 0, Dev 1, @body: 12 8",
      hordeEnabled: true,
      bonusHits: "1",
      magPer: "6",
      woundsPer: "10",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  const hit = getByRole("group", { name: "Hit 1" });
  const equations = hit.querySelectorAll(".equation");
  expect(equations).toHaveLength(2);
  expect(equations[0].textContent).toMatch(/^Damage: /);
  expect(equations[1].textContent).toMatch(/^Magnitude: /);
});

test("renders armor reduced exactly to zero without max notation and preserves the total", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 8, Fel 0, @lleg: 30 27 20 31 25 28",
      toughnessBonus: "12",
      armorBody: "10",
      armorLegs: "8",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "18 = 30 − Armor (8 − 8 = 0) − Toughness (12)"
  );
  expect(getByRole("group", { name: "Hit 1" })).not.toHaveTextContent("max(");
  expect(store.getState().warhammerDefenderDamage.results?.totals.damage).toBe(
    83
  );
});

test("renders fully mitigated damage as zero instead of subtracting it from the total", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 0, Fel 0, @body: 1 20",
      toughnessBonus: "3",
      armorBody: "4",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "0 = 1 − Armor (4) − Toughness (3)"
  );
  expect(store.getState().warhammerDefenderDamage.results?.totals.damage).toBe(
    13
  );
});

test("renders vehicle location and facing on one line without duplicate armor facing", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 25(10)",
      facing: "Front",
      armorFront: "20",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  const hit = getByRole("group", { name: "Hit 1" });
  const locations = hit.querySelectorAll(".location");
  expect(locations).toHaveLength(1);
  expect(locations[0]).toHaveTextContent("Hull · Facing Front");
  expect(hit).toHaveTextContent("(RF suppressed)");
  expect(hit).not.toHaveTextContent("· Front armor");
  expect(hit).not.toHaveTextContent("Armor facing");
});

test("calculates per-location advanced defenses through the production store", () => {
  const store = createDamageStore();
  store.dispatch(
    requestWarhammerDefenderDamage({
      ...draft,
      attackSummaryString: "Pen 0, Fel 0, @head: 12",
      toughnessBonus: "2",
      advancedEnabled: true,
      advancedArmorHead: "4",
      advancedToughnessHead: "1",
    })
  );
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "5 = 12 − Armor (4) − Toughness (2 + 1 = 3)"
  );
  expect(document.body.textContent).toContain("Total Damage: 5");
  expect(
    store.getState().warhammerDefenderDamage.results?.request
  ).toMatchObject({ targetFamily: "humanoid", defenses: { mode: "advanced" } });
});

test.each([
  ["Head", "@head"],
  ["Body", "@body"],
  ["Left Arm", "@larm"],
  ["Right Arm", "@rarm"],
  ["Left Leg", "@lleg"],
  ["Right Leg", "@rleg"],
] as const)(
  "pasted attacker summary starts defender hits at %s",
  (location, token) => {
    const attackerInput: WarhammerAttackerDamageInput = {
      hits: 3,
      damageDice: 0,
      damageModifier: 30,
      penetration: 0,
      felling: 2,
      devastating: 0,
      proven: 0,
      rfOn: 10,
      rfConfirmsOn: 0,
      alwaysConfirm: false,
      tearing: "none",
      firstHitLocation: location,
    };
    const attackerResult = calculateWarhammerAttackerDamage(attackerInput, "", {
      rollD10: () => 4,
      rollD100: () => 100,
    });
    const attackSummary = formatWarhammerAttackerDamageSummary({
      penetration: attackerInput.penetration,
      felling: attackerInput.felling,
      devastating: attackerInput.devastating,
      firstHitLocation: attackerResult.input.firstHitLocation,
      damages: attackerResult.damages,
    });
    expect(attackSummary).toBe(`Pen 0, Fel 2, ${token}: 30 30 30`);

    const store = createDamageStore();
    store.dispatch(
      requestWarhammerDefenderDamage({
        ...draft,
        attackSummaryString: attackSummary,
        advancedEnabled: true,
        advancedArmorHead: "1",
        advancedArmorBody: "2",
        advancedArmorLeftArm: "3",
        advancedArmorRightArm: "4",
        advancedArmorLeftLeg: "5",
        advancedArmorRightLeg: "6",
      })
    );

    const result = store.getState().warhammerDefenderDamage.results;
    expect(result?.request.firstHitLocation).toBe(location);
    expect(result?.request.summary.firstHitLocation).toBe(location);
    const hits =
      result?.entries.filter(
        (entry): entry is WarhammerHumanoidDamageHit =>
          entry.kind === "hit" && entry.targetFamily === "humanoid"
      ) || [];
    const expectedLocations = HIT_LOCATION_CYCLES[location].slice(0, 3);
    const armorByLocation = {
      Head: 1,
      Body: 2,
      "Left Arm": 3,
      "Right Arm": 4,
      "Left Leg": 5,
      "Right Leg": 6,
    };
    expect(hits.map((hit) => hit.location)).toEqual(expectedLocations);
    expect(hits.map((hit) => hit.finalDamage)).toEqual(
      expectedLocations.map((hitLocation) => 30 - armorByLocation[hitLocation])
    );
  }
);
