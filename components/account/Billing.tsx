
import React from 'react';

export const Billing: React.FC = () => {
  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold">Billing</h2>
            <p className="text-brand-text-secondary mt-1">Manage your subscription and payment methods.</p>
        </div>

        <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">Current Plan</h3>
                    <p className="text-brand-text-primary mt-1 text-lg">Pro Plan <span className="text-sm text-brand-text-secondary font-normal">($29 / month)</span></p>
                    <p className="text-sm text-brand-text-secondary mt-1">Your plan renews on August 15, 2024.</p>
                </div>
                 <button className="py-2 px-4 bg-brand-secondary text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors">
                    Change Plan
                </button>
            </div>
        </div>

        <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
            <h3 className="text-xl font-bold mb-4">Payment Method</h3>
            <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gray-200 rounded-md flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"></path></svg>
                </div>
                <div>
                    <p className="font-semibold">Visa ending in 1234</p>
                    <p className="text-sm text-brand-text-secondary">Expires 12/2028</p>
                </div>
                <button className="ml-auto text-sm font-semibold text-brand-primary hover:underline">
                    Update
                </button>
            </div>
        </div>

         <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
            <h3 className="text-xl font-bold mb-4">Billing History</h3>
             <div className="text-center text-brand-text-secondary py-8">
                <p>No billing history found.</p>
             </div>
        </div>
    </div>
  );
};
