import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerDefenderDamageModal from "./WarhammerDefenderDamageModal";
import { EMPTY_DEFENDER_DAMAGE_DRAFT } from "./WarhammerDefenderDamageTypes";

test("renders the defender damage modal, clears the draft, and closes with the standard close button", () => {
  const closeModal = jest.fn();
  const onClear = jest.fn();
  const { getByText } = render(
    <WarhammerDefenderDamageModal
      showModal
      closeWarhammerDefenderDamageModal={closeModal}
      draft={{ ...EMPTY_DEFENDER_DAMAGE_DRAFT }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onClear={onClear}
      clearCounter={0}
    />
  );

  expect(getByText("Defender Damage")).toBeInTheDocument();
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
