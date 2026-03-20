'use client';

import { Navbar } from '@/components/navbar';

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-32">
        <h1 className="text-5xl md:text-7xl font-bold font-headline mb-8 text-center">Blog</h1>
        <div className="max-w-4xl w-full space-y-12">
          <div className="space-y-4">
            <div className="text-primary text-sm font-medium">March 15, 2024</div>
            <h2 className="text-3xl font-bold">The Future of AI Reasoning</h2>
            <p className="text-white/70">Exploring how large language models are evolving to handle complex logical puzzles.</p>
          </div>
          <div className="space-y-4">
            <div className="text-primary text-sm font-medium">March 10, 2024</div>
            <h2 className="text-3xl font-bold">Introducing NexBot 4.0</h2>
            <p className="text-white/70">A deep dive into the latest updates and features of our most advanced model yet.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
