import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import dieImage from "../../img/d10.png";
import { openWarhammerAttackerDamageModal } from "../../actions/modals";
import {
  closeWarhammerAttackerDamageResultsModal,
  requestWarhammerAttackerDamage,
} from "../../actions/warhammerAttackerDamage.actions";
import { WarhammerAttackerDamageState } from "../../reducers/warhammer-attacker-damage-reducer";
import CodeSpan from "../CodeSpan/CodeSpan";
import WarhammerAttackerDamageHitBreakdown from "./WarhammerAttackerDamageHitBreakdown";
import styles from "./WarhammerAttackerDamageResultsModal.module.css";

interface RootState {
  warhammerAttackerDamage: WarhammerAttackerDamageState;
}

function WarhammerAttackerDamageResultsModal() {
  const dispatch = useDispatch();
  const { results, isResultsModalOpen, error } = useSelector(
    (state: RootState) => state.warhammerAttackerDamage
  );

  if (!results) {
    return null;
  }

  const closeResults = () => dispatch(closeWarhammerAttackerDamageResultsModal());
  const returnToForm = () => {
    closeResults();
    dispatch(openWarhammerAttackerDamageModal());
  };
  const rerollAttack = () => dispatch(requestWarhammerAttackerDamage(results.input));
  const summary = `Pen ${results.input.penetration}, Fel ${
    results.input.felling
  }: ${results.damages.join(", ")}`;
  const copySummary = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).catch(() => {});
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = summary;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (_error) {
      // Clipboard access may be unavailable; the results remain visible to copy manually.
    }
    document.body.removeChild(textArea);
  };
  const tearingLabel =
    results.input.tearing === "tripleTearing"
      ? "Triple Tearing"
      : results.input.tearing === "tearing"
      ? "Tearing"
      : "";

  return (
    <Modal show={isResultsModalOpen} onHide={closeResults}>
      <Modal.Header closeButton className={styles.resultsModalHeader}>
        <Modal.Title className={styles.resultsModalTitle}>
          Attacker Damage Results
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.resultsBody}>
        <div className={styles.attackProfile}>
          <img
            className={styles.profileDie}
            src={dieImage}
            alt=""
            aria-hidden="true"
          />
          <div className={styles.profileDetails}>
            <div className={styles.damageExpression}>
              <CodeSpan>{`${results.input.damageDice}d10`}</CodeSpan>
              <span>{results.input.damageModifier < 0 ? " − " : " + "}</span>
              <CodeSpan>{Math.abs(results.input.damageModifier)}</CodeSpan>
            </div>
            <div className={styles.attackAttributes}>
              <span>
                Felling <CodeSpan>{results.input.felling}</CodeSpan>
              </span>
              <span>
                Penetration <CodeSpan>{results.input.penetration}</CodeSpan>
              </span>
              {results.input.proven > 0 && (
                <span>
                  Proven <CodeSpan>{results.input.proven}</CodeSpan>
                </span>
              )}
              {tearingLabel && <span>{tearingLabel}</span>}
            </div>
          </div>
        </div>
        <div className={styles.hitBreakdowns}>
          {results.hitDetails.map((hit, index) => (
            <WarhammerAttackerDamageHitBreakdown
              key={index}
              hit={hit}
              hitNumber={index + 1}
            />
          ))}
        </div>
        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}
        <div className={styles.rerollButtonContainer}>
          <Button variant="outline-primary" onClick={rerollAttack}>
            Re-roll Attack
          </Button>
          <Button variant="outline-secondary" onClick={copySummary}>
            Copy
          </Button>
        </div>
        <hr className={styles.summaryDivider} />
        <p className={`mb-0 ${styles.summary}`}>
          <CodeSpan>{summary}</CodeSpan>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={returnToForm}>
          Back
        </Button>
        <Button variant="secondary" onClick={closeResults}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerAttackerDamageResultsModal;
