import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import dieImage from "../../img/d10.png";
import { backToWarhammerDefenderDamageForm } from "../../actions/warhammerDefenderDamage.actions";
import { WarhammerDefenderDamageState } from "../../reducers/warhammer-defender-damage-reducer";
import { ModalsStateTypes } from "../../reducers/modals-reducer";
import WarhammerDefenderDamageHitBreakdown from "./WarhammerDefenderDamageHitBreakdown";
import styles from "./WarhammerDefenderDamageResultsModal.module.css";

interface RootState {
  modalsState: ModalsStateTypes;
  warhammerDefenderDamage: WarhammerDefenderDamageState;
}

function WarhammerDefenderDamageResultsModal() {
  const dispatch = useDispatch();
  const { results } = useSelector(
    (state: RootState) => state.warhammerDefenderDamage
  );
  const isOpen = useSelector(
    (state: RootState) => state.modalsState.isWarhammerDefenderDamageResultsModalOpen
  );

  if (!results) return null;
  const back = () => dispatch(backToWarhammerDefenderDamageForm());

  return (
    <Modal
      show={isOpen}
      onHide={back}
      keyboard
      aria-labelledby="warhammer-damage-results-title"
    >
      <Modal.Header>
        <Modal.Title id="warhammer-damage-results-title">
          Defender Damage Results
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={styles.body}>
        <div className={styles.profile}>
          <img src={dieImage} alt="" aria-hidden="true" />
          <div>
            <strong>Attack Summary</strong>
            <div>
              Penetration {results.request.summary.penetration} · Fel {results.request.summary.felling}
              {results.request.summary.devastating !== 0 &&
                ` · Dev ${results.request.summary.devastating}`}
            </div>
          </div>
        </div>
        <div className={styles.entries}>
          {results.entries.map((entry, index) => (
            <WarhammerDefenderDamageHitBreakdown
              key={entry.number}
              entry={entry}
              request={results.request}
              isLast={index === results.entries.length - 1}
            />
          ))}
        </div>
        <hr />
        <p className={styles.totals}>
          <strong>Total Damage:</strong> {results.totals.damage}
          {results.request.mode === "horde" && (
            <>
              <br />
              <strong>Total Magnitude:</strong> {results.totals.magnitude}
              <br />
              <strong>Kill Count:</strong>{" "}
              {results.totals.killCountUnavailable
                ? "Unavailable (Mag per is 0)"
                : `${results.totals.killCount}+`}
            </>
          )}
        </p>
      </Modal.Body>
      <Modal.Footer className={styles.footer}>
        <Button variant="outline-secondary" onClick={back}>
          Back
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerDefenderDamageResultsModal;
