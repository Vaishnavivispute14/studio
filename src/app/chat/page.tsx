"use client";

import { useState, useContext, createContext } from 'react';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Bot, MessageSquare, Plus, Search, Home, Compass, Library, History, LogOut, ChevronDown, User } from 'lucide-react';
import useAuthRedirect from '@/hooks/use-auth-redirect';
import { ChatInterface } from '@/components/chat-interface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';

const ChatSidebar = () => {
  const { user, auth } = useFirebase();
  const { firestore } = useFirebase();
  const router = useRouter();
  
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const chatSessionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'chatSessions'), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: chatSessions, isLoading: sessionsLoading } = useCollection(chatSessionsQuery);

  const groupedSessions = chatSessions?.reduce((acc, session) => {
    if (!session.createdAt) return acc;
    const date = new Date(session.createdAt.seconds * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let group = 'Older';
    if (diffDays <= 1) group = 'Today';
    else if (diffDays <= 7) group = 'Previous 7 Days';

    if(!acc[group]) {
        acc[group] = [];
    }
    acc[group].push(session);
    return acc;
  }, {} as Record<string, typeof chatSessions>);

  const { setOpenMobile } = useSidebar();
  const { setSelectedChatId, selectedChatId } = useChatState();

  return (
    <>
      <SidebarHeader>
        <div className="flex h-10 items-center px-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline ml-2">NexBot</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search" className="pl-9 h-9" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => setSelectedChatId(null)} isActive={selectedChatId === null}><Home /> Home</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled><Compass /> Explore</SidebarMenuButton>
          </SidebarMenuItem>
           <SidebarMenuItem>
            <SidebarMenuButton disabled><Library /> Library</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled><History /> History</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />
        
        {sessionsLoading && (
            <SidebarGroup>
                 <SidebarGroupLabel>Recent</SidebarGroupLabel>
                 <div className="h-8 w-full bg-muted animate-pulse rounded-md mt-2" />
                 <div className="h-8 w-full bg-muted animate-pulse rounded-md mt-2" />
                 <div className="h-8 w-full bg-muted animate-pulse rounded-md mt-2" />
            </SidebarGroup>
        )}

        {groupedSessions && Object.entries(groupedSessions).map(([group, sessions]) => (
            <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                    {sessions.map((session) => (
                        <SidebarMenuItem key={session.id}>
                            <SidebarMenuButton
                              isActive={selectedChatId === session.id}
                              onClick={() => {
                                  setSelectedChatId(session.id);
                                  setOpenMobile(false);
                              }}
                            >
                            <MessageSquare />
                            <span>{session.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        ))}

      </SidebarContent>
      <SidebarFooter>
        <div className='flex items-center justify-center gap-2'>
          <ThemeToggle />
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                      <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                              {user?.displayName ? user.displayName[0] : <User />}
                          </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-sm overflow-hidden">
                          <span className="font-semibold truncate">{user?.displayName || (user?.isAnonymous ? 'Guest' : 'User')}</span>
                          <span className="text-muted-foreground truncate">{user?.email}</span>
                      </div>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" align="start" side="top">
                  <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarFooter>
    </>
  )
}

const MainContentHeader = () => {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { setSelectedChatId } = useChatState();

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

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="font-semibold text-lg gap-2">
                            <Bot />
                            NexBot 4.0
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>NexBot 4.0</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="default" size="sm" onClick={handleNewChat} className="shadow-sm">
                    <Plus className="mr-2 h-4 w-4" />
                    New Chat
                </Button>
                 <Avatar className="h-8 w-8">
                     <AvatarImage src={user?.photoURL || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.displayName ? user.displayName[0] : <User />}
                    </AvatarFallback>
                </Avatar>
            </div>
      </header>
    )
}

type ChatState = {
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
}
const ChatStateContext = createContext<ChatState | null>(null);

const ChatStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    return (
        <ChatStateContext.Provider value={{ selectedChatId, setSelectedChatId }}>
            {children}
        </ChatStateContext.Provider>
    )
}
const useChatState = () => {
    const context = useContext(ChatStateContext);
    if (!context) {
        throw new Error('useChatState must be used within a ChatStateProvider');
    }
    return context;
}

export default function ChatPage() {
  useAuthRedirect('/login');
  const { user, isUserLoading } = useUser();

  if (isUserLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <ChatStateProvider>
        <SidebarProvider>
            <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar-background">
                <ChatSidebar />
            </Sidebar>
            <SidebarInset>
                <div className="flex flex-col min-h-screen bg-background text-foreground chat-background">
                    <MainContentHeader />
                    <MainContentBody />
                </div>
            </SidebarInset>
        </SidebarProvider>
    </ChatStateProvider>
  );
}

const MainContentBody = () => {
    const { selectedChatId } = useChatState();
    const { user } = useUser();

    return (
        <main className="flex-1 flex items-center justify-center p-4 md:p-6">
            {selectedChatId ? (
                <ChatInterface key={selectedChatId} chatSessionId={selectedChatId} />
            ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="mb-4 relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse"></div>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                    Good Morning, {user?.displayName || 'User'}
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-muted-foreground mt-2">
                    How Can I Assist You Today?
                </h2>
            </div>
            )}
        </main>
    )
}
