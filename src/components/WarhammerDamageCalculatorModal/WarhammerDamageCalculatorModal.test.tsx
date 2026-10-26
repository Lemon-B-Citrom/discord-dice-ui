import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerDamageCalculatorModal from "./WarhammerDamageCalculatorModal";
import { EMPTY_DAMAGE_DRAFT } from "./WarhammerDamageCalculatorTypes";

test("renders the calculator, clears the draft, and closes with the standard close button", () => {
  const closeModal = jest.fn();
  const onClear = jest.fn();
  const { getByText } = render(
    <WarhammerDamageCalculatorModal
      showModal
      closeWarhammerDamageCalculatorModal={closeModal}
      draft={{ ...EMPTY_DAMAGE_DRAFT }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onClear={onClear}
      clearCounter={0}
    />
  );

  expect(getByText("Damage Calculator")).toBeInTheDocument();
  expect(
    document.querySelector('input[placeholder="Attack summary string"]')
  ).toBeInTheDocument();
  expect(getByText("Horde Options")).toBeInTheDocument();
  expect(getByText("Calculate").closest("button")).not.toBeDisabled();
  expect(getByText("Clear").closest("button")).toBeInTheDocument();
  fireEvent.click(getByText("Clear").closest("button") as HTMLElement);
  expect(onClear).toHaveBeenCalledTimes(1);

  const closeButton = getByText("Close").closest("button");
  expect(closeButton).not.toBeNull();
  fireEvent.click(closeButton as HTMLElement);

  expect(closeModal).toHaveBeenCalledTimes(1);
});
