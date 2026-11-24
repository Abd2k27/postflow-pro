import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SUPPORT_EMAIL } from '@/lib/site';

export type LegalSectionContent = {
  title: string;
  paragraphs: string[];
  items?: string[];
};

type PublicLegalLayoutProps = {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
};

export function PublicLegalLayout({
  title,
  description,
  lastUpdated,
  children,
}: PublicLegalLayoutProps) {
  useEffect(() => {
    document.title = `${title} | PostFlow Pro`;
  }, [title]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.14),_transparent_35%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border bg-background/80 px-5 py-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link to="/login" className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-background border shadow-sm">
              <img src="/Postflow_Pro.png" alt="PostFlow Pro Logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-base font-semibold">PostFlow Pro</p>
              <p className="text-sm text-muted-foreground">Public legal pages</p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/data-deletion" className="transition-colors hover:text-foreground">
              Data Deletion
            </Link>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Login
            </Link>
            <Link to="/signup" className="transition-colors hover:text-foreground">
              Sign up
            </Link>
          </nav>
        </header>

        <main className="flex-1 py-10">
          <div className="mb-8 max-w-3xl space-y-4">
            <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-primary">
              Official legal document
            </span>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
              <p className="text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border bg-background/80 px-3 py-1.5">
                Last updated: {lastUpdated}
              </span>
              <span className="rounded-full border bg-background/80 px-3 py-1.5">
                Publicly accessible
              </span>
            </div>
          </div>

          <Card className="border-border/70 bg-card/95 shadow-xl shadow-primary/5">
            <CardContent className="space-y-8 p-6 sm:p-8">{children}</CardContent>
          </Card>
        </main>

        <footer className="flex flex-col gap-3 border-t py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} PostFlow Pro. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link to="/privacy-policy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/data-deletion" className="transition-colors hover:text-foreground">
              Data Deletion
            </Link>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Login
            </Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-foreground">
              Contact: {SUPPORT_EMAIL}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function LegalSection({ section }: { section: LegalSectionContent }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="leading-7 text-muted-foreground">
          {paragraph}
        </p>
      ))}
      {section.items && (
        <ul className="space-y-2 pl-5 text-muted-foreground marker:text-primary">
          {section.items.map((item) => (
            <li key={item} className="leading-7">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
