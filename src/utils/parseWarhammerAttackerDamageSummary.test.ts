import parseWarhammerAttackerDamageSummary, {
  SUMMARY_FORMAT_ERROR,
} from "./parseWarhammerAttackerDamageSummary";
import formatWarhammerAttackerDamageSummary from "./formatWarhammerAttackerDamageSummary";

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
