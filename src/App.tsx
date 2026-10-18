import { HomePage } from './home/HomePage';
import { findLabByPath } from './labs/registry';
import { LabPage } from './shell/LabPage';
import { NotFoundPage } from './shell/NotFoundPage';
import { useLocation } from './state/location';

export function App() {
  const { pathname } = useLocation();
  if (pathname === '/') return <HomePage />;
  const lab = findLabByPath(pathname);
  // Keyed by Lab so moving between Labs starts each one fresh.
  if (lab) return <LabPage key={lab.id} lab={lab} />;
  return <NotFoundPage />;
}
