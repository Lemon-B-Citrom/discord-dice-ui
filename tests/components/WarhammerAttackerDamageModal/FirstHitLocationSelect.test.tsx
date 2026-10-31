import React from "react";
import { fireEvent, render } from "@testing-library/react";
import FirstHitLocationSelect from "../../../src/components/WarhammerAttackerDamageModal/FirstHitLocationSelect";

const openMenu = (
  getByRole: (role: string, options?: object) => HTMLElement
) => {
  fireEvent.click(getByRole("button", { name: "Humanoid" }));
  return getByRole("menu");
};

test("renders the body diagram as 1, 3 and 2 button rows", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="" onChange={jest.fn()} />
  );

  const menu = openMenu(getByRole);
  expect(getByRole("button", { name: "Humanoid" })).toHaveAttribute(
    "aria-controls",
    "attacker-damage-first-hit-location-menu"
  );
  expect(menu).toHaveAttribute("id", "attacker-damage-first-hit-location-menu");
  const rows = Array.from(menu.querySelectorAll(".optionRow"));
  expect(rows).toHaveLength(3);
  expect(
    rows.map((row) => row.querySelectorAll('[role="menuitemradio"]').length)
  ).toEqual([1, 3, 2]);
  expect(
    Array.from(menu.querySelectorAll('[role="menuitemradio"]')).map(
      (item) => item.textContent
    )
  ).toEqual(["Head", "L. Arm", "Body", "R. Arm", "L. Leg", "R. Leg"]);
  expect(
    Array.from(menu.querySelectorAll('[role="menuitemradio"]')).map((item) =>
      item.getAttribute("aria-label")
    )
  ).toEqual(["Head", "Left Arm", "Body", "Right Arm", "Left Leg", "Right Leg"]);
});

test("marks the current location as the checked option", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="Right Arm" onChange={jest.fn()} />
  );

  fireEvent.click(
    getByRole("button", { name: "First Hit Location: Right Arm" })
  );
  const checked = getByRole("menuitemradio", { name: "Right Arm" });
  expect(checked).toHaveAttribute("aria-checked", "true");
  expect(checked).toHaveClass("active");
  expect(getByRole("menuitemradio", { name: "Left Arm" })).toHaveAttribute(
    "aria-checked",
    "false"
  );
});

test("selects a location and displays it on the closed control", () => {
  const onChange = jest.fn();
  const { getByRole, rerender } = render(
    <FirstHitLocationSelect value="" onChange={onChange} />
  );

  openMenu(getByRole);
  fireEvent.click(getByRole("menuitemradio", { name: "Right Arm" }));
  expect(onChange).toHaveBeenCalledWith("Right Arm");

  rerender(<FirstHitLocationSelect value="Right Arm" onChange={onChange} />);
  expect(
    getByRole("button", { name: "First Hit Location: Right Arm" })
  ).toHaveTextContent("Right Arm");
});

test("arrow keys follow the diagram rather than the flat order", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="" onChange={jest.fn()} />
  );

  openMenu(getByRole);
  const leftArm = getByRole("menuitemradio", { name: "Left Arm" });
  fireEvent.keyDown(leftArm, { key: "ArrowRight" });
  expect(getByRole("menuitemradio", { name: "Body" })).toHaveFocus();

  fireEvent.keyDown(getByRole("menuitemradio", { name: "Body" }), {
    key: "ArrowDown",
  });
  expect(getByRole("menuitemradio", { name: "Right Leg" })).toHaveFocus();

  fireEvent.keyDown(getByRole("menuitemradio", { name: "Right Leg" }), {
    key: "ArrowUp",
  });
  expect(getByRole("menuitemradio", { name: "Body" })).toHaveFocus();

  fireEvent.keyDown(getByRole("menuitemradio", { name: "Body" }), {
    key: "Home",
  });
  expect(getByRole("menuitemradio", { name: "Head" })).toHaveFocus();

  fireEvent.keyDown(getByRole("menuitemradio", { name: "Head" }), {
    key: "End",
  });
  expect(getByRole("menuitemradio", { name: "Right Leg" })).toHaveFocus();
});

test("opening from the toggle focuses the current choice", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="Left Leg" onChange={jest.fn()} />
  );

  fireEvent.keyDown(
    getByRole("button", { name: "First Hit Location: Left Leg" }),
    {
      key: "ArrowDown",
    }
  );
  expect(getByRole("menuitemradio", { name: "Left Leg" })).toHaveFocus();
});

test("Escape closes the menu without invoking modal dismissal", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="" onChange={jest.fn()} />
  );
  openMenu(getByRole);
  fireEvent.keyDown(getByRole("menuitemradio", { name: "Head" }), {
    key: "Escape",
    keyCode: 27,
  });
  expect(getByRole("button", { name: "Humanoid" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(getByRole("button", { name: "Humanoid" })).toHaveFocus();
});
