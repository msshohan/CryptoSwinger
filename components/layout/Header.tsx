
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { UserCircleIcon, UserIcon as ProfileIcon } from '../icons';

type Page = 'main' | 'account';

interface HeaderProps {
  user: User;
  navigate: (page: Page) => void;
}

export const Header: React.FC<HeaderProps> = ({ user, navigate }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-brand-surface border-b border-brand-border p-4 sticky top-0 z-20">
      <div className="container mx-auto flex justify-between items-center">
        <div className="w-1/3">
           {/* Left aligned content can go here if needed */}
        </div>
        <div className="w-1/3 text-center">
            <button onClick={() => navigate('main')} className="text-xl font-bold text-brand-text-primary tracking-tight">
                Crypto Day Trading Calculator
            </button>
        </div>
        <div className="w-1/3 flex justify-end items-center gap-4" ref={menuRef}>
            <div className="relative">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2" aria-label="Open user menu">
                    <span className="hidden sm:inline text-sm font-medium text-brand-text-secondary">{user.firstName} {user.lastName}</span>
                    {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="User avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                    <UserCircleIcon className="w-8 h-8 text-brand-text-secondary" />
                    )}
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-brand-surface rounded-md shadow-lg border border-brand-border z-10">
                        <div className="p-2">
                            <div className="px-2 py-2 mb-2 border-b border-brand-border">
                                <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                                <p className="text-xs text-brand-text-secondary truncate">{user.email}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigate('account');
                                    setIsMenuOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-3 px-2 py-2 text-sm text-brand-text-secondary hover:bg-white/5 hover:text-brand-text-primary rounded-md transition-colors"
                            >
                                <ProfileIcon className="w-4 h-4" />
                                My Account
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </header>
  );
};
