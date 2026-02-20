"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { chatWithAi } from "@/ai/flows/chat-with-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, SendHorizonal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';

type Message = {
  id?: string;
  senderType: "user" | "ai";
  content: string;
  timestamp?: any; 
};

type ChatInterfaceProps = {
  chatSessionId: string;
};

export function ChatInterface({ chatSessionId }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { firestore, user } = useFirebase();

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
    if (!input.trim() || isLoading || !user) return;

    const tempUserInput = input;
    setInput("");

    const messagesCollection = collection(firestore, `users/${user.uid}/chatSessions/${chatSessionId}/chatMessages`);
    
    const userMessage = {
      senderType: "user" as const,
      content: tempUserInput,
      timestamp: serverTimestamp(),
      chatSessionId: chatSessionId,
    };
    addDocumentNonBlocking(messagesCollection, userMessage);

    setIsLoading(true);

    try {
      const { response } = await chatWithAi({ message: tempUserInput });
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
    <Card className="w-full max-w-3xl h-[calc(100vh-12rem)] flex flex-col shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg font-headline">Conversation</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {messagesLoading && messages?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                 <Bot className="w-12 h-12 animate-spin text-primary" />
              </div>
            )}
            {!messagesLoading && messages?.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                <Bot className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Start a conversation with NexBot!</p>
                <p className="text-sm">Ask me anything, and I'll do my best to help.</p>
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
                    "max-w-[75%] rounded-lg p-3 text-sm whitespace-pre-wrap",
                    message.senderType === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {message.content}
                </div>
                {message.senderType === "user" && (
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <User className="w-5 h-5" />
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
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 resize-none"
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
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} aria-label="Send message">
            <SendHorizonal />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

ChatInterface.displayName = "ChatInterface";
