import React from "react";
import { fireEvent, render } from "@testing-library/react";
import AdvancedDefenseModal from "./AdvancedDefenseModal";
import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";
import { ADVANCED_DEFENSE_FIELDS } from "../../utils/advancedDefenses";
import { NON_NEGATIVE_INTEGER_ERROR } from "../../utils/safeInteger";

const renderModal = (
  patch: Partial<WarhammerDefenderDamageDraft> = {},
  onChange = jest.fn(),
  onClose = jest.fn()
) =>
  render(
    <AdvancedDefenseModal
      show
      draft={{ ...EMPTY_DEFENDER_DAMAGE_DRAFT, ...patch }}
      onChange={onChange}
      onClose={onClose}
    />
  );

const ARMOR_LABELS = ADVANCED_DEFENSE_FIELDS.map((field) => `Armor ${field.label}`);
const TOUGHNESS_LABELS = ADVANCED_DEFENSE_FIELDS.map(
  (field) => `+Toughness ${field.label}`
);

test("shows both centered halves with their summary text and twelve zeroed fields", () => {
  const { getByText, getByLabelText } = renderModal();

  expect(getByText("Armor")).toBeInTheDocument();
  expect(getByText("+Toughness")).toBeInTheDocument();
  expect(getByText("Sets armor for specific bodyparts")).toBeInTheDocument();
  expect(getByText("Adds to base TB for specific bodyparts")).toBeInTheDocument();
  [...ARMOR_LABELS, ...TOUGHNESS_LABELS].forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("placeholder", "0");
    expect(input.value).toBe("");
  });
});

test("lays the body out in centred rows with one width for every field", () => {
  const { getByLabelText } = renderModal();

  ARMOR_LABELS.forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    expect(input.previousElementSibling?.tagName).toBe("LABEL");
  });

  // The modal renders outside the render container, so query the document.
  const panel = document.querySelectorAll("fieldset")[0];
  const rows = Array.from(panel.querySelectorAll(".bodyRow"));
  expect(
    rows.map((row) =>
      Array.from(row.querySelectorAll("input")).map((input) =>
        input.getAttribute("aria-label")
      )
    )
  ).toEqual([
    ["Armor Head"],
    ["Armor L. Arm", "Armor Body", "Armor R. Arm"],
    ["Armor L. Leg", "Armor R. Leg"],
  ]);

  // One shared cell class means no body part is wider than another.
  const cells = Array.from(panel.querySelectorAll(".cell"));
  expect(cells).toHaveLength(6);
  expect(new Set(cells.map((cell) => cell.className)).size).toBe(1);
});

test("reports an invalid override and blocks Confirm", () => {
  const onClose = jest.fn();
  const { getByText, getByRole } = renderModal({ advancedArmorBody: "1.5" }, jest.fn(), onClose);

  expect(getByText(NON_NEGATIVE_INTEGER_ERROR)).toBeInTheDocument();
  fireEvent.click(getByRole("button", { name: "Confirm" }));
  expect(onClose).not.toHaveBeenCalled();
});

test("forwards each edit under its own draft field", () => {
  const onChange = jest.fn();
  const { getByLabelText } = renderModal({}, onChange);

  fireEvent.change(getByLabelText("Armor R. Leg"), { target: { value: "4" } });
  expect(onChange).toHaveBeenCalledWith("advancedArmorRightLeg", "4");

  fireEvent.change(getByLabelText("+Toughness Head"), { target: { value: "2" } });
  expect(onChange).toHaveBeenCalledWith("advancedToughnessHead", "2");
});

test("Clear empties all twelve overrides", () => {
  const onChange = jest.fn();
  const { getByRole } = renderModal(
    {
      advancedArmorHead: "4",
      advancedToughnessRightArm: "1",
    },
    onChange
  );

  fireEvent.click(getByRole("button", { name: "Clear" }));
  expect(onChange).toHaveBeenCalledTimes(12);
  ADVANCED_DEFENSE_FIELDS.forEach((field) => {
    expect(onChange).toHaveBeenCalledWith(field.armorField, "");
    expect(onChange).toHaveBeenCalledWith(field.toughnessField, "");
  });
});

test("Confirm closes the editor and keeps the values", () => {
  const onClose = jest.fn();
  const { getByRole } = renderModal({ advancedArmorHead: "4" }, jest.fn(), onClose);

  fireEvent.click(getByRole("button", { name: "Confirm" }));
  expect(onClose).toHaveBeenCalledTimes(1);
});
