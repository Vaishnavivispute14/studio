'use client';

import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-12 px-8 bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold font-headline text-foreground">NexBot</h2>
          <p className="text-sm text-muted-foreground">© {currentYear} NexBot AI. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
