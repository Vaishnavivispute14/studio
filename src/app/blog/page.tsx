'use client';

import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Calendar, User, ArrowRight } from 'lucide-react';

export default function BlogPage() {
  const posts = [
    {
      date: "March 15, 2026",
      title: "The Evolution of AI Reasoning in 2026",
      description: "Exploring how NexBot's reasoning mode is transforming the way we solve complex engineering puzzles.",
      author: "Dr. Elena Vance"
    },
    {
      date: "February 28, 2026",
      title: "NexBot 5.0: The Future is Here",
      description: "A deep dive into the latest engine updates, including lower latency and higher-order semantic understanding.",
      author: "Marcus Thorne"
    },
    {
      date: "January 10, 2026",
      title: "Ethical AI: Our Commitment for 2026",
      description: "How we ensure NexBot remains a helpful, harmless, and honest assistant in an increasingly digital world.",
      author: "Sarah Jenkins"
    }
  ];

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-5xl mx-auto px-8 py-32">
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6">NexBot Insights</h1>
          <p className="text-xl text-white/50">Stay updated with the latest in AI innovation and NexBot news.</p>
        </div>

        <div className="space-y-12">
          {posts.map((post, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4 text-primary text-sm font-medium">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {post.date}
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <User className="w-4 h-4" />
                  {post.author}
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 group-hover:text-primary transition-colors font-headline">
                {post.title}
              </h2>
              <p className="text-lg text-white/60 mb-6 leading-relaxed">
                {post.description}
              </p>
              <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-4 transition-all">
                Read Article <ArrowRight className="w-4 h-4" />
              </div>
              <div className="mt-12 h-px w-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
