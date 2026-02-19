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
  const [authType, setAuthType] = useState<'login' | 'signup'>('login');

  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
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
      // Redirect is handled by useEffect
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

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4 auth-background">
      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-glass rounded-xl p-8 shadow-2xl text-white">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              {authType === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h1>
            <p className="text-white/70">
              {authType === 'login' ? 'Sign in to continue to NexBot' : 'Fill in the details to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-12 bg-transparent text-white placeholder:text-white/60 border-white/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="pr-10 h-12 bg-transparent text-white placeholder:text-white/60 border-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-white/70" />
                  ) : (
                    <Eye className="h-5 w-5 text-white/70" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 transition-opacity"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Loading...'
                  : authType === 'login'
                  ? 'Sign In'
                  : 'Sign Up'}
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            {authType === 'login' ? (
              <Link
                href="/forgot-password"
                className="text-white/70 hover:text-white transition-colors"
              >
                Forgot password?
              </Link>
            ) : null}
          </div>

          <div className="mt-4 text-center text-sm">
            <p className="text-white/70">
              {authType === 'login'
                ? "Don't have an account?"
                : 'Already have an account?'}
              <button
                onClick={() => {
                  setAuthType(authType === 'login' ? 'signup' : 'login');
                  setEmail('');
                  setPassword('');
                }}
                className="ml-1 font-semibold text-white hover:underline"
              >
                {authType === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
