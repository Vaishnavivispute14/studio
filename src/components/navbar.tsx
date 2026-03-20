'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md bg-black/10">
      <div className="flex items-center">
        <Link href="/" className="text-3xl font-bold text-white font-headline tracking-tight">
          NexBot
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === link.href ? "text-primary" : "text-white/70"
            )}
          >
            {link.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
