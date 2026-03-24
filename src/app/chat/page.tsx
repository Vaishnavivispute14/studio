"use client";

import { useState, useContext, createContext, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp, addDoc, query, orderBy } from 'firebase/firestore';
import { useFirebase, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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
import { Bot, MessageSquare, Plus, Search, Home, Compass, Library, History, LogOut, ChevronDown, User, SendHorizonal, Wand2, SearchCode } from 'lucide-react';
import useAuthRedirect from '@/hooks/use-auth-redirect';
import { ChatInterface } from '@/components/chat-interface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { chatWithAi } from '@/ai/flows/chat-with-ai';

type Message = {
  id?: string;
  senderType: "user" | "ai";
  content: string;
  timestamp?: any;
};

type ChatState = {
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  guestMessages: Message[];
  setGuestMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}
const ChatStateContext = createContext<ChatState | null>(null);

const ChatStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [guestMessages, setGuestMessages] = useState<Message[]>([]);
    return (
        <ChatStateContext.Provider value={{ selectedChatId, setSelectedChatId, guestMessages, setGuestMessages }}>
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
    if (!user || user.isAnonymous) return null;
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
  const { setSelectedChatId, selectedChatId, setGuestMessages } = useChatState();

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
            <SidebarMenuButton onClick={() => {
                setSelectedChatId(null);
                setGuestMessages([]);
            }} isActive={selectedChatId === null}><Home /> Home</SidebarMenuButton>
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
    const { setSelectedChatId, setGuestMessages } = useChatState();

    const handleNewChat = async () => {
        if (!user) return;
        if (user.isAnonymous) {
            setGuestMessages([]);
            setSelectedChatId('guest');
            return;
        }
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
    const { selectedChatId, setSelectedChatId, setGuestMessages } = useChatState();
    const { user } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'reasoning' | 'deep_research' | null>(null);

    const handleWelcomeSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !user) return;

        const tempUserInput = input;
        const currentMode = mode;
        
        setInput("");
        setMode(null);
        setIsLoading(true);

        if (user.isAnonymous) {
            const initialMessages: Message[] = [
                { senderType: "user", content: tempUserInput, timestamp: new Date() }
            ];
            setGuestMessages(initialMessages);
            setSelectedChatId('guest');
            setIsLoading(false);

            // Execute AI response for guest
            try {
                const { response } = await chatWithAi({ message: tempUserInput, mode: currentMode });
                setGuestMessages(prev => [...prev, { senderType: "ai", content: response, timestamp: new Date() }]);
            } catch (err) {
                console.error("Guest AI fail:", err);
            }
            return;
        }

        try {
            const newChatSession = {
                title: 'New Chat',
                userId: user.uid,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            const sessionDocRef = await addDoc(
                collection(firestore, 'users', user.uid, 'chatSessions'),
                newChatSession
            );
            const newChatId = sessionDocRef.id;
            
            const messagesCollection = collection(firestore, `users/${user.uid}/chatSessions/${newChatId}/chatMessages`);
            const userMessage = {
              senderType: "user" as const,
              content: tempUserInput,
              timestamp: serverTimestamp(),
              chatSessionId: newChatId,
            };
            addDocumentNonBlocking(messagesCollection, userMessage);
            
            setSelectedChatId(newChatId);

            generateChatTitle({ message: tempUserInput })
                .then(({ title }) => {
                    if (title) {
                        updateDocumentNonBlocking(sessionDocRef, { title });
                    }
                })
                .catch(err => console.error("Failed to generate chat title:", err));
            
            const { response } = await chatWithAi({ message: tempUserInput, mode: currentMode });
            const assistantMessage = {
              senderType: "ai" as const,
              content: response,
              timestamp: serverTimestamp(),
              chatSessionId: newChatId,
            };
            addDocumentNonBlocking(messagesCollection, assistantMessage);

        } catch (error) {
           console.error("Failed to create new chat:", error);
           toast({
             variant: "destructive",
             title: "Uh oh! Something went wrong.",
             description: "Could not start a new chat. Please try again.",
           });
           setIsLoading(false);
        }
    };

    if (selectedChatId) {
        return (
             <main className="flex-1 flex items-center justify-center p-4 md:p-6">
                <ChatInterface key={selectedChatId} chatSessionId={selectedChatId} />
            </main>
        );
    }
    
    return (
        <main className="h-full flex flex-col justify-center items-center p-4 md:p-6">
            <div className="flex-1 flex flex-col justify-center items-center text-center -mt-24">
                <div className="mb-4 relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl animate-pulse"></div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                    Good Morning, {user?.displayName || (user?.isAnonymous ? 'Guest' : 'User')}
                </h1>
                <h2 className="text-2xl md:text-3xl font-bold text-muted-foreground mt-2">
                    How Can I Assist You Today?
                </h2>
            </div>
            <div className="w-full max-w-4xl">
                 <Card className="p-2 rounded-2xl shadow-lg">
                    <CardContent className="p-0">
                        <form onSubmit={handleWelcomeSubmit} className="flex flex-col gap-2">
                        <div className="relative">
                            <Wand2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Initiate a query or send a command to the AI..."
                                className="w-full resize-none border-0 bg-transparent pl-12 pr-12 py-3 text-sm focus:ring-0 focus-visible:ring-0"
                                rows={1}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleWelcomeSubmit(e as unknown as FormEvent<HTMLFormElement>);
                                    }
                                }}
                                disabled={isLoading}
                                aria-label="Chat input"
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg">
                                <SendHorizonal />
                            </Button>
                        </div>
                         <div className="flex items-center gap-2 px-2 pb-1">
                            <Button variant={mode === 'reasoning' ? 'secondary' : 'outline'} size="sm" className="text-xs gap-1.5" onClick={() => setMode(prev => prev === 'reasoning' ? null : 'reasoning')}>
                               <Wand2 /> Reasoning
                            </Button>
                             <Button variant={mode === 'deep_research' ? 'secondary' : 'outline'} size="sm" className="text-xs gap-1.5" onClick={() => setMode(prev => prev === 'deep_research' ? null : 'deep_research')}>
                               <SearchCode /> Deep Research
                            </Button>
                        </div>
                    </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
