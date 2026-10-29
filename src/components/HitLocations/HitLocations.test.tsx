import React from "react";
import { render } from "@testing-library/react";
import HitLocations from "./HitLocations";

test("renders the combined human and vehicle location", () => {
  const { getByText } = render(
    <HitLocations
      hitLocation="Body / Hull"
      isDarkHeresy={true}
      alwaysExpanded={true}
    />
  );

  expect(getByText("Body / Hull")).toBeInTheDocument();
});
