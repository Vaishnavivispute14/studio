"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { Header } from '@/components/header';
import { ChatInterface } from '@/components/chat-interface';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
} from '@/components/ui/sidebar';
import { Bot, MessageSquare } from 'lucide-react';
import useAuthRedirect from '@/hooks/use-auth-redirect';

export default function Home() {
  useAuthRedirect();
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const chatSessionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'chatSessions'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: chatSessions, isLoading: sessionsLoading } = useCollection(chatSessionsQuery);
  
  useEffect(() => {
    if (!selectedChatId && chatSessions && chatSessions.length > 0) {
      setSelectedChatId(chatSessions[0].id);
    }
  }, [chatSessions, selectedChatId]);


  const handleNewChat = async () => {
    if (!user) return;
    const newChatSession = {
      title: 'New Chat',
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const docRef = await addDoc(
        collection(firestore, 'users', user.uid, 'chatSessions'),
        newChatSession
      );
      setSelectedChatId(docRef.id);
    } catch (error) {
      console.error('Error creating new chat session:', error);
    }
  };

  if (isUserLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <div className="flex h-10 items-center px-2">
              <h1 className="text-2xl font-bold text-primary font-headline">AuraChat</h1>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {sessionsLoading && <>
              <SidebarMenuItem><div className="h-8 w-full bg-muted animate-pulse rounded-md" /></SidebarMenuItem>
              <SidebarMenuItem><div className="h-8 w-full bg-muted animate-pulse rounded-md" /></SidebarMenuItem>
              <SidebarMenuItem><div className="h-8 w-full bg-muted animate-pulse rounded-md" /></SidebarMenuItem>
            </>}
            {chatSessions?.map((session) => (
              <SidebarMenuItem key={session.id}>
                <SidebarMenuButton
                  onClick={() => setSelectedChatId(session.id)}
                  isActive={selectedChatId === session.id}
                >
                  <MessageSquare />
                  <span>{session.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-background text-foreground">
          <Header onNewChat={handleNewChat} />
          <main className="flex-1 flex items-center justify-center p-4 md:p-6">
            {selectedChatId ? (
               <ChatInterface key={selectedChatId} chatSessionId={selectedChatId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">No Chat Selected</p>
                <p className="text-sm">Start a new conversation or select one from the list.</p>
              </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
