import React from "react";
import fs from "fs";
import path from "path";
import { applyMiddleware, createStore } from "redux";
import { Provider, useSelector } from "react-redux";
import { fireEvent, render } from "@testing-library/react";
import { saveUserSettings } from "../../../src/actions";
import reducers from "../../../src/reducers";
import { openWarhammerCriticalsModal } from "../../../src/actions/modals";
import { WarhammerCriticalsState } from "../../../src/reducers/warhammer-criticals-reducer";
import { ModalsStateTypes } from "../../../src/reducers/modals-reducer";
import { createWarhammerCriticalsRequestedMiddleware } from "../../../src/middleware/warhammer/warhammerCriticalsRequested.middleware";
import WarhammerCriticalsModalContainer from "../../../src/components/WarhammerCriticalsModal/WarhammerCriticalsModalContainer";
import WarhammerCriticalsResultsModal from "../../../src/components/WarhammerCriticalsModal/WarhammerCriticalsResultsModal";
import { getCriticalPresentation } from "../../../src/utils/WarhammerCustom/criticals/criticalPresentation";
import { formatCriticalTextForDiscord } from "../../../src/utils/WarhammerCustom/criticals/formatCriticalText";
import { lookupWarhammerCritical } from "../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";
import { rollMiddleware } from "../../../src/store";

interface RootState {
  readonly modalsState: ModalsStateTypes;
  readonly warhammerCriticals: WarhammerCriticalsState;
}

function CriticalModals() {
  const showForm = useSelector(
    (state: RootState) => state.modalsState.isWarhammerCriticalsModalOpen
  );
  return (
    <>
      <WarhammerCriticalsModalContainer showModal={showForm} />
      <WarhammerCriticalsResultsModal />
    </>
  );
}

function setup(lookup = lookupWarhammerCritical, rollDie = () => 1) {
  const store = createStore(
    reducers,
    applyMiddleware(createWarhammerCriticalsRequestedMiddleware(lookup, rollDie))
  );
  store.dispatch(openWarhammerCriticalsModal());
  return {
    store,
    ...render(
      <Provider store={store}>
        <CriticalModals />
      </Provider>
    ),
  };
}

test("starts blank without placeholder/default and presents the exact two-column menu", () => {
  const { getByLabelText, getAllByRole } = setup();
  const damage = getByLabelText("Damage") as HTMLInputElement;

  expect(damage.value).toBe("");
  expect(damage.getAttribute("placeholder")).toBeNull();
  expect(damage.defaultValue).toBe("");
  expect(damage.min).toBe("1");
  expect(damage.max).toBe("10");
  expect(damage.step).toBe("1");
  expect(document.querySelector(".modal hr")).not.toBeNull();
  expect(
    Array.from(document.querySelectorAll(".modal h3")).map(
      (heading) => heading.textContent
    )
  ).toEqual(["Humanoid", "Vehicle"]);

  const labels = getAllByRole("button")
    .map((button) => button.textContent?.trim())
    .filter((label) =>
      [
        "Head",
        "Body",
        "Arm",
        "Leg",
        "Motive System",
        "Hull",
        "Weapon",
        "Turret",
      ].includes(label || "")
    );
  expect(labels).toEqual([
    "Head",
    "Body",
    "Arm",
    "Leg",
    "Motive System",
    "Hull",
    "Weapon",
    "Turret",
  ]);
});

test.each(["Head", "Body", "Arm", "Leg"])(
  "%s opens a labelled menu with the four ordered damage types",
  (location) => {
    const { getByLabelText, getByRole, store } = setup();
    fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
    fireEvent.click(getByRole("button", { name: location }));

    const menu = document.getElementById(
      `warhammer-criticals-${location.toLowerCase()}-damage-types`
    );
    expect(menu).not.toBeNull();
    if (!menu) throw new Error(`Expected the ${location} damage-type menu`);
    expect(menu).toHaveAttribute("role", "menu");
    expect(menu.parentElement).toHaveClass("locationDropdown");
    expect(menu.querySelectorAll('[role="menuitem"]')).toHaveLength(4);
    expect(
      Array.from(menu.querySelectorAll('[role="menuitem"]')).map((item) =>
        item.textContent?.trim()
      )
    ).toEqual(["Energy", "Explosive", "Impact", "Rending"]);
    expect(store.getState().warhammerCriticals.results).toBeNull();
  }
);

test("damage-type styles define an out-of-flow floating surface and hide it closed", () => {
  const styles = fs.readFileSync(
    path.resolve(
      process.cwd(),
      "src/components/WarhammerCriticalsModal/WarhammerCriticalsModal.module.css"
    ),
    "utf8"
  );
  const panelRule = styles.match(
    /\.locationDropdown\s+\.typeMenu\s*\{([^}]*)\}/
  );
  const openPanelRule = styles.match(
    /\.locationDropdown\s+\.typeMenu\[aria-hidden="false"\]\s*\{([^}]*)\}/
  );

  expect(panelRule?.[1]).toMatch(/position:\s*absolute/);
  expect(panelRule?.[1]).toMatch(/display:\s*none/);
  expect(panelRule?.[1]).toMatch(/background:\s*#fff/);
  expect(panelRule?.[1]).toMatch(/box-shadow:/);
  expect(openPanelRule?.[1]).toMatch(/display:\s*flex/);
});

test.each(["", "0", "11", "-1", "1.5"])(
  "shows the exact red validation feedback for invalid Damage %j",
  (damageValue) => {
    const { getByLabelText, getByRole, store } = setup();
    if (damageValue) {
      fireEvent.change(getByLabelText("Damage"), {
        target: { value: damageValue },
      });
    }
    fireEvent.click(getByRole("button", { name: "Head" }));

    const error = getByRole("alert");
    expect(error.textContent).toBe(
      "Input critical damage before selecting a location"
    );
    expect(error.className).toMatch(/validationError/);
    expect(getByLabelText("Damage").getAttribute("aria-invalid")).toBe("true");
    expect(getByLabelText("Damage").getAttribute("aria-describedby")).toContain(
      "warhammer-criticals-damage-error"
    );
    expect(store.getState().warhammerCriticals.results).toBeNull();
    expect(
      store.getState().modalsState.isWarhammerCriticalsResultsModalOpen
    ).toBe(false);
  }
);

test.each([
  "Head",
  "Body",
  "Arm",
  "Leg",
  "Motive System",
  "Hull",
  "Weapon",
  "Turret",
])(
  "every location click validates empty Damage before selecting %s",
  (location) => {
    const { getByRole, store } = setup();
    fireEvent.click(getByRole("button", { name: location }));
    expect(getByRole("alert").textContent).toBe(
      "Input critical damage before selecting a location"
    );
    expect(store.getState().warhammerCriticals.selectedLocation).toBeNull();
    expect(store.getState().warhammerCriticals.results).toBeNull();
  }
);

test("a valid humanoid location opens the type selector; a selected type shows its result", () => {
  const { getByLabelText, getByRole, queryByRole, store } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "2" } });
  fireEvent.click(getByRole("button", { name: "Head" }));

  const menu = document.getElementById("warhammer-criticals-head-damage-types");
  expect(menu).not.toBeNull();
  if (!menu) throw new Error("Expected the Head damage-type dropdown");
  expect(menu).toHaveAttribute("id", "warhammer-criticals-head-damage-types");
  expect(menu).toHaveAttribute(
    "aria-labelledby",
    "warhammer-criticals-head-location"
  );
  expect(getByRole("button", { name: "Head" })).toHaveAttribute(
    "aria-controls",
    "warhammer-criticals-head-damage-types"
  );
  expect(getByRole("button", { name: "Head" })).toHaveAttribute(
    "aria-expanded",
    "true"
  );
  expect(
    Array.from(menu.querySelectorAll('[role="menuitem"]')).map((item) =>
      item.textContent?.trim()
    )
  ).toEqual(["Energy", "Explosive", "Impact", "Rending"]);
  expect(store.getState().warhammerCriticals.results).toBeNull();

  fireEvent.click(getByRole("menuitem", { name: "Impact" }));
  expect(queryByRole("heading", { name: "Criticals Result" })).toBeTruthy();
  expect(getByRole("heading", { name: "Head, Impact – 2" })).toBeTruthy();
  expect(
    getByRole("heading", { name: "Head, Impact – 2" }).parentElement
  ).toHaveTextContent("The hit causes the target’s sight to blur");
  expect(
    store.getState().modalsState.isWarhammerCriticalsResultsModalOpen
  ).toBe(true);
  expect(store.getState().warhammerCriticals.results?.request.damageType).toBe(
    "Impact"
  );
  const result = store.getState().warhammerCriticals.results;
  if (!result) throw new Error("Expected the selected critical result");
  getCriticalPresentation(result).sections.forEach((section) => {
    expect(document.querySelector(".modal.show")).toHaveTextContent(
      section.text
    );
  });
  fireEvent.click(getByRole("button", { name: "Back" }));
  expect(store.getState().warhammerCriticals.selectedLocation).toEqual({
    family: "humanoid",
    location: "head",
  });
  expect(
    document.getElementById("warhammer-criticals-head-location")
  ).toHaveAttribute("aria-expanded", "false");
});

test("result excerpts emphasize status effects, dice, and durations without citations", () => {
  const { getByLabelText, getByRole, getByText } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "3" } });
  fireEvent.click(getByRole("button", { name: "Head" }));
  fireEvent.click(getByRole("menuitem", { name: "Energy" }));

  const heading = getByRole("heading", { name: "Head, Energy – 3" });
  const dieIcon = heading.querySelector("img");
  expect(dieIcon).not.toBeNull();
  expect(dieIcon).toHaveAttribute("aria-hidden", "true");
  expect(dieIcon).toHaveAttribute("alt", "");
  expect(heading.parentElement?.querySelector("hr")).not.toBeNull();
  expect(getByText("Deafened").tagName).toBe("STRONG");
  expect(getByText("1d5").tagName).toBe("STRONG");
  expect(getByText("hours").tagName).toBe("STRONG");
  expect(document.querySelector(".modal.show")).not.toHaveTextContent("Source:");
});

test("modal renders stipulated checks in highlighted monospace spans", () => {
  const { getByLabelText, getByRole } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
  fireEvent.click(getByRole("button", { name: "Hull" }));

  const check = document.querySelector(".section p .codeSpan");
  expect(check).toHaveTextContent("Ordinary (+10) Fortitude Test");
  expect(check).toHaveClass("codeSpan");
});

test("modal shows a conditional status roll and its manual check in log order", () => {
  const { getByLabelText, getByRole, getByText } = setup(
    lookupWarhammerCritical,
    () => 2
  );
  fireEvent.change(getByLabelText("Damage"), { target: { value: "3" } });
  fireEvent.click(getByRole("button", { name: "Hull" }));

  expect(document.querySelector(".section p")?.textContent).toContain(
    "Stunned for 2 (1d5) rounds"
  );
  expect(getByText("1d5 = 2")).toBeTruthy();
  expect(document.querySelector(".rollLog li")).toHaveTextContent(
    "Stunned (rounds)"
  );
  expect(getByText("#1")).toBeTruthy();
  expect(getByText("#2:")).toBeTruthy();
  const check = document.querySelector(".rollLog .codeSpan");
  expect(check).toHaveTextContent("Ordinary (+10) Fortitude Test");
  expect(document.querySelector(".condition")).toHaveTextContent(
    "Only if Ordinary (+10) Fortitude Test fails"
  );
});

test("modal rolls unannotated quantities and labels the ones it can attribute", () => {
  const { getByLabelText, getByRole } = setup(
    lookupWarhammerCritical,
    () => 3
  );
  fireEvent.change(getByLabelText("Damage"), { target: { value: "6" } });
  fireEvent.click(getByRole("button", { name: "Head" }));
  fireEvent.click(getByRole("menuitem", { name: "Energy" }));

  expect(document.querySelector(".section p")?.textContent).toBe(
    "The attack cooks the target’s face, melting his features and damaging his eyes. The target suffers 3 (1d5) levels of Fatigue and is Blinded for 3 (1d10) hours. Permanently reduce his Fellowship and Perception characteristics by 3 (1d5)."
  );
  const rows = Array.from(document.querySelectorAll(".rollLog li")).map(
    (row) => row.textContent
  );
  expect(rows).toEqual([
    "#11d5 = 3 — Fatigue (levels)",
    "#21d10 = 3 — Blinded (hours)",
    "#31d5 = 3",
  ]);
});

test("saved status results are not rerolled when the modal returns to the form", () => {
  const rollDie = jest.fn(() => 2);
  const { getByLabelText, getByRole, store } = setup(
    lookupWarhammerCritical,
    rollDie
  );
  fireEvent.change(getByLabelText("Damage"), { target: { value: "3" } });
  fireEvent.click(getByRole("button", { name: "Hull" }));

  const savedResult = store.getState().warhammerCriticals.results;
  expect(rollDie).toHaveBeenCalledTimes(1);
  if (!savedResult) throw new Error("Expected a saved critical result");
  getCriticalPresentation(savedResult);
  getCriticalPresentation(savedResult);
  fireEvent.click(getByRole("button", { name: "Back" }));

  expect(store.getState().warhammerCriticals.results).toBe(savedResult);
  expect(rollDie).toHaveBeenCalledTimes(1);
});

test.each(["Energy", "Explosive", "Impact", "Rending"])(
  "selecting %s passes the current Damage and location to lookup",
  (damageType) => {
    const { getByLabelText, getByRole, store } = setup();
    fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
    fireEvent.click(getByRole("button", { name: "Body" }));
    fireEvent.click(getByRole("menuitem", { name: damageType }));

    expect(store.getState().warhammerCriticals.results?.request).toEqual({
      severity: 1,
      family: "humanoid",
      location: "body",
      damageType,
    });
    expect(
      getByRole("heading", { name: `Body, ${damageType} – 1` })
    ).toBeTruthy();
  }
);

test("humanoid dropdown closes, switches location, and resets on Damage edits", () => {
  const { getByLabelText, getByRole, queryByRole } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "3" } });

  const headToggle = getByRole("button", { name: "Head" });
  fireEvent.click(headToggle);
  const headMenu = document.getElementById(
    "warhammer-criticals-head-damage-types"
  );
  expect(headMenu).toHaveClass("show");
  fireEvent.click(headToggle);
  expect(headMenu).not.toHaveClass("show");
  expect(headMenu).toHaveAttribute("aria-hidden", "true");
  expect(queryByRole("menuitem", { name: "Energy" })).toBeNull();
  expect(headToggle).toHaveAttribute("aria-expanded", "false");

  fireEvent.click(headToggle);
  fireEvent.click(getByRole("button", { name: "Body" }));
  expect(headMenu).not.toHaveClass("show");
  const bodyMenu = document.getElementById(
    "warhammer-criticals-body-damage-types"
  );
  expect(bodyMenu).toHaveClass("show");

  fireEvent.click(document.body);
  expect(bodyMenu).not.toHaveClass("show");

  fireEvent.change(getByLabelText("Damage"), { target: { value: "4" } });
  expect(bodyMenu).not.toHaveClass("show");
  expect(getByRole("button", { name: "Body" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test("hiding and reopening the form never restores an open type menu", () => {
  const { getByLabelText, getByRole, store } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "2" } });
  fireEvent.click(getByRole("button", { name: "Head" }));
  const menu = document.getElementById(
    "warhammer-criticals-head-damage-types"
  );
  expect(menu).toHaveClass("show");

  fireEvent.click(getByRole("button", { name: "Close" }));
  expect(menu).not.toHaveClass("show");
  expect(menu).toHaveAttribute("aria-hidden", "true");
  store.dispatch(openWarhammerCriticalsModal());

  expect(menu).not.toHaveClass("show");
  expect(getByRole("button", { name: "Head" })).toHaveAttribute(
    "aria-expanded",
    "false"
  );
});

test.each(["", "0", "-1", "1.5", "11"])(
  "invalid Damage %j does not open a humanoid type dropdown",
  (damageValue) => {
    const { getByLabelText, getByRole } = setup();
    if (damageValue) {
      fireEvent.change(getByLabelText("Damage"), {
        target: { value: damageValue },
      });
    }

    fireEvent.click(getByRole("button", { name: "Head" }));

    const menu = document.getElementById(
      "warhammer-criticals-head-damage-types"
    );
    expect(menu).not.toHaveClass("show");
    expect(menu).toHaveAttribute("aria-hidden", "true");
    expect(menu?.querySelector('[role="menuitem"]')).toHaveAttribute(
      "tabindex",
      "-1"
    );
    expect(getByRole("alert")).toHaveTextContent(
      "Input critical damage before selecting a location"
    );
  }
);

test("keyboard opens the type dropdown, navigates options, and Escape restores focus", () => {
  const { getByLabelText, getByRole } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "2" } });
  const headToggle = getByRole("button", { name: "Head" });
  fireEvent.keyDown(headToggle, { key: "ArrowDown" });

  const energy = getByRole("menuitem", { name: "Energy" });
  expect(energy).toHaveFocus();
  fireEvent.keyDown(energy, { key: "ArrowDown" });
  expect(getByRole("menuitem", { name: "Explosive" })).toHaveFocus();
  fireEvent.keyDown(getByRole("menuitem", { name: "Explosive" }), {
    key: "ArrowUp",
  });
  expect(energy).toHaveFocus();
  fireEvent.keyDown(energy, {
    key: "End",
  });
  const rending = getByRole("menuitem", { name: "Rending" });
  expect(rending).toHaveFocus();
  fireEvent.keyDown(rending, {
    key: "Home",
  });
  expect(energy).toHaveFocus();
  fireEvent.keyDown(energy, {
    key: "End",
  });
  expect(rending).toHaveFocus();
  fireEvent.keyDown(rending, { key: "Escape", keyCode: 27 });

  expect(headToggle).toHaveAttribute("aria-expanded", "false");
  expect(headToggle).toHaveFocus();

  fireEvent.click(headToggle);
  fireEvent.keyDown(getByRole("menuitem", { name: "Energy" }), {
    key: "Tab",
  });
  expect(headToggle).toHaveAttribute("aria-expanded", "false");
});

test("a failed keyboard open does not leave stale focus for a later click", () => {
  const { getByLabelText, getByRole } = setup();
  const headToggle = getByRole("button", { name: "Head" });
  fireEvent.keyDown(headToggle, { key: "ArrowDown" });
  expect(getByRole("alert")).toHaveTextContent(
    "Input critical damage before selecting a location"
  );

  fireEvent.change(getByLabelText("Damage"), { target: { value: "2" } });
  headToggle.focus();
  fireEvent.click(headToggle);

  expect(headToggle).toHaveAttribute("aria-expanded", "true");
  expect(headToggle).toHaveFocus();
});

test.each(["Enter", " "])(
  "native button %s activation selects exactly one critical type",
  (key) => {
    const lookup = jest.fn(lookupWarhammerCritical);
    const { getByLabelText, getByRole, store } = setup(lookup);
    fireEvent.change(getByLabelText("Damage"), { target: { value: "4" } });
    fireEvent.click(getByRole("button", { name: "Leg" }));
    const explosive = getByRole("menuitem", { name: "Explosive" });
    fireEvent.keyDown(explosive, { key });
    // Simulate the native click generated by Enter/Space on a button.
    fireEvent.click(explosive);

    expect(store.getState().warhammerCriticals.results?.request).toEqual({
      severity: 4,
      family: "humanoid",
      location: "leg",
      damageType: "Explosive",
    });
    expect(lookup).toHaveBeenCalledTimes(1);
  }
);

test("type selection uses Damage edited after its dropdown was opened", () => {
  const { getByLabelText, getByRole, store } = setup();
  const damage = getByLabelText("Damage");
  fireEvent.change(damage, { target: { value: "2" } });
  fireEvent.click(getByRole("button", { name: "Head" }));
  fireEvent.change(damage, { target: { value: "7" } });
  fireEvent.click(getByRole("button", { name: "Head" }));
  fireEvent.click(getByRole("menuitem", { name: "Energy" }));

  expect(store.getState().warhammerCriticals.results?.request).toEqual({
    severity: 7,
    family: "humanoid",
    location: "head",
    damageType: "Energy",
  });
});

test("selected humanoid result and Discord webhook carry the same presentation", () => {
  const originalFetch = (global as typeof global & { fetch?: jest.Mock }).fetch;
  const fetchMock = jest.fn((..._args: any[]) =>
    Promise.resolve({ ok: true, status: 204 } as Response)
  );
  (global as typeof global & { fetch?: jest.Mock }).fetch = fetchMock;

  try {
    const store = createStore(reducers, applyMiddleware(...rollMiddleware));
    store.dispatch(
      saveUserSettings({
        username: "Alex",
        hookUrl: "https://example.test/hook",
      })
    );
    store.dispatch(openWarhammerCriticalsModal());
    const view = render(
      <Provider store={store}>
        <CriticalModals />
      </Provider>
    );
    fireEvent.click(view.getByRole("button", { name: "Head" }));
    expect(view.getByRole("alert")).toHaveTextContent(
      "Input critical damage before selecting a location"
    );
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(view.getByLabelText("Damage"), {
      target: { value: "10" },
    });
    const bodyToggle = view.getByRole("button", { name: "Body" });
    fireEvent.click(bodyToggle);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(bodyToggle);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(bodyToggle);
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(view.getByRole("menuitem", { name: "Energy" }));

    const result = store.getState().warhammerCriticals.results;
    if (!result) throw new Error("Expected the selected critical result");
    const presentation = getCriticalPresentation(result);
    expect(presentation.sections.some((section) => section.isPrerequisite)).toBe(
      true
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://example.test/hook");
    const embed = JSON.parse(init.body).embeds[0];
    expect(embed.title).toBeUndefined();
    expect(embed.description).toContain(
      "**Alex rolled a critical effect**\n:skull_crossbones: Body, Energy – 10\n\n"
    );
    expect(embed.description).toContain(
      presentation.sections
        .map((section) => formatCriticalTextForDiscord(section.text))
        .join("\n\n")
    );
    expect(embed.fields).toEqual([]);
    const resultModal = document.querySelector(".modal.show");
    if (!resultModal) throw new Error("Expected the critical result modal");
    expect(resultModal).not.toHaveTextContent("Source:");
    expect(resultModal).toHaveTextContent("Body, Energy – 10+");
    presentation.sections.forEach((section) => {
      expect(resultModal).toHaveTextContent(section.heading);
      expect(resultModal).toHaveTextContent(section.text);
    });
    fireEvent.click(view.getByRole("button", { name: "Back" }));
    store.dispatch(openWarhammerCriticalsModal());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  } finally {
    (global as typeof global & { fetch?: jest.Mock }).fetch = originalFetch;
  }
});

test("vehicle location returns directly and Back retains the raw draft without another lookup", () => {
  const { getByLabelText, getByRole, store } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
  fireEvent.click(getByRole("button", { name: "Turret" }));

  expect(getByRole("heading", { name: "Criticals Result" })).toBeTruthy();
  expect(getByRole("heading", { name: "Turret – 1" })).toBeTruthy();
  const savedResult = store.getState().warhammerCriticals.results;
  fireEvent.click(getByRole("button", { name: "Back" }));

  expect(store.getState().modalsState.isWarhammerCriticalsModalOpen).toBe(true);
  expect(store.getState().warhammerCriticals.damage).toBe("1");
  expect(store.getState().warhammerCriticals.results).toBe(savedResult);
  expect(store.getState().warhammerCriticals.selectedLocation).toBeNull();
});

test.each([
  ["Motive System", "Motive System"],
  ["Hull", "Hull"],
  ["Weapon", "Weapon"],
])(
  "vehicle %s resolves directly without a type menu",
  (location, heading) => {
    const { getByLabelText, getByRole, queryByRole } = setup();
    fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
    fireEvent.click(getByRole("button", { name: location }));

    expect(getByRole("heading", { name: `${heading} – 1` })).toBeTruthy();
    expect(queryByRole("menu")).toBeNull();
  }
);

test("Close hides both criticals modals", () => {
  const { getByLabelText, getByRole, store } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
  fireEvent.click(getByRole("button", { name: "Turret" }));
  fireEvent.click(getByRole("button", { name: "Close" }));

  expect(store.getState().modalsState.isWarhammerCriticalsModalOpen).toBe(
    false
  );
  expect(
    store.getState().modalsState.isWarhammerCriticalsResultsModalOpen
  ).toBe(false);
});

test("Escape from the results modal returns to the form and retains Damage", () => {
  const { getByLabelText, getByRole, store } = setup();
  fireEvent.change(getByLabelText("Damage"), { target: { value: "1" } });
  fireEvent.click(getByRole("button", { name: "Turret" }));

  fireEvent.keyDown(document, { key: "Escape", keyCode: 27, which: 27 });

  expect(store.getState().modalsState.isWarhammerCriticalsModalOpen).toBe(true);
  expect(
    store.getState().modalsState.isWarhammerCriticalsResultsModalOpen
  ).toBe(false);
  expect(store.getState().warhammerCriticals.damage).toBe("1");
});
