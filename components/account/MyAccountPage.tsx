import React, { useState } from 'react';
import { User, Position } from '../../types';
import { ChartBarIcon, BookmarkIcon, UserIcon, CreditCardIcon, LogoutIcon, ArrowDownTrayIcon } from '../icons';
import { Overview } from './Overview';
import { PositionCard } from '../PositionCard';
import { Profile } from './Profile';
import { Billing } from './Billing';

type AccountPage = 'overview' | 'ledger' | 'profile' | 'billing';

interface MyAccountPageProps {
    user: User;
    ledgerPositions: Position[];
    onDeleteLedgerPosition: (positionId: string) => void;
    onLogout: () => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive
                ? 'bg-brand-primary/20 text-brand-primary'
                : 'text-brand-text-secondary hover:bg-white/5 hover:text-brand-text-primary'
        }`}
    >
        {icon}
        {label}
    </button>
);

export const MyAccountPage: React.FC<MyAccountPageProps> = (props) => {
    const [activePage, setActivePage] = useState<AccountPage>('overview');
    
    const escapeCsvCell = (cell: any): string => {
        const strCell = String(cell ?? '');
        if (strCell.includes(',') || strCell.includes('"') || strCell.includes('\n')) {
            return `"${strCell.replace(/"/g, '""')}"`;
        }
        return strCell;
    };

    const handleExport = () => {
        const headers = [
            "Position ID", "Time", "Action", "Price", "Margin", "Leverage (x)",
            "Position (Base)", "Position (Quote)", "Trading Fee (USD)",
            "Position Total (Base)", "Position Total (Quote)", "Total PnL",
            "Average Open", "Net ROI"
        ];
        
        let csvRows: string[] = [headers.join(',')];

        props.ledgerPositions.forEach(pos => {
            let totalBuyAmount = 0;
            let totalBuyCost = 0;
            let totalSellValue = 0;
            let totalFees = 0;

            pos.trades.forEach(trade => {
                totalFees += trade.fee;
                if (trade.action === 'Buy') {
                    totalBuyAmount += trade.amount;
                    totalBuyCost += trade.total;
                } else {
                    totalSellValue += trade.total;
                }
            });

            const avgOpenPrice = totalBuyAmount > 0 ? totalBuyCost / totalBuyAmount : 0;
            const totalPnl = totalSellValue - totalBuyCost - totalFees;
            const netRoi = totalBuyCost > 0 ? `${((totalPnl / totalBuyCost) * 100).toFixed(2)}%` : '0.00%';
            
            const summaryData = [
                escapeCsvCell(totalBuyAmount),
                escapeCsvCell(totalBuyCost),
                escapeCsvCell(totalPnl),
                escapeCsvCell(avgOpenPrice),
                escapeCsvCell(netRoi)
            ];

            pos.trades.forEach((trade, index) => {
                const isLastTrade = index === pos.trades.length - 1;
                
                const margin = (trade.action === 'Buy' && trade.leverage && trade.leverage > 1)
                    ? (trade.total / trade.leverage)
                    : (trade.action === 'Buy' ? trade.total : 0);

                const tradeData = [
                    escapeCsvCell(pos.id),
                    escapeCsvCell(new Date(trade.timestamp).toISOString()),
                    escapeCsvCell(trade.action),
                    escapeCsvCell(trade.price),
                    escapeCsvCell(margin),
                    escapeCsvCell(trade.leverage ? `${trade.leverage}x` : 'N/A'),
                    escapeCsvCell(trade.amount),
                    escapeCsvCell(trade.total),
                    escapeCsvCell(trade.fee)
                ];

                const finalRow = isLastTrade
                    ? [...tradeData, ...summaryData]
                    : [...tradeData, '', '', '', '', ''];
                
                csvRows.push(finalRow.join(','));
            });

            // Add an empty row for separation between positions
            csvRows.push('');
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\r\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "trade_ledger_detailed.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        switch (activePage) {
            case 'overview':
                // Pass ledger positions to overview for historical stats
                return <Overview positions={props.ledgerPositions} />;
            case 'ledger':
                return (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-3xl font-bold">Trade Ledger</h2>
                            <button 
                                onClick={handleExport}
                                className="flex items-center gap-2 py-2 px-4 bg-brand-surface hover:bg-white/5 border border-brand-border text-brand-text-primary text-sm font-semibold rounded-md transition-colors"
                            >
                                <ArrowDownTrayIcon className="w-5 h-5" />
                                Export to Excel
                            </button>
                        </div>
                        {props.ledgerPositions.length === 0 ? (
                            <div className="text-center text-brand-text-secondary py-16 bg-brand-surface rounded-lg border border-brand-border">
                                <p>Your trade ledger is empty.</p>
                                <p>Close a position in the main Trade Log and save it to the ledger to archive it here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                            {props.ledgerPositions.map(pos => (
                                <PositionCard
                                    key={pos.id}
                                    position={pos}
                                    onDeletePosition={props.onDeleteLedgerPosition}
                                    isLedgerView={true}
                                    // Dummy props to satisfy type, won't be used in ledger view
                                    onAddTrade={() => {}}
                                    onEditTrade={() => {}}
                                    onDeleteTrade={() => {}}
                                />
                            ))}
                            </div>
                        )}
                    </div>
                );
            case 'profile':
                return <Profile user={props.user} />;
            case 'billing':
                return <Billing />;
            default:
                return null;
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-64 flex-shrink-0">
                    <div className="bg-brand-surface p-4 rounded-lg border border-brand-border space-y-2">
                        <NavItem icon={<ChartBarIcon />} label="Overview" isActive={activePage === 'overview'} onClick={() => setActivePage('overview')} />
                        <NavItem icon={<BookmarkIcon />} label="Trade Ledger" isActive={activePage === 'ledger'} onClick={() => setActivePage('ledger')} />
                        <NavItem icon={<UserIcon />} label="Profile" isActive={activePage === 'profile'} onClick={() => setActivePage('profile')} />
                        <NavItem icon={<CreditCardIcon />} label="Billing" isActive={activePage === 'billing'} onClick={() => setActivePage('billing')} />
                        <div className="pt-2 mt-2 border-t border-brand-border/50">
                             <NavItem icon={<LogoutIcon />} label="Logout" isActive={false} onClick={props.onLogout} />
                        </div>
                    </div>
                </aside>
                <main className="flex-grow">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};