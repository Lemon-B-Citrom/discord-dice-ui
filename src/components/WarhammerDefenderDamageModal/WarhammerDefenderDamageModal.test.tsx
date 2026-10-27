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

test("keeps the advanced editor shut until the box is ticked", () => {
  const { getByRole } = render(
    <WarhammerDefenderDamageModal
      showModal
      closeWarhammerDefenderDamageModal={jest.fn()}
      draft={{ ...EMPTY_DEFENDER_DAMAGE_DRAFT }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onClear={jest.fn()}
      clearCounter={0}
    />
  );

  expect(getByRole("checkbox", { name: "Advanced" })).not.toBeChecked();
  expect(getByRole("button", { name: "Advanced" })).toBeDisabled();
});

test("opens the advanced editor over the modal without closing it", () => {
  const closeModal = jest.fn();
  const { getByRole, getByText, queryByText } = render(
    <WarhammerDefenderDamageModal
      showModal
      closeWarhammerDefenderDamageModal={closeModal}
      draft={{ ...EMPTY_DEFENDER_DAMAGE_DRAFT, advancedEnabled: true }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onClear={jest.fn()}
      clearCounter={0}
    />
  );

  expect(queryByText("Advanced Defenses")).not.toBeInTheDocument();
  expect(getByRole("checkbox", { name: "Advanced" })).toBeChecked();

  fireEvent.click(getByRole("button", { name: "Advanced" }));
  expect(getByText("Advanced Defenses")).toBeInTheDocument();

  fireEvent.click(getByRole("button", { name: "Confirm" }));
  expect(closeModal).not.toHaveBeenCalled();
  expect(getByText("Defender Damage")).toBeInTheDocument();
});
