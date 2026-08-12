import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import { TrashIcon } from '../../../../components/icons/Icons';
import { Modal } from '../../../../components/overlay/Modal/Modal';
import type { ProjectIconName, ProjectSummary } from '../../model/project';
import type { ProjectDetailsInput } from '../../providers/ProjectProvider';
import { ProjectGlyph, projectIconOptions } from '../ProjectGlyph/ProjectGlyph';
import styles from './ProjectModal.module.css';

interface ProjectModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onDelete?: (() => void) | undefined;
  readonly onSave: (input: ProjectDetailsInput) => void;
  readonly project?: ProjectSummary | undefined;
}

export function ProjectModal({
  isOpen,
  onClose,
  onDelete,
  onSave,
  project,
}: ProjectModalProps) {
  const formId = useId();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const keepProjectButtonRef = useRef<HTMLButtonElement>(null);
  const nameErrorId = useId();
  const [description, setDescription] = useState('');
  const [displayedProject, setDisplayedProject] = useState<ProjectSummary | undefined>(project);
  const [icon, setIcon] = useState<ProjectIconName>('layers');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const modalProject = isOpen ? project : displayedProject;
  const isEditing = modalProject !== undefined;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDisplayedProject(project);
    setName(project?.name ?? '');
    setDescription(project?.description ?? '');
    setIcon(project?.icon ?? 'layers');
    setNameError('');
    setIsConfirmingDelete(false);
  }, [isOpen, project]);

  useEffect(() => {
    if (!isConfirmingDelete) {
      return;
    }

    const focusFrame = window.requestAnimationFrame(() => keepProjectButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(focusFrame);
  }, [isConfirmingDelete]);

  function closeModal() {
    onClose();
  }

  function keepProject() {
    setIsConfirmingDelete(false);
    window.requestAnimationFrame(() => deleteButtonRef.current?.focus());
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      setNameError('Enter a project name.');
      return;
    }

    onSave({ name, description, icon });
  }

  if (isConfirmingDelete && modalProject) {
    return (
      <Modal
        className={styles.modal}
        description="This action removes the project from the current browser session."
        footer={(
          <div className={styles.footerActions}>
            <button
              className={styles.secondaryButton}
              onClick={keepProject}
              ref={keepProjectButtonRef}
              type="button"
            >
              Keep project
            </button>
            <button
              className={styles.confirmDeleteButton}
              disabled={!isOpen || !onDelete}
              onClick={() => onDelete?.()}
              type="button"
            >
              <TrashIcon />
              Delete project
            </button>
          </div>
        )}
        icon={<TrashIcon />}
        isOpen={isOpen}
        onClose={closeModal}
        title={`Delete ${modalProject.name}?`}
      >
        <div className={styles.deleteConfirmation}>
          <div className={styles.projectPreview}>
            <ProjectGlyph icon={modalProject.icon} />
            <div>
              <strong>{modalProject.name}</strong>
              <span>{modalProject.description || 'No description'}</span>
            </div>
          </div>
          <p>
            The project will disappear from the sidebar and overview. This frontend mock does
            not delete related requirement, codebase, or report fixtures from a server.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      className={styles.modal}
      description={isEditing
        ? 'Update this verification workspace. Changes remain in the current browser session.'
        : 'Give this verification workspace a clear identity. You can refine its details later.'}
      footer={(
        <div className={styles.footerActions}>
          {isEditing ? (
            <button
              className={styles.deleteButton}
              disabled={!isOpen || !onDelete}
              onClick={() => setIsConfirmingDelete(true)}
              ref={deleteButtonRef}
              type="button"
            >
              <TrashIcon />
              Delete project
            </button>
          ) : null}
          <button className={styles.secondaryButton} onClick={closeModal} type="button">
            Cancel
          </button>
          <button className={styles.primaryButton} form={formId} type="submit">
            {isEditing ? 'Save changes' : 'Create project'}
          </button>
        </div>
      )}
      icon={<ProjectGlyph icon={icon} />}
      isOpen={isOpen}
      onClose={closeModal}
      title={isEditing ? 'Edit project' : 'New project'}
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
              data-autofocus="true"
              id={`${formId}-name`}
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
