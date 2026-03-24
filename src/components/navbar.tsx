'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
    { name: 'Blog', href: '/blog' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3 backdrop-blur-md bg-black/60 border-b border-white/10 shadow-sm transition-all duration-300">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2 group">
          {mounted ? (
            <Bot className="w-6 h-6 text-primary filter drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-transform group-hover:scale-110" />
          ) : (
            <div className="w-6 h-6" />
          )}
          <span className="text-xl font-bold text-white font-headline tracking-tight drop-shadow-sm">
            NexBot
          </span>
        </Link>
      </div>
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-6 mr-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-all duration-200 hover:text-white relative py-1",
                pathname === link.href 
                  ? "text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full" 
                  : "text-white/80"
              )}
            >
              {link.name}
            </Link>
          ))}
        </div>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-primary/90 hover:bg-primary text-white font-semibold px-6 h-9 rounded-full text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          onClick={() => router.push('/login?mode=login')}
        >
          Log In
        </Button>
      </div>
    </nav>
  );
}
