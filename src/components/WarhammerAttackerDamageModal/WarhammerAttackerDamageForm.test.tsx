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

  expect(getByLabelText("# Hits")).toHaveValue(null);
  expect(getByLabelText("# Hits")).toHaveAttribute("placeholder", "1");
  expect(getByLabelText("Damage dice count")).toHaveValue(null);
  expect(getByLabelText("Damage dice count")).toHaveAttribute("placeholder", "1");
  expect(getByLabelText("Damage modifier")).toHaveValue(null);
  expect(getByLabelText("Damage modifier")).toHaveAttribute("placeholder", "0");
  expect(getByLabelText("Pen")).toHaveValue(null);
  expect(getByLabelText("Pen")).toHaveAttribute("placeholder", "0");
  expect(getByLabelText("Felling")).toHaveValue(null);
  expect(getByLabelText("Felling")).toHaveAttribute("placeholder", "0");
  expect(getByLabelText("Proven")).toHaveValue(null);
  expect(getByLabelText("Proven")).toHaveAttribute("placeholder", "0");
  expect(getByLabelText("RF on...")).toHaveValue(null);
  expect(getByLabelText("RF on...")).toHaveAttribute("placeholder", "10");
  expect(getByLabelText("Confirms on")).toHaveValue(null);
  expect(getByLabelText("Confirms on")).toHaveAttribute("placeholder", "0");
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
    "Proven",
    "RF on...",
    "Confirms on",
  ];

  nonNegativeFields.forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "-1" } });
    expect(input).toHaveValue(null);
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
