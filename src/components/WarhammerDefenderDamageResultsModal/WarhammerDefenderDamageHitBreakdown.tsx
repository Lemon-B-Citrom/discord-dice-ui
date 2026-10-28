import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import CodeSpan from "../CodeSpan/CodeSpan";
import {
  WarhammerDefenderDamageEntry,
  WarhammerDefenderDamageRequest,
} from "../WarhammerDefenderDamageModal/WarhammerDefenderDamageTypes";
import { getHordeClassificationLabel } from "../../utils/warhammerDefenderDamageLabels";
import {
  EquationToken,
  getDamageEquationTokens,
  getMagnitudeEquationTokens,
} from "../../utils/warhammerDamageEquation";
import styles from "./WarhammerDefenderDamageHitBreakdown.module.css";

interface WarhammerDefenderDamageHitBreakdownProps {
  entry: WarhammerDefenderDamageEntry;
  request: WarhammerDefenderDamageRequest;
  isLast: boolean;
}

/** Render the tokens the embed formatter also uses, so the two cannot drift. */
function renderEquation(tokens: ReadonlyArray<EquationToken>) {
  return tokens.map((token, index) => {
    if (token.kind === "text") {
      return <React.Fragment key={index}>{token.text}</React.Fragment>;
    }
    if (token.kind === "code") {
      return <CodeSpan key={index}>{token.value}</CodeSpan>;
    }
    return (
      <strong key={index}>
        <CodeSpan>{token.value}</CodeSpan>
      </strong>
    );
  });
}

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
  const classification = hordeHit
    ? getHordeClassificationLabel(hordeHit.classification)
    : "";

  return (
    <div className={rowClass} role="group" aria-label={`Hit ${entry.number}`}>
      <div className={styles.hitHeading}>
        <span>
          #{entry.number}
          {bonusLabel}
        </span>
        <FontAwesomeIcon
          className={styles.arrow}
          icon={faArrowAltCircleRight}
          aria-hidden="true"
        />
        {classification && <strong>{classification} </strong>}
        {hordeHit ? (
          <strong>
            {entry.finalDamage} Damage, {hordeHit.magnitude} Magnitude
          </strong>
        ) : (
          <strong>{entry.finalDamage}</strong>
        )}
      </div>
      <div className={styles.location}>{entry.location}</div>
      <div className={styles.equation}>
        {renderEquation(getDamageEquationTokens(entry, request))}
      </div>
      {hordeHit && (
        <div className={styles.equation}>
          {renderEquation(getMagnitudeEquationTokens(hordeHit))}
        </div>
      )}
    </div>
  );
}

export default WarhammerDefenderDamageHitBreakdown;
