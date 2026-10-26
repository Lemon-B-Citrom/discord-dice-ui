import React from "react";
import { applyMiddleware, createStore } from "redux";
import { Provider } from "react-redux";
import { fireEvent, render } from "@testing-library/react";
import reducers from "../../reducers";
import {
  changeWarhammerDefenderDamageDraft,
  requestWarhammerDefenderDamage,
} from "../../actions/warhammerDefenderDamage.actions";
import { openWarhammerDefenderDamageModal } from "../../actions/modals";
import { createWarhammerDefenderDamageCalculationRequestedMiddleware } from "../../middleware/warhammer/warhammerDefenderDamageCalculationRequested.middleware";
import WarhammerDefenderDamageResultsModal from "../WarhammerDefenderDamageResultsModal/WarhammerDefenderDamageResultsModal";
import { WarhammerDefenderDamageDraft } from "./WarhammerDefenderDamageTypes";

const draft: WarhammerDefenderDamageDraft = {
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
  woundsPer: "",
};

const createDamageStore = () =>
  createStore(reducers, applyMiddleware(createWarhammerDefenderDamageCalculationRequestedMiddleware()));

test("Back returns to the exact raw draft without recalculating", () => {
  const draftWithFortitude = { ...draft, fortitude: "02", attackSummaryString: "Pen 0, Fel 0: 12, 8, " };
  const store = createDamageStore();
  store.dispatch(openWarhammerDefenderDamageModal());
  Object.keys(draftWithFortitude).forEach((key) => {
    const field = key as keyof WarhammerDefenderDamageDraft;
    store.dispatch(changeWarhammerDefenderDamageDraft(field, draftWithFortitude[field]));
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

  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(true);
  expect(store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen).toBe(false);
  expect(store.getState().warhammerDefenderDamage.draft).toEqual(savedDraft);
  expect(store.getState().warhammerDefenderDamage.results).toBe(savedSnapshot);
});

test("renders doubled Toughness before Felling only on protected hits", () => {
  const store = createDamageStore();
  store.dispatch(requestWarhammerDefenderDamage({ ...draft, attackSummaryString: "Pen 0, Fel 2: 20, 20,", toughnessBonus: "6", fortitude: "1" }));
  const { getByRole } = render(<Provider store={store}><WarhammerDefenderDamageResultsModal /></Provider>);
  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent("10 = 20 − Toughness (6 × 2 − 2 = 10)");
  expect(getByRole("group", { name: "Hit 2" })).toHaveTextContent("16 = 20 − Toughness (6 − 2 = 4)");
});

test("renders the independent Horde Fortitude quotas in damage equations", () => {
  const store = createDamageStore();
  store.dispatch(requestWarhammerDefenderDamage({
    ...draft, attackSummaryString: "Pen 0, Fel 2: 20, 20, 20, 20, 20,",
    toughnessBonus: "6", fortitude: "1", trueHits: "2", magPer: "6", woundsPer: "20",
  }));
  const { getByRole } = render(<Provider store={store}><WarhammerDefenderDamageResultsModal /></Provider>);
  [1, 3, 4].forEach((number) => expect(getByRole("group", { name: `Hit ${number}` })).toHaveTextContent("Damage: 10 = 20 − Toughness (6 × 2 − 2 = 10)"));
  [2, 5].forEach((number) => expect(getByRole("group", { name: `Hit ${number}` })).toHaveTextContent("Damage: 16 = 20 − Toughness (6 − 2 = 4)"));
});

test("middleware rejects a direct invalid request and keeps the input open", () => {
  const store = createDamageStore();
  store.dispatch(openWarhammerDefenderDamageModal());
  store.dispatch(requestWarhammerDefenderDamage({ ...draft, attackSummaryString: "bad" }));
  expect(store.getState().modalsState.isWarhammerDefenderDamageModalOpen).toBe(true);
  expect(store.getState().modalsState.isWarhammerDefenderDamageResultsModalOpen).toBe(false);
  expect(store.getState().warhammerDefenderDamage.errors.attackSummaryString).toBeTruthy();
});

test("Horde modal labels the damage and magnitude equations after the hit heading", () => {
  const store = createDamageStore();
  store.dispatch(requestWarhammerDefenderDamage({
    ...draft,
    attackSummaryString: "Pen 0, Dev 1: 12, 8",
    trueHits: "1",
    magPer: "6",
    woundsPer: "10",
  }));
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
  store.dispatch(requestWarhammerDefenderDamage({
    ...draft,
    attackSummaryString: "Pen 8, Fel 0: 30, 27, 20, 31, 25, 28",
    toughnessBonus: "12",
    armorBody: "10",
    armorLegs: "8",
    firstHitLocation: "Right Leg",
  }));
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "18 = 30 − Armor (8 − 8 = 0) − Toughness (12)"
  );
  expect(getByRole("group", { name: "Hit 1" })).not.toHaveTextContent("max(");
  expect(store.getState().warhammerDefenderDamage.results?.totals.damage).toBe(83);
});

test("renders fully mitigated damage as zero instead of subtracting it from the total", () => {
  const store = createDamageStore();
  store.dispatch(requestWarhammerDefenderDamage({
    ...draft,
    attackSummaryString: "Pen 0, Fel 0: 1, 20",
    toughnessBonus: "3",
    armorBody: "4",
  }));
  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerDefenderDamageResultsModal />
    </Provider>
  );

  expect(getByRole("group", { name: "Hit 1" })).toHaveTextContent(
    "0 = 1 − Armor (4) − Toughness (3)"
  );
  expect(store.getState().warhammerDefenderDamage.results?.totals.damage).toBe(13);
});
