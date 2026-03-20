'use client';

import { Navbar } from '@/components/navbar';

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
        <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 text-center">Features</h1>
        <div className="max-w-3xl text-center space-y-6">
          <p className="text-xl text-white/70 leading-relaxed">
            Discover the advanced capabilities of NexBot. From real-time reasoning to deep research, our AI is built to empower your productivity.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
              <h3 className="text-xl font-bold mb-2">Smart Reasoning</h3>
              <p className="text-white/60">Complex problem solving with step-by-step logical analysis.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left">
              <h3 className="text-xl font-bold mb-2">Deep Research</h3>
              <p className="text-white/60">Comprehensive information gathering and synthesis from trusted sources.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
