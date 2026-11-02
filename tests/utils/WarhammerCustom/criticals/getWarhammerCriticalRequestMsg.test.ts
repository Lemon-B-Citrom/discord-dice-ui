import { getWarhammerCriticalRequestMsg } from "../../../../src/utils/WarhammerCustom/criticals/getWarhammerCriticalRequestMsg";
import { getCriticalPresentation } from "../../../../src/utils/WarhammerCustom/criticals/criticalPresentation";
import { lookupWarhammerCritical } from "../../../../src/utils/WarhammerCustom/criticals/lookupWarhammerCritical";
import { resolveWarhammerCriticalResult } from "../../../../src/utils/WarhammerCustom/criticals/resolveWarhammerCritical";
import {
  HUMANOID_CRITICAL_TABLES,
  VEHICLE_CRITICAL_TABLES,
} from "../../../../src/utils/WarhammerCustom/criticals/criticalTables";
import { formatCriticalTextForDiscord } from "../../../../src/utils/WarhammerCustom/criticals/formatCriticalText";

test("builds a complete, bounded webhook message from the saved lookup result", () => {
  const result = resolveWarhammerCriticalResult(lookupWarhammerCritical({
    family: "humanoid",
    location: "body",
    damageType: "Energy",
    severity: 10,
  }), () => 1);
  const message = getWarhammerCriticalRequestMsg(result, "Alex");
  const presentation = getCriticalPresentation(result);

  expect(message.msgTitle).toBeUndefined();
  expect(message.description).toContain(
    "**Alex rolled a critical effect**\n:skull_crossbones: Body, Energy – 10\n\n"
  );
  expect(message.description).toContain(
    presentation.sections
      .map((section) => formatCriticalTextForDiscord(section.text))
      .join("\n\n")
  );
  expect(message.description).not.toContain("Source:");
  expect(message.description).toContain("**1d5**");
  expect(message.description).toContain("\n**Rolls and Checks**\n");
  expect(message.description).not.toContain("\n---\n");
  expect(message.description).toContain("#1: :arrow_right: **1d5 = 1**");
  expect(message.description).toContain("#2: :arrow_right: **1d10+5 = 6**");
  expect(message.fields).toEqual([]);
});

test("marks rolled quantities with their status effect when one applies", () => {
  const result = resolveWarhammerCriticalResult(lookupWarhammerCritical({
    family: "humanoid",
    location: "head",
    damageType: "Energy",
    severity: 6,
  }), () => 3);
  const message = getWarhammerCriticalRequestMsg(result, "Alex");

  expect(message.description).toContain(
    "3 (**1d5**) levels of **Fatigue** and is **Blinded** for 3 (**1d10**) **hours**"
  );
  expect(message.description).toContain(
    "#1: :arrow_right: **1d5 = 3** — **Fatigue (levels)**"
  );
  expect(message.description).toContain(
    "#2: :arrow_right: **1d10 = 3** — **Blinded (hours)**"
  );
  expect(message.description).toContain("#3: :arrow_right: **1d5 = 3**");
  expect(message.description).toContain("\n\n**Rolls and Checks**\n");
});

test("formats vehicle metadata and checks without a damage type", () => {
  const result = resolveWarhammerCriticalResult(lookupWarhammerCritical({
    family: "vehicle",
    location: "hull",
    severity: 1,
  }), () => 1);
  const message = getWarhammerCriticalRequestMsg(result, "@everyone");

  expect(message.description).toContain(
    ":skull_crossbones: Hull – 1\n\n"
  );
  expect(message.description).toContain("**@\u200beveryone rolled a critical effect**");
  expect(message.description).toContain("`Ordinary (+10) Fortitude Test`");
  expect(message.description).toContain(
    `#1: \`Ordinary (+10) Fortitude Test\``
  );
  expect(message.description).not.toContain("– undefined");
});

test("bolds numeric quantities before highlighted effects and durations", () => {
  expect(
    formatCriticalTextForDiscord(
      "The target suffers 2 levels of Fatigue for 1 round."
    )
  ).toBe("The target suffers **2** levels of **Fatigue** for **1** **round**.");
});

test("rejects oversized text that cannot fit in one embed", () => {
  const lookupResult = lookupWarhammerCritical({
    family: "vehicle",
    location: "turret",
    severity: 10,
  });
  const sourceText = "Verified source wording. ".repeat(300);
  const result = resolveWarhammerCriticalResult(
    {
      ...lookupResult,
      effect: { ...lookupResult.effect, text: sourceText },
    },
    () => 1
  );
  expect(() => getWarhammerCriticalRequestMsg(result, "@everyone")).toThrow(
    "Unable to fit critical effect in a Discord embed"
  );
});

test("rejects a source effect that cannot fit in one embed", () => {
  const lookupResult = lookupWarhammerCritical({
    family: "vehicle",
    location: "turret",
    severity: 10,
  });
  const result = resolveWarhammerCriticalResult(
    {
      ...lookupResult,
      effect: { ...lookupResult.effect, text: "x".repeat(25_000) },
    },
    () => 1
  );

  expect(() => getWarhammerCriticalRequestMsg(result, "Username")).toThrow(
    "Unable to fit critical effect in a Discord embed"
  );
});

test("every selected effect and prerequisite fits one embed", () => {
  HUMANOID_CRITICAL_TABLES.concat(VEHICLE_CRITICAL_TABLES).forEach((table) => {
    table.rows.forEach((row) => {
      const result = resolveWarhammerCriticalResult(lookupWarhammerCritical({
        family: table.family,
        location: table.location,
        severity: row.severity,
        ...(table.damageType ? { damageType: table.damageType } : {}),
      } as any), () => 1);
      const presentation = getCriticalPresentation(result);
      const message = getWarhammerCriticalRequestMsg(result, "Username");

      expect(message.fields).toEqual([]);
      presentation.sections.forEach((section) => {
        expect(message.description).toContain(
          formatCriticalTextForDiscord(section.text)
        );
      });
    });
  });
});
