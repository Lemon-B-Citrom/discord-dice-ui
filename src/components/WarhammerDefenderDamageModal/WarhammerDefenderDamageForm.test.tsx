import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerDefenderDamageForm from "./WarhammerDefenderDamageForm";
import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
} from "./WarhammerDefenderDamageTypes";

const renderForm = (
  draft: WarhammerDefenderDamageDraft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, @body: 1",
  },
  onCalculate = jest.fn()
) =>
  render(
    <WarhammerDefenderDamageForm
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
    "Bonus Hits",
    "Mag per",
    "Wounds per",
  ].forEach((label) => {
    const input = getByLabelText(label) as HTMLInputElement;
    expect(input).toHaveAttribute("type", "number");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("placeholder", "0");
    expect(input.value).toBe("");
  });
});

test("defaults to humanoid defenses without a summary and hides them for invalid text", () => {
  const empty = renderForm({ ...EMPTY_DEFENDER_DAMAGE_DRAFT });
  expect(empty.getByLabelText("AP Body")).toBeInTheDocument();
  expect(() => empty.getByLabelText("Facing")).toThrow();
  empty.unmount();

  const invalid = renderForm({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "not a valid summary",
  });
  expect(() => invalid.getByLabelText("AP Body")).toThrow();
  invalid.unmount();

  const humanoid = renderForm({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, @body: 1",
  });
  expect(humanoid.getByLabelText("AP Body")).toBeInTheDocument();
});

test("places vehicle Facing in the left column and armor AP fields in the right", () => {
  const { container, getByLabelText } = renderForm({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, @hull: 1",
  });
  const facing = getByLabelText("Facing");
  const leftColumn = container.querySelector(".defensePrimary");
  const rightColumn = container.querySelector(".armorFields");

  expect(leftColumn?.contains(facing)).toBe(true);
  expect(rightColumn?.contains(facing)).toBe(false);
  expect(rightColumn).toHaveTextContent("AP Front");
  expect(
    Array.from(facing.querySelectorAll("option")).map((option) => option.value)
  ).toEqual(["", "Front", "Side", "Rear"]);
});

test("associates the required vehicle facing error with its control", () => {
  const { getByLabelText, getByText } = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @hull: 1",
      }}
      errors={{ facing: "Choose a facing" }}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
    />
  );

  const facing = getByLabelText("Facing");
  expect(facing).toHaveAttribute(
    "aria-describedby",
    "defender-damage-facing-error"
  );
  expect(getByText("Choose a facing")).toHaveAttribute(
    "id",
    "defender-damage-facing-error"
  );
});

test("blocks invalid submission and associates the summary error with its input", () => {
  const onCalculate = jest.fn();
  const { getByPlaceholderText, getByText } = renderForm(
    { ...EMPTY_DEFENDER_DAMAGE_DRAFT },
    onCalculate
  );
  fireEvent.submit(
    getByPlaceholderText("Attack summary string").closest(
      "form"
    ) as HTMLFormElement
  );

  const summary = getByPlaceholderText("Attack summary string");
  expect(onCalculate).not.toHaveBeenCalled();
  expect(summary).toHaveAttribute("aria-invalid", "true");
  expect(summary).toHaveAttribute(
    "aria-describedby",
    "defender-damage-attack-summary-error"
  );
  expect(getByText(/first hit location/)).toBeInTheDocument();
});

test("passes a valid raw draft to calculation", () => {
  const onCalculate = jest.fn();
  const draft = {
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, Fel 0, @body: 12",
  };
  const { getByPlaceholderText } = renderForm(draft, onCalculate);
  fireEvent.submit(
    getByPlaceholderText("Attack summary string").closest(
      "form"
    ) as HTMLFormElement
  );
  expect(onCalculate).toHaveBeenCalledWith(draft);
});

test("gates Horde mode behind a labelled Enable box in the first grid cell", () => {
  const onChange = jest.fn();
  const off = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
      }}
      errors={{}}
      onChange={onChange}
      onCalculate={jest.fn()}
    />
  );

  const enable = off.getByLabelText("Enable");
  expect(enable).not.toBeChecked();
  ["Wounds per", "Bonus Hits", "Mag per"].forEach((label) => {
    expect(off.getByLabelText(label)).toBeDisabled();
  });

  // Grid flow fills two columns in DOM order, so this is Enable / Wounds per on
  // the first line and Bonus Hits / Mag per on the second.
  const order = [
    enable,
    off.getByLabelText("Wounds per"),
    off.getByLabelText("Bonus Hits"),
    off.getByLabelText("Mag per"),
  ];
  order.slice(1).forEach((field, index) => {
    expect(
      order[index].compareDocumentPosition(field) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  fireEvent.click(enable);
  expect(onChange).toHaveBeenCalledWith("hordeEnabled", true);
  off.unmount();

  const on = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
        hordeEnabled: true,
      }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
    />
  );
  expect(on.getByLabelText("Enable")).toBeChecked();
  ["Wounds per", "Bonus Hits", "Mag per"].forEach((label) => {
    expect(on.getByLabelText(label)).not.toBeDisabled();
  });
});

test("places Fortitude after Toughness and has no first-location selector", () => {
  const onChange = jest.fn();
  const { getByLabelText } = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
      }}
      errors={{}}
      onChange={onChange}
      onCalculate={jest.fn()}
    />
  );
  const toughness = getByLabelText("Toughness Bonus");
  const fortitude = getByLabelText("Fortitude #");
  expect(
    toughness.compareDocumentPosition(fortitude) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(() => getByLabelText("First Hit Location")).toThrow();
  fireEvent.change(fortitude, { target: { value: "3" } });
  expect(onChange).toHaveBeenCalledWith("fortitude", "3");
});

test("blocks invalid Fortitude and associates its error with the input", () => {
  const onCalculate = jest.fn();
  const { getByLabelText, getByPlaceholderText } = renderForm(
    {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, Fel 0, @body: 12 ",
      fortitude: "1.5",
    },
    onCalculate
  );
  fireEvent.submit(
    getByPlaceholderText("Attack summary string").closest(
      "form"
    ) as HTMLFormElement
  );
  expect(onCalculate).not.toHaveBeenCalled();
  expect(getByLabelText("Fortitude #")).toHaveAttribute("aria-invalid", "true");
  expect(getByLabelText("Fortitude #")).toHaveAttribute(
    "aria-describedby",
    "defender-damage-fortitude-error"
  );
});

test("requires the location token in the summary and associates the error with Input", () => {
  const onCalculate = jest.fn();
  const { getByLabelText, getByPlaceholderText, getByText } = renderForm(
    {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0: 12",
    },
    onCalculate
  );
  const input = getByPlaceholderText("Attack summary string");
  fireEvent.submit(input.closest("form") as HTMLFormElement);
  expect(onCalculate).not.toHaveBeenCalled();
  expect(getByLabelText("Input")).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute(
    "aria-describedby",
    "defender-damage-attack-summary-error"
  );
  expect(getByText(/@head, @body, @larm/)).toBeInTheDocument();
});

const ARMOR_LABELS = ["AP Head", "AP Body", "AP Arms", "AP Legs"];

test("disables the simple armor fields only while advanced mode is on", () => {
  const enabled = renderForm({
    ...EMPTY_DEFENDER_DAMAGE_DRAFT,
    attackSummaryString: "Pen 0, @body: 1",
    advancedEnabled: true,
  });
  ARMOR_LABELS.forEach((label) => {
    expect(enabled.getByLabelText(label)).toBeDisabled();
  });
  enabled.unmount();

  const disabled = renderForm();
  ARMOR_LABELS.forEach((label) => {
    expect(disabled.getByLabelText(label)).not.toBeDisabled();
  });
});

test("toggles advanced mode as a boolean draft field", () => {
  const onChange = jest.fn();
  const { getByRole } = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
      }}
      errors={{}}
      onChange={onChange}
      onCalculate={jest.fn()}
    />
  );

  fireEvent.click(getByRole("checkbox", { name: "Advanced" }));
  expect(onChange).toHaveBeenCalledWith("advancedEnabled", true);
});

test("opens the advanced editor from its button only once advanced is on", () => {
  const onOpenAdvanced = jest.fn();
  const off = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
      }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onOpenAdvanced={onOpenAdvanced}
    />
  );
  const offButton = off.getByRole("button", { name: "Advanced" });
  expect(offButton).toBeDisabled();
  fireEvent.click(offButton);
  expect(onOpenAdvanced).not.toHaveBeenCalled();
  off.unmount();

  const on = render(
    <WarhammerDefenderDamageForm
      draft={{
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: "Pen 0, @body: 1",
        advancedEnabled: true,
      }}
      errors={{}}
      onChange={jest.fn()}
      onCalculate={jest.fn()}
      onOpenAdvanced={onOpenAdvanced}
    />
  );
  const onButton = on.getByRole("button", { name: "Advanced" });
  expect(onButton).not.toBeDisabled();
  fireEvent.click(onButton);
  expect(onOpenAdvanced).toHaveBeenCalledTimes(1);
});

test("blocks the calculation and points at the advanced values", () => {
  const onCalculate = jest.fn();
  const { getByText, getByPlaceholderText } = renderForm(
    {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, Fel 0, @body: 12",
      advancedEnabled: true,
      advancedArmorHead: "1.5",
    },
    onCalculate
  );

  fireEvent.submit(
    getByPlaceholderText("Attack summary string").closest(
      "form"
    ) as HTMLFormElement
  );
  expect(onCalculate).not.toHaveBeenCalled();
  expect(
    getByText("Check the Advanced armor and Toughness values")
  ).toBeInTheDocument();
});
