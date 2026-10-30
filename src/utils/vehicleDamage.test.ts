import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageHit,
} from "../components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS } from "./damageLocations";
import formatWarhammerAttackerDamageSummary from "./formatWarhammerAttackerDamageSummary";
import parseWarhammerAttackerDamageSummary from "./parseWarhammerAttackerDamageSummary";
import normalizeWarhammerDefenderDamage from "./normalizeWarhammerDefenderDamage";
import calculateWarhammerDefenderDamage from "./calculateWarhammerDefenderDamage";
import getWarhammerDefenderDamageRequestMsg from "./getWarhammerDefenderDamageRequestMsg";

describe("vehicle damage summary and calculation", () => {
  it("uses the required vehicle wire tokens and round-trips RF base values", () => {
    expect(VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS).toEqual({
      "Motive Systems": "@motv", Hull: "@hull", Weapons: "@wpns", Turret: "@turr",
    });
    const summary = {
      penetration: 3, felling: 0, devastating: 0, firstHitLocation: "Hull" as const,
      damages: [25, 12, 31], baseDamages: [10, 12, 18],
    };
    const text = formatWarhammerAttackerDamageSummary(summary);
    expect(text).toBe("Pen 3, @hull: 25(10) 12 31(18)");
    expect(parseWarhammerAttackerDamageSummary(text).summary).toEqual(summary);
  });

  it("requires vehicle facing and independently defaults blank facing armor to zero", () => {
    const draft: WarhammerDefenderDamageDraft = {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @motv: 10",
    };
    expect(normalizeWarhammerDefenderDamage(draft).errors.facing).toBe("Choose a facing");
    const normalized = normalizeWarhammerDefenderDamage({ ...draft, facing: "Side", armorSide: "4" });
    expect(normalized.request && normalized.request.targetFamily).toBe("vehicle");
    expect(normalized.request && normalized.request.vehicleArmor).toEqual({ Front: 0, Side: 4, Rear: 0 });
  });

  it("ignores invalid inactive humanoid protections for vehicle requests", () => {
    const normalized = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 10",
      facing: "Front",
      toughnessBonus: "invalid",
      fortitude: "-1",
      armorBody: "not armor",
      hordeEnabled: true,
      advancedEnabled: true,
      advancedArmorHead: "invalid",
      magPer: "bad",
    });
    expect(normalized.errors).toEqual({});
    expect(normalized.request).not.toHaveProperty("defenses");
    expect(normalized.request).not.toHaveProperty("toughnessBonus");
    expect(normalized.request).not.toHaveProperty("mode", "horde");
  });

  it("uses selected facing for vehicle locations and always uses Front for Turret", () => {
    const armor = { Front: 2, Side: 5, Rear: 9 };
    const cases = [
      ["Motive Systems", "Front", "Front"],
      ["Hull", "Side", "Side"],
      ["Weapons", "Rear", "Rear"],
      ["Turret", "Rear", "Front"],
    ] as const;
    cases.forEach(([location, facing, armorFacing]) => {
      const request = normalizeWarhammerDefenderDamage({
        ...EMPTY_DEFENDER_DAMAGE_DRAFT,
        attackSummaryString: `Pen 0, @${location === "Motive Systems" ? "motv" : location === "Hull" ? "hull" : location === "Weapons" ? "wpns" : "turr"}: 20`,
        facing,
        armorFront: `${armor.Front}`,
        armorSide: `${armor.Side}`,
        armorRear: `${armor.Rear}`,
      }).request!;
      const hit = calculateWarhammerDefenderDamage(request).entries[0];
      expect(hit).toMatchObject({ location, armorFacing, armorBeforePenetration: armor[armorFacing] });
    });
  });

  it("uses first location, fresh subsequent d100 locations, Turret Front AP, and the base-damage RF gate", () => {
    const draft = {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 25(10) 26(11) 5(-2)",
      facing: "Side", armorFront: "20", armorSide: "10", armorRear: "30",
    };
    const request = normalizeWarhammerDefenderDamage(draft).request!;
    const draws = [90, 50];
    const result = calculateWarhammerDefenderDamage(request, () => draws.shift() as number);
    const hits = result.entries.filter((entry) => entry.kind === "hit") as WarhammerDefenderDamageHit[];
    expect(hits.map((entry) => entry.location)).toEqual(["Hull", "Turret", "Hull"]);
    expect(hits.map((entry) => entry.armorFacing)).toEqual(["Side", "Front", "Side"]);
    expect(hits.map((entry) => entry.finalDamage)).toEqual([1, 1, 1]);
    expect(hits[0].rfApplied).toBe(false);
    expect(hits[1].locationRoll).toBe(90);
    expect(draws).toEqual([]);
  });

  it("allows repeated independent vehicle locations and rejects out-of-range injected rolls", () => {
    const draft = {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 1 1 1",
      facing: "Front",
    };
    const request = normalizeWarhammerDefenderDamage(draft).request!;
    const draws = [50, 50];
    const result = calculateWarhammerDefenderDamage(request, () => draws.shift() as number);
    expect((result.entries.filter((entry) => entry.kind === "hit") as WarhammerDefenderDamageHit[]).map((entry) => entry.location)).toEqual(["Hull", "Hull", "Hull"]);
    expect(() => calculateWarhammerDefenderDamage(request, () => 101)).toThrow(/integer from 1 to 100/);
    expect(() => calculateWarhammerDefenderDamage(request, () => undefined as any)).toThrow(/integer from 1 to 100/);
  });

  it("uses the full percentile boundary range for subsequent locations", () => {
    const request = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 1 1 1",
      facing: "Rear",
    }).request!;
    const rolls = [1, 100];
    const hits = calculateWarhammerDefenderDamage(request, () => rolls.shift() as number)
      .entries.filter((entry) => entry.kind === "hit") as WarhammerDefenderDamageHit[];
    expect(hits.map((hit) => hit.locationRoll)).toEqual([undefined, 1, 100]);
    expect(hits.map((hit) => hit.location)).toEqual(["Hull", "Motive Systems", "Turret"]);
    expect(hits.map((hit) => hit.armorFacing)).toEqual(["Rear", "Rear", "Front"]);
  });

  it("applies RF after armor only when base damage penetrates by at least one", () => {
    const draft = {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 26(11)",
      facing: "Side", armorSide: "10",
    };
    const request = normalizeWarhammerDefenderDamage(draft).request!;
    const hit = calculateWarhammerDefenderDamage(request).entries[0];
    expect(hit.kind === "hit" && hit.finalDamage).toBe(16);
  });

  it("inflicts exactly one vehicle damage when RF is suppressed and none without RF", () => {
    const suppressedRequest = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 25(10)",
      facing: "Front",
      armorFront: "20",
    }).request!;
    const suppressed = calculateWarhammerDefenderDamage(suppressedRequest).entries[0];
    expect(suppressed.kind === "hit" && suppressed.rfApplied).toBe(false);
    expect(suppressed.kind === "hit" && suppressed.finalDamage).toBe(1);

    const ordinaryRequest = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 10",
      facing: "Front",
      armorFront: "20",
    }).request!;
    const ordinary = calculateWarhammerDefenderDamage(ordinaryRequest).entries[0];
    expect(ordinary.kind === "hit" && ordinary.finalDamage).toBe(0);
  });

  it("transports the canonical vehicle summary, facing, and RF equation to Discord", () => {
    const draft = {
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 26(11)",
      facing: "Side", armorSide: "10",
    };
    const request = normalizeWarhammerDefenderDamage(draft).request!;
    const result = calculateWarhammerDefenderDamage(request);
    const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");
    expect(message.description).toContain("Pen 0, @hull: 26(11)");
    expect(message.description).toContain("Facing Side");
    const output = message.fields.map((field) => field.value).join("\n");
    expect(output).toContain("-# Hull · Facing Side");
    expect(output).not.toContain("Armor facing");
    expect(output).toContain("+ RF `15`");
  });

  it("omits armor-facing suffixes after suppressed RF and shows location with facing once", () => {
    const request = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: "Pen 0, @hull: 25(10)",
      facing: "Front",
      armorFront: "20",
    }).request!;
    const message = getWarhammerDefenderDamageRequestMsg(
      calculateWarhammerDefenderDamage(request),
      "Alex"
    );
    const output = message.fields.map((field) => field.value).join("\n");

    expect(output).toContain("-# Hull · Facing Front");
    expect(output).toContain("(RF suppressed)");
    expect(output).not.toContain("· Front armor");
    expect(output).not.toContain("Armor facing");
  });

  it("moves long annotated summaries out of Discord's bounded description without splitting hits", () => {
    const repeated = new Array(100).fill("1234567890123(1234567890122)").join(" ");
    const summaryText = `Pen 0, @hull: ${repeated}`;
    const request = normalizeWarhammerDefenderDamage({
      ...EMPTY_DEFENDER_DAMAGE_DRAFT,
      attackSummaryString: summaryText,
      facing: "Front",
    }).request!;
    const result = calculateWarhammerDefenderDamage(request, () => 50);
    const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");
    const continuation = message.fields.filter((field) => field.name.indexOf("Attack Summary") >= 0);
    expect(continuation.length).toBeGreaterThan(0);
    expect(continuation.map((field) => field.value.replace(/`/g, "")).join(" ")).toContain("1234567890123(1234567890122)");
    expect(message.description.length).toBeLessThan(4096);
    expect(message.fields.length).toBeLessThanOrEqual(25);
  });
});
