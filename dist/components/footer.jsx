'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
export function Footer() {
    const [currentYear, setCurrentYear] = useState(null);
    useEffect(() => {
        setCurrentYear(new Date().getFullYear());
    }, []);
    return (<footer className="w-full py-4 px-8 bg-black border-t border-primary/20 mt-auto relative overflow-hidden">
      {/* Subtle purple glow effect matching the theme */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_15px_rgba(168,85,247,0.3)]"/>
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div className="flex flex-col items-center md:items-start gap-0.5">
          <h2 className="text-lg font-bold font-headline text-white tracking-tight">NexBot</h2>
          <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60">
            © {currentYear || '...'} NexBot AI. Premium Intelligence.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/about" className="text-xs text-white/50 hover:text-primary transition-colors">
            About
          </Link>
          <Link href="/privacy" className="text-xs text-white/50 hover:text-primary transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-xs text-white/50 hover:text-primary transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </footer>);
}
