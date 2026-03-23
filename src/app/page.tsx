'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0b]">
      <Navbar />
      
      <main className="flex-1 relative">
        <div className="relative h-screen w-full overflow-hidden">
          <iframe
            src="https://my.spline.design/nexbotrobotcharacterconcept-FjwJoe6XBbksyUfxFv16vTux/"
            frameBorder="0"
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
            loading="lazy"
            allowFullScreen
          ></iframe>
          {/* Subtle overlay to help text readability without losing image clarity */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 pointer-events-none">
            <div className="relative z-10 text-center p-4 pointer-events-auto">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-headline tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                NexBot
              </h1>
              <p className="text-xl md:text-2xl text-white mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 max-w-2xl mx-auto font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                Your personal AI assistant for instant answers, creative ideas, and seamless conversation.
              </p>
              <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
                <Button
                  size="lg"
                  className="text-lg px-10 py-7 bg-gradient-to-br from-primary via-primary/90 to-accent hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(168,85,247,0.3)] border border-primary-foreground/10"
                  onClick={() => router.push('/login')}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
