import { AppLink } from '../../app/routing/RouterProvider';
import styles from './NotFoundPage.module.css';

interface NotFoundPageProps {
  readonly pathname: string;
}

export function NotFoundPage({ pathname }: NotFoundPageProps) {
  return (
    <div className={styles.page}>
      <p className={styles.code}>404</p>
      <h1>That page is not in this workspace.</h1>
      <p className={styles.description}>
        The path <code>{pathname}</code> does not match a recognized application route.
      </p>
      <AppLink className={styles.homeLink} to="/">
        Return to projects
      </AppLink>
    </div>
  );
}

