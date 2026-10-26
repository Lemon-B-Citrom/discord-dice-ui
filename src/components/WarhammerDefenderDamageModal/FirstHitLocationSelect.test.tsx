import React from "react";
import { fireEvent, render } from "@testing-library/react";
import FirstHitLocationSelect from "./FirstHitLocationSelect";

test("renders six choices in full-width and paired rows", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="" onChange={jest.fn()} />
  );

  fireEvent.click(getByRole("button", { name: "First Hit Location" }));
  const menu = getByRole("menu");
  expect(menu.querySelectorAll(".fullRow")).toHaveLength(2);
  expect(menu.querySelectorAll(".pairedRow")).toHaveLength(2);
  expect(
    Array.from(menu.querySelectorAll('[role="menuitemradio"]')).map(
      (item) => item.textContent
    )
  ).toEqual([
    "Head",
    "Body",
    "Left Arm",
    "Right Arm",
    "Left Leg",
    "Right Leg",
  ]);
});

test("selects a location and displays it on the closed control", () => {
  const onChange = jest.fn();
  const { getByRole, rerender } = render(
    <FirstHitLocationSelect value="" onChange={onChange} />
  );

  fireEvent.click(getByRole("button", { name: "First Hit Location" }));
  fireEvent.click(getByRole("menuitemradio", { name: "Right Arm" }));
  expect(onChange).toHaveBeenCalledWith("Right Arm");

  rerender(
    <FirstHitLocationSelect value="Right Arm" onChange={onChange} />
  );
  expect(
    getByRole("button", { name: "First Hit Location: Right Arm" })
  ).toHaveTextContent("Right Arm");
});

test("Escape closes the menu without invoking modal dismissal", () => {
  const { getByRole } = render(
    <FirstHitLocationSelect value="" onChange={jest.fn()} />
  );
  fireEvent.click(getByRole("button", { name: "First Hit Location" }));
  fireEvent.keyDown(getByRole("menuitemradio", { name: "Head" }), {
    key: "Escape",
    keyCode: 27,
  });
  expect(getByRole("button", { name: "First Hit Location" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
  expect(getByRole("button", { name: "First Hit Location" })).toHaveFocus();
});
