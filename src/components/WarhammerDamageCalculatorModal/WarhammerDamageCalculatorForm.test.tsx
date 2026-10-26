import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerDamageCalculatorForm from "./WarhammerDamageCalculatorForm";
import {
  EMPTY_DAMAGE_DRAFT,
  WarhammerDamageDraft,
} from "./WarhammerDamageCalculatorTypes";

const renderForm = (
  draft: WarhammerDamageDraft = { ...EMPTY_DAMAGE_DRAFT },
  onCalculate = jest.fn()
) =>
  render(
    <WarhammerDamageCalculatorForm
      draft={draft}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={onCalculate}
    />
  );

test("keeps the existing field controls and zero minimums", () => {
  const { getByLabelText, getByPlaceholderText } = renderForm();
  expect(getByPlaceholderText("Attack summary string")).toHaveAttribute(
    "type",
    "text"
  );

  [
    "Toughness Bonus",
    "Fortitude #",
    "AP Head",
    "AP Body",
    "AP Arms",
    "AP Legs",
    "True Hits",
    "Mag per",
    "Devastating",
    "Wounds per",
  ].forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("placeholder", "0");
    expect(input.value).toBe("");
  });
});

test("blocks invalid submission and associates the summary error with its input", () => {
  const onCalculate = jest.fn();
  const { getByPlaceholderText, getByText } = renderForm(
    { ...EMPTY_DAMAGE_DRAFT },
    onCalculate
  );
  fireEvent.submit(getByPlaceholderText("Attack summary string").closest("form") as HTMLFormElement);

  const summary = getByPlaceholderText("Attack summary string");
  expect(onCalculate).not.toHaveBeenCalled();
  expect(summary).toHaveAttribute("aria-invalid", "true");
  expect(summary).toHaveAttribute(
    "aria-describedby",
    "damage-calculator-attack-summary-error"
  );
  expect(getByText(/Use the format: Pen X, Fel Y/)).toBeInTheDocument();
});

test("passes a valid raw draft to calculation", () => {
  const onCalculate = jest.fn();
  const draft = {
    ...EMPTY_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0: 12",
    firstHitLocation: "Head",
  };
  const { getByPlaceholderText } = renderForm(draft, onCalculate);
  fireEvent.submit(getByPlaceholderText("Attack summary string").closest("form") as HTMLFormElement);
  expect(onCalculate).toHaveBeenCalledWith(draft);
});

test("places Fortitude between Toughness and the location selector and forwards edits", () => {
  const onChange = jest.fn();
  const { getByLabelText } = render(<WarhammerDamageCalculatorForm draft={{ ...EMPTY_DAMAGE_DRAFT }} errors={{}} onChange={onChange} onCalculate={jest.fn()} />);
  const toughness = getByLabelText("Toughness Bonus");
  const fortitude = getByLabelText("Fortitude #");
  const location = getByLabelText("First Hit Location");
  expect(toughness.compareDocumentPosition(fortitude) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(fortitude.compareDocumentPosition(location) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.change(fortitude, { target: { value: "3" } });
  expect(onChange).toHaveBeenCalledWith("fortitude", "3");
});

test("blocks invalid Fortitude and associates its error with the input", () => {
  const onCalculate = jest.fn();
  const { getByLabelText, getByPlaceholderText } = renderForm({ ...EMPTY_DAMAGE_DRAFT, attackSummaryString: "Pen 0, Fel 0: 12,", firstHitLocation: "Body", fortitude: "1.5" }, onCalculate);
  fireEvent.submit(getByPlaceholderText("Attack summary string").closest("form") as HTMLFormElement);
  expect(onCalculate).not.toHaveBeenCalled();
  expect(getByLabelText("Fortitude #")).toHaveAttribute("aria-invalid", "true");
  expect(getByLabelText("Fortitude #")).toHaveAttribute("aria-describedby", "damage-calculator-fortitude-error");
});
