'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3 backdrop-blur-md bg-black/40 border-b border-white/5">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          <Bot className="w-8 h-8 text-primary transition-transform group-hover:scale-110" />
          <span className="text-2xl font-bold text-white font-headline tracking-tight">
            NexBot
          </span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-8 mr-4">
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
        <Button 
          variant="default" 
          size="sm" 
          className="bg-primary/90 hover:bg-primary text-white font-semibold px-6 rounded-full"
          onClick={() => router.push('/login')}
        >
          Get Started
        </Button>
      </div>
    </nav>
  );
}
