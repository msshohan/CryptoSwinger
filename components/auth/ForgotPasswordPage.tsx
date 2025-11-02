import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';

type Page = 'main' | 'login' | 'signup' | 'forgot-password' | 'account';

interface ForgotPasswordPageProps {
  navigate: (page: Page) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ navigate }) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission logic
    console.log('Password reset requested for:', email);
    setSubmitted(true);
  };

  return (
    <AuthLayout title="Forgot Password">
      {submitted ? (
        <div className="text-center">
          <p className="text-brand-text-secondary mb-4">
            If an account with that email exists, we've sent a password reset link.
          </p>
          <button
            onClick={() => navigate('login')}
            className="w-full py-2 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
          >
            Back to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
            >
              Send Reset Link
            </button>
          </div>
        </form>
      )}
       <div className="mt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              Remember your password?{' '}
              <button onClick={() => navigate('login')} className="font-semibold text-brand-primary hover:underline">
                Login here
              </button>
            </p>
        </div>
    </AuthLayout>
  );
};