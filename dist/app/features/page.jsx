'use client';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Zap, Search, Brain, Shield, Clock, Smartphone } from 'lucide-react';
export default function FeaturesPage() {
    const features = [
        {
            icon: <Brain className="w-8 h-8 text-primary"/>,
            title: "Smart Reasoning",
            description: "Experience deep analytical thinking with our reasoning mode, designed to break down complex logical challenges step-by-step."
        },
        {
            icon: <Search className="w-8 h-8 text-primary"/>,
            title: "Deep Research",
            description: "Get comprehensive answers backed by wide-scale data synthesis. NexBot explores vast knowledge bases to give you accurate insights."
        },
        {
            icon: <Zap className="w-8 h-8 text-primary"/>,
            title: "Instant Response",
            description: "Powered by Gemini 1.5 Flash, NexBot delivers lightning-fast replies without compromising on quality or intelligence."
        },
        {
            icon: <Shield className="w-8 h-8 text-primary"/>,
            title: "Private & Secure",
            description: "Your data is protected. Registered users enjoy siloed chat history, while guest users benefit from zero-storage temporary sessions."
        },
        {
            icon: <Clock className="w-8 h-8 text-primary"/>,
            title: "24/7 Availability",
            description: "NexBot is always here. Whether it's late-night coding or early-morning brainstorming, your AI assistant never sleeps."
        },
        {
            icon: <Smartphone className="w-8 h-8 text-primary"/>,
            title: "Omnichannel Access",
            description: "A seamless experience across all your devices. Chat with NexBot from your desktop, tablet, or mobile phone with ease."
        }
    ];
    return (<main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-8 py-32">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-bold font-headline mb-6 bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">
            Cutting-Edge Features
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            Discover the advanced capabilities of NexBot. From real-time reasoning to deep research, our AI is built to empower your productivity in 2026.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (<div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all duration-300 group">
              <div className="mb-4 transform group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3 font-headline">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">
                {feature.description}
              </p>
            </div>))}
        </div>

        <div className="mt-20 p-12 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 border border-white/10 text-center">
          <h2 className="text-3xl font-bold font-headline mb-4">Ready to evolve?</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto text-lg">
            Join the thousands of users leveraging NexBot for creative and technical excellence in 2026.
          </p>
        </div>
      </div>
      <Footer />
    </main>);
}
