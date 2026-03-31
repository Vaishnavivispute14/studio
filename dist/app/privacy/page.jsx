'use client';
import { Navbar } from '@/components/navbar';
export default function PrivacyPage() {
    return (<main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto p-8 pt-32">
        <h1 className="text-4xl font-bold font-headline mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-white/70">
          <p>Last Updated: March 2024</p>
          <p>Your privacy is important to us. This policy outlines how we handle your personal data when you use NexBot.</p>
          <h2 className="text-2xl font-bold text-white mt-8">Data Collection</h2>
          <p>We only collect data necessary to provide and improve our services, including chat history for authorized users.</p>
          <h2 className="text-2xl font-bold text-white mt-8">Data Usage</h2>
          <p>Your data is used to personalize your experience and is never sold to third parties.</p>
        </div>
      </div>
    </main>);
}
