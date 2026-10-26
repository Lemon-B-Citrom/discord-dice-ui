import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import CodeSpan from "../CodeSpan/CodeSpan";
import {
  WarhammerDamageEntry,
  WarhammerHordeDamageHit,
  WarhammerDamageRequest,
} from "../WarhammerDamageCalculatorModal/WarhammerDamageCalculatorTypes";
import styles from "./WarhammerDamageHitBreakdown.module.css";

interface WarhammerDamageHitBreakdownProps {
  entry: WarhammerDamageEntry;
  request: WarhammerDamageRequest;
  isLast: boolean;
}

const classificationLabel = (hit: WarhammerHordeDamageHit): string => {
  switch (hit.classification) {
    case "overkill":
      return "Overkill!";
    case "partial-overkill":
      return "Partial Overkill!";
    case "ordinary":
    case "no-damage":
      return "";
    case "bonus":
      return "";
  }
};

function WarhammerDamageHitBreakdown({
  entry,
  request,
  isLast,
}: WarhammerDamageHitBreakdownProps) {
  const rowClass = isLast
    ? `${styles.hitRow} ${styles.lastHitRow}`
    : styles.hitRow;
  if (entry.kind === "bonus-devastating") {
    return (
      <div className={rowClass}>
        <div className={styles.hitHeading}>
          <span>#{entry.number} (Bonus Devastating)</span>
          <FontAwesomeIcon
            className={styles.arrow}
            icon={faArrowAltCircleRight}
            aria-hidden="true"
          />
          <strong>{entry.magnitude} Magnitude</strong>
        </div>
      </div>
    );
  }

  const hordeHit = entry.mode === "horde" ? entry : null;
  const bonusLabel = hordeHit && hordeHit.role === "bonus" ? " (Bonus)" : "";
  const classification = hordeHit ? classificationLabel(hordeHit) : "";
  const penetration = request.summary.penetration;
  const armorWasReduced = entry.effectiveArmor < entry.armorBeforePenetration;
  const toughnessWasReduced =
    entry.effectiveToughnessBonus < entry.toughnessBeforeFelling;
  const damageEquation = (
    <div className={styles.equation}>
      {hordeHit && "Damage: "}
      <strong><CodeSpan>{entry.finalDamage}</CodeSpan></strong>
      {" = "}
      <CodeSpan>{entry.originalDamage}</CodeSpan>
      {entry.showArmorTerm && (
        <>
          {" − Armor ("}
          {armorWasReduced ? (
            <>
              <CodeSpan>{entry.armorBeforePenetration}</CodeSpan> − <CodeSpan>{penetration}</CodeSpan>
              {penetration > entry.armorBeforePenetration ? " → " : " = "}
              <CodeSpan>{entry.effectiveArmor}</CodeSpan>
            </>
          ) : (
            <CodeSpan>{entry.effectiveArmor}</CodeSpan>
          )}
          {")"}
        </>
      )}
      {" − Toughness ("}
      {entry.fortitudeApplied && (
        <><CodeSpan>{request.toughnessBonus}</CodeSpan>{" × "}<CodeSpan>{2}</CodeSpan>{toughnessWasReduced ? " − " : " = "}</>
      )}
      {toughnessWasReduced ? (
        <>
          {!entry.fortitudeApplied && <><CodeSpan>{entry.toughnessBeforeFelling}</CodeSpan>{" − "}</>}
          <CodeSpan>{request.summary.felling}</CodeSpan>
          {request.summary.felling > entry.toughnessBeforeFelling ? " → " : " = "}
          <CodeSpan>{entry.effectiveToughnessBonus}</CodeSpan>
        </>
      ) : (
        <CodeSpan>{entry.effectiveToughnessBonus}</CodeSpan>
      )}
      {")"
      }
    </div>
  );

  return (
    <div className={rowClass} role="group" aria-label={`Hit ${entry.number}`}>
      <div className={styles.hitHeading}>
        <span>#{entry.number}{bonusLabel}</span>
        <FontAwesomeIcon
          className={styles.arrow}
          icon={faArrowAltCircleRight}
          aria-hidden="true"
        />
        {classification && <strong>{classification} </strong>}
        {hordeHit ? (
          <strong>{entry.finalDamage} Damage, {hordeHit.magnitude} Magnitude</strong>
        ) : (
          <strong>{entry.finalDamage}</strong>
        )}
      </div>
      <div className={styles.location}>{entry.location}</div>
      {damageEquation}
      {hordeHit && (
        <div className={styles.equation}>
          {"Magnitude: "}
          <strong><CodeSpan>{hordeHit.magnitude}</CodeSpan></strong>
          {" = "}
          {hordeHit.classification === "overkill" && (
            <>Per-unit Magnitude (<CodeSpan>{hordeHit.baseMagnitude}</CodeSpan>)</>
          )}
          {hordeHit.classification === "partial-overkill" && (
            <>Halved Per-unit Magnitude (<CodeSpan>{hordeHit.baseMagnitude}</CodeSpan>)</>
          )}
          {hordeHit.classification === "ordinary" && <>Nonzero Damage (1)</>}
          {hordeHit.classification === "no-damage" && <>Nonpositive Damage (0)</>}
          {hordeHit.classification === "bonus" && (
            <>{entry.finalDamage > 0 ? "Nonzero Damage (1)" : "Nonpositive Damage (0)"}</>
          )}
          {hordeHit.devastatingAdded > 0 && (
            <> + Devastating (<CodeSpan>{hordeHit.devastatingAdded}</CodeSpan>)</>
          )}
        </div>
      )}
    </div>
  );
}

export default WarhammerDamageHitBreakdown;
