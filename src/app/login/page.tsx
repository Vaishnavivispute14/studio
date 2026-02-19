'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authType, setAuthType] = useState<'login' | 'signup'>('signup');

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/chat');
    }
  }, [user, isUserLoading, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Missing Fields',
        description: 'Please enter both email and password.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (authType === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description:
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password.'
            : error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="grid h-screen w-screen overflow-hidden md:grid-cols-2">
      {/* Left Panel */}
      <div className="relative hidden md:block p-12">
        <div className="absolute inset-0 auth-container" />
        <div className="relative z-10 flex flex-col justify-between h-full">
           <div>
             <h1 className="text-3xl font-bold text-white font-headline">NexBot</h1>
           </div>
           <div className="space-y-4 text-white">
             <h2 className="text-4xl font-bold leading-tight">
               Engage with the future of conversation.
             </h2>
              <p className="font-light text-white/80 text-lg">
                Your personal AI assistant for instant answers, creative ideas, and seamless conversation.
             </p>
           </div>
         </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-col justify-center p-8 md:p-12 bg-card">
        <div className="mx-auto w-full max-w-md">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {authType === 'signup' ? 'Create an account' : 'Welcome back'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {authType === 'signup'
              ? 'Sign up to save your chat history and unlock more features.'
              : 'Sign in to continue to NexBot.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {authType === 'login' && (
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Loading...'
                  : authType === 'signup'
                  ? 'Sign Up'
                  : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              {authType === 'signup'
                ? 'Already have an account?'
                : "Don't have an account?"}
              <button
                onClick={() => {
                  setAuthType(authType === 'login' ? 'signup' : 'login');
                  setEmail('');
                  setPassword('');
                }}
                className="ml-1 font-semibold text-primary hover:underline"
              >
                {authType === 'signup' ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
