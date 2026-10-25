import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerAttackCalculatorForm from "./WarhammerAttackCalculatorForm";

test("renders editable attack fields and defaults to no tearing", () => {
  const { getByLabelText, getByText } = render(
    <WarhammerAttackCalculatorForm />
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
  const { getByLabelText } = render(<WarhammerAttackCalculatorForm />);
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
