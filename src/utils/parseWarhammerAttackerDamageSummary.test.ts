import parseWarhammerAttackerDamageSummary, {
  SUMMARY_FORMAT_ERROR,
} from "./parseWarhammerAttackerDamageSummary";
import formatWarhammerAttackerDamageSummary, {
  getWarhammerAttackerDamageSummaryFragments,
} from "./formatWarhammerAttackerDamageSummary";

const locations = [
  ["@head", "Head"],
  ["@body", "Body"],
  ["@larm", "Left Arm"],
  ["@rarm", "Right Arm"],
  ["@lleg", "Left Leg"],
  ["@rleg", "Right Leg"],
] as const;

test.each(locations)("maps %s to %s", (token, firstHitLocation) => {
  expect(
    parseWarhammerAttackerDamageSummary(`Pen 3, ${token}: 23 22`).summary
  ).toMatchObject({ penetration: 3, firstHitLocation, damages: [23, 22] });
});

test("accepts aliases, reordered headers, case-insensitive location and mixed signed damage separators", () => {
  expect(
    parseWarhammerAttackerDamageSummary(
      " ` Devastating 4, @HEAD, Fel 2, Penetration 3: 23, -2 0 ` "
    ).summary
  ).toEqual({
    penetration: 3,
    felling: 2,
    devastating: 4,
    firstHitLocation: "Head",
    damages: [23, -2, 0],
  });
});

test.each([
  "Pen 3: 1",
  "Pen 3, @other: 1",
  "Pen 3, @head, @body: 1",
  "Pen 3, @head, @head: 1",
  "Pen 3, @head: 1,,2",
  "Pen 3, @head: 1, ,2",
  "Pen 3, @head: 1.5",
  "Pen 3, @head: 9007199254740992",
  "Pen 3, @head: 1:",
])("rejects invalid/missing location or damage in %p", (text) => {
  const result = parseWarhammerAttackerDamageSummary(text);
  expect(result.summary).toBeNull();
  expect(result.error).toBeTruthy();
});

test("explains how to repair legacy location-free summaries", () => {
  expect(parseWarhammerAttackerDamageSummary("Pen 3: 1").error).toContain(
    "@head, @body, @larm"
  );
  expect(SUMMARY_FORMAT_ERROR).toContain("first hit location");
});

test("rejects a Fury base above its total with an actionable error", () => {
  const result = parseWarhammerAttackerDamageSummary("Pen 0, @hull: 25(30)");
  expect(result.summary).toBeNull();
  expect(result.error).toContain("cannot exceed the total damage");
});

test.each([
  "Pen 0, @hull: 25 (10)",
  "Pen 0, @hull: 25(10",
  "Pen 0, @hull: 25(10)(9)",
])("names the Fury annotation grammar when rejecting %p", (text) => {
  const result = parseWarhammerAttackerDamageSummary(text);
  expect(result.summary).toBeNull();
  expect(result.error).toContain("parenthesised pre-Fury base");
});

test("keeps an equal Fury annotation so the formatter can drop it", () => {
  const parsed = parseWarhammerAttackerDamageSummary("Pen 0, @hull: 25(25)");
  if (!parsed.summary) throw new Error(parsed.error);

  expect(parsed.summary).toMatchObject({
    firstHitLocation: "Hull",
    damages: [25],
    baseDamages: [25],
  });
  expect(formatWarhammerAttackerDamageSummary(parsed.summary)).toBe(
    "Pen 0, @hull: 25"
  );
});

test("accepts a trailing comma and counts flattened damage values", () => {
  expect(
    parseWarhammerAttackerDamageSummary("Pen 0, @body: 1, -2,").summary?.damages
  ).toEqual([1, -2]);
  expect(
    parseWarhammerAttackerDamageSummary(
      `Pen 0, @body: ${Array(100).fill(1).join(" ")}`
    ).summary?.damages
  ).toHaveLength(100);
  expect(
    parseWarhammerAttackerDamageSummary(
      `Pen 0, @body: ${Array(101).fill(1).join(" ")}`
    ).summary
  ).toBeNull();
});

test.each(locations)("round-trips %s", (token, firstHitLocation) => {
  const summary = {
    penetration: 3,
    felling: 2,
    devastating: 4,
    firstHitLocation,
    damages: [23, 22, 15, 32],
  };
  const text = formatWarhammerAttackerDamageSummary(summary);
  expect(text).toBe(`Pen 3, Fel 2, Dev 4, ${token}: 23 22 15 32`);
  expect(parseWarhammerAttackerDamageSummary(text).summary).toEqual(summary);
});

test("formats the documented example exactly", () => {
  expect(
    formatWarhammerAttackerDamageSummary({
      penetration: 3,
      felling: 2,
      devastating: 0,
      firstHitLocation: "Head",
      damages: [23, 22, 15, 32],
    })
  ).toBe("Pen 3, Fel 2, @head: 23 22 15 32");
});

test("summary fragments preserve the formatted text and keep Fury hits atomic", () => {
  const summary = {
    penetration: 3,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Left Arm" as const,
    damages: [30, 22],
    baseDamages: [21, 22],
  };
  const fragments = getWarhammerAttackerDamageSummaryFragments(summary);

  expect(fragments).toEqual(["Pen 3, @larm: ", "30(21)", " 22"]);
  expect(fragments.join("")).toBe(
    formatWarhammerAttackerDamageSummary(summary)
  );
});
