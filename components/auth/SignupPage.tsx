import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { GoogleIcon, FacebookIcon, XIcon } from '../icons';

type Page = 'main' | 'login' | 'signup' | 'forgot-password' | 'account';

interface SignupPageProps {
  onSignup: (name?: string, email?: string, password?: string) => Promise<void>;
  navigate: (page: Page) => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; }> = ({ icon, label, onClick, disabled }) => (
    <button
      onClick={onClick}
      type="button"
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-brand-surface hover:bg-white/5 border border-brand-border rounded-md transition-colors text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed"
    >
      {icon}
      {label}
    </button>
  );

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await onSignup(name, email, password);
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSocialSignup = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSignup();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an Account">
        <div className="space-y-3">
            <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={handleSocialSignup} disabled={isLoading} />
            <SocialButton icon={<FacebookIcon />} label="Continue with Facebook" onClick={handleSocialSignup} disabled={isLoading} />
            <SocialButton icon={<XIcon />} label="Continue with X" onClick={handleSocialSignup} disabled={isLoading} />
        </div>

        <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-brand-border"></div>
            <span className="flex-shrink mx-4 text-xs text-brand-text-secondary">OR</span>
            <div className="flex-grow border-t border-brand-border"></div>
        </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
            placeholder="Alex Crypto"
            disabled={isLoading}
          />
        </div>
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
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition"
            placeholder="••••••••"
            disabled={isLoading}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
        {error && <p className="mt-4 text-sm text-center text-brand-danger">{error}</p>}
      </form>
       <div className="mt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              Already have an account?{' '}
              <button onClick={() => navigate('login')} className="font-semibold text-brand-primary hover:underline" disabled={isLoading}>
                Login
              </button>
            </p>
        </div>
    </AuthLayout>
  );
};
