import {
  changeWarhammerDefenderDamageDraft,
  clearWarhammerDefenderDamageDraft,
  failWarhammerDefenderDamage,
} from "../../src/actions/warhammerDefenderDamage.actions";
import { EMPTY_DEFENDER_DAMAGE_DRAFT } from "../../src/components/WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import warhammerDefenderDamage from "../../src/reducers/warhammer-defender-damage-reducer";

test("stores the advanced toggle and overrides in the raw draft", () => {
  const toggled = warhammerDefenderDamage(
    undefined,
    changeWarhammerDefenderDamageDraft("advancedEnabled", true)
  );
  expect(toggled.draft.advancedEnabled).toBe(true);

  const withValue = warhammerDefenderDamage(
    toggled,
    changeWarhammerDefenderDamageDraft("advancedToughnessLeftLeg", "3")
  );
  expect(withValue.draft.advancedToughnessLeftLeg).toBe("3");
  expect(withValue.draft.advancedEnabled).toBe(true);
});

test("Clear restores the empty advanced draft", () => {
  const dirty = warhammerDefenderDamage(
    undefined,
    changeWarhammerDefenderDamageDraft("advancedArmorBody", "2")
  );
  const cleared = warhammerDefenderDamage(
    dirty,
    clearWarhammerDefenderDamageDraft()
  );

  expect(cleared.draft).toEqual(EMPTY_DEFENDER_DAMAGE_DRAFT);
  expect(cleared.draft.advancedEnabled).toBe(false);
});

test("editing an advanced value clears a stored advanced error", () => {
  const failed = warhammerDefenderDamage(
    undefined,
    failWarhammerDefenderDamage({ advancedArmorHead: "Use whole numbers only" })
  );
  expect(failed.errors.advancedArmorHead).toBeTruthy();

  const next = warhammerDefenderDamage(
    failed,
    changeWarhammerDefenderDamageDraft("advancedArmorHead", "4")
  );
  expect(next.errors).toEqual({});
});
