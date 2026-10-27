import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import CodeSpan from "../CodeSpan/CodeSpan";
import {
  WarhammerDefenderDamageEntry,
  WarhammerDefenderHordeDamageHit,
  WarhammerDefenderDamageRequest,
} from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import {
  getWarhammerMagnitudeBasis,
  getWarhammerToughnessTerm,
} from "../../utils/warhammerDefenderDamageLabels";
import styles from "./WarhammerDefenderDamageHitBreakdown.module.css";

interface WarhammerDefenderDamageHitBreakdownProps {
  entry: WarhammerDefenderDamageEntry;
  request: WarhammerDefenderDamageRequest;
  isLast: boolean;
}

const classificationLabel = (hit: WarhammerDefenderHordeDamageHit): string => {
  switch (hit.classification) {
    case "overkill":
      return "Overkill!";
    case "partial-overkill":
      return "Partial Overkill!";
    default:
      return "";
  }
};

function WarhammerDefenderDamageHitBreakdown({
  entry,
  request,
  isLast,
}: WarhammerDefenderDamageHitBreakdownProps) {
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
  const toughnessTerm = getWarhammerToughnessTerm(entry, request);
  const magnitudeBasis = hordeHit ? getWarhammerMagnitudeBasis(hordeHit) : null;
  const showsMagnitudeOperand =
    hordeHit !== null &&
    (hordeHit.classification === "overkill" ||
      hordeHit.classification === "partial-overkill");
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
      {toughnessTerm.fortitudeApplied ? (
        <>
          {toughnessTerm.advanced > 0 ? (
            <>
              {"("}
              <CodeSpan>{request.toughnessBonus}</CodeSpan>
              {" + "}
              <CodeSpan>{toughnessTerm.advanced}</CodeSpan>
              {")"}
            </>
          ) : (
            <CodeSpan>{request.toughnessBonus}</CodeSpan>
          )}
          {" × "}
          <CodeSpan>{2}</CodeSpan>
          {toughnessTerm.reduced ? (
            <>
              {" − "}
              <CodeSpan>{toughnessTerm.felling}</CodeSpan>
              {toughnessTerm.overridden ? " → " : " = "}
            </>
          ) : (
            " = "
          )}
          <CodeSpan>{toughnessTerm.effective}</CodeSpan>
        </>
      ) : toughnessTerm.advanced > 0 ? (
        <>
          <CodeSpan>{request.toughnessBonus}</CodeSpan>
          {" + "}
          <CodeSpan>{toughnessTerm.advanced}</CodeSpan>
          {toughnessTerm.reduced ? (
            <>
              {" − "}
              <CodeSpan>{toughnessTerm.felling}</CodeSpan>
              {toughnessTerm.overridden ? " → " : " = "}
              <CodeSpan>{toughnessTerm.effective}</CodeSpan>
            </>
          ) : (
            <>
              {" = "}
              <CodeSpan>{toughnessTerm.effective}</CodeSpan>
            </>
          )}
        </>
      ) : toughnessTerm.reduced ? (
        <>
          <CodeSpan>{toughnessTerm.beforeFelling}</CodeSpan>
          {" − "}
          <CodeSpan>{toughnessTerm.felling}</CodeSpan>
          {toughnessTerm.overridden ? " → " : " = "}
          <CodeSpan>{toughnessTerm.effective}</CodeSpan>
        </>
      ) : (
        <CodeSpan>{toughnessTerm.effective}</CodeSpan>
      )}
      {")"}
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
      {hordeHit && magnitudeBasis && (
        <div className={styles.equation}>
          {"Magnitude: "}
          <strong><CodeSpan>{hordeHit.magnitude}</CodeSpan></strong>
          {" = "}
          {magnitudeBasis.label}
          {showsMagnitudeOperand && (
            <> (<CodeSpan>{magnitudeBasis.operand}</CodeSpan>)</>
          )}
          {hordeHit.devastatingAdded > 0 && (
            <> + Devastating (<CodeSpan>{hordeHit.devastatingAdded}</CodeSpan>)</>
          )}
        </div>
      )}
    </div>
  );
}

export default WarhammerDefenderDamageHitBreakdown;
