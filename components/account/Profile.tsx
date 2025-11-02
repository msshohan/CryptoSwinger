
import React, { useState } from 'react';
import { User } from '../../types';

interface ProfileProps {
  user: User;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input {...props} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition disabled:opacity-50" />
    </div>
);

export const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock profile update logic
        alert(`Profile updated for ${name}`);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords don't match.");
            return;
        }
        // Mock password change logic
        alert("Password changed successfully.");
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Profile</h2>
        <p className="text-brand-text-secondary mt-1">Manage your personal information.</p>
      </div>

      <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
            <InputField label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required />
            <InputField label="Email Address" type="email" value={email} disabled />
            <div>
                <button type="submit" className="py-2 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
      </div>

       <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <h3 className="text-xl font-bold mb-1">Change Password</h3>
        <p className="text-brand-text-secondary mb-4 text-sm">Update your password for enhanced security.</p>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <InputField label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
            <InputField label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
            <InputField label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
             <div>
                <button type="submit" className="py-2 px-4 bg-brand-secondary text-white font-semibold rounded-md hover:bg-indigo-500 transition-colors">
                    Update Password
                </button>
            </div>
        </form>
      </div>

    </div>
  );
};
