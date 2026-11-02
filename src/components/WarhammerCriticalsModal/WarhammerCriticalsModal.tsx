import React, { useEffect, useRef, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Modal from "react-bootstrap/Modal";
import { CRITICAL_LOCATION_GROUPS } from "../../utils/WarhammerCustom/criticals/criticalTables";
import {
  CriticalDamageType,
  CriticalFamily,
  CriticalLocation,
  CriticalValidationErrors,
} from "../../utils/WarhammerCustom/criticals/criticalTypes";
import { parseCriticalSeverity } from "../../utils/WarhammerCustom/criticals/normalizeWarhammerCritical";
import { WarhammerCriticalSelection } from "../../actions/warhammerCriticals.actions";
import styles from "./WarhammerCriticalsModal.module.css";
import CriticalDamageTypeDropdown from "./CriticalDamageTypeDropdown";

interface WarhammerCriticalsModalProps {
  readonly showModal: boolean;
  readonly damage: string;
  readonly selectedLocation: WarhammerCriticalSelection | null;
  readonly errors: CriticalValidationErrors;
  readonly onClose: () => void;
  readonly onDamageChange: (value: string) => void;
  readonly onRequest: (
    family: CriticalFamily,
    location: CriticalLocation,
    damageType?: CriticalDamageType
  ) => void;
}

function WarhammerCriticalsModal({
  showModal,
  damage,
  selectedLocation,
  errors,
  onClose,
  onDamageChange,
  onRequest,
}: WarhammerCriticalsModalProps) {
  const [openLocation, setOpenLocation] = useState<CriticalLocation | null>(
    null
  );
  const damageError = errors.damage || errors.form;
  const damageErrorId = damageError
    ? "warhammer-criticals-damage-error"
    : undefined;
  const damageHelpId = "warhammer-criticals-damage-help";
  const damageInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showModal && (damageError || damageInput.current)) {
      damageInput.current?.focus();
    }
  }, [showModal, damageError]);

  useEffect(() => {
    setOpenLocation(null);
  }, [showModal, damage]);

  const toggleLocation = (location: CriticalLocation, show: boolean) => {
    if (!show) {
      setOpenLocation((current) => (current === location ? null : current));
      return;
    }
    if (parseCriticalSeverity(damage) === null) {
      setOpenLocation(null);
      onRequest("humanoid", location);
      return;
    }
    onRequest("humanoid", location);
    setOpenLocation(location);
  };

  return (
    <Modal
      show={showModal}
      onHide={onClose}
      aria-labelledby="warhammer-criticals-title"
      dialogClassName={styles.dialog}
    >
      <Modal.Header closeButton>
        <h1 className="modal-title h4 mb-0" id="warhammer-criticals-title">
          Criticals
        </h1>
      </Modal.Header>
      <Modal.Body>
        <Form.Group controlId="warhammer-criticals-damage">
          <Form.Label>Damage</Form.Label>
          <Form.Control
            className={styles.damageInput}
            ref={damageInput}
            type="number"
            min={1}
            max={10}
            step={1}
            value={damage}
            aria-invalid={Boolean(damageError)}
            aria-describedby={
              damageErrorId ? `${damageHelpId} ${damageErrorId}` : damageHelpId
            }
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              onDamageChange(event.currentTarget.value)
            }
          />
          {damageError && (
            <div
              id={damageErrorId}
              className={styles.validationError}
              role="alert"
            >
              {damageError}
            </div>
          )}
          <Form.Text id={damageHelpId} className="text-muted">
            Enter a whole number from 1 to 10.
          </Form.Text>
        </Form.Group>
        <hr />
        <div className={styles.groups}>
          {CRITICAL_LOCATION_GROUPS.map((group) => (
            <section
              className={styles.group}
              key={group.family}
              aria-labelledby={`critical-group-${group.family}`}
            >
              <h3
                className={styles.groupHeading}
                id={`critical-group-${group.family}`}
              >
                {group.label}
              </h3>
              <div className={styles.locationList}>
                {group.locations.map((location) => {
                  const criticalLocation = location.id as CriticalLocation;
                  const isSelected =
                    selectedLocation?.family === group.family &&
                    selectedLocation.location === location.id;
                  return (
                    <div key={location.id}>
                      {group.family === "humanoid" ? (
                        <CriticalDamageTypeDropdown
                          location={criticalLocation}
                          label={location.label}
                          selected={isSelected}
                          expanded={openLocation === criticalLocation}
                          onToggle={(show) =>
                            toggleLocation(criticalLocation, show)
                          }
                          onSelect={(damageType) => {
                            setOpenLocation(null);
                            onRequest("humanoid", criticalLocation, damageType);
                          }}
                        />
                      ) : (
                        <Button
                          className={styles.locationButton}
                          type="button"
                          variant={isSelected ? "primary" : "outline-primary"}
                          onClick={() =>
                            onRequest(group.family, criticalLocation)
                          }
                        >
                          {location.label}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default WarhammerCriticalsModal;
