"use client";

import { useRef } from 'react';
import { Header } from '@/components/header';
import { ChatInterface, type ChatInterfaceHandle } from '@/components/chat-interface';

export default function Home() {
  const chatRef = useRef<ChatInterfaceHandle>(null);

  const handleNewChat = () => {
    chatRef.current?.reset();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header onNewChat={handleNewChat} />
      <main className="flex-1 flex items-center justify-center p-4 md:p-6">
        <ChatInterface ref={chatRef} />
      </main>
    </div>
  );
}
