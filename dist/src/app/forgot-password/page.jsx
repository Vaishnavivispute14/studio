'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const auth = useAuth();
    const { toast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        if (!email) {
            setError('Please enter your email address.');
            return;
        }
        setIsSubmitting(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess('Password reset link has been sent to your email.');
            toast({
                title: 'Email Sent',
                description: 'Check your inbox for password reset instructions.',
            });
        }
        catch (err) {
            setError(err.message || 'Failed to send password reset email. Please try again.');
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<main className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute inset-0 auth-container -z-10"/>
      <div className="w-full max-w-md rounded-2xl bg-card/80 p-8 shadow-lg backdrop-blur-lg">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-foreground font-headline">
            Forgot Password?
          </h1>
          <p className="text-muted-foreground">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (<Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4"/>
              <AlertDescription>{error}</AlertDescription>
            </Alert>)}

          {success && (<Alert className="mb-4 border-green-500 text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400"/>
              <AlertDescription>{success}</AlertDescription>
            </Alert>)}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isSubmitting} className="h-12"/>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4"/>
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </main>);
}
