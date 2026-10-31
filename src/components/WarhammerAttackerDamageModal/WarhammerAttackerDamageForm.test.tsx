import React from "react";
import { fireEvent, render } from "@testing-library/react";
import WarhammerAttackerDamageForm from "./WarhammerAttackerDamageForm";
import { WarhammerAttackerDamageInput } from "./WarhammerAttackerDamageTypes";
import { WARHAMMER_ATTACKER_DAMAGE_DEFAULTS } from "../../utils/normalizeWarhammerAttackerDamage";

const onRoll = (_input: WarhammerAttackerDamageInput) => undefined;

test("renders editable attack fields and defaults to no tearing", () => {
  const { container, getByLabelText, getByText } = render(
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
  expect(getByLabelText("Humanoid")).toBeInTheDocument();
  expect(getByLabelText("Vehicle")).toBeInTheDocument();
  expect(
    getByLabelText("Vehicle").querySelector('option[value=""]')
  ).toBeDisabled();
  expect(getByText("First Hit Location")).toBeInTheDocument();
  const tearingFieldset = container.querySelector("fieldset");
  const locationGroup = tearingFieldset?.nextElementSibling;
  expect(locationGroup?.querySelector("legend")).toHaveTextContent(
    "First Hit Location"
  );
  expect(tearingFieldset?.parentElement).toBe(locationGroup?.parentElement);
  expect(getByLabelText("Humanoid")).not.toHaveClass("locationControlActive");
  expect(getByLabelText("Vehicle")).not.toHaveClass("locationControlActive");
});

test.each(["Head", "Body", "Left Arm", "Right Arm", "Left Leg", "Right Leg"])(
  "submits the selected full-name location %s",
  (location) => {
    const onRollSpy = jest.fn();
    const { container, getByRole } = render(
      <WarhammerAttackerDamageForm onRoll={onRollSpy} />
    );
    fireEvent.click(getByRole("button", { name: "Humanoid" }));
    fireEvent.click(getByRole("menuitemradio", { name: location }));
    expect(
      getByRole("button", { name: `First Hit Location: ${location}` })
    ).toHaveClass("locationControlActive");
    expect(
      container.querySelector("#attacker-damage-vehicle-hit-location")
    ).not.toHaveClass("locationControlActive");
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(onRollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ firstHitLocation: location })
    );
  }
);

test.each(["Motive Systems", "Hull", "Weapons", "Turret"])(
  "submits vehicle location %s and replaces the Humanoid selection",
  (location) => {
    const onRollSpy = jest.fn();
    const { container } = render(
      <WarhammerAttackerDamageForm onRoll={onRollSpy} />
    );
    fireEvent.change(
      container.querySelector(
        "#attacker-damage-vehicle-hit-location"
      ) as HTMLSelectElement,
      { target: { value: location } }
    );
    expect(
      container.querySelector("#attacker-damage-vehicle-hit-location")
    ).toHaveClass("locationControlActive");
    expect(
      container.querySelector("#attacker-damage-first-hit-location")
    ).not.toHaveClass("locationControlActive");
    fireEvent.submit(container.querySelector("form") as HTMLFormElement);
    expect(onRollSpy).toHaveBeenCalledWith(
      expect.objectContaining({ firstHitLocation: location })
    );
    expect(
      container.querySelector("#attacker-damage-first-hit-location")
    ).not.toHaveTextContent(location);
  }
);

test("switches the selected location from vehicle to humanoid and back", () => {
  const onRollSpy = jest.fn();
  const { container, getByRole } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const vehicle = container.querySelector(
    "#attacker-damage-vehicle-hit-location"
  ) as HTMLSelectElement;
  fireEvent.change(vehicle, { target: { value: "Hull" } });
  fireEvent.click(getByRole("button", { name: "Humanoid" }));
  fireEvent.click(getByRole("menuitemradio", { name: "Left Leg" }));
  expect(vehicle.value).toBe("");
  expect(vehicle.querySelector('option[value=""]')).toHaveTextContent(
    "Vehicle"
  );
  fireEvent.change(vehicle, { target: { value: "Turret" } });
  expect(getByRole("button", { name: "Humanoid" })).toBeInTheDocument();
  expect(vehicle.value).toBe("Turret");
  expect(vehicle.querySelector('option[value=""]')).toBeNull();
});

test("requires a location and reports its validation error", () => {
  const onRollSpy = jest.fn();
  const { container, getAllByText } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  fireEvent.submit(container.querySelector("form") as HTMLFormElement);
  expect(onRollSpy).not.toHaveBeenCalled();
  expect(getAllByText("Choose a first hit location")[0]).toHaveAttribute(
    "role",
    "alert"
  );
});

test("restores the saved first hit location", () => {
  const initialInput: WarhammerAttackerDamageInput = {
    ...WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
    firstHitLocation: "Right Leg",
  };
  const { getByRole } = render(
    <WarhammerAttackerDamageForm onRoll={onRoll} initialInput={initialInput} />
  );

  expect(
    getByRole("button", { name: "First Hit Location: Right Leg" })
  ).toHaveTextContent("Right Leg");
});

test("allows a valid submission after selecting a location to fix validation", () => {
  const onRollSpy = jest.fn();
  const { container, getByRole, queryAllByRole } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const form = container.querySelector("form") as HTMLFormElement;

  fireEvent.submit(form);
  expect(onRollSpy).not.toHaveBeenCalled();

  fireEvent.click(getByRole("button", { name: "Humanoid" }));
  fireEvent.click(getByRole("menuitemradio", { name: "Head" }));
  fireEvent.submit(form);

  expect(onRollSpy).toHaveBeenCalledWith(
    expect.objectContaining({ firstHitLocation: "Head" })
  );
  expect(queryAllByRole("alert")).toHaveLength(0);
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
  const { container, getByRole } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const form = container.querySelector("form");

  expect(form).not.toBeNull();
  fireEvent.click(getByRole("button", { name: "Humanoid" }));
  fireEvent.click(getByRole("menuitemradio", { name: "Body" }));
  fireEvent.submit(form as HTMLFormElement);

  expect(onRollSpy).toHaveBeenCalledWith({
    ...WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
    firstHitLocation: "Body",
  });
});

test("grays out Confirms on while Always Confirm is ticked", () => {
  const onRollSpy = jest.fn();
  const { container, getByLabelText, getByRole } = render(
    <WarhammerAttackerDamageForm onRoll={onRollSpy} />
  );
  const alwaysConfirm = getByLabelText("Always Confirm");
  const confirmsOn = getByLabelText("Confirms on");

  expect(alwaysConfirm).not.toBeChecked();
  expect(confirmsOn).not.toBeDisabled();

  fireEvent.click(alwaysConfirm);
  expect(alwaysConfirm).toBeChecked();
  expect(confirmsOn).toBeDisabled();
  fireEvent.click(getByRole("button", { name: "Humanoid" }));
  fireEvent.click(getByRole("menuitemradio", { name: "Body" }));

  fireEvent.submit(container.querySelector("form") as HTMLFormElement);
  expect(onRollSpy).toHaveBeenCalledWith({
    ...WARHAMMER_ATTACKER_DAMAGE_DEFAULTS,
    alwaysConfirm: true,
    firstHitLocation: "Body",
  });

  fireEvent.click(alwaysConfirm);
  expect(alwaysConfirm).not.toBeChecked();
  expect(confirmsOn).not.toBeDisabled();
});
