"use client";

import { useState, useContext, createContext, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp, addDoc, query, orderBy, doc } from 'firebase/firestore';
import { useFirebase, useUser, useCollection, useDoc, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Bot, MessageSquare, Plus, Search, Home, LogOut, ChevronDown, User, Sparkles, MoreHorizontal, Pin, Archive, Trash2, Edit2, Check, X, Upload, Image as ImageIcon } from 'lucide-react';
import useAuthRedirect from '@/hooks/use-auth-redirect';
import { ChatInterface } from '@/components/chat-interface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useToast } from '@/hooks/use-toast';
import { generateChatTitle } from '@/ai/flows/generate-chat-title';
import { chatWithAi } from '@/ai/flows/chat-with-ai';
import { cn } from '@/lib/utils';

type Message = {
  id?: string;
  senderType: "user" | "ai";
  content: string;
  timestamp?: any;
};

type ChatSession = {
  id: string;
  title: string;
  userId: string;
  isPinned?: boolean;
  isArchived?: boolean;
  createdAt: any;
  updatedAt: any;
  messages?: Message[]; // Used for guest sessions
};

type ChatState = {
  selectedChatId: string | null;
  setSelectedChatId: (id: string | null) => void;
  guestSessions: ChatSession[];
  setGuestSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
  isGuestLoading: boolean;
  setIsGuestLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
const ChatStateContext = createContext<ChatState | null>(null);

const ChatStateProvider = ({ children }: { children: React.ReactNode }) => {
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [guestSessions, setGuestSessions] = useState<ChatSession[]>([]);
    const [isGuestLoading, setIsGuestLoading] = useState(false);

    return (
        <ChatStateContext.Provider value={{ 
            selectedChatId, setSelectedChatId, 
            guestSessions, setGuestSessions,
            isGuestLoading, setIsGuestLoading
        }}>
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

const ChatHistoryItem = ({ session, isSelected, onSelect, isGuest }: { session: ChatSession; isSelected: boolean; onSelect: (id: string) => void; isGuest: boolean }) => {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const { setGuestSessions } = useChatState();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);

  const handleAction = (action: 'pin' | 'archive' | 'delete' | 'rename') => {
    if (isGuest) {
        switch (action) {
            case 'rename':
                setIsRenaming(true);
                break;
            case 'delete':
                setGuestSessions(prev => prev.filter(s => s.id !== session.id));
                toast({ variant: "destructive", title: "Deleted", description: "Guest chat session removed." });
                break;
            default:
                toast({ title: "Feature unavailable", description: "Login to pin or archive chats." });
        }
        return;
    }

    if (!user) return;
    const sessionRef = doc(firestore, 'users', user.uid, 'chatSessions', session.id);

    switch (action) {
      case 'pin':
        updateDocumentNonBlocking(sessionRef, { isPinned: !session.isPinned });
        break;
      case 'archive':
        updateDocumentNonBlocking(sessionRef, { isArchived: !session.isArchived });
        break;
      case 'delete':
        deleteDocumentNonBlocking(sessionRef);
        toast({ variant: "destructive", title: "Deleted", description: "Chat session removed permanently." });
        break;
      case 'rename':
        setIsRenaming(true);
        break;
    }
  };

  const submitRename = () => {
    if (isGuest) {
        setGuestSessions(prev => prev.map(s => s.id === session.id ? { ...s, title: newTitle.trim() } : s));
        setIsRenaming(false);
        return;
    }
    if (!user || !newTitle.trim()) return;
    const sessionRef = doc(firestore, 'users', user.uid, 'chatSessions', session.id);
    updateDocumentNonBlocking(sessionRef, { title: newTitle.trim() });
    setIsRenaming(false);
  };

  return (
    <SidebarMenuItem className="group/item relative">
      {isRenaming ? (
        <div className="flex items-center gap-1 p-1 bg-accent/20 rounded-md">
          <Input 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            className="h-7 text-xs px-2 py-0" 
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitRename();
              if (e.key === 'Escape') setIsRenaming(false);
            }}
          />
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={submitRename}><Check className="h-3 w-3" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => setIsRenaming(false)}><X className="h-3 w-3" /></Button>
        </div>
      ) : (
        <>
          <SidebarMenuButton
            isActive={isSelected}
            onClick={() => onSelect(session.id)}
            className="pr-8"
          >
            <MessageSquare className={cn("h-4 w-4 shrink-0", session.isPinned && "text-primary fill-primary/20")} />
            <span className="truncate">{session.title}</span>
            {session.isPinned && <Pin className="h-3 w-3 absolute right-8 text-primary/50 rotate-45" />}
          </SidebarMenuButton>

          <div className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAction('rename')}>
                  <Edit2 className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                {!isGuest && (
                    <>
                        <DropdownMenuItem onClick={() => handleAction('pin')}>
                            <Pin className="mr-2 h-4 w-4" /> {session.isPinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAction('archive')}>
                            <Archive className="mr-2 h-4 w-4" /> Archive
                        </DropdownMenuItem>
                    </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleAction('delete')} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </SidebarMenuItem>
  );
};

const ChatSidebar = () => {
  const { user, auth, firestore } = useFirebase();
  const { state } = useSidebar();
  const router = useRouter();
  const { setSelectedChatId, selectedChatId, guestSessions, setGuestSessions } = useChatState();
  
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    if (user.isAnonymous) {
        const newGuestSession: ChatSession = {
            id: `guest-${Date.now()}`,
            title: 'New Guest Chat',
            userId: 'guest',
            createdAt: new Date(),
            updatedAt: new Date(),
            messages: []
        };
        setGuestSessions(prev => [newGuestSession, ...prev]);
        setSelectedChatId(newGuestSession.id);
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

  const chatSessionsQuery = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chatSessions'), 
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: cloudSessions, isLoading: sessionsLoading } = useCollection<ChatSession>(chatSessionsQuery);

  const displaySessions = user?.isAnonymous ? guestSessions : cloudSessions || [];
  const activeSessions = displaySessions?.filter(s => !s.isArchived) || [];
  const pinnedSessions = activeSessions.filter(s => s.isPinned) || [];
  const regularSessions = activeSessions.filter(s => !s.isPinned) || [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPinned = pinnedSessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const filteredGroups = Object.entries(regularSessions.reduce((acc, session) => {
    const date = session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000) : new Date(session.createdAt);
    if (!date || isNaN(date.getTime())) return acc;
    
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let group = 'Older';
    if (diffDays <= 1) group = 'Today';
    else if (diffDays <= 7) group = 'Previous 7 Days';

    if(!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>)).reduce((acc, [group, sessions]) => {
      const filtered = sessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
      if (filtered.length > 0) acc[group] = filtered;
      return acc;
  }, {} as Record<string, ChatSession[]>);

  return (
    <>
      <SidebarHeader className="pt-4 px-2">
        <div className={cn(
            "flex h-10 items-center mb-4",
            state === "expanded" ? "justify-between" : "justify-center"
        )}>
            {state === "expanded" && (
                <div className="flex items-center overflow-hidden">
                    <Bot className="h-8 w-8 text-primary shrink-0" />
                    <h1 className="text-2xl font-bold text-foreground font-headline ml-2 truncate">NexBot</h1>
                </div>
            )}
            <SidebarTrigger className="h-8 w-8" />
        </div>
        {state === "expanded" && (
            <Button 
                onClick={handleNewChat} 
                className="w-full bg-primary hover:bg-primary/90 text-white shadow-md font-semibold"
            >
                <Plus className="mr-2 h-4 w-4" />
                New Chat
            </Button>
        )}
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin scrollbar-visible">
        <SidebarGroup>
          <SidebarGroupLabel>Search Chats</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="relative px-2 py-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search chats" 
                  className="pl-8 h-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSelectedChatId(null)} isActive={selectedChatId === null}><Home /> Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />
        
        {sessionsLoading && (
            <SidebarGroup>
                 <SidebarGroupLabel>Loading history...</SidebarGroupLabel>
                 <div className="h-8 w-full bg-muted animate-pulse rounded-md mt-2" />
                 <div className="h-8 w-full bg-muted animate-pulse rounded-md mt-2" />
            </SidebarGroup>
        )}

        {!sessionsLoading && filteredPinned.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Pinned</SidebarGroupLabel>
            <SidebarMenu>
              {filteredPinned.map(session => (
                <ChatHistoryItem key={session.id} session={session} isSelected={selectedChatId === session.id} onSelect={setSelectedChatId} isGuest={!!user?.isAnonymous} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {!sessionsLoading && filteredGroups && Object.entries(filteredGroups).map(([group, sessions]) => (
            <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                    {sessions.map((session) => (
                      <ChatHistoryItem key={session.id} session={session} isSelected={selectedChatId === session.id} onSelect={setSelectedChatId} isGuest={!!user?.isAnonymous} />
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        ))}

      </SidebarContent>
      <SidebarFooter>
        <div className='flex items-center justify-center gap-2'>
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start items-center gap-3 p-2 h-auto">
                      <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.photoURL || ''} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                              {user?.displayName ? user.displayName[0] : <User />}
                          </AvatarFallback>
                      </Avatar>
                      {state === "expanded" && (
                          <div className="flex flex-col items-start text-sm overflow-hidden text-left">
                              <span className="font-semibold truncate w-full">{user?.displayName || (user?.isAnonymous ? 'Guest' : 'User')}</span>
                              <span className="text-muted-foreground truncate w-full">{user?.email || (user?.isAnonymous ? 'Temporary session' : '')}</span>
                          </div>
                      )}
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
    const { user, firestore } = useFirebase();
    const { state } = useSidebar();
    const { toast } = useToast();
    const { setSelectedChatId, selectedChatId, guestSessions } = useChatState();

    const isGuest = selectedChatId?.startsWith('guest-');
    
    const chatSessionRef = useMemoFirebase(() => {
        if (!user || !selectedChatId || isGuest) return null;
        return doc(firestore, `users/${user.uid}/chatSessions/${selectedChatId}`);
    }, [firestore, user, selectedChatId, isGuest]);
    
    const { data: cloudChatSession } = useDoc<ChatSession>(chatSessionRef);
    const guestChatSession = isGuest ? guestSessions.find(s => s.id === selectedChatId) : null;
    const chatSession = isGuest ? guestChatSession : cloudChatSession;

    const handleAction = (action: 'pin' | 'archive' | 'delete') => {
        if (!user || isGuest) return;
        if (!chatSessionRef || !chatSession) return;
        
        switch (action) {
          case 'pin':
            updateDocumentNonBlocking(chatSessionRef, { isPinned: !chatSession.isPinned });
            break;
          case 'archive':
            updateDocumentNonBlocking(chatSessionRef, { isArchived: !chatSession.isArchived });
            break;
          case 'delete':
            deleteDocumentNonBlocking(chatSessionRef);
            setSelectedChatId(null);
            toast({ variant: "destructive", title: "Deleted", description: "Chat session removed permanently." });
            break;
        }
    };

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm h-[64px]">
            <div className="flex items-center gap-2">
                {state === "collapsed" && <SidebarTrigger className="h-9 w-9" />}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="font-semibold text-lg gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            NexBot 4.0
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>NexBot 4.0</DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-muted-foreground flex justify-between">
                          <span>NexBot Pro</span>
                          <Sparkles className="h-3 w-3 text-primary" />
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2">
                <ThemeToggle />
                {selectedChatId && !isGuest && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleAction('pin')}>
                                <Pin className="mr-2 h-4 w-4" /> {chatSession?.isPinned ? 'Unpin Chat' : 'Pin Chat'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction('archive')}>
                                <Archive className="mr-2 h-4 w-4" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleAction('delete')} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                 <Avatar className="h-8 w-8 ml-2">
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isUserLoading || !user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Bot className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <ChatStateProvider>
        <SidebarProvider>
            <Sidebar collapsible="icon" variant="sidebar" side="left" className="border-r bg-sidebar">
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
    const { 
        selectedChatId, setSelectedChatId, 
        guestSessions, setGuestSessions,
        isGuestLoading, setIsGuestLoading
    } = useChatState();
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
            const newGuestChatId = `guest-${Date.now()}`;
            const initialMessages: Message[] = [
                { senderType: "user", content: tempUserInput, timestamp: new Date() }
            ];
            
            const newSession: ChatSession = {
                id: newGuestChatId,
                title: 'New Guest Chat',
                userId: 'guest',
                createdAt: new Date(),
                updatedAt: new Date(),
                messages: initialMessages
            };

            setGuestSessions(prev => [newSession, ...prev]);
            setSelectedChatId(newGuestChatId);
            setIsGuestLoading(true);
            setIsLoading(false);

            try {
                const { response } = await chatWithAi({ message: tempUserInput, mode: currentMode });
                const aiMessage: Message = { senderType: "ai", content: response, timestamp: new Date() };
                
                setGuestSessions(prev => prev.map(s => s.id === newGuestChatId ? {
                    ...s,
                    messages: [...s.messages!, aiMessage]
                } : s));

                generateChatTitle({ message: tempUserInput }).then(({ title }) => {
                    if (title) {
                        setGuestSessions(prev => prev.map(s => {
                            if (s.id === newGuestChatId) {
                                return { ...s, title };
                            }
                            return s;
                        }));
                    }
                });
            } catch (err) {
                console.error("Guest AI fail:", err);
                toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
            } finally {
                setIsGuestLoading(false);
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
            await addDoc(messagesCollection, userMessage);
            
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
            await addDoc(messagesCollection, assistantMessage);

        } catch (error) {
           console.error("Failed to create new chat:", error);
           toast({
             variant: "destructive",
             title: "Uh oh! Something went wrong.",
             description: "Something went wrong. Please try again.",
           });
        } finally {
           setIsLoading(false);
        }
    };

    if (selectedChatId) {
        const currentGuestSession = guestSessions.find(s => s.id === selectedChatId);
        return (
             <main className="flex-1 flex items-center justify-center p-4 md:p-6">
                <ChatInterface 
                    key={selectedChatId} 
                    chatSessionId={selectedChatId} 
                    initialInput={input}
                    initialGuestMessages={currentGuestSession?.messages}
                    onGuestMessagesChange={(updater) => {
                        setGuestSessions(prev => prev.map(s => {
                            if (s.id === selectedChatId) {
                                const newMessages = typeof updater === 'function' ? updater(s.messages || []) : updater;
                                return { ...s, messages: newMessages };
                            }
                            return s;
                        }));
                    }}
                    isGuestLoading={isGuestLoading}
                    onGuestLoadingChange={setIsGuestLoading}
                />
            </main>
        );
    }
    
    return (
        <main className="h-full flex flex-col justify-center items-center p-4 md:p-6 relative">
            <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-xl md:text-2xl font-bold text-center mb-10 text-foreground font-poppins text-[1.1rem]">
                    Hello, how can I assist you today?
                </h1>
                <div className="relative group p-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-accent/30 to-primary/50 shadow-sm max-w-lg mx-auto">
                    <form onSubmit={handleWelcomeSubmit}>
                        <div className="relative flex items-center bg-background/80 backdrop-blur-md rounded-2xl overflow-hidden min-h-[40px]">
                            <div className="absolute left-2 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground h-8 w-8">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem onClick={() => toast({ title: "Upload File", description: "Feature coming soon." })}>
                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toast({ title: "Attach Image", description: "Feature coming soon." })}>
                                            <ImageIcon className="mr-2 h-4 w-4" /> Attach Image
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything"
                                className="block w-full border-0 bg-transparent py-2.5 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-0 transition-all resize-none overflow-hidden min-h-[40px]"
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
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
