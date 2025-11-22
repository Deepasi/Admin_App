import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'signIn' | 'signUp' | 'forgotPassword'>('signIn');
  const { signIn, signUp, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      
      if (mode === 'forgotPassword') {
        result = await resetPassword(email);
        
        if (!result.error) {
          toast({
            title: "Password reset email sent",
            description: "Please check your email for password reset instructions.",
          });
          setMode('signIn'); // Switch back to sign in mode
          setEmail(''); // Clear email field
        }
      } else {
        result = mode === 'signIn' 
          ? await signIn(email, password)
          : await signUp(email, password);

        if (!result.error) {
          toast({
            title: mode === 'signIn' ? "Signed in successfully" : "Signed up successfully",
            description: mode === 'signUp' 
              ? "Please check your email for verification instructions." 
              : "Welcome back!"
          });
          
          if (mode === 'signIn') {
            navigate('/');
          }
        }
      }

      if (result.error) {
        toast({
          title: "Authentication error",
          description: result.error.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signIn': return 'Sign In';
      case 'signUp': return 'Create Account';
      case 'forgotPassword': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Processing...';
    
    switch (mode) {
      case 'signIn': return 'Sign In';
      case 'signUp': return 'Sign Up';
      case 'forgotPassword': return 'Send Reset Email';
      default: return 'Sign In';
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="pt-28 pb-20"
    >
      <div className="section-container max-w-md mx-auto">
        <div className="glass-panel p-8">
          <h1 className="text-3xl font-display font-bold mb-6 text-center">
            {getTitle()}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            
            {mode !== 'forgotPassword' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full bg-brand-red hover:bg-brand-red/90"
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>
          </form>
          
          <div className="mt-6 space-y-3 text-center">
            {mode === 'signIn' && (
              <>
                <button
                  type="button"
                  onClick={() => setMode('forgotPassword')}
                  className="block w-full text-brand-red hover:underline text-sm"
                >
                  Forgot your password?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signUp')}
                  className="text-brand-red hover:underline"
                >
                  Don't have an account? Sign Up
                </button>
              </>
            )}
            
            {mode === 'signUp' && (
              <button
                type="button"
                onClick={() => setMode('signIn')}
                className="text-brand-red hover:underline"
              >
                Already have an account? Sign In
              </button>
            )}
            
            {mode === 'forgotPassword' && (
              <button
                type="button"
                onClick={() => setMode('signIn')}
                className="text-brand-red hover:underline"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.main>
  );
};

export default Auth;