import getWarhammerDefenderDamageRequestMsg from "../../src/utils/getWarhammerDefenderDamageRequestMsg";
import calculateWarhammerDefenderDamage from "../../src/utils/calculateWarhammerDefenderDamage";
import normalizeWarhammerDefenderDamage from "../../src/utils/normalizeWarhammerDefenderDamage";
import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageResult,
  WarhammerDefenderSingleDamageHit,
  WarhammerDefenderHordeDamageHit,
  WarhammerBonusDevastatingEntry,
  WarhammerHumanoidDamageRequest,
} from "../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";

/** These fixtures are all humanoid, so the humanoid branch is always live. */
interface HumanoidResult extends WarhammerDefenderDamageResult {
  request: WarhammerHumanoidDamageRequest;
}

const defenses = {
  mode: "simple" as const,
  armor: {
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
  },
};

const draft = {
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  attackSummaryString: "Pen 0, Fel 0, @body: 10",
  toughnessBonus: "0",
};

const singleHit: WarhammerDefenderSingleDamageHit = {
  kind: "hit",
  targetFamily: "humanoid",
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

function singleResult(): HumanoidResult {
  return {
    request: {
      targetFamily: "humanoid",
      mode: "single",
      summary: {
        penetration: 0,
        felling: 0,
        devastating: 0,
        firstHitLocation: "Body",
        damages: [10],
      },
      toughnessBonus: 0,
      fortitude: 0,
      defenses,
      firstHitLocation: "Body",
    },
    entries: [singleHit],
    totals: { damage: 10 },
  };
}

function hordeResult(): HumanoidResult {
  const trueHit: WarhammerDefenderHordeDamageHit = {
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
    request: {
      targetFamily: "humanoid",
      mode: "horde",
      summary: {
        penetration: 0,
        felling: 0,
        devastating: 1,
        firstHitLocation: "Body",
        damages: [10],
      },
      toughnessBonus: 0,
      fortitude: 0,
      defenses,
      firstHitLocation: "Body",
      trueHits: 1,
      magPer: 6,
      woundsPer: 10,
    },
    entries: [trueHit, synthetic],
    totals: { damage: 10, magnitude: 8, killCount: 1 },
  };
}

test("formats an ordered single-target breakdown with omitted armor and totals", () => {
  const message = getWarhammerDefenderDamageRequestMsg(singleResult(), "Alex");

  expect(message.msgTitle).toBe("Alex calculated damage. Single target");
  expect(message.description).toBe(
    ":dart: Single target x1: `Pen 0, @body: 10`\n:mens: Starting at Body"
  );
  expect(message.fields[0].value).toContain(
    "#1: :arrow_right: **10**\n-# Body"
  );
  expect(message.fields[0].value).not.toContain("Armor");
  expect(message.fields[0].value).not.toContain("Original");
  expect(message.fields[0].value).not.toContain("Damage:");
  expect(message.fields[0].value).toContain(
    "**`10`** = `10` − Toughness (`0`)"
  );
  expect(message.fields[message.fields.length - 1]).toEqual({
    name: ":boom: Summary",
    value: "Total Damage: 10",
  });
});

test("formats Horde classification operands and a separate Bonus Devastating entry", () => {
  const message = getWarhammerDefenderDamageRequestMsg(hordeResult(), "Alex");
  const values = message.fields.map((field) => field.value).join("\n");

  expect(message.msgTitle).toContain("Horde");
  expect(values).toContain("**Overkill!**");
  expect(message.description).toBe(
    ":dart: Horde x1 (1 True, 0 Bonus): `Pen 0, Dev 1, @body: 10`\n:mens: Starting at Body"
  );
  expect(values).toContain(
    "#1: :arrow_right: **Overkill!** **10** Damage, **7** Magnitude\n-# Body"
  );
  expect(values).toContain("Damage: **`10`** = `10` − Toughness (`0`)");
  expect(values).toContain(
    "Magnitude: **`7`** = Per-unit Magnitude (`6`) + Devastating (`1`)"
  );
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
  const message = getWarhammerDefenderDamageRequestMsg(
    result,
    "@everyone `GM`"
  );

  expect(message.msgTitle).toContain("@\u200beveryone \\`GM\\`");
  expect(message.fields[message.fields.length - 1].value).toContain(
    "Kill Count: Unavailable (Mag per is 0)"
  );
});

test("uses the existing missing-username fallback", () => {
  expect(
    getWarhammerDefenderDamageRequestMsg(singleResult(), "").msgTitle
  ).toContain("USERNAME\\_MISSING calculated damage");
});

test("derives the summary line from the validated request", () => {
  const result = singleResult();
  result.request.summary = {
    penetration: 7,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [3],
  };

  const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");

  expect(message.description).toContain("`Pen 7, @body: 3`");
  expect(message.description).not.toContain("summary shortened");
});

test.each(["0", "2", "12", "13"])(
  "formats protected Toughness consistently at Felling %s",
  (felling) => {
    const input = {
      ...draft,
      attackSummaryString: `Pen 0, Fel ${felling}, @body: 20, 20,`,
      toughnessBonus: "6",
      fortitude: "1",
    };
    const normalized = normalizeWarhammerDefenderDamage(input);
    if (!normalized.request) throw new Error("Expected valid request");
    const result = calculateWarhammerDefenderDamage(normalized.request);
    const hits = getWarhammerDefenderDamageRequestMsg(result, "Alex").fields[0]
      .value;
    const expected =
      felling === "0"
        ? "`6` × `2` = `12`"
        : `\`6\` × \`2\` − \`${felling}\`${
            felling === "13" ? " → " : " = "
          }\`${Math.max(0, 12 - Number(felling))}\``;
    expect(hits).toContain(`Toughness (${expected})`);
    expect(hits.match(/×/g)).toHaveLength(1);
  }
);

test("bounds maximum-size Horde results with Fortitude equations", () => {
  const input = {
    ...draft,
    attackSummaryString: `Pen 0, Fel 1, Dev 1, @body: ${Array(100)
      .fill(0)
      .join(",")},`,
    toughnessBonus: "4503599627370495",
    fortitude: String(Number.MAX_SAFE_INTEGER),
    hordeEnabled: true,
    bonusHits: "50",
    magPer: "6",
    woundsPer: "20",
  };
  const normalized = normalizeWarhammerDefenderDamage(input);
  if (!normalized.request) throw new Error("Expected valid request");
  const message = getWarhammerDefenderDamageRequestMsg(
    calculateWarhammerDefenderDamage(normalized.request),
    "Alex"
  );
  expect(message.fields.length).toBeLessThanOrEqual(25);
  message.fields.forEach((field) =>
    expect(field.value.length).toBeLessThanOrEqual(1024)
  );
  expect(
    message.msgTitle.length +
      message.description.length +
      message.fields.reduce(
        (length, field) => length + field.name.length + field.value.length,
        0
      )
  ).toBeLessThanOrEqual(5800);
  expect(message.fields[message.fields.length - 1].value).toContain(
    "Total Magnitude: 1"
  );
  expect(message.fields.map((field) => field.value).join("\n")).toContain(
    "Bonus Devastating"
  );
});

test("shows true and bonus counts beside the Horde hit count without a settings line", () => {
  const input = {
    ...draft,
    attackSummaryString: `Pen 0, @body: ${Array(9).fill(20).join(", ")}`,
    hordeEnabled: true,
    bonusHits: "6",
    magPer: "10",
    woundsPer: "20",
  };
  const normalized = normalizeWarhammerDefenderDamage(input);
  if (!normalized.request) throw new Error("Expected valid request");
  const message = getWarhammerDefenderDamageRequestMsg(
    calculateWarhammerDefenderDamage(normalized.request),
    "Alex"
  );
  expect(message.description).toBe(
    ":dart: Horde x9 (3 True, 6 Bonus): `Pen 0, @body: 20 20 20 20 20 20 20 20 20`\n:mens: Starting at Body"
  );
  expect(message.description).not.toContain("Mag per");
});

test("keeps totals and complete rows within a bounded embed for 100 large hits", () => {
  const result = singleResult();
  const large = Number.MAX_SAFE_INTEGER;
  result.request.summary.damages = Array(100).fill(-large);
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

  const message = getWarhammerDefenderDamageRequestMsg(
    result,
    "A very long display name"
  );
  const allFields = message.fields;
  const aggregate =
    message.msgTitle.length +
    message.description.length +
    allFields.reduce(
      (sum, field) => sum + field.name.length + field.value.length,
      0
    );
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
  result.request.summary = {
    penetration: 3,
    felling: 5,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [10, 10],
  };
  result.request.toughnessBonus = 3;
  result.entries = [
    {
      ...singleHit,
      toughnessBeforeFelling: 3,
      showArmorTerm: true,
      armorBeforePenetration: 4,
      effectiveArmor: 1,
      finalDamage: 9,
    },
    {
      ...singleHit,
      toughnessBeforeFelling: 3,
      index: 1,
      number: 2,
      location: "Left Arm",
      showArmorTerm: true,
      armorBeforePenetration: 2,
      effectiveArmor: 0,
    },
  ];
  result.totals.damage = 19;

  const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");
  const hits = message.fields[0].value;
  expect(message.description).toBe(
    ":dart: Single target x2: `Pen 3, Fel 5, @body: 10 10`\n:mens: Starting at Body"
  );
  expect(hits).toContain(
    "**`9`** = `10` − Armor (`4` − `3` = `1`) − Toughness (`3` − `5` → `0`)"
  );
  expect(hits).toContain("Armor (`2` − `3` → `0`)");
  expect(hits).not.toContain("max(");
  expect(hits).toContain("#2: :arrow_right: **10**\n-# Left Arm");
  expect(hits).toContain("\n\n#2:");
});

test("shows an exact armor reduction to zero without max notation", () => {
  const result = singleResult();
  result.request.summary = {
    penetration: 8,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [30],
  };
  result.request.toughnessBonus = 12;
  result.entries = [
    {
      ...singleHit,
      originalDamage: 30,
      armorBeforePenetration: 8,
      showArmorTerm: true,
      effectiveToughnessBonus: 12,
      toughnessBeforeFelling: 12,
      finalDamage: 18,
    },
  ];
  result.totals.damage = 18;

  const message = getWarhammerDefenderDamageRequestMsg(result, "MultiKill");
  expect(message.fields[0].value).toContain(
    "**`18`** = `30` − Armor (`8` − `8` = `0`) − Toughness (`12`)"
  );
  expect(message.fields[0].value).not.toContain("max(");
});

test("formats the per-location Toughness add-on inside the equation", () => {
  const result = singleResult();
  result.request.defenses = {
    mode: "advanced",
    armor: {
      Head: 4,
      Body: 2,
      "Left Arm": 1,
      "Right Arm": 1,
      "Left Leg": 0,
      "Right Leg": 0,
    },
    toughnessBonus: {
      Head: 0,
      Body: 1,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
  };
  result.request.toughnessBonus = 2;
  result.request.fortitude = 1;
  result.request.summary = {
    penetration: 0,
    felling: 1,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [12],
  };
  result.entries = [
    {
      ...singleHit,
      originalDamage: 12,
      armorBeforePenetration: 2,
      effectiveArmor: 2,
      showArmorTerm: true,
      fortitudeApplied: true,
      toughnessBeforeFelling: 6,
      effectiveToughnessBonus: 5,
      finalDamage: 5,
    },
  ];
  result.totals.damage = 5;

  const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");

  expect(message.description).toBe(
    ":dart: Single target x1: `Pen 0, Fel 1, @body: 12`\n:mens: Starting at Body"
  );
  expect(message.fields[0].value).toContain(
    "**`5`** = `12` − Armor (`2`) − Toughness ((`2` + `1`) × `2` − `1` = `5`)"
  );
});

test("shows the advanced Toughness sum without Fortitude", () => {
  const result = singleResult();
  result.request.defenses = {
    mode: "advanced",
    armor: {
      Head: 0,
      Body: 0,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
    toughnessBonus: {
      Head: 0,
      Body: 1,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
  };
  result.request.toughnessBonus = 2;
  result.entries = [
    {
      ...singleHit,
      toughnessBeforeFelling: 3,
      effectiveToughnessBonus: 3,
      finalDamage: 7,
    },
  ];
  result.totals.damage = 7;

  const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");
  expect(message.fields[0].value).toContain("Toughness (`2` + `1` = `3`)");
});

test("rejects an unsafe advanced defense before formatting", () => {
  const result = singleResult();
  result.request.defenses = {
    mode: "advanced",
    armor: {
      Head: 1.5,
      Body: 0,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
    toughnessBonus: {
      Head: 0,
      Body: 0,
      "Left Arm": 0,
      "Right Arm": 0,
      "Left Leg": 0,
      "Right Leg": 0,
    },
  };

  expect(() => getWarhammerDefenderDamageRequestMsg(result, "Alex")).toThrow(
    /safe whole-number/
  );
});

test("shows zero received damage without wrapping the equation or a minimum notice", () => {
  const result = singleResult();
  result.request.summary = {
    penetration: 3,
    felling: 0,
    devastating: 0,
    firstHitLocation: "Body",
    damages: [17],
  };
  result.request.toughnessBonus = 20;
  result.entries = [
    {
      ...singleHit,
      originalDamage: 17,
      armorBeforePenetration: 4,
      effectiveArmor: 1,
      showArmorTerm: true,
      effectiveToughnessBonus: 20,
      toughnessBeforeFelling: 20,
      finalDamage: 0,
    },
  ];
  result.totals.damage = 0;

  const hits = getWarhammerDefenderDamageRequestMsg(result, "Alex").fields[0]
    .value;
  expect(hits).toContain(
    "**`0`** = `17` − Armor (`4` − `3` = `1`) − Toughness (`20`)"
  );
  expect(hits).not.toContain("minimum 0");
  expect(hits).not.toContain("= (");
});
