import parseWarhammerAttackerDamageSummary, {
  SUMMARY_FORMAT_ERROR,
} from "./parseWarhammerAttackerDamageSummary";
import formatWarhammerAttackerDamageSummary from "./formatWarhammerAttackerDamageSummary";

test("parses the Attack summary shape and preserves signed hit order", () => {
  const result = parseWarhammerAttackerDamageSummary(" ` Pen 3, Fel 0: 16, -2, 0 ` ");
  expect(result.error).toBeNull();
  expect(result.summary).toEqual({
    penetration: 3,
    felling: 0,
    devastating: 0,
    damages: [16, -2, 0],
  });
});

test("treats a missing Felling as zero", () => {
  expect(parseWarhammerAttackerDamageSummary("Pen 3: 16, 11").summary).toEqual({
    penetration: 3,
    felling: 0,
    devastating: 0,
    damages: [16, 11],
  });
});

test("treats a missing Devastating as zero", () => {
  expect(parseWarhammerAttackerDamageSummary("Pen 3, Fel 2: 16").summary).toEqual({
    penetration: 3,
    felling: 2,
    devastating: 0,
    damages: [16],
  });
});

test("parses Devastating without Felling", () => {
  expect(parseWarhammerAttackerDamageSummary("Pen 3, Dev 4: 5").summary).toEqual({
    penetration: 3,
    felling: 0,
    devastating: 4,
    damages: [5],
  });
});

test.each([
  "Pen 3, Fel 2, Dev 4: 5",
  "Pen 3, Dev 4, Fel 2: 5",
  "Dev 4, Fel 2, Pen 3: 5",
  "pen 3, felling 2, devastating 4: 5",
  "Penetration 3, Fel 2, Dev 4: 5",
])("accepts header order and aliases in %p", (text) => {
  expect(parseWarhammerAttackerDamageSummary(text).summary).toEqual({
    penetration: 3,
    felling: 2,
    devastating: 4,
    damages: [5],
  });
});

test.each([
  "",
  "Pen 3, Fel 0: 1,,",
  "Pen 3, Fel 0: ,",
  "Pen 3, Fel 0: 1,,2",
  "Pen 3, Fel 0: 1.5",
  "Pen -1, Fel 0: 1",
  "Pen 3, Fel 0: 9007199254740992",
  "continuation 16, 19",
  "Fel 1: 1",
  "Pen 3",
  "Pen 3, Fel 0:",
  "Pen 3, Fel 0: , ",
  "Pen 3, Fel 1, Fel 2: 1",
  "Pen 3, Dev 2, Dev 2: 1",
  "Pen 3, Armor 2: 1",
  "Pen 3, Dev -1: 1",
  "Pen 3, : 1",
  "Armor 2: 1",
])("rejects malformed or unsafe summary %p without a partial result", (text) => {
  const result = parseWarhammerAttackerDamageSummary(text);
  expect(result.summary).toBeNull();
  expect(result.error).toBeTruthy();
});

test("explains the accepted format when the colon is missing", () => {
  expect(parseWarhammerAttackerDamageSummary("Pen 3, Fel 0 1").error).toBe(
    SUMMARY_FORMAT_ERROR
  );
});

test.each(["Pen 3, Fel 0: 1, -2,  ", " `Pen 3, Fel 0: 1, -2, ` "])(
  "accepts a single trailing comma in %p", (text) => {
    expect(parseWarhammerAttackerDamageSummary(text).summary?.damages).toEqual([1, -2]);
  }
);

test("counts actual hits rather than the trailing separator", () => {
  expect(parseWarhammerAttackerDamageSummary(`Pen 0, Fel 0: ${Array(100).fill(1).join(",")},`).summary?.damages).toHaveLength(100);
  expect(parseWarhammerAttackerDamageSummary(`Pen 0, Fel 0: ${Array(101).fill(1).join(",")},`).summary).toBeNull();
});

test.each([
  { penetration: 0, felling: 0, devastating: 0, damages: [16, -2] },
  { penetration: 3, felling: 2, devastating: 0, damages: [16] },
  { penetration: 3, felling: 0, devastating: 4, damages: [16, 11] },
  { penetration: 3, felling: 2, devastating: 4, damages: [16, 11, 0] },
])("round-trips %p through the canonical formatter", (summary) => {
  const text = formatWarhammerAttackerDamageSummary(summary);
  expect(parseWarhammerAttackerDamageSummary(text).summary).toEqual(summary);
});

test("omits zero-valued traits from the canonical summary", () => {
  expect(
    formatWarhammerAttackerDamageSummary({
      penetration: 3,
      felling: 0,
      devastating: 0,
      damages: [16, 11],
    })
  ).toBe("Pen 3: 16, 11");
  expect(
    formatWarhammerAttackerDamageSummary({
      penetration: 3,
      felling: 2,
      devastating: 4,
      damages: [16],
    })
  ).toBe("Pen 3, Fel 2, Dev 4: 16");
});
