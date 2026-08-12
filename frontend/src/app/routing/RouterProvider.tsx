import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { resolvePath, type AppRoute, type RouteResolution } from './routes';

interface NavigateOptions {
  readonly replace?: boolean;
}

interface RouterContextValue {
  readonly route: AppRoute;
  readonly navigate: (to: string, options?: NavigateOptions) => void;
}

interface RouterProviderProps {
  readonly children: ReactNode;
}

interface AppLinkProps {
  readonly children: ReactNode;
  readonly className?: string | undefined;
  readonly to: string;
  readonly ariaCurrent?: 'page' | undefined;
  readonly onNavigate?: (() => void) | undefined;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);
const routeChangeEventName = 'implementation-verifier:navigate';

function readLocation(): RouteResolution {
  return resolvePath(window.location.pathname);
}

export function RouterProvider({ children }: RouterProviderProps) {
  const [resolution, setResolution] = useState<RouteResolution>(readLocation);

  const syncLocation = useCallback(() => {
    setResolution(readLocation());
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncLocation);
    window.addEventListener(routeChangeEventName, syncLocation);

    return () => {
      window.removeEventListener('popstate', syncLocation);
      window.removeEventListener(routeChangeEventName, syncLocation);
    };
  }, [syncLocation]);

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  useLayoutEffect(() => {
    if (!resolution.redirectTo) {
      return;
    }

    window.history.replaceState(null, '', resolution.redirectTo);
    setResolution(resolvePath(resolution.redirectTo));
  }, [resolution.redirectTo]);

  useLayoutEffect(() => {
    window.scrollTo({ behavior: 'auto', left: 0, top: 0 });
  }, [resolution.route]);

  const navigate = useCallback((to: string, options: NavigateOptions = {}) => {
    if (options.replace) {
      window.history.replaceState(null, '', to);
    } else {
      window.history.pushState(null, '', to);
    }

    window.dispatchEvent(new Event(routeChangeEventName));
  }, []);

  const value = useMemo<RouterContextValue>(
    () => ({ route: resolution.route, navigate }),
    [navigate, resolution.route],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterContextValue {
  const context = useContext(RouterContext);

  if (!context) {
    throw new Error('useRouter must be used within RouterProvider.');
  }

  return context;
}

export function AppLink({ children, className, to, ariaCurrent, onNavigate }: AppLinkProps) {
  const { navigate } = useRouter();

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigate(to);
    onNavigate?.();
  }

  return (
    <a aria-current={ariaCurrent} className={className} href={to} onClick={handleClick}>
      {children}
    </a>
  );
}
