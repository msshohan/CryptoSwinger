
import React from 'react';

export const AuthLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-brand-text-primary tracking-tight">
            Crypto Day Trading Calculator
          </h1>
        </header>
        <main className="bg-brand-surface p-8 rounded-lg shadow-lg border border-brand-border">
          <h2 className="text-2xl font-bold text-center text-brand-text-primary mb-6">{title}</h2>
          {children}
        </main>
      </div>
    </div>
  );
};
