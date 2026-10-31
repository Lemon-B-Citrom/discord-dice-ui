import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import App from "../src/App";
import store from "../src/store";

test("renders the app shell inside a Redux provider", () => {
  const { container, getByText } = render(
    <Provider store={store}>
      <App />
    </Provider>
  );

  expect(container.querySelector(".dice-module-container")).not.toBeNull();
  expect(getByText(/roll options/i)).toBeInTheDocument();
});
