import parseWarhammerAttackerDamageSummary from "./parseWarhammerAttackerDamageSummary";

test("parses the Attack summary shape and preserves signed hit order", () => {
  const result = parseWarhammerAttackerDamageSummary(" ` Pen 3, Fel 0: 16, -2, 0 ` ");
  expect(result.error).toBeNull();
  expect(result.summary).toEqual({
    penetration: 3,
    felling: 0,
    damages: [16, -2, 0],
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
])("rejects malformed or unsafe summary %p without a partial result", (text) => {
  const result = parseWarhammerAttackerDamageSummary(text);
  expect(result.summary).toBeNull();
  expect(result.error).toBeTruthy();
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
