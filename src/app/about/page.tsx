'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-32">
        <div className="max-w-4xl w-full">
          <h1 className="text-6xl md:text-8xl font-bold font-headline mb-12 text-center bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
            About NexBot
          </h1>
          
          <div className="space-y-12 text-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold font-headline text-primary">Our Vision for 2026</h2>
              <p className="text-xl text-white/70 leading-relaxed mx-auto max-w-3xl">
                NexBot is more than just a chatbot; it's a partner in progress. Founded with the mission to bridge the gap between human curiosity and artificial intelligence, we strive to build tools that are intuitive, powerful, and ethical.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8">
              <div className="space-y-4 text-left p-8 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-2xl font-bold font-headline text-white">Innovation First</h3>
                <p className="text-white/50 leading-relaxed">
                  We leverage the latest models, including the 2026 iteration of Gemini Flash, to provide responses that aren't just fast, but contextually aware and highly accurate.
                </p>
              </div>
              <div className="space-y-4 text-left p-8 rounded-3xl bg-white/5 border border-white/10">
                <h3 className="text-2xl font-bold font-headline text-white">User Siloed Security</h3>
                <p className="text-white/50 leading-relaxed">
                  Your privacy is our cornerstone. Our multi-tenant architecture ensures your data is siloed and never used to train global models without explicit consent.
                </p>
              </div>
            </div>

            <div className="pt-12">
              <p className="text-white/40 italic">
                "Empowering human potential through intelligent conversation." — NexBot AI Team, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
