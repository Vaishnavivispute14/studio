"use client";

import { useState, useContext, createContext, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp, addDoc, query, orderBy, where, doc } from 'firebase/firestore';
import { useFirebase, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
import { Bot, MessageSquare, Plus, Search, Home, Compass, History, LogOut, ChevronDown, User, SendHorizonal, Wand2, SearchCode, Sparkles, MoreVertical, Pin, Archive, Trash2, Edit2, Check, X, Mic, Upload, Image as ImageIcon, FileText } from 'lucide-react';
import useAuthRedirect from '@/hooks/use-auth-redirect';
import { ChatInterface } from '@/components/chat-interface';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
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

const ChatHistoryItem = ({ session, isSelected, onSelect }: { session: ChatSession; isSelected: boolean; onSelect: (id: string) => void }) => {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title);

  const handleAction = (action: 'pin' | 'archive' | 'delete' | 'rename') => {
    if (!user) return;
    const sessionRef = doc(firestore, 'users', user.uid, 'chatSessions', session.id);

    switch (action) {
      case 'pin':
        updateDocumentNonBlocking(sessionRef, { isPinned: !session.isPinned });
        toast({ title: session.isPinned ? "Unpinned" : "Pinned", description: `Chat session ${session.isPinned ? 'unpinned' : 'pinned'}.` });
        break;
      case 'archive':
        updateDocumentNonBlocking(sessionRef, { isArchived: !session.isArchived });
        toast({ title: session.isArchived ? "Unarchived" : "Archived", description: `Chat session ${session.isArchived ? 'unarchived' : 'archived'}.` });
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
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleAction('rename')}>
                  <Edit2 className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleAction('pin')}>
                  <Pin className="mr-2 h-4 w-4" /> {session.isPinned ? 'Unpin' : 'Pin'}
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
          </div>
        </>
      )}
    </SidebarMenuItem>
  );
};

const ChatSidebar = () => {
  const { user, auth, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();
  
  const handleLogout = () => {
    if (auth) {
      auth.signOut();
      router.push('/login');
    }
  };

  const chatSessionsQuery = useMemoFirebase(() => {
    if (!user || user.isAnonymous) return null;
    return query(
      collection(firestore, 'users', user.uid, 'chatSessions'), 
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: chatSessions, isLoading: sessionsLoading } = useCollection<ChatSession>(chatSessionsQuery);

  const activeSessions = chatSessions?.filter(s => !s.isArchived) || [];
  const pinnedSessions = activeSessions.filter(s => s.isPinned) || [];
  const regularSessions = activeSessions.filter(s => !s.isPinned) || [];

  const groupedSessions = regularSessions.reduce((acc, session) => {
    if (!session.createdAt) return acc;
    const date = new Date(session.createdAt.seconds * 1000);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let group = 'Older';
    if (diffDays <= 1) group = 'Today';
    else if (diffDays <= 7) group = 'Previous 7 Days';

    if(!acc[group]) acc[group] = [];
    acc[group].push(session);
    return acc;
  }, {} as Record<string, ChatSession[]>);

  const { setSelectedChatId, selectedChatId } = useChatState();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPinned = pinnedSessions.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredGroups = Object.entries(regularSessions.reduce((acc, session) => {
    if (!session.createdAt) return acc;
    const date = new Date(session.createdAt.seconds * 1000);
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
      <SidebarHeader>
        <div className="flex h-10 items-center px-2">
            <Bot className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground font-headline ml-2">NexBot</h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Controls</SidebarGroupLabel>
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

            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={() => toast({ title: "Deep Research", description: "Advanced research mode is active for your next query." })}
                className="hover:bg-accent/50 transition-colors"
              >
                <SearchCode className="h-4 w-4" />
                <span>Deep Research</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Quick Nav</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setSelectedChatId(null)} isActive={selectedChatId === null}><Home /> Home</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled><Compass /> Explore</SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton disabled><History /> History</SidebarMenuButton>
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
                <ChatHistoryItem key={session.id} session={session} isSelected={selectedChatId === session.id} onSelect={setSelectedChatId} />
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {!sessionsLoading && filteredGroups && Object.entries(filteredGroups).map(([group, sessions]) => (
            <SidebarGroup key={group}>
                <SidebarGroupLabel>{group}</SidebarGroupLabel>
                <SidebarMenu>
                    {sessions.map((session) => (
                      <ChatHistoryItem key={session.id} session={session} isSelected={selectedChatId === session.id} onSelect={setSelectedChatId} />
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
                      <div className="flex flex-col items-start text-sm overflow-hidden text-left">
                          <span className="font-semibold truncate w-full">{user?.displayName || (user?.isAnonymous ? 'Guest' : 'User')}</span>
                          <span className="text-muted-foreground truncate w-full">{user?.email || (user?.isAnonymous ? 'Temporary session' : '')}</span>
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
                        <DropdownMenuItem disabled className="text-muted-foreground flex justify-between">
                          <span>NexBot Pro</span>
                          <Sparkles className="h-3 w-3 text-primary" />
                        </DropdownMenuItem>
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
        <main className="h-full flex flex-col justify-center items-center p-4 md:p-6 relative">
            <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground font-poppins">
                    Hello, how can I assist you today?
                </h1>
                <div className="relative group">
                    <form onSubmit={handleWelcomeSubmit}>
                        <div className="relative flex items-center">
                            <div className="absolute left-2 z-10">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                            <Plus className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                        <DropdownMenuItem onClick={() => toast({ title: "Upload File", description: "Feature coming soon." })}>
                                            <Upload className="mr-2 h-4 w-4" /> Upload File
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toast({ title: "Attach Image", description: "Feature coming soon." })}>
                                            <ImageIcon className="mr-2 h-4 w-4" /> Attach Image
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleNewChat}>
                                            <Plus className="mr-2 h-4 w-4" /> Start New Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => toast({ title: "Use Template", description: "Feature coming soon." })}>
                                            <FileText className="mr-2 h-4 w-4" /> Use Template
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask anything"
                                className="block w-full rounded-full bg-muted/30 border border-white/25 py-4 pl-12 pr-6 text-lg ring-offset-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all resize-none overflow-hidden"
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
