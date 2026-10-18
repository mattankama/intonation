import { copy } from '../copy/en';
import { Link } from '../state/Link';
import { Wordmark } from './Wordmark';
import { useDocumentTitle } from './useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle(copy.shell.documentTitle(copy.notFound.title));
  return (
    <div className="home">
      <header className="home-masthead">
        <Wordmark />
      </header>
      <main className="home-main">
        <h1 className="home-headline">{copy.notFound.title}</h1>
        <p className="home-intro">{copy.notFound.body}</p>
        <p>
          <Link href="/">{copy.notFound.home}</Link>
        </p>
      </main>
    </div>
  );
}
