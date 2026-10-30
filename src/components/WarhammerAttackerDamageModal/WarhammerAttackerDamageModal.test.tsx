import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerAttackerDamageModal from "./WarhammerAttackerDamageModal";
import { WarhammerAttackerDamageInput } from "./WarhammerAttackerDamageTypes";

const initialInput: WarhammerAttackerDamageInput = {
  hits: 3,
  damageDice: 2,
  damageModifier: -1,
  penetration: 4,
  felling: 5,
  devastating: 7,
  proven: 6,
  rfOn: 9,
  rfConfirmsOn: 55,
  alwaysConfirm: false,
  tearing: "tripleTearing",
  firstHitLocation: "Body",
};

test("Clear resets attack inputs to empty placeholder values and removes validation errors", () => {
  const onRoll = jest.fn();
  const { getByLabelText, getByRole, queryByRole } = render(
    <WarhammerAttackerDamageModal
      showModal
      closeWarhammerAttackerDamageModal={() => undefined}
      onRoll={onRoll}
      initialInput={initialInput}
    />
  );

  const hits = getByLabelText("# Hits") as HTMLInputElement;
  expect(hits.value).toBe("3");
  expect(getByLabelText("Triple Tearing")).toBeChecked();

  fireEvent.change(hits, { target: { value: "101" } });
  fireEvent.submit(hits.closest("form") as HTMLFormElement);
  expect(getByRole("alert")).toHaveTextContent("Enter between 1 and 100 hits");
  expect(onRoll).not.toHaveBeenCalled();

  fireEvent.click(getByRole("button", { name: "Clear" }));

  const expectedPlaceholders: Array<[string, string]> = [
    ["# Hits", "1"],
    ["Damage dice count", "1"],
    ["Damage modifier", "0"],
    ["Pen", "0"],
    ["Felling", "0"],
    ["Devastating", "0"],
    ["Proven", "0"],
    ["RF on...", "10"],
    ["Confirms on", "0"],
  ];
  expectedPlaceholders.forEach(([label, placeholder]) => {
    const field = getByLabelText(label) as HTMLInputElement;
    expect(field.value).toBe("");
    expect(field.placeholder).toBe(placeholder);
  });
  expect(getByLabelText("No Tearing")).toBeChecked();
  expect(getByLabelText("Tearing")).not.toBeChecked();
  expect(getByLabelText("Triple Tearing")).not.toBeChecked();
  expect(getByLabelText("Always Confirm")).not.toBeChecked();
  expect(getByLabelText("Confirms on")).not.toBeDisabled();
  expect(queryByRole("alert")).toBeNull();
});
