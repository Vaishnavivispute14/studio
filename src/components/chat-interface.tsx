"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { chatWithAi } from "@/ai/flows/chat-with-ai";
import { generateChatTitle } from "@/ai/flows/generate-chat-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, SendHorizonal, Wand2, SearchCode, MoreHorizontal, Pin, Archive, Trash2, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

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
}

type ChatInterfaceProps = {
  chatSessionId: string;
  initialInput?: string;
};

export function ChatInterface({ chatSessionId, initialInput }: ChatInterfaceProps) {
  const [input, setInput] = useState(initialInput || "");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'reasoning' | 'deep_research' | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { firestore, user } = useFirebase();
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  // Handle Guest Mode (Temporary State)
  const isGuestSession = chatSessionId === 'guest';
  
  const chatSessionRef = useMemoFirebase(() => {
    if (!user || !chatSessionId || isGuestSession) return null;
    return doc(firestore, `users/${user.uid}/chatSessions/${chatSessionId}`);
  }, [firestore, user, chatSessionId, isGuestSession]);
  
  const { data: chatSession } = useDoc<ChatSession>(chatSessionRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !chatSessionId || isGuestSession) return null;
    return query(
      collection(firestore, `users/${user.uid}/chatSessions/${chatSessionId}/chatMessages`),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, user, chatSessionId, isGuestSession]);

  const { data: firestoreMessages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

  const [localGuestMessages, setLocalGuestMessages] = useState<Message[]>([]);
  
  const displayMessages = isGuestSession ? localGuestMessages : firestoreMessages;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages, isLoading]);

  const handleAction = (action: 'pin' | 'archive' | 'delete') => {
    if (!user || !chatSessionRef) return;
    
    switch (action) {
      case 'pin':
        updateDocumentNonBlocking(chatSessionRef, { isPinned: !chatSession?.isPinned });
        toast({ title: chatSession?.isPinned ? "Unpinned" : "Pinned", description: `Chat session ${chatSession?.isPinned ? 'unpinned' : 'pinned'}.` });
        break;
      case 'archive':
        updateDocumentNonBlocking(chatSessionRef, { isArchived: !chatSession?.isArchived });
        toast({ title: chatSession?.isArchived ? "Unarchived" : "Archived", description: `Chat session ${chatSession?.isArchived ? 'unarchived' : 'archived'}.` });
        break;
      case 'delete':
        deleteDocumentNonBlocking(chatSessionRef);
        toast({ variant: "destructive", title: "Deleted", description: "Chat session removed permanently." });
        break;
    }
  };

  const handleCopy = (content: string, id: string | number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast({ title: "Copied", description: "Message copied to clipboard." });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const tempUserInput = input;
    const currentMode = mode;
    setInput("");
    setMode(null);
    setIsLoading(true);

    if (isGuestSession) {
        setLocalGuestMessages(prev => [...prev, { senderType: 'user', content: tempUserInput, timestamp: new Date() }]);
        try {
            const { response } = await chatWithAi({ message: tempUserInput, mode: currentMode });
            setLocalGuestMessages(prev => [...prev, { senderType: 'ai', content: response, timestamp: new Date() }]);
        } catch (err) {
            console.error("Guest chat error:", err);
            toast({ variant: "destructive", title: "Error", description: "AI response failed." });
        } finally {
            setIsLoading(false);
        }
        return;
    }

    if (!chatSessionRef) return;

    const messagesCollection = collection(firestore, `users/${user.uid}/chatSessions/${chatSessionId}/chatMessages`);
    
    const userMessage = {
      senderType: "user" as const,
      content: tempUserInput,
      timestamp: serverTimestamp(),
      chatSessionId: chatSessionId,
    };
    addDocumentNonBlocking(messagesCollection, userMessage);
    
    if (chatSession?.title === 'New Chat' && (!firestoreMessages || firestoreMessages.length === 0)) {
        generateChatTitle({ message: tempUserInput })
            .then(({ title }) => {
                if (title) {
                    updateDocumentNonBlocking(chatSessionRef, { title });
                }
            })
            .catch(err => console.error("Failed to generate chat title:", err));
    }

    try {
      const { response } = await chatWithAi({ message: tempUserInput, mode: currentMode });
      const assistantMessage = {
        senderType: "ai" as const,
        content: response,
        timestamp: serverTimestamp(),
        chatSessionId: chatSessionId,
      };
      addDocumentNonBlocking(messagesCollection, assistantMessage);
    } catch (error) {
      console.error("AI chat failed:", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with the AI response. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-2">
           <Bot className="h-5 w-5 text-primary" />
           <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">NexBot 4.0</span>
        </div>
        {!isGuestSession && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
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
      </div>

      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-8 pb-8">
          {messagesLoading && !isGuestSession && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                <Bot className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
          {displayMessages?.map((message, idx) => (
            <div
              key={message.id || idx}
              className={cn(
                "flex items-start gap-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500",
                message.senderType === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.senderType === "ai" && (
                <Avatar className="w-8 h-8 border">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex flex-col gap-1 max-w-[75%]">
                <div
                    className={cn(
                    "rounded-2xl p-4 text-sm whitespace-pre-wrap shadow-sm",
                    message.senderType === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card"
                    )}
                >
                    {message.content}
                </div>
                <div className={cn("flex mt-1", message.senderType === "user" ? "justify-end" : "justify-start")}>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-muted-foreground hover:text-foreground opacity-50 hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(message.content, message.id || idx)}
                    >
                        {copiedId === (message.id || idx) ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                </div>
              </div>
              {message.senderType === "user" && (
                <Avatar className="w-8 h-8 border">
                  <AvatarImage src={user?.photoURL || ''} />
                  <AvatarFallback className="bg-accent text-accent-foreground">
                    {user?.displayName ? user.displayName[0] : <User />}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 justify-start animate-pulse">
              <Avatar className="w-8 h-8 border">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="w-5 h-5" />
                </AvatarFallback>
              </Avatar>
              <div className="max-w-[75%] rounded-lg p-3 bg-muted space-y-2 w-full">
                <div className="h-4 bg-slate-300 rounded w-1/3"></div>
                <div className="h-4 bg-slate-300 rounded w-2/3"></div>
                <div className="h-4 bg-slate-300 rounded w-1/2"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="mt-auto pt-4">
        <Card className="p-1 rounded-2xl shadow-sm">
            <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-1">
                    <div className="relative">
                        <Wand2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type a message..."
                            className="w-full resize-none border-0 bg-transparent pl-10 pr-10 py-2.5 text-sm focus:ring-0 focus-visible:ring-0 min-h-[40px] max-h-[200px]"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                                }
                            }}
                            disabled={isLoading || (messagesLoading && !isGuestSession)}
                            aria-label="Chat input"
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-xl">
                            <SendHorizonal className="h-4 w-4" />
                        </Button>
                    </div>
                     <div className="flex items-center gap-2 px-2 pb-1">
                        <Button variant={mode === 'reasoning' ? 'secondary' : 'ghost'} size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setMode(prev => prev === 'reasoning' ? null : 'reasoning')}>
                           <Wand2 className="h-3 w-3" /> Reasoning
                        </Button>
                         <Button variant={mode === 'deep_research' ? 'secondary' : 'ghost'} size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={() => setMode(prev => prev === 'deep_research' ? null : 'deep_research')}>
                           <SearchCode className="h-3 w-3" /> Deep Research
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

ChatInterface.displayName = "ChatInterface";
