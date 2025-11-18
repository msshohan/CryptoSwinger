
import React, { useState } from 'react';
import { User } from '../../types';

interface ProfileProps {
  user: User;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.id} className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input {...props} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition disabled:opacity-50 read-only:bg-brand-surface/50" />
    </div>
);

export const Profile: React.FC<ProfileProps> = ({ user }) => {
    const [firstName, setFirstName] = useState(user.firstName);
    const [lastName, setLastName] = useState(user.lastName);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleProfileUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock profile update logic
        alert(`Profile updated for ${firstName} ${lastName}`);
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            alert("New passwords don't match.");
            return;
        }
        if (!newPassword || newPassword.length < 8) {
            alert("New password must be at least 8 characters long.");
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
        <h2 className="text-3xl font-bold">Profile Settings</h2>
        <p className="text-brand-text-secondary mt-1">Manage your personal information and password.</p>
      </div>

      <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <h3 className="text-xl font-bold mb-1">Personal Information</h3>
        <p className="text-brand-text-secondary mb-4 text-sm">Update your name. Your email address cannot be changed.</p>
        <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField id="firstName" label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required />
                <InputField id="lastName" label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
            <InputField id="email" label="Email Address" type="email" value={user.email} readOnly disabled />
            <div>
                <button type="submit" className="py-2 px-4 bg-brand-primary text-white font-semibold rounded-md hover:bg-blue-500 transition-colors">
                    Save Changes
                </button>
            </div>
        </form>
      </div>

       <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <h3 className="text-xl font-bold mb-1">Change Password</h3>
        <p className="text-brand-text-secondary mb-4 text-sm">For security, you must provide your current password to make changes.</p>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            <InputField id="currentPassword" label="Current Password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
            <InputField id="newPassword" label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required autoComplete="new-password" />
            <InputField id="confirmPassword" label="Confirm New Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
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
