import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerAttackerDamageForm from "./WarhammerAttackerDamageForm";
import { WarhammerAttackerDamageInput } from "./WarhammerAttackerDamageTypes";
import { WARHAMMER_ATTACKER_DAMAGE_DEFAULTS } from "../../utils/normalizeWarhammerAttackerDamage";

const onRoll = (_input: WarhammerAttackerDamageInput) => undefined;

test("renders editable attack fields and defaults to no tearing", () => {
  const { getByLabelText, getByText } = render(
    <WarhammerAttackerDamageForm onRoll={onRoll} />
  );

  const numericFields: Array<[string, string]> = [
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
  numericFields.forEach(([label, placeholder]) => {
    const input = getByLabelText(label) as HTMLInputElement;
    expect(input.value).toBe("");
    expect(input).toHaveAttribute("placeholder", placeholder);
  });
  expect(getByText("d10 +")).toBeInTheDocument();
  expect(getByLabelText("No Tearing")).toBeChecked();
  expect(getByLabelText("Tearing")).not.toBeChecked();
  expect(getByLabelText("Triple Tearing")).not.toBeChecked();
});

test("keeps numeric entries and allows changing the tearing selection", () => {
  const { getByLabelText } = render(
    <WarhammerAttackerDamageForm onRoll={onRoll} />
  );
  const hits = getByLabelText("# Hits") as HTMLInputElement;
  const damageDice = getByLabelText("Damage dice count") as HTMLInputElement;

  fireEvent.change(hits, { target: { value: "3" } });
  fireEvent.change(damageDice, { target: { value: "2" } });
  fireEvent.click(getByLabelText("Triple Tearing"));

  expect(hits.value).toBe("3");
  expect(damageDice.value).toBe("2");
  expect(getByLabelText("Triple Tearing")).toBeChecked();
  expect(getByLabelText("No Tearing")).not.toBeChecked();
});

test("rejects negative values in non-negative fields", () => {
  const { getByLabelText } = render(
    <WarhammerAttackerDamageForm onRoll={onRoll} />
  );
  const nonNegativeFields = [
    "# Hits",
    "Damage dice count",
    "Pen",
    "Felling",
    "Devastating",
    "Proven",
    "RF on...",
    "Confirms on",
  ];

  nonNegativeFields.forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-1" } });
    expect(input.value).toBe("");
  });

  const damageModifier = getByLabelText("Damage modifier") as HTMLInputElement;
  fireEvent.change(damageModifier, { target: { value: "-1" } });
  expect(damageModifier).toHaveValue(-1);
});

test("submits normalized defaults when inputs are left blank", () => {
  const onRollSpy = jest.fn();
  const { container } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const form = container.querySelector("form");

  expect(form).not.toBeNull();
  fireEvent.submit(form as HTMLFormElement);

  expect(onRollSpy).toHaveBeenCalledWith(WARHAMMER_ATTACKER_DAMAGE_DEFAULTS);
});

test("grays out Confirms on while Always Confirm is ticked", () => {
  const onRollSpy = jest.fn();
  const { container, getByLabelText } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const alwaysConfirm = getByLabelText("Always Confirm");
  const confirmsOn = getByLabelText("Confirms on");

  expect(alwaysConfirm).not.toBeChecked();
  expect(confirmsOn).not.toBeDisabled();

  fireEvent.click(alwaysConfirm);
  expect(alwaysConfirm).toBeChecked();
  expect(confirmsOn).toBeDisabled();

  fireEvent.submit(container.querySelector("form") as HTMLFormElement);
  expect(onRollSpy).toHaveBeenCalledWith({
    ...WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
    alwaysConfirm: true,
  });

  fireEvent.click(alwaysConfirm);
  expect(alwaysConfirm).not.toBeChecked();
  expect(confirmsOn).not.toBeDisabled();
});
