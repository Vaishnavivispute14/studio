"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { chatWithAi } from "@/ai/flows/chat-with-ai";
import { generateChatTitle } from "@/ai/flows/generate-chat-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bot, User, SendHorizonal, Wand2, SearchCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc } from 'firebase/firestore';

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
    createdAt: any;
    updatedAt: any;
}

type ChatInterfaceProps = {
  chatSessionId: string;
};

export function ChatInterface({ chatSessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'reasoning' | 'deep_research' | null>(null);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { firestore, user } = useFirebase();

  const chatSessionRef = useMemoFirebase(() => {
    if (!user || !chatSessionId) return null;
    return doc(firestore, `users/${user.uid}/chatSessions/${chatSessionId}`);
  }, [firestore, user, chatSessionId]);
  const { data: chatSession } = useDoc<ChatSession>(chatSessionRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!user || !chatSessionId) return null;
    return query(
      collection(firestore, `users/${user.uid}/chatSessions/${chatSessionId}/chatMessages`),
      orderBy('timestamp', 'asc')
    );
  }, [firestore, user, chatSessionId]);

  const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user || !chatSessionRef) return;

    const tempUserInput = input;
    const currentMode = mode;
    setInput("");
    setMode(null);
    setIsLoading(true);

    const messagesCollection = collection(firestore, `users/${user.uid}/chatSessions/${chatSessionId}/chatMessages`);
    
    const userMessage = {
      senderType: "user" as const,
      content: tempUserInput,
      timestamp: serverTimestamp(),
      chatSessionId: chatSessionId,
    };
    addDocumentNonBlocking(messagesCollection, userMessage);
    
    // If this is the first message of a new chat, generate and set the title.
    if (chatSession?.title === 'New Chat' && (!messages || messages.length === 0)) {
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
      // Optional: Re-add the failed user message to the input
      // setInput(tempUserInput);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl h-full flex flex-col">
      <ScrollArea className="flex-1 pr-4 -mr-4">
        <div className="space-y-8 pb-8">
          {messagesLoading && messages?.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                <Bot className="w-12 h-12 animate-spin text-primary" />
            </div>
          )}
          {messages?.map((message) => (
            <div
              key={message.id}
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
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-4 text-sm whitespace-pre-wrap shadow-sm",
                  message.senderType === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card"
                )}
              >
                {message.content}
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
        <Card className="p-2 rounded-2xl shadow-lg">
            <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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
                                handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                                }
                            }}
                            disabled={isLoading || messagesLoading}
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
    </div>
  );
}

ChatInterface.displayName = "ChatInterface";
