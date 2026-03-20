'use client';

import { Navbar } from '@/components/navbar';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
        <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 text-center">About NexBot</h1>
        <div className="max-w-2xl text-center space-y-6">
          <p className="text-xl text-white/70 leading-relaxed">
            NexBot is at the forefront of AI innovation, dedicated to creating seamless and intelligent conversational experiences.
          </p>
          <p className="text-lg text-white/50">
            Founded in 2024, our mission is to make advanced language models accessible and useful for everyone, everywhere.
          </p>
        </div>
      </div>
    </main>
  );
}
