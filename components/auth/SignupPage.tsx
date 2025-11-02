import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { GoogleIcon, FacebookIcon, XIcon } from '../icons';

type Page = 'main' | 'login' | 'signup' | 'forgot-password' | 'account';

interface SignupPageProps {
  onSignup: () => void;
  navigate: (page: Page) => void;
}

const SocialButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button
      onClick={onClick}
      type="button"
      className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-brand-surface hover:bg-white/5 border border-brand-border rounded-md transition-colors text-sm font-medium"
    >
      {icon}
      {label}
    </button>
  );

export const SignupPage: React.FC<SignupPageProps> = ({ onSignup, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock signup logic
    console.log('Signing up with:', name, email, password);
    onSignup();
  };

  return (
    <AuthLayout title="Create an Account">
        <div className="space-y-3">
            <SocialButton icon={<GoogleIcon />} label="Continue with Google" onClick={onSignup} />
            <SocialButton icon={<FacebookIcon />} label="Continue with Facebook" onClick={onSignup} />
            <SocialButton icon={<XIcon />} label="Continue with X" onClick={onSignup} />
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
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors"
          >
            Create Account
          </button>
        </div>
      </form>
       <div className="mt-6 text-center">
            <p className="text-sm text-brand-text-secondary">
              Already have an account?{' '}
              <button onClick={() => navigate('login')} className="font-semibold text-brand-primary hover:underline">
                Login
              </button>
            </p>
        </div>
    </AuthLayout>
  );
};