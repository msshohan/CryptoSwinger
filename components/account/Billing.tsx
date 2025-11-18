
import React from 'react';
import { CreditCardIcon, CheckCircleIcon, ArrowDownTrayIcon } from '../icons';

const PlanCard: React.FC = () => (
    <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h3 className="text-xl font-bold">Current Plan</h3>
                <p className="text-brand-text-primary mt-1 text-lg">Pro Plan <span className="text-sm text-brand-text-secondary font-normal">($29 / month)</span></p>
                <p className="text-sm text-brand-text-secondary mt-1">Your plan renews on August 15, 2024.</p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                 <button className="py-2 px-4 bg-brand-secondary text-white text-sm font-semibold rounded-md hover:bg-indigo-500 transition-colors w-1/2 sm:w-auto">
                    Change Plan
                </button>
                 <button className="py-2 px-4 bg-brand-surface hover:bg-white/5 border border-brand-border text-brand-text-secondary text-sm font-semibold rounded-md transition-colors w-1/2 sm:w-auto">
                    Cancel
                </button>
            </div>
        </div>
    </div>
);

const PaymentMethodCard: React.FC = () => (
     <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Payment Methods</h3>
             <button className="py-2 px-4 bg-brand-primary text-white text-sm font-semibold rounded-md hover:bg-blue-500 transition-colors">
                    Add Method
            </button>
        </div>
        <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border border-brand-border rounded-md bg-brand-bg">
                <CreditCardIcon className="w-8 h-8 text-brand-text-secondary flex-shrink-0" />
                <div className="flex-grow">
                    <p className="font-semibold">Visa ending in 1234</p>
                    <p className="text-sm text-brand-text-secondary">Expires 12/2028</p>
                </div>
                 <span className="text-xs font-semibold bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-full">Primary</span>
                <button className="ml-auto text-sm font-semibold text-brand-primary hover:underline">
                    Edit
                </button>
            </div>
        </div>
    </div>
);

const InvoiceHistoryTable: React.FC = () => {
    const invoices = [
        { id: 'INV-2024-003', date: 'July 15, 2024', amount: '$29.00', status: 'Paid' },
        { id: 'INV-2024-002', date: 'June 15, 2024', amount: '$29.00', status: 'Paid' },
        { id: 'INV-2024-001', date: 'May 15, 2024', amount: '$29.00', status: 'Paid' },
    ];

    return (
        <div className="bg-brand-surface rounded-lg border border-brand-border">
            <div className="p-6">
                 <h3 className="text-xl font-bold">Billing History</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-black/20 text-xs text-brand-text-secondary uppercase">
                        <tr>
                            <th scope="col" className="px-6 py-3">Invoice</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3">Amount</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3 text-right">Download</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((invoice, index) => (
                            <tr key={index} className="border-t border-brand-border">
                                <td className="px-6 py-4 font-semibold text-brand-text-primary">{invoice.id}</td>
                                <td className="px-6 py-4 text-brand-text-secondary">{invoice.date}</td>
                                <td className="px-6 py-4">{invoice.amount}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircleIcon className="w-4 h-4 text-brand-success" />
                                        <span className="text-brand-success">{invoice.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-brand-text-secondary hover:text-brand-primary" aria-label={`Download invoice ${invoice.id}`}>
                                        <ArrowDownTrayIcon />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const Billing: React.FC = () => {
  return (
    <div className="space-y-8">
        <div>
            <h2 className="text-3xl font-bold">Billing & Subscriptions</h2>
            <p className="text-brand-text-secondary mt-1">Manage your plan, payment methods, and view invoices.</p>
        </div>
        <PlanCard />
        <PaymentMethodCard />
        <InvoiceHistoryTable />
    </div>
  );
};
