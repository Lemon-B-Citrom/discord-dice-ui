import React from "react";
import { useDispatch, useSelector } from "react-redux";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowAltCircleRight } from "@fortawesome/free-solid-svg-icons";
import dieImage from "../../img/d10.png";
import {
  backToWarhammerCriticalsForm,
  closeWarhammerCriticalsResultsModal,
} from "../../actions/warhammerCriticals.actions";
import { WarhammerCriticalsState } from "../../reducers/warhammer-criticals-reducer";
import { ModalsStateTypes } from "../../reducers/modals-reducer";
import {
  getCriticalPresentation,
  getCriticalStatusRollEffectLabel,
} from "../../utils/WarhammerCustom/criticals/criticalPresentation";
import { getCriticalTextSegments } from "../../utils/WarhammerCustom/criticals/formatCriticalText";
import CodeSpan from "../CodeSpan/CodeSpan";
import styles from "./WarhammerCriticalsResultsModal.module.css";

interface RootState {
  readonly modalsState: ModalsStateTypes;
  readonly warhammerCriticals: WarhammerCriticalsState;
}

function WarhammerCriticalsResultsModal() {
  const dispatch = useDispatch();
  const results = useSelector(
    (state: RootState) => state.warhammerCriticals.results
  );
  const isOpen = useSelector(
    (state: RootState) => state.modalsState.isWarhammerCriticalsResultsModalOpen
  );
  const sendWarning = useSelector(
    (state: RootState) => state.warhammerCriticals.sendWarning
  );

  if (!results) return null;
  const presentation = getCriticalPresentation(results);
  const back = () => dispatch(backToWarhammerCriticalsForm());
  const close = () => dispatch(closeWarhammerCriticalsResultsModal());

  return (
    <Modal
      show={isOpen}
      onHide={back}
      keyboard
      scrollable
      aria-labelledby="warhammer-criticals-results-title"
    >
      <Modal.Header>
        <h1 className="modal-title h4 mb-0" id="warhammer-criticals-results-title">
          Criticals Result
        </h1>
      </Modal.Header>
      <Modal.Body className={styles.body}>
        {presentation.sections.map((section, index) => (
          <section className={styles.section} key={`${section.source}-${index}`}>
            <h2 className={styles.sectionHeading}>
              <img
                className={styles.dieIcon}
                src={dieImage}
                alt=""
                aria-hidden="true"
              />
              {section.heading}
            </h2>
            <hr />
            <p>
              {getCriticalTextSegments(section.text).map(
                ({ text, format }, segmentIndex) =>
                  format === "code" ? (
                    <CodeSpan key={segmentIndex}>{text}</CodeSpan>
                  ) : format === "bold" ? (
                    <strong key={segmentIndex}>{text}</strong>
                  ) : (
                    text
                  )
              )}
            </p>
            {(section.statusRolls.length > 0 || section.checks.length > 0) && (
              <>
                <hr />
                <ol className={styles.rollLog} aria-label="Rolls and checks">
                  {section.statusRolls.map((roll) => (
                    <li key={`roll-${roll.entryNumber}`}>
                      <span className={styles.logNumber}>#{roll.entryNumber}</span>
                      <FontAwesomeIcon
                        icon={faArrowAltCircleRight}
                        aria-hidden="true"
                      />
                      <strong>
                        {roll.expression} = {roll.result}
                      </strong>
                      {getCriticalStatusRollEffectLabel(roll) && (
                        <span> — {getCriticalStatusRollEffectLabel(roll)}</span>
                      )}
                      {roll.condition && (
                        <small className={styles.condition}>
                          {roll.condition}
                        </small>
                      )}
                    </li>
                  ))}
                  {section.checks.map((check) => (
                    <li key={`check-${check.entryNumber}`}>
                      <span className={styles.logNumber}>#{check.entryNumber}:</span>
                      <CodeSpan>{check.text}</CodeSpan>
                      {check.condition && (
                        <small className={styles.condition}>
                          {check.condition}
                        </small>
                      )}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        ))}
        {sendWarning && (
          <p className={styles.warning} role="status">
            {sendWarning}
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={back}>
          Back
        </Button>
        <Button variant="secondary" onClick={close}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default WarhammerCriticalsResultsModal;
