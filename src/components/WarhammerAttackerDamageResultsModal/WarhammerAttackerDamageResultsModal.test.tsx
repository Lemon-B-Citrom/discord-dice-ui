import React from "react";
import { applyMiddleware, createStore } from "redux";
import { fireEvent, render } from "@testing-library/react";
import { Provider } from "react-redux";
import reducers from "../../reducers";
import {
  failWarhammerAttackerDamage,
  saveWarhammerAttackerDamageResults,
} from "../../actions/warhammerAttackerDamage.actions";
import { createWarhammerAttackerDamageRollRequestedMiddleware } from "../../middleware/warhammer/warhammerAttackerDamageRollRequested.middleware";
import WarhammerAttackerDamageResultsModal from "./WarhammerAttackerDamageResultsModal";
import WarhammerDefenderDamageForm from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageForm";
import { EMPTY_DEFENDER_DAMAGE_DRAFT } from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import normalizeWarhammerDefenderDamage from "../../utils/normalizeWarhammerDefenderDamage";

const attack = {
  hits: 2,
  damageDice: 1,
  damageModifier: 0,
  penetration: 3,
  felling: 2,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 0,
  alwaysConfirm: false,
  tearing: "none" as const,
  firstHitLocation: "Body" as const,
};

const resultWithDamages = (damages: number[]) => ({
  input: { ...attack, hits: damages.length },
  damages,
  hitDetails: damages.map((damage) => ({
    attempts: [
      {
        baseRolls: [{ roll: damage, damage }],
        righteousFuryRolls: [],
        damage,
      },
    ],
    selectedAttemptIndex: 0,
  })),
});

test("shows formatted per-hit totals and Back reopens the form without rerolling", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults(resultWithDamages([17, 24]))
  );

  const { getAllByRole, getByRole, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  expect(getByText("Pen 3, Fel 2, @body: 17 24")).toBeInTheDocument();
  fireEvent.click(getByText("Back"));

  const state = store.getState();
  expect(state.modalsState.isWarhammerAttackerDamageModalOpen).toBe(true);
  expect(state.warhammerAttackerDamage.isResultsModalOpen).toBe(false);
  expect(state.warhammerAttackerDamage.results?.damages).toEqual([17, 24]);
});

test("copies the Attack summary without a trailing newline", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults(resultWithDamages([17, 24]))
  );
  const originalClipboard = navigator.clipboard;
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });

  const { getByRole } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  fireEvent.click(getByRole("button", { name: "Copy" }));

  expect(writeText).toHaveBeenCalledWith("Pen 3, Fel 2, @body: 17 24");
  expect(writeText.mock.calls[0][0]).not.toMatch(/\n$/);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
});

test("copies a vehicle attacker summary that the defender accepts as input", () => {
  const vehicleAttack = {
    ...attack,
    hits: 1,
    firstHitLocation: "Hull" as const,
  };
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults({
      ...resultWithDamages([17]),
      input: vehicleAttack,
    })
  );
  const originalClipboard = navigator.clipboard;
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  const { getByRole, unmount } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );
  fireEvent.click(getByRole("button", { name: "Copy" }));
  const summary = writeText.mock.calls[0][0];
  expect(summary).toBe("Pen 3, Fel 2, @hull: 17");
  unmount();

  const draft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: summary,
    facing: "Side",
  };
  const onChange = jest.fn();
  const form = render(
    <WarhammerDefenderDamageForm
      draft={draft}
      errors={{}}
      onChange={onChange}
      onCalculate={jest.fn()}
    />
  );
  expect(form.getByLabelText("AP Front")).toBeInTheDocument();
  expect(normalizeWarhammerDefenderDamage(draft).request).toMatchObject({
    targetFamily: "vehicle",
    firstHitLocation: "Hull",
    vehicleFacing: "Side",
  });
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: originalClipboard,
  });
});

test("shows the webhook size warning without removing local results or Copy", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults(resultWithDamages([17, 24]))
  );
  store.dispatch(
    failWarhammerAttackerDamage(
      "The attack summary is too large to send to Discord. Local results and Copy are still available; reduce the number of hits or simplify the summary, then calculate again."
    )
  );

  const { getByRole, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  expect(getByRole("alert")).toHaveTextContent("too large to send to Discord");
  expect(getByText("Pen 3, Fel 2, @body: 17 24")).toBeInTheDocument();
  expect(getByRole("button", { name: "Copy" })).toBeInTheDocument();
});

test("re-rolls the full attack repeatedly using its original input", () => {
  const firstReroll = resultWithDamages([18, 26]);
  const secondReroll = resultWithDamages([22, 29]);
  const calculateAttack = jest
    .fn()
    .mockReturnValueOnce(firstReroll)
    .mockReturnValueOnce(secondReroll);
  const store = createStore(
    reducers,
    applyMiddleware(
      createWarhammerAttackerDamageRollRequestedMiddleware(calculateAttack)
    )
  );
  store.dispatch(
    saveWarhammerAttackerDamageResults(resultWithDamages([17, 24]))
  );

  const { getAllByRole, getByRole, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  fireEvent.click(getByRole("button", { name: "Re-roll Attack" }));
  expect(calculateAttack).toHaveBeenNthCalledWith(1, attack, "warhammer4eSL");
  expect(getByText("Pen 3, Fel 2, @body: 18 26")).toBeInTheDocument();

  fireEvent.click(getByRole("button", { name: "Re-roll Attack" }));
  expect(calculateAttack).toHaveBeenNthCalledWith(2, attack, "warhammer4eSL");
  expect(getByText("Pen 3, Fel 2, @body: 22 29")).toBeInTheDocument();
});

test("keeps the last successful results visible when an attack reroll fails", () => {
  const store = createStore(
    reducers,
    applyMiddleware(
      createWarhammerAttackerDamageRollRequestedMiddleware(() => {
        throw new Error("Reroll failed");
      })
    )
  );
  store.dispatch(
    saveWarhammerAttackerDamageResults(resultWithDamages([17, 24]))
  );

  const { getByRole, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  fireEvent.click(getByRole("button", { name: "Re-roll Attack" }));

  expect(getByText("Pen 3, Fel 2, @body: 17 24")).toBeInTheDocument();
  expect(getByRole("alert")).toHaveTextContent("Reroll failed");
  expect(store.getState().warhammerAttackerDamage.isResultsModalOpen).toBe(
    true
  );
});

test("shows per-hit equations with selected tearing damage first and a gray comparison", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults({
      input: { ...attack, hits: 1, damageModifier: 2, tearing: "tearing" },
      damages: [16],
      hitDetails: [
        {
          attempts: [
            {
              baseRolls: [{ roll: 8, damage: 8 }],
              righteousFuryRolls: [],
              damage: 10,
            },
            {
              baseRolls: [{ roll: 10, damage: 10 }],
              righteousFuryRolls: [4],
              damage: 16,
            },
          ],
          selectedAttemptIndex: 1,
        },
      ],
    })
  );

  const { getAllByRole, getByRole, getByText, queryByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  expect(document.querySelectorAll("img.profileDie")).toHaveLength(1);
  expect(document.querySelectorAll(".hitArrow")).toHaveLength(1);
  expect(getByText("1d10")).toBeInTheDocument();
  expect(getByText("Felling")).toHaveTextContent("Felling 2");
  expect(getByText("Penetration")).toHaveTextContent("Penetration 3");
  expect(queryByText("No Tearing")).toBeNull();
  expect(getByText("Tearing")).toBeInTheDocument();
  expect(getByText("Righteous Fury!")).toBeInTheDocument();
  expect(getByRole("group", { name: "Selected attempt" })).toHaveTextContent(
    "10 + 4 + 2 = 16"
  );
  expect(getByText("#1:").parentElement).toHaveTextContent(
    /#1:\s*Righteous Fury!\s*16/
  );
  const hitHeading = getByText("#1:").parentElement;
  expect(hitHeading?.children[0]).toHaveClass("hitLabel");
  expect(hitHeading?.children[1]).toHaveClass("hitArrow");
  expect(getByRole("group", { name: "Discarded attempt" })).toHaveTextContent(
    "8 + 2 = 10"
  );
  const summary = getByText("Pen 3, Fel 2, @body: 16(12)");
  expect(summary).toHaveClass("codeSpan");
  expect(summary.parentElement).toHaveClass("summary");
  expect(summary.parentElement?.previousElementSibling?.tagName).toBe("HR");
  expect(getByRole("group", { name: "Discarded attempt" })).toHaveClass(
    "discardedAttempt"
  );
  const hitContent = getByText("#1:").parentElement?.parentElement;
  const hitMath = hitContent?.querySelector(".hitMath");
  expect(hitMath).not.toHaveTextContent("(");
  expect(hitMath).not.toHaveTextContent(")");
  expect(
    Array.from(hitMath?.querySelectorAll(".codeSpan") || []).map(
      (number) => number.textContent
    )
  ).toEqual(["10", "4", "8"]);
  expect(hitMath?.querySelector(".selectedDamage .codeSpan")).toBeNull();
  expect(
    Array.from(
      getByRole("group", { name: "Selected attempt" }).querySelectorAll(
        ".equation .codeSpan"
      )
    ).map((number) => number.textContent)
  ).toEqual(["10", "4"]);
});

test("labels multiple Fury bonus dice and annotates Proven adjustments", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults({
      input: { ...attack, hits: 1, proven: 7 },
      damages: [22],
      hitDetails: [
        {
          attempts: [
            {
              baseRolls: [{ roll: 3, damage: 7 }],
              righteousFuryRolls: [10, 5],
              damage: 22,
            },
          ],
          selectedAttemptIndex: 0,
        },
      ],
    })
  );

  const { getByRole, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  expect(getByText("Righteous Fury x2!")).toBeInTheDocument();
  expect(getByRole("group", { name: "Selected attempt" })).toHaveTextContent(
    "7 + 10 + 5 = 22"
  );
  expect(getByRole("group", { name: "Selected attempt" })).toHaveTextContent(
    "Proven: 3 → 7"
  );
});

test("shows all triple-tearing attempts after the selected damage in descending order", () => {
  const store = createStore(reducers);
  store.dispatch(
    saveWarhammerAttackerDamageResults({
      input: { ...attack, hits: 1, tearing: "tripleTearing" },
      damages: [20],
      hitDetails: [
        {
          attempts: [
            {
              baseRolls: [{ roll: 10, damage: 10 }],
              righteousFuryRolls: [],
              damage: 10,
            },
            {
              baseRolls: [{ roll: 15, damage: 15 }],
              righteousFuryRolls: [],
              damage: 15,
            },
            {
              baseRolls: [{ roll: 20, damage: 20 }],
              righteousFuryRolls: [],
              damage: 20,
            },
          ],
          selectedAttemptIndex: 2,
        },
      ],
    })
  );

  const { getAllByRole, getAllByText, getByText } = render(
    <Provider store={store}>
      <WarhammerAttackerDamageResultsModal />
    </Provider>
  );

  const attempts = getAllByRole("group");
  expect(attempts).toHaveLength(3);
  expect(attempts[0]).toHaveAttribute("aria-label", "Selected attempt");
  expect(attempts[0]).toHaveTextContent("20 = 20");
  expect(attempts[1]).toHaveTextContent("15 = 15");
  expect(attempts[2]).toHaveTextContent("10 = 10");
  expect(getByText("#1:").parentElement).toHaveTextContent("20");
  expect(getAllByText(">", { exact: true })).toHaveLength(2);
});
