import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { SearchInput } from '../../components/forms/SearchInput/SearchInput';
import { NumberChip } from '../../components/data/NumberChip/NumberChip';
import { toast } from '../../components/feedback/Toast/toastStore';
import {
  BrandMarkIcon,
  CloseIcon,
  MenuIcon,
  MoonIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SunIcon,
} from '../../components/icons/Icons';
import { SplitView } from '../../components/layout/SplitView/SplitView';
import { NewProjectModal } from '../../features/projects/components/NewProjectModal/NewProjectModal';
import { ProjectNavigation } from '../../features/projects/components/ProjectNavigation/ProjectNavigation';
import type { CreateProjectInput } from '../../features/projects/providers/ProjectProvider';
import { useProjects } from '../../features/projects/providers/ProjectProvider';
import { useTheme } from '../../app/providers/ThemeProvider';
import { AppLink, useRouter } from '../../app/routing/RouterProvider';
import { projectPath } from '../../app/routing/routes';
import styles from './AppShell.module.css';

interface AppShellProps {
  readonly children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const collapseButtonRef = useRef<HTMLButtonElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const [isNavigationCollapsed, setIsNavigationCollapsed] = useState(false);
  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const { createProject, projects } = useProjects();
  const { navigate, route } = useRouter();
  const { theme, toggleTheme } = useTheme();

  const filteredProjects = useMemo(() => {
    const normalizedSearch = projectSearch.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return projects;
    }

    return projects.filter((project) =>
      `${project.name} ${project.description}`.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [projectSearch, projects]);

  useEffect(() => {
    setIsNavigationOpen(false);
  }, [route]);

  useEffect(() => {
    const mobileBreakpoint = window.matchMedia('(max-width: 900px)');
    const syncNavigationMode = () => {
      if (mobileBreakpoint.matches) {
        setIsNavigationCollapsed(false);
      }
    };

    syncNavigationMode();
    mobileBreakpoint.addEventListener('change', syncNavigationMode);
    return () => mobileBreakpoint.removeEventListener('change', syncNavigationMode);
  }, []);

  function collapseNavigation() {
    setIsNavigationCollapsed(true);
    window.requestAnimationFrame(() => reopenButtonRef.current?.focus());
  }

  function reopenNavigation() {
    setIsNavigationCollapsed(false);
    window.requestAnimationFrame(() => collapseButtonRef.current?.focus());
  }

  function createNewProject(input: CreateProjectInput) {
    const project = createProject(input);
    setProjectSearch('');
    setIsNewProjectModalOpen(false);
    toast.success('Project created', {
      description: `${project.name} is ready. Start by adding requirements.`,
    });
    navigate(projectPath(project.id, 'requirements'));
  }

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>

      <button
        aria-label="Close navigation"
        className={`${styles.overlay} ${isNavigationOpen ? styles.overlayVisible : ''}`}
        onClick={() => setIsNavigationOpen(false)}
        type="button"
      />

      <button
        aria-controls="primary-navigation"
        aria-hidden={!isNavigationCollapsed}
        aria-label="Open project navigation"
        className={`${styles.reopenNavigationButton} ${isNavigationCollapsed ? styles.reopenNavigationButtonVisible : ''}`}
        onClick={reopenNavigation}
        ref={reopenButtonRef}
        tabIndex={isNavigationCollapsed ? 0 : -1}
        title="Open project navigation"
        type="button"
      >
        <PanelLeftOpenIcon />
      </button>

      <SplitView
        defaultLeadingSize={280}
        isLeadingPaneVisible={!isNavigationCollapsed}
        leading={
          <aside
            aria-label="Primary navigation"
            className={`${styles.sidebar} ${isNavigationOpen ? styles.sidebarOpen : ''}`}
            id="primary-navigation"
          >
            <div className={styles.sidebarHeader}>
              <div className={styles.sidebarTopline}>
                <AppLink className={styles.brand} to="/">
                  <span className={styles.brandMark}>
                    <BrandMarkIcon />
                  </span>
                  <span>Verifier</span>
                </AppLink>

                <div className={styles.headerActions}>
                  <button
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    className={styles.iconButton}
                    onClick={toggleTheme}
                    title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    type="button"
                  >
                    {theme === 'light' ? <MoonIcon /> : <SunIcon />}
                  </button>
                  <button
                    aria-controls="primary-navigation"
                    aria-label="Collapse project navigation"
                    className={`${styles.iconButton} ${styles.desktopCollapse}`}
                    onClick={collapseNavigation}
                    ref={collapseButtonRef}
                    title="Collapse project navigation"
                    type="button"
                  >
                    <PanelLeftCloseIcon />
                  </button>
                  <button
                    aria-label="Close navigation"
                    className={`${styles.iconButton} ${styles.mobileClose}`}
                    onClick={() => setIsNavigationOpen(false)}
                    type="button"
                  >
                    <CloseIcon />
                  </button>
                </div>
              </div>

              <div className={styles.sidebarControls}>
                <SearchInput
                  aria-label="Search projects"
                  onChange={(event) => setProjectSearch(event.target.value)}
                  onClear={() => setProjectSearch('')}
                  placeholder="Search projects"
                  value={projectSearch}
                />
                <button
                  aria-label="New project"
                  className={styles.newProjectButton}
                  onClick={() => setIsNewProjectModalOpen(true)}
                  title="New project"
                  type="button"
                >
                  <PlusIcon />
                </button>
              </div>
            </div>

            <div className={styles.sidebarBody}>
              <div className={styles.navigationHeading}>
                <span>Projects</span>
                <NumberChip value={projects.length} />
              </div>
              <ProjectNavigation
                emptyMessage="No projects match your search."
                projects={filteredProjects}
              />
            </div>

            <div className={styles.sidebarFooter}>
              <span className={styles.statusDot} />
              <span>Local workspace</span>
            </div>
          </aside>
        }
        leadingPaneId="primary-navigation"
        maxLeadingSize={420}
        minLeadingSize={232}
        resizeLabel="Resize project navigation"
      >
        <div className={styles.workspace}>
          <header className={styles.mobileHeader}>
            <button
              aria-controls="primary-navigation"
              aria-expanded={isNavigationOpen}
              aria-label="Open navigation"
              className={styles.iconButton}
              onClick={() => setIsNavigationOpen(true)}
              type="button"
            >
              <MenuIcon />
            </button>
            <AppLink className={styles.mobileBrand} to="/">
              <BrandMarkIcon />
              <span>Verifier</span>
            </AppLink>
            <button
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className={styles.iconButton}
              onClick={toggleTheme}
              type="button"
            >
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
          </header>

          <main className={styles.main} id="main-content">
            {children}
          </main>
        </div>
      </SplitView>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={createNewProject}
      />
    </div>
  );
}
