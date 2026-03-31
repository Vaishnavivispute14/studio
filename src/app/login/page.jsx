'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Bot, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authType, setAuthType] = useState('signup');
  const [error, setError] = useState(null);

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'login') {
      setAuthType('login');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isUserLoading && user && !user.isAnonymous) {
      router.push('/chat');
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction = async (action) => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (action === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      const message = error.code === 'auth/invalid-credential'
        ? 'Invalid email or password.'
        : error.message || 'An unexpected error occurred.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleGuestLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInAnonymously(auth);
      router.push('/chat');
    } catch (error) {
      setError(error.message || 'An unexpected guest login error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || (user && !user.isAnonymous)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="grid h-screen w-screen overflow-hidden md:grid-cols-2">
      <div className="relative hidden items-center justify-center md:flex">
        <div className="absolute inset-0 auth-container" />
         <div className="absolute inset-0 bg-gradient-to-br from-background/40 via-transparent to-background/40" />
        <div className="relative z-10 flex flex-col justify-center h-full p-12 text-white">
           <div className="flex items-center gap-4 mb-8">
             <Bot className="h-12 w-12 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
             <h1 className="text-5xl font-bold font-headline tracking-wide">NexBot</h1>
           </div>
           <div className="space-y-4">
             <h2 className="text-4xl font-bold leading-tight">
               Engage with the future of conversation.
             </h2>
              <p className="font-light text-white/80 text-lg">
                Your intelligent AI companion for smart conversations and instant solutions.
             </p>
           </div>
         </div>
      </div>

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

          <form onSubmit={(e) => { e.preventDefault(); handleAuthAction(authType); }} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
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

            <div className="pt-4 space-y-2">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting && authType !== 'login'
                  ? 'Creating Account...'
                  : isSubmitting && authType === 'login'
                  ? 'Signing In...'
                  : authType === 'signup'
                  ? 'Create Account'
                  : 'Sign In'}
              </Button>
               <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Loading...' : 'Continue as Guest'}
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
                  setError(null);
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-background"><div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
