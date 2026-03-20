'use client';

import { Navbar } from '@/components/navbar';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto p-8 pt-32">
        <h1 className="text-4xl font-bold font-headline mb-8">Terms of Service</h1>
        <div className="space-y-6 text-white/70">
          <p>By using NexBot, you agree to the following terms and conditions.</p>
          <h2 className="text-2xl font-bold text-white mt-8">User Conduct</h2>
          <p>Users must not use NexBot for any illegal or harmful activities. We reserve the right to terminate accounts that violate our guidelines.</p>
          <h2 className="text-2xl font-bold text-white mt-8">Intellectual Property</h2>
          <p>All content and software related to NexBot are the property of NexBot AI.</p>
        </div>
      </div>
    </main>
  );
}
