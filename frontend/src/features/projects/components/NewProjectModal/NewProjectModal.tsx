import { useEffect, useId, useState, type FormEvent } from 'react';

import { Modal } from '../../../../components/overlay/Modal/Modal';
import type { ProjectIconName } from '../../model/project';
import type { CreateProjectInput } from '../../providers/ProjectProvider';
import { ProjectGlyph, projectIconOptions } from '../ProjectGlyph/ProjectGlyph';
import styles from './NewProjectModal.module.css';

interface NewProjectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreate: (input: CreateProjectInput) => void;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const formId = useId();
  const nameErrorId = useId();
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState<ProjectIconName>('layers');
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setName('');
    setDescription('');
    setIcon('layers');
    setNameError('');
  }, [isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setNameError('Enter a project name.');
      return;
    }

    onCreate({ name, description, icon });
  }

  return (
    <Modal
      className={styles.modal}
      description="Give this verification workspace a clear identity. You can refine its details later."
      footer={
        <>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={styles.primaryButton} form={formId} type="submit">
            Create project
          </button>
        </>
      }
      icon={<ProjectGlyph icon={icon} />}
      isOpen={isOpen}
      onClose={onClose}
      title="New project"
    >
      <form className={styles.form} id={formId} onSubmit={handleSubmit}>
        <fieldset className={styles.iconFieldset}>
          <legend>Project icon</legend>
          <div aria-label="Project icon" className={styles.iconOptions} role="group">
            {projectIconOptions.map((option) => (
              <button
                aria-label={`${option.label} icon`}
                aria-pressed={icon === option.value}
                className={`${styles.iconOption} ${icon === option.value ? styles.iconOptionSelected : ''}`}
                key={option.value}
                onClick={() => setIcon(option.value)}
                title={option.label}
                type="button"
              >
                <ProjectGlyph icon={option.value} />
              </button>
            ))}
          </div>
        </fieldset>

        <div className={styles.detailsPanel}>
          <div className={styles.fieldGroup}>
            <label htmlFor={`${formId}-name`}>Name</label>
            <input
              aria-describedby={nameError ? nameErrorId : undefined}
              aria-invalid={nameError ? true : undefined}
              autoComplete="off"
              id={`${formId}-name`}
              data-autofocus="true"
              maxLength={255}
              onChange={(event) => {
                setName(event.target.value);
                if (nameError) {
                  setNameError('');
                }
              }}
              placeholder="Customer portal"
              value={name}
            />
            {nameError ? (
              <span className={styles.errorMessage} id={nameErrorId} role="alert">
                {nameError}
              </span>
            ) : null}
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.labelRow}>
              <label htmlFor={`${formId}-description`}>Description</label>
              <span>Optional</span>
            </div>
            <textarea
              id={`${formId}-description`}
              maxLength={2000}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will this project verify?"
              rows={3}
              value={description}
            />
            <span className={styles.characterCount}>{description.length}/2000</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
