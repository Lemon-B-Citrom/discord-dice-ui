import getWarhammerDamageRequestMsg from "./getWarhammerDamageRequestMsg";
import calculateWarhammerDamage from "./calculateWarhammerDamage";
import normalizeWarhammerDamage from "./normalizeWarhammerDamage";
import {
  WarhammerDamageResult,
  WarhammerSingleDamageHit,
  WarhammerHordeDamageHit,
  WarhammerBonusDevastatingEntry,
} from "../components/WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";

const armor = {
  headAP: 0,
  bodyAP: 0,
  armsAP: 0,
  legsAP: 0,
  sources: {
    headAP: "omitted" as const,
    bodyAP: "omitted" as const,
    armsAP: "omitted" as const,
    legsAP: "omitted" as const,
  },
};

const draft = {
  attackSummaryString: "Pen 0, Fel 0: 10",
  toughnessBonus: "0",
  fortitude: "",
  armorHead: "",
  armorBody: "",
  armorArms: "",
  armorLegs: "",
  firstHitLocation: "Body",
  trueHits: "",
  magPer: "",
  devastating: "",
  woundsPer: "",
};

const singleHit: WarhammerSingleDamageHit = {
  kind: "hit",
  index: 0,
  number: 1,
  mode: "single",
  role: "single",
  location: "Body",
  armorSlot: "bodyAP",
  originalDamage: 10,
  armorBeforePenetration: 0,
  effectiveArmor: 0,
  showArmorTerm: false,
  effectiveToughnessBonus: 0,
  toughnessBeforeFelling: 0,
  fortitudeApplied: false,
  finalDamage: 10,
};

function singleResult(): WarhammerDamageResult {
  return {
    draft,
    request: {
      mode: "single",
      summary: { penetration: 0, felling: 0, damages: [10] },
      toughnessBonus: 0,
      fortitude: 0,
      armor,
      firstHitLocation: "Body",
    },
    entries: [singleHit],
    totals: { damage: 10 },
  };
}

function hordeResult(): WarhammerDamageResult {
  const trueHit: WarhammerHordeDamageHit = {
    ...singleHit,
    mode: "horde",
    role: "true",
    classification: "overkill",
    baseMagnitude: 6,
    devastatingAdded: 1,
    magnitude: 7,
  };
  const synthetic: WarhammerBonusDevastatingEntry = {
    kind: "bonus-devastating",
    number: 2,
    magnitude: 1,
  };
  return {
    draft: { ...draft, trueHits: "1", magPer: "6", devastating: "1", woundsPer: "10" },
    request: {
      mode: "horde",
      summary: { penetration: 0, felling: 0, damages: [10] },
      toughnessBonus: 0,
      fortitude: 0,
      armor,
      firstHitLocation: "Body",
      trueHits: 1,
      magPer: 6,
      devastating: 1,
      woundsPer: 10,
    },
    entries: [trueHit, synthetic],
    totals: { damage: 10, magnitude: 8, killCount: 1 },
  };
}

test("formats an ordered single-target breakdown with omitted armor and totals", () => {
  const message = getWarhammerDamageRequestMsg(singleResult(), "Alex");

  expect(message.msgTitle).toBe("Alex calculated damage. Single target");
  expect(message.description).toBe(":dart: Single target x1: `Pen 0, Fel 0: 10`\n:mens: Starting at Body");
  expect(message.fields[0].value).toContain(
    "#1: :arrow_right: **10**\n-# Body"
  );
  expect(message.fields[0].value).not.toContain("Armor");
  expect(message.fields[0].value).not.toContain("Original");
  expect(message.fields[0].value).not.toContain("Damage:");
  expect(message.fields[0].value).toContain("**`10`** = `10` − Toughness (`0`)");
  expect(message.fields[message.fields.length - 1]).toEqual({
    name: ":boom: Summary",
    value: "Total Damage: 10",
  });
});

test("formats Horde classification operands and a separate Bonus Devastating entry", () => {
  const message = getWarhammerDamageRequestMsg(hordeResult(), "Alex");
  const values = message.fields.map((field) => field.value).join("\n");

  expect(message.msgTitle).toContain("Horde");
  expect(values).toContain("**Overkill!**");
  expect(message.description).toBe(":dart: Horde x1 (1 True, 0 Bonus): `Pen 0, Fel 0: 10`\n:mens: Starting at Body");
  expect(values).toContain("#1: :arrow_right: **Overkill!** **10** Damage, **7** Magnitude\n-# Body");
  expect(values).toContain("Damage: **`10`** = `10` − Toughness (`0`)");
  expect(values).toContain("Magnitude: **`7`** = Per-unit Magnitude (`6`) + Devastating (`1`)");
  expect(values).not.toContain("Original");
  expect(values).toContain(
    "#2 (Bonus Devastating) :arrow_right: **1 Magnitude**"
  );
  expect(values).toContain("Total Magnitude: 8");
  expect(values).toContain("Kill Count: 1+");
});

test("sanitizes usernames and reports the zero-Mag-per kill count", () => {
  const result = hordeResult();
  if (result.request.mode !== "horde") throw new Error("Expected Horde result");
  result.request.magPer = 0;
  result.totals.killCountUnavailable = true;
  const message = getWarhammerDamageRequestMsg(result, "@everyone `GM`");

  expect(message.msgTitle).toContain("@\u200beveryone \\`GM\\`");
  expect(message.fields[message.fields.length - 1].value).toContain(
    "Kill Count: Unavailable (Mag per is 0)"
  );
});

test("uses the existing missing-username fallback", () => {
  expect(getWarhammerDamageRequestMsg(singleResult(), "").msgTitle).toContain(
    "USERNAME\\_MISSING calculated damage"
  );
});

test("derives the summary line from the validated request, not the raw draft", () => {
  const result = singleResult();
  result.draft = {
    ...draft,
    attackSummaryString: "  `Pen 0 , Fel 0 :  10`  ",
  };

  const message = getWarhammerDamageRequestMsg(result, "Alex");

  expect(message.description).toContain("`Pen 0, Fel 0: 10`");
  expect(message.description).not.toContain("summary shortened");
});

test.each(["0", "2", "12", "13"])("formats protected Toughness consistently at Felling %s", (felling) => {
  const input = { ...draft, attackSummaryString: `Pen 0, Fel ${felling}: 20, 20,`, toughnessBonus: "6", fortitude: "1" };
  const normalized = normalizeWarhammerDamage(input);
  if (!normalized.request) throw new Error("Expected valid request");
  const result = calculateWarhammerDamage(input, normalized.request);
  const hits = getWarhammerDamageRequestMsg(result, "Alex").fields[0].value;
  const expected = felling === "0" ? "`6` × `2` = `12`"
    : `\`6\` × \`2\` − \`${felling}\`${felling === "13" ? " → " : " = "}\`${Math.max(0, 12 - Number(felling))}\``;
  expect(hits).toContain(`Toughness (${expected})`);
  expect(hits.match(/×/g)).toHaveLength(1);
});

test("bounds maximum-size Horde results with Fortitude equations", () => {
  const input = {
    ...draft,
    attackSummaryString: `Pen 0, Fel 1: ${Array(100).fill(0).join(",")},`,
    toughnessBonus: "4503599627370495", fortitude: String(Number.MAX_SAFE_INTEGER),
    trueHits: "50", magPer: "6", woundsPer: "20", devastating: "1",
  };
  const normalized = normalizeWarhammerDamage(input);
  if (!normalized.request) throw new Error("Expected valid request");
  const message = getWarhammerDamageRequestMsg(calculateWarhammerDamage(input, normalized.request), "Alex");
  expect(message.fields.length).toBeLessThanOrEqual(25);
  message.fields.forEach((field) => expect(field.value.length).toBeLessThanOrEqual(1024));
  expect(message.msgTitle.length + message.description.length + message.fields.reduce((length, field) => length + field.name.length + field.value.length, 0)).toBeLessThanOrEqual(5800);
  expect(message.fields[message.fields.length - 1].value).toContain("Total Magnitude: 1");
  expect(message.fields.map((field) => field.value).join("\n")).toContain("Bonus Devastating");
});

test("shows true and bonus counts beside the Horde hit count without a settings line", () => {
  const input = {
    ...draft, attackSummaryString: `Pen 0, Fel 0: ${Array(9).fill(20).join(", ")}`,
    trueHits: "3", magPer: "10", devastating: "0", woundsPer: "20",
  };
  const normalized = normalizeWarhammerDamage(input);
  if (!normalized.request) throw new Error("Expected valid request");
  const message = getWarhammerDamageRequestMsg(calculateWarhammerDamage(input, normalized.request), "Alex");
  expect(message.description).toBe(`:dart: Horde x9 (3 True, 6 Bonus): \`${input.attackSummaryString}\`\n:mens: Starting at Body`);
  expect(message.description).not.toContain("Mag per");
});

test("keeps totals and complete rows within a bounded embed for 100 large hits", () => {
  const result = singleResult();
  const large = Number.MAX_SAFE_INTEGER;
  result.request.summary.damages = Array(100).fill(-large);
  result.draft = {
    ...draft,
    attackSummaryString: `Pen 0, Fel 0: ${result.request.summary.damages.join(", ")}`,
  };
  result.entries = Array(100)
    .fill(null)
    .map((_, index) => ({
      ...singleHit,
      index,
      number: index + 1,
      originalDamage: -large,
      finalDamage: 0,
      location: index % 2 ? "Left Leg" : "Right Arm",
    }));
  result.totals.damage = 0;

  const message = getWarhammerDamageRequestMsg(result, "A very long display name");
  const allFields = message.fields;
  const aggregate =
    message.msgTitle.length +
    message.description.length +
    allFields.reduce((sum, field) => sum + field.name.length + field.value.length, 0);
  const rendered = allFields.map((field) => field.value).join("\n");

  expect(aggregate).toBeLessThanOrEqual(5800);
  expect(allFields.length).toBeLessThanOrEqual(25);
  allFields.forEach((field) => {
    expect(field.name.length).toBeLessThanOrEqual(32);
    expect(field.value.length).toBeLessThanOrEqual(1024);
  });
  expect(rendered).toContain("Total Damage: 0");
  expect(message.description).toContain("omitted");
  expect(message.fields.length).toBeGreaterThan(2);
  message.fields.slice(1, -1).forEach((field) => {
    expect(field.name).toBe("\u200b");
  });
  expect(rendered).not.toContain("Damage (continued)");
  expect(rendered).not.toContain("#100: :arrow_right:");
});

test("matches modal reduction equations and separates hits with a blank line", () => {
  const result = singleResult();
  result.draft = { ...draft, attackSummaryString: "Pen 3, Fel 5: 10, 10" };
  result.request.summary = { penetration: 3, felling: 5, damages: [10, 10] };
  result.request.toughnessBonus = 3;
  result.entries = [
    { ...singleHit, toughnessBeforeFelling: 3, showArmorTerm: true, armorBeforePenetration: 4, effectiveArmor: 1, finalDamage: 9 },
    { ...singleHit, toughnessBeforeFelling: 3, index: 1, number: 2, location: "Left Arm", showArmorTerm: true, armorBeforePenetration: 2, effectiveArmor: 0 },
  ];
  result.totals.damage = 19;

  const message = getWarhammerDamageRequestMsg(result, "Alex");
  const hits = message.fields[0].value;
  expect(message.description).toBe(":dart: Single target x2: `Pen 3, Fel 5: 10, 10`\n:mens: Starting at Body");
  expect(hits).toContain("**`9`** = `10` − Armor (`4` − `3` = `1`) − Toughness (`3` − `5` → `0`)");
  expect(hits).toContain("Armor (`2` − `3` → `0`)");
  expect(hits).not.toContain("max(");
  expect(hits).toContain("#2: :arrow_right: **10**\n-# Left Arm");
  expect(hits).toContain("\n\n#2:");
});

test("shows an exact armor reduction to zero without max notation", () => {
  const result = singleResult();
  result.draft = { ...draft, attackSummaryString: "Pen 8, Fel 0: 30" };
  result.request.summary = { penetration: 8, felling: 0, damages: [30] };
  result.request.toughnessBonus = 12;
  result.entries = [{
    ...singleHit,
    originalDamage: 30,
    armorBeforePenetration: 8,
    showArmorTerm: true,
    effectiveToughnessBonus: 12,
    toughnessBeforeFelling: 12,
    finalDamage: 18,
  }];
  result.totals.damage = 18;

  const message = getWarhammerDamageRequestMsg(result, "MultiKill");
  expect(message.fields[0].value).toContain(
    "**`18`** = `30` − Armor (`8` − `8` = `0`) − Toughness (`12`)"
  );
  expect(message.fields[0].value).not.toContain("max(");
});

test("shows zero received damage without wrapping the equation or a minimum notice", () => {
  const result = singleResult();
  result.draft = { ...draft, attackSummaryString: "Pen 3, Fel 0: 17" };
  result.request.summary = { penetration: 3, felling: 0, damages: [17] };
  result.request.toughnessBonus = 20;
  result.entries = [{
    ...singleHit,
    originalDamage: 17,
    armorBeforePenetration: 4,
    effectiveArmor: 1,
    showArmorTerm: true,
    effectiveToughnessBonus: 20,
    toughnessBeforeFelling: 20,
    finalDamage: 0,
  }];
  result.totals.damage = 0;

  const hits = getWarhammerDamageRequestMsg(result, "Alex").fields[0].value;
  expect(hits).toContain("**`0`** = `17` − Armor (`4` − `3` = `1`) − Toughness (`20`)");
  expect(hits).not.toContain("minimum 0");
  expect(hits).not.toContain("= (");
});
