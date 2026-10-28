import getWarhammerAttackerDamageRequestMsg from "./getWarhammerAttackerDamageRequestMsg";
import { WarhammerAttackerDamageResult } from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

const input: WarhammerAttackerDamageResult["input"] = {
  hits: 2,
  damageDice: 1,
  damageModifier: 2,
  penetration: 3,
  felling: 2,
  devastating: 0,
  proven: 0,
  rfOn: 10,
  rfConfirmsOn: 50,
  alwaysConfirm: false,
  tearing: "tearing",
};

function result(): WarhammerAttackerDamageResult {
  return {
    input,
    damages: [16, 11],
    hitDetails: [
      {
        attempts: [
          {
            baseRolls: [{ roll: 8, damage: 8 }],
            righteousFuryRolls: [],
            damage: 10,
          },
          {
            baseRolls: [{ roll: 10, damage: 10 }],
            righteousFuryRolls: [4],
            damage: 16,
          },
        ],
        selectedAttemptIndex: 1,
      },
      {
        attempts: [
          {
            baseRolls: [{ roll: 6, damage: 6 }],
            righteousFuryRolls: [],
            damage: 8,
          },
          {
            baseRolls: [{ roll: 9, damage: 9 }],
            righteousFuryRolls: [],
            damage: 11,
          },
        ],
        selectedAttemptIndex: 1,
      },
    ],
  };
}

test("formats the profile, ordered hit totals, selected attempts, and comparisons", () => {
  const message = getWarhammerAttackerDamageRequestMsg(result(), "Alex");

  expect(message.msgTitle).toBe("Alex performed an attack. `1d10` + `2` x `2`");
  expect(message.description).toContain("Penetration 3");
  expect(message.description).toContain("Felling 2");
  expect(message.description).not.toContain("Proven");
  expect(message.description.split("\n")[0]).toBe(
    ":crossed_swords: Penetration 3 · Felling 2 · Tearing"
  );
  expect(message.description.split("\n")[1]).toBe(
    ":drop_of_blood: Righteous Fury confirms at 50%"
  );
  expect(message.description).not.toContain("Damage before target mitigation.");
  expect(message.fields[0]).toEqual({
    name: "Damage by hit",
    value:
      "#1: :arrow_right: **Righteous Fury!** **16**\n`10` + `4` + 2 = 16 > `8` + 2 = 10\n#2: :arrow_right: **11**\n`9` + 2 = 11 > `6` + 2 = 8",
  });
  expect(message.fields[0].value.indexOf("#1: :arrow_right:")).toBeLessThan(
    message.fields[0].value.indexOf("`10` + `4` + 2 = 16")
  );
  expect(message.fields[0].value.indexOf("`10` + `4` + 2 = 16")).toBeLessThan(
    message.fields[0].value.indexOf("`8` + 2 = 10")
  );
  expect(message.fields[0].value.indexOf("`8` + 2 = 10")).toBeLessThan(
    message.fields[0].value.indexOf("#2: :arrow_right:")
  );
  expect(message.fields[0].value).not.toContain("Selected:");
  expect(message.fields[0].value).not.toContain("Discarded:");
  expect(message.fields[message.fields.length - 1]).toEqual({
    name: ":boom: Summary",
    value: "`Pen 3, Fel 2: 16, 11`",
  });
});

test("includes Devastating in the profile and summary only when it is not zero", () => {
  const attack = result();
  attack.input = { ...input, devastating: 3 };

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");

  expect(message.description).toContain("Devastating 3");
  expect(message.description.split("\n")[0]).toBe(
    ":crossed_swords: Penetration 3 · Felling 2 · Devastating 3 · Tearing"
  );
  expect(message.fields[message.fields.length - 1]).toEqual({
    name: ":boom: Summary",
    value: "`Pen 3, Fel 2, Dev 3: 16, 11`",
  });
});

test("omits zero-valued traits from the summary while keeping the header order canonical", () => {
  const attack = result();
  attack.input = { ...input, felling: 0, devastating: 4 };

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");

  expect(message.description.split("\n")[0]).toBe(
    ":crossed_swords: Penetration 3 · Devastating 4 · Tearing"
  );
  expect(message.fields[message.fields.length - 1].value).toBe(
    "`Pen 3, Dev 4: 16, 11`"
  );
});

test("renders each hit with modal-style monospaced dice, bold totals, and greater-than comparisons", () => {
  const attack = result();
  attack.input = { ...input, hits: 3, damageModifier: 5 };
  attack.damages = [14, 12, 14];
  const attemptValues: Array<Array<[number, number]>> = [
    [
      [9, 14],
      [7, 12],
    ],
    [
      [7, 12],
      [4, 9],
    ],
    [
      [9, 14],
      [9, 14],
    ],
  ];
  attack.hitDetails = attemptValues.map((attemptPairs) => ({
    attempts: attemptPairs.map(([roll, damage]) => ({
      baseRolls: [{ roll, damage: roll }],
      righteousFuryRolls: [],
      damage,
    })),
    selectedAttemptIndex: 0,
  }));

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");
  expect(message.fields[0].value).toBe(
    "#1: :arrow_right: **14**\n`9` + 5 = 14 > `7` + 5 = 12\n#2: :arrow_right: **12**\n`7` + 5 = 12 > `4` + 5 = 9\n#3: :arrow_right: **14**\n`9` + 5 = 14 > `9` + 5 = 14"
  );
});

test("formats Proven adjustments, Fury chains, negative modifiers, and non-positive damage", () => {
  const attack = result();
  attack.input = {
    ...input,
    hits: 1,
    damageDice: 2,
    damageModifier: -19,
    proven: 7,
  };
  attack.damages = [-2];
  attack.hitDetails = [
    {
      attempts: [
        {
          baseRolls: [
            { roll: 3, damage: 7 },
            { roll: 4, damage: 7 },
          ],
          righteousFuryRolls: [2, 1],
          damage: -2,
        },
      ],
      selectedAttemptIndex: 0,
    },
  ];

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");
  expect(message.msgTitle).toBe(
    "Alex performed an attack. `2d10` − `19` x `1`"
  );
  expect(message.fields[0].value).toContain(
    "#1: :arrow_right: **Righteous Fury x2!** **-2**"
  );
  expect(message.fields[0].value).toContain(
    "`7` + `7` + `2` + `1` − 19 = -2 (Proven: `3` → `7`, `4` → `7`)"
  );
});

test("omits zero Felling and Proven and shows only the configured Fury details", () => {
  const attack = result();
  attack.input = {
    ...input,
    hits: 1,
    damageModifier: 0,
    felling: 0,
    proven: 0,
    rfOn: 9,
    rfConfirmsOn: 100,
  };
  attack.damages = [10];
  attack.hitDetails = [result().hitDetails[0]];

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");
  expect(message.msgTitle).toBe("Alex performed an attack. `1d10` + `0` x `1`");
  expect(message.description).toContain("Penetration 3");
  expect(message.description).toContain(":drop_of_blood: Righteous Fury on 9");
  expect(message.description).not.toContain("Felling");
  expect(message.description).not.toContain("Proven");
  expect(message.description).not.toContain("confirms at");

  attack.input = { ...attack.input, rfOn: 10, rfConfirmsOn: 100 };
  const defaultFuryMessage = getWarhammerAttackerDamageRequestMsg(attack, "Alex");
  expect(defaultFuryMessage.description).not.toContain("Righteous Fury");
  expect(defaultFuryMessage.description).not.toContain(":drop_of_blood:");

  attack.input = { ...attack.input, rfOn: 10, rfConfirmsOn: 55 };
  expect(getWarhammerAttackerDamageRequestMsg(attack, "Alex").description).toContain(
    ":drop_of_blood: Righteous Fury confirms at 55%"
  );

  attack.input = { ...attack.input, rfOn: 9, rfConfirmsOn: 55 };
  expect(getWarhammerAttackerDamageRequestMsg(attack, "Alex").description).toContain(
    ":drop_of_blood: Righteous Fury on 9, confirms at 55%"
  );
});

test("reports No Righteous Fury when the confirmation threshold is zero", () => {
  const attack = result();
  attack.input = { ...input, hits: 1, rfOn: 10, rfConfirmsOn: 0 };
  attack.damages = [2];
  attack.hitDetails = [result().hitDetails[0]];

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Lemon");
  expect(message.description.split("\n")[0]).toBe(
    ":crossed_swords: Penetration 3 · Felling 2 · Tearing"
  );
  expect(message.description.split("\n")[1]).toBe(":drop_of_blood: No Righteous Fury");
});

test("reports always-confirming Fury instead of a confirmation threshold", () => {
  const attack = result();
  attack.input = {
    ...input,
    hits: 1,
    rfOn: 10,
    rfConfirmsOn: 0,
    alwaysConfirm: true,
  };
  attack.damages = [2];
  attack.hitDetails = [result().hitDetails[0]];

  expect(
    getWarhammerAttackerDamageRequestMsg(attack, "Lemon").description.split("\n")[1]
  ).toBe(":drop_of_blood: Righteous Fury always confirms");

  attack.input = { ...attack.input, rfOn: 9 };
  expect(
    getWarhammerAttackerDamageRequestMsg(attack, "Lemon").description.split("\n")[1]
  ).toBe(":drop_of_blood: Righteous Fury on 9, always confirms");
});

test("keeps crossed swords on the profile and blood on the Fury line for Triple Tearing", () => {
  const attack = result();
  attack.input = {
    ...input,
    penetration: 0,
    felling: 0,
    tearing: "tripleTearing",
    rfOn: 4,
    rfConfirmsOn: 95,
  };

  expect(getWarhammerAttackerDamageRequestMsg(attack, "Lemon").description).toBe(
    ":crossed_swords: Penetration 0 · Triple Tearing\n:drop_of_blood: Righteous Fury on 4, confirms at 95%"
  );
});

test("does not include a No Tearing descriptor in the webhook profile", () => {
  const attack = result();
  attack.input = { ...input, hits: 1, tearing: "none" };
  attack.damages = [16];
  attack.hitDetails = [result().hitDetails[0]];

  const message = getWarhammerAttackerDamageRequestMsg(attack, "Alex");

  expect(message.description).not.toContain("No Tearing");
  expect(message.description).not.toContain("Tearing");
});

test("escapes and bounds a user name without creating a mention", () => {
  const message = getWarhammerAttackerDamageRequestMsg(
    result(),
    "@everyone *Player*\nNext"
  );

  expect(message.msgTitle).toContain("@\u200beveryone");
  expect(message.msgTitle).toContain("\\*Player\\*");
  expect(message.msgTitle).not.toContain("\n");
  expect(message.msgTitle.length).toBeLessThanOrEqual(256);
  expect(getWarhammerAttackerDamageRequestMsg(result(), "").msgTitle).toContain(
    "USERNAME\\_MISSING"
  );
});

test("preserves all hit totals and bounds every Discord embed field for maximum-sized results", () => {
  const attack = result();
  attack.input = {
    ...input,
    hits: 100,
    damageDice: 100,
    tearing: "tripleTearing",
  };
  attack.damages = Array.from({ length: 100 }, (_, index) => index + 1);
  attack.hitDetails = attack.damages.map((damage) => ({
    attempts: [0, 1, 2].map(() => ({
      baseRolls: Array.from({ length: 100 }, () => ({ roll: 10, damage: 10 })),
      righteousFuryRolls: Array.from({ length: 100 }, () => 10),
      damage,
    })),
    selectedAttemptIndex: 1,
  }));

  const message = getWarhammerAttackerDamageRequestMsg(
    attack,
    "A very long player name".repeat(20)
  );
  const allHitValues = message.fields
    .filter(({ name }) => name.startsWith("Damage"))
    .map(({ value }) => value)
    .join("\n");
  const embedCharacterCount =
    message.msgTitle.length +
    message.description.length +
    message.fields.reduce(
      (count, field) => count + field.name.length + field.value.length,
      0
    );
  expect(allHitValues).toContain("#1: :arrow_right:");
  expect(allHitValues).toContain(
    "#100: :arrow_right: **Righteous Fury x100!** **100**"
  );
  expect(
    message.fields.some(({ value }) => value.includes("details shortened"))
  ).toBe(true);
  expect(message.fields.length).toBeLessThanOrEqual(25);
  expect(
    message.fields.every(
      ({ name, value }) => name.length <= 256 && value.length <= 1024
    )
  ).toBe(true);
  expect(message.description.length).toBeLessThanOrEqual(4096);
  expect(embedCharacterCount).toBeLessThanOrEqual(6000);
});

test("rejects inconsistent completion snapshots instead of formatting fabricated results", () => {
  const attack = result();
  attack.hitDetails.pop();

  expect(() => getWarhammerAttackerDamageRequestMsg(attack, "Alex")).toThrow(
    "Invalid Warhammer attack result"
  );
});
