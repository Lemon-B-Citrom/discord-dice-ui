import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import CodeSpan from "../CodeSpan/CodeSpan";
import {
  WarhammerAttackAttempt,
  WarhammerAttackHit,
} from "../WarhammerAttackCalculatorModal/WarhammerAttackCalculatorTypes";
import styles from "./WarhammerAttackHitBreakdown.module.css";

interface WarhammerAttackHitBreakdownProps {
  hit: WarhammerAttackHit;
  hitNumber: number;
}

interface OrderedAttempt {
  attempt: WarhammerAttackAttempt;
  originalIndex: number;
  isSelected: boolean;
}

interface DamageTerm {
  value: number;
  isDiceRoll: boolean;
}

const getDamageTerms = (attempt: WarhammerAttackAttempt): DamageTerm[] =>
  [
    ...attempt.baseRolls.map(({ damage }) => ({ value: damage, isDiceRoll: true })),
    ...attempt.righteousFuryRolls.map((value) => ({ value, isDiceRoll: true })),
  ];

function WarhammerAttackHitBreakdown({
  hit,
  hitNumber,
}: WarhammerAttackHitBreakdownProps) {
  const orderedAttempts: OrderedAttempt[] = hit.attempts
    .map((attempt, originalIndex) => ({
      attempt,
      originalIndex,
      isSelected: originalIndex === hit.selectedAttemptIndex,
    }))
    .sort((left, right) => {
      if (left.isSelected !== right.isSelected) {
        return left.isSelected ? -1 : 1;
      }
      if (left.attempt.damage !== right.attempt.damage) {
        return right.attempt.damage - left.attempt.damage;
      }
      return left.originalIndex - right.originalIndex;
    });

  const selectedDamage = hit.attempts[hit.selectedAttemptIndex].damage;
  const selectedAttempt = hit.attempts[hit.selectedAttemptIndex];

  return (
    <div className={styles.hitRow}>
      <div className={styles.hitContent}>
        <div className={styles.hitHeading}>
          <span className={styles.hitLabel}>#{hitNumber}:</span>
          {" "}
          <FontAwesomeIcon
            className={styles.hitArrow}
            icon={faArrowAltCircleRight}
            aria-hidden="true"
          />
          {selectedAttempt.righteousFuryRolls.length > 0 && (
            <strong className={styles.righteousFury}>
              Righteous Fury
              {selectedAttempt.righteousFuryRolls.length > 1 &&
                ` x${selectedAttempt.righteousFuryRolls.length}`}
              !
            </strong>
          )}
          <strong className={styles.selectedDamage}>{selectedDamage}</strong>
        </div>
        <div className={styles.hitMath}>
          {orderedAttempts.map(({ attempt, originalIndex, isSelected }, index) => {
            const rolledTerms = getDamageTerms(attempt);
            const baseAndFuryDamage = rolledTerms.reduce(
              (sum, term) => sum + term.value,
              0
            );
            const hasModifier = attempt.damage !== baseAndFuryDamage;
            const modifier = hasModifier
              ? attempt.damage - baseAndFuryDamage
              : 0;
            const terms = [...rolledTerms];
            if (hasModifier) {
              terms.push({ value: modifier, isDiceRoll: false });
            }
            const provenAdjustments = attempt.baseRolls.filter(
              ({ roll, damage }) => roll !== damage
            );

            return (
              <React.Fragment key={originalIndex}>
                {index > 0 && (
                  <span className={styles.attemptSeparator} aria-hidden="true">
                    &gt;
                  </span>
                )}
                <span
                  className={
                    isSelected ? styles.selectedAttempt : styles.discardedAttempt
                  }
                  role="group"
                  aria-label={isSelected ? "Selected attempt" : "Discarded attempt"}
                >
                  {!isSelected && attempt.righteousFuryRolls.length > 0 && (
                    <strong className={styles.righteousFury}>
                      Righteous Fury
                      {attempt.righteousFuryRolls.length > 1 &&
                        ` x${attempt.righteousFuryRolls.length}`}!{" "}
                    </strong>
                  )}
                  <span className={styles.equation}>
                    {terms.map((term, termIndex) => (
                      <React.Fragment key={termIndex}>
                        {termIndex > 0 && (
                          <span className={styles.operator}>
                            {term.value < 0 ? " − " : " + "}
                          </span>
                        )}
                        {term.isDiceRoll ? (
                          <CodeSpan>{Math.abs(term.value)}</CodeSpan>
                        ) : (
                          Math.abs(term.value)
                        )}
                      </React.Fragment>
                    ))}
                    {" = "}
                    {attempt.damage}
                  </span>
                  {provenAdjustments.length > 0 && (
                    <small className={styles.provenNote}>
                      {" "}
                      (Proven: {provenAdjustments
                        .map(({ roll, damage }, index) => (
                          <React.Fragment key={index}>
                            {index > 0 && ", "}
                            <CodeSpan>{roll}</CodeSpan>
                            {" → "}
                            <CodeSpan>{damage}</CodeSpan>
                          </React.Fragment>
                        ))}
                        )
                    </small>
                  )}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default WarhammerAttackHitBreakdown;
