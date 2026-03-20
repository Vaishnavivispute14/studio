'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen bg-black">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 pointer-events-none">
            <div className="relative z-10 text-center p-4 pointer-events-auto">
              <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-headline tracking-tight">
                NexBot
              </h1>
              <p className="text-xl md:text-2xl text-white/80 mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Your personal AI assistant.
              </p>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-primary/80 hover:bg-primary backdrop-blur-sm border border-primary-foreground/20 animate-in fade-in slide-in-from-bottom-12 duration-1000"
                onClick={() => router.push('/login')}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
