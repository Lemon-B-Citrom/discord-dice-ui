import {
  WarhammerAttackerDamageAttempt,
  WarhammerAttackerDamageHit,
} from "../components/WarhammerAttackerDamageModal/WarhammerAttackerDamageTypes";

export interface OrderedAttackerDamageAttempt {
  attempt: WarhammerAttackerDamageAttempt;
  /** Position in the hit, used to keep ties in roll order. */
  index: number;
  isSelected: boolean;
}

/**
 * Display order for one hit: the selected attempt first, then the highest
 * damage, then roll order. Shared by the results modal and the embed so both
 * compare tearing attempts the same way.
 */
export default function orderWarhammerAttackerDamageAttempts(
  hit: WarhammerAttackerDamageHit
): OrderedAttackerDamageAttempt[] {
  return hit.attempts
    .map((attempt, index) => ({
      attempt,
      index,
      isSelected: index === hit.selectedAttemptIndex,
    }))
    .sort((left, right) => {
      if (left.isSelected !== right.isSelected) {
        return left.isSelected ? -1 : 1;
      }
      if (left.attempt.damage !== right.attempt.damage) {
        return right.attempt.damage - left.attempt.damage;
      }
      return left.index - right.index;
    });
}
