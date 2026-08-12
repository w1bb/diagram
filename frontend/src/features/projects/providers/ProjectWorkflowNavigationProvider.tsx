import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface ProjectWorkflowNavigationContextValue {
  readonly isWorkflowNavigationVisible: boolean;
  readonly toggleWorkflowNavigation: () => void;
}

interface ProjectWorkflowNavigationProviderProps {
  readonly children: ReactNode;
}

const workflowNavigationStorageKey =
  'implementation-verifier:workflow-navigation-visibility';
const ProjectWorkflowNavigationContext = createContext<
  ProjectWorkflowNavigationContextValue | undefined
>(undefined);

function getInitialWorkflowNavigationVisibility(): boolean {
  try {
    const storedVisibility = window.localStorage.getItem(workflowNavigationStorageKey);

    if (storedVisibility === 'hidden') {
      return false;
    }

    if (storedVisibility === 'visible') {
      return true;
    }
  } catch {
    // Storage can be unavailable in hardened or private browser contexts.
  }

  return true;
}

export function ProjectWorkflowNavigationProvider({
  children,
}: ProjectWorkflowNavigationProviderProps) {
  const [isWorkflowNavigationVisible, setIsWorkflowNavigationVisible] = useState(
    getInitialWorkflowNavigationVisibility,
  );

  useLayoutEffect(() => {
    try {
      window.localStorage.setItem(
        workflowNavigationStorageKey,
        isWorkflowNavigationVisible ? 'visible' : 'hidden',
      );
    } catch {
      // The in-memory preference remains usable when persistence is blocked.
    }
  }, [isWorkflowNavigationVisible]);

  const value = useMemo<ProjectWorkflowNavigationContextValue>(
    () => ({
      isWorkflowNavigationVisible,
      toggleWorkflowNavigation: () =>
        setIsWorkflowNavigationVisible((currentVisibility) => !currentVisibility),
    }),
    [isWorkflowNavigationVisible],
  );

  return (
    <ProjectWorkflowNavigationContext.Provider value={value}>
      {children}
    </ProjectWorkflowNavigationContext.Provider>
  );
}

export function useProjectWorkflowNavigation(): ProjectWorkflowNavigationContextValue {
  const context = useContext(ProjectWorkflowNavigationContext);

  if (!context) {
    throw new Error(
      'useProjectWorkflowNavigation must be used within ProjectWorkflowNavigationProvider.',
    );
  }

  return context;
}
