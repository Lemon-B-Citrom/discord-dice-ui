import {
  EMPTY_DEFENDER_DAMAGE_DRAFT,
  WarhammerDefenderDamageDraft,
  WarhammerDefenderDamageResult,
  WarhammerDefenderVehicleDamageHit,
  WarhammerDefenderVehicleDamageRequest,
} from "../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS } from "../../src/utils/damageLocations";
import formatWarhammerAttackerDamageSummary from "../../src/utils/formatWarhammerAttackerDamageSummary";
import parseWarhammerAttackerDamageSummary from "../../src/utils/parseWarhammerAttackerDamageSummary";
import normalizeWarhammerDefenderDamage from "../../src/utils/normalizeWarhammerDefenderDamage";
import calculateWarhammerDefenderDamage from "../../src/utils/calculateWarhammerDefenderDamage";
import getWarhammerDefenderDamageRequestMsg from "../../src/utils/getWarhammerDefenderDamageRequestMsg";
import {
  formatEquationTokens,
  getDamageEquationTokens,
} from "../../src/utils/warhammerDamageEquation";

/** Normalize one vehicle draft, failing loudly on a validation error. */
const vehicleRequest = (
  draft: WarhammerDefenderDamageDraft
): WarhammerDefenderVehicleDamageRequest => {
  const normalized = normalizeWarhammerDefenderDamage(draft);
  if (!normalized.request || normalized.request.targetFamily !== "vehicle") {
    throw new Error(JSON.stringify(normalized.errors));
  }
  return normalized.request;
};

const vehicleHits = (
  result: WarhammerDefenderDamageResult
): WarhammerDefenderVehicleDamageHit[] =>
  result.entries.filter(
    (entry): entry is WarhammerDefenderVehicleDamageHit =>
      entry.kind === "hit" && entry.targetFamily === "vehicle"
  );

const vehicleDraft = (
  patch: Partial<WarhammerDefenderDamageDraft> = {}
): WarhammerDefenderDamageDraft => ({
  ...EMPTY_DEFENDER_DAMAGE_DRAFT,
  ...patch,
});

describe("vehicle damage summary and calculation", () => {
  it("uses the required vehicle wire tokens and round-trips RF base values", () => {
    expect(VEHICLE_DAMAGE_LOCATION_WIRE_TOKENS).toEqual({
      "Motive Systems": "@motv",
      Hull: "@hull",
      Weapons: "@wpns",
      Turret: "@turr",
    });
    const summary = {
      penetration: 3,
      felling: 0,
      devastating: 0,
      firstHitLocation: "Hull" as const,
      damages: [25, 12, 31],
      baseDamages: [10, 12, 18],
    };
    const text = formatWarhammerAttackerDamageSummary(summary);
    expect(text).toBe("Pen 3, @hull: 25(10) 12 31(18)");
    expect(parseWarhammerAttackerDamageSummary(text).summary).toEqual(summary);
  });

  it("requires vehicle facing and independently defaults blank facing armor to zero", () => {
    const draft = vehicleDraft({ attackSummaryString: "Pen 0, @motv: 10" });
    expect(normalizeWarhammerDefenderDamage(draft).errors.facing).toBe(
      "Choose a facing"
    );
    const request = vehicleRequest({
      ...draft,
      facing: "Side",
      armorSide: "4",
    });
    expect(request.vehicleArmor).toEqual({ Front: 0, Side: 4, Rear: 0 });
  });

  it("ignores invalid inactive humanoid protections for vehicle requests", () => {
    const normalized = normalizeWarhammerDefenderDamage(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 10",
        facing: "Front",
        toughnessBonus: "invalid",
        fortitude: "-1",
        armorBody: "not armor",
        hordeEnabled: true,
        advancedEnabled: true,
        advancedArmorHead: "invalid",
        magPer: "bad",
      })
    );
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
      const request = vehicleRequest(
        vehicleDraft({
          attackSummaryString: `Pen 0, @${
            location === "Motive Systems"
              ? "motv"
              : location === "Hull"
              ? "hull"
              : location === "Weapons"
              ? "wpns"
              : "turr"
          }: 20`,
          facing,
          armorFront: `${armor.Front}`,
          armorSide: `${armor.Side}`,
          armorRear: `${armor.Rear}`,
        })
      );
      const hit = calculateWarhammerDefenderDamage(request).entries[0];
      expect(hit).toMatchObject({
        location,
        armorFacing,
        armorBeforePenetration: armor[armorFacing],
      });
    });
  });

  it("uses first location, fresh subsequent d100 locations, Turret Front AP, and the base-damage RF gate", () => {
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 25(10) 26(11) 5(-2)",
        facing: "Side",
        armorFront: "20",
        armorSide: "10",
        armorRear: "30",
      })
    );
    const draws = [90, 50];
    const result = calculateWarhammerDefenderDamage(
      request,
      () => draws.shift() as number
    );
    const hits = vehicleHits(result);
    expect(hits.map((entry) => entry.location)).toEqual([
      "Hull",
      "Turret",
      "Hull",
    ]);
    expect(hits.map((entry) => entry.armorFacing)).toEqual([
      "Side",
      "Front",
      "Side",
    ]);
    expect(hits.map((entry) => entry.finalDamage)).toEqual([1, 1, 1]);
    expect(hits[0].rfApplied).toBe(false);
    expect(hits[1].locationRoll).toBe(90);
    expect(draws).toEqual([]);
  });

  it("allows repeated independent vehicle locations and rejects out-of-range injected rolls", () => {
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 1 1 1",
        facing: "Front",
      })
    );
    const draws = [50, 50];
    const result = calculateWarhammerDefenderDamage(request, () => {
      return draws.shift() as number;
    });
    expect(vehicleHits(result).map((entry) => entry.location)).toEqual([
      "Hull",
      "Hull",
      "Hull",
    ]);
    expect(() => calculateWarhammerDefenderDamage(request, () => 101)).toThrow(
      /integer from 1 to 100/
    );
    expect(() =>
      calculateWarhammerDefenderDamage(request, () => undefined as any)
    ).toThrow(/integer from 1 to 100/);
  });

  it("uses the full percentile boundary range for subsequent locations", () => {
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 1 1 1",
        facing: "Rear",
      })
    );
    const rolls = [1, 100];
    const hits = vehicleHits(
      calculateWarhammerDefenderDamage(request, () => rolls.shift() as number)
    );
    expect(hits.map((hit) => hit.locationRoll)).toEqual([undefined, 1, 100]);
    expect(hits.map((hit) => hit.location)).toEqual([
      "Hull",
      "Motive Systems",
      "Turret",
    ]);
    expect(hits.map((hit) => hit.armorFacing)).toEqual([
      "Rear",
      "Rear",
      "Front",
    ]);
  });

  it("applies RF after armor only when base damage penetrates by at least one", () => {
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 26(11)",
        facing: "Side",
        armorSide: "10",
      })
    );
    const hit = vehicleHits(calculateWarhammerDefenderDamage(request))[0];
    expect(hit.finalDamage).toBe(16);
    expect(hit.rfApplied).toBe(true);
  });

  it("inflicts exactly one vehicle damage when RF is suppressed and none without RF", () => {
    const suppressed = vehicleHits(
      calculateWarhammerDefenderDamage(
        vehicleRequest(
          vehicleDraft({
            attackSummaryString: "Pen 0, @hull: 25(10)",
            facing: "Front",
            armorFront: "20",
          })
        )
      )
    )[0];
    expect(suppressed.rfApplied).toBe(false);
    expect(suppressed.finalDamage).toBe(1);

    const ordinary = vehicleHits(
      calculateWarhammerDefenderDamage(
        vehicleRequest(
          vehicleDraft({
            attackSummaryString: "Pen 0, @hull: 10",
            facing: "Front",
            armorFront: "20",
          })
        )
      )
    )[0];
    expect(ordinary.finalDamage).toBe(0);
    expect(ordinary.rfApplied).toBe(false);
  });

  it("shows the RF base, the effective AP, and the suppression outcome in the equation", () => {
    const equation = (draft: WarhammerDefenderDamageDraft) => {
      const request = vehicleRequest(draft);
      const hit = vehicleHits(calculateWarhammerDefenderDamage(request))[0];
      return formatEquationTokens(getDamageEquationTokens(hit, request));
    };

    expect(
      equation(
        vehicleDraft({
          attackSummaryString: "Pen 0, @hull: 26(11)",
          facing: "Side",
          armorSide: "10",
        })
      )
    ).toBe("**`16`** = Base `11` − AP (`10`) + RF `15`");

    expect(
      equation(
        vehicleDraft({
          attackSummaryString: "Pen 0, @hull: 25(10)",
          facing: "Front",
          armorFront: "20",
        })
      )
    ).toBe("**`1`** = Base `10` − AP (`20`) → `0` (RF suppressed) → `1`");

    expect(
      equation(
        vehicleDraft({
          attackSummaryString: "Pen 0, @hull: 10",
          facing: "Front",
          armorFront: "20",
        })
      )
    ).toBe("**`0`** = Base `10` − AP (`20`) → `0`");
  });

  it("transports the canonical vehicle summary, facing, and RF equation to Discord", () => {
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 26(11)",
        facing: "Side",
        armorSide: "10",
      })
    );
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
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: "Pen 0, @hull: 25(10)",
        facing: "Front",
        armorFront: "20",
      })
    );
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
    const repeated = new Array(100)
      .fill("1234567890123(1234567890122)")
      .join(" ");
    const summaryText = `Pen 0, @hull: ${repeated}`;
    const request = vehicleRequest(
      vehicleDraft({
        attackSummaryString: summaryText,
        facing: "Front",
      })
    );
    const result = calculateWarhammerDefenderDamage(request, () => 50);
    const message = getWarhammerDefenderDamageRequestMsg(result, "Alex");
    const continuation = message.fields.filter(
      (field) => field.name.indexOf("Attack Summary") >= 0
    );
    expect(continuation.length).toBeGreaterThan(0);
    expect(
      continuation.map((field) => field.value.replace(/`/g, "")).join(" ")
    ).toContain("1234567890123(1234567890122)");
    expect(message.description.length).toBeLessThan(4096);
    expect(message.fields.length).toBeLessThanOrEqual(25);
  });
});
