import React, { useState } from 'react';
import { User, Position } from '../../types';
import { ChartBarIcon, BookmarkIcon, ArrowDownTrayIcon } from '../icons';
import { Overview } from './Overview';
import { PositionCard } from '../PositionCard';

type AccountPage = 'overview' | 'ledger';

interface MyAccountPageProps {
    user: User;
    ledgerPositions: Position[];
    onDeleteLedgerPosition: (positionId: string) => void;
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
            "Position ID", "Time", "Pair", "Action", "Order Type", "Price", "Margin", "Borrowed", "Leverage",
            "Amount", "Total", "Fee", // Per-trade
            "Final Position Size", "Final Position Value", "Total Borrowed", "Remaining Borrowed", "Total PnL", // Summary
            "Average Open", "Net ROI", "Market", "Opinion"
        ];
        
        let csvRows: string[] = [headers.join(',')];

        props.ledgerPositions.forEach(pos => {
            const [baseCurrency, quoteCurrency] = pos.pair.split('/');
            const tradesSorted = [...pos.trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            if (tradesSorted.length === 0) return;

            const originalDirection = tradesSorted[0].action === 'Buy' ? 'long' : 'short';

            let totalBuyAmount = 0, totalBuyCost = 0, totalSellAmount = 0, totalSellValue = 0, totalFees = 0;
            let totalBorrowed = 0, remainingBorrowed = 0, initialInvestment = 0;
            const tradeBorrowingMap: { [key: string]: string } = {};

            tradesSorted.forEach(trade => {
                totalFees += trade.fee;
                const leverage = trade.leverage && trade.leverage > 1 ? trade.leverage : 1;

                if ((originalDirection === 'long' && trade.action === 'Buy') || (originalDirection === 'short' && trade.action === 'Sell')) {
                    initialInvestment += trade.total / leverage;
                }

                if (trade.action === 'Buy') {
                    totalBuyAmount += trade.amount;
                    totalBuyCost += trade.total;
                } else { // Sell
                    totalSellAmount += trade.amount;
                    totalSellValue += trade.total;
                }
                
                let borrowedAmountForTrade = 'N/A';
                if (leverage > 1) {
                    if (originalDirection === 'long') {
                        if (trade.action === 'Buy') {
                            const borrowedThisTrade = trade.total * (1 - 1/leverage);
                            remainingBorrowed += borrowedThisTrade;
                            totalBorrowed += borrowedThisTrade;
                            borrowedAmountForTrade = `${borrowedThisTrade.toFixed(2)} ${quoteCurrency}`;
                        } else { // Sell
                            const repaymentAmount = Math.min(trade.total, remainingBorrowed);
                            if (repaymentAmount > 0) {
                                remainingBorrowed -= repaymentAmount;
                                borrowedAmountForTrade = `-${repaymentAmount.toFixed(2)} ${quoteCurrency}`;
                            }
                        }
                    } else { // short
                        if (trade.action === 'Sell') {
                            const borrowedThisTrade = trade.amount * (1 - 1/leverage);
                            remainingBorrowed += borrowedThisTrade;
                            totalBorrowed += borrowedThisTrade;
                            borrowedAmountForTrade = `${parseFloat(borrowedThisTrade.toFixed(8))} ${baseCurrency}`;
                        } else { // Buy
                            const repaymentAmount = Math.min(trade.amount, remainingBorrowed);
                            if (repaymentAmount > 0) {
                                remainingBorrowed -= repaymentAmount;
                                borrowedAmountForTrade = `-${parseFloat(repaymentAmount.toFixed(8))} ${baseCurrency}`;
                            }
                        }
                    }
                }
                tradeBorrowingMap[trade.id] = borrowedAmountForTrade;
            });
            
            const avgBuyPrice = totalBuyAmount > 0 ? totalBuyCost / totalBuyAmount : 0;
            const avgSellPrice = totalSellAmount > 0 ? totalSellValue / totalSellAmount : 0;
            const avgOpenPrice = originalDirection === 'long' ? avgBuyPrice : avgSellPrice;

            let pnl = 0;
            if (originalDirection === 'long') {
                pnl = totalSellValue - (totalSellAmount * avgBuyPrice);
            } else {
                pnl = (totalBuyAmount * avgSellPrice) - totalBuyCost;
            }
            const totalPnl = pnl - totalFees;
            const netRoi = initialInvestment > 0 ? `${((totalPnl / initialInvestment) * 100).toFixed(2)}%` : '0.00%';
            
            const borrowedCurrency = originalDirection === 'long' ? quoteCurrency : baseCurrency;
            const borrowedPrecision = borrowedCurrency === baseCurrency ? 8 : 2;
            const totalBorrowedDisplay = totalBorrowed > 0 ? `${totalBorrowed.toFixed(borrowedPrecision)} ${borrowedCurrency}` : 'N/A';
            const remainingBorrowedDisplay = totalBorrowed > 0 ? `${remainingBorrowed.toFixed(borrowedPrecision)} ${borrowedCurrency}` : 'N/A';

            const finalPositionSize = originalDirection === 'long' ? totalBuyAmount : totalSellAmount;
            const finalPositionValue = originalDirection === 'long' ? totalSellValue : totalBuyCost;

            const marketDisplay = `${pos.market}${pos.isFutures ? ' (Futures)' : ''}`;

            const summaryData = [
                escapeCsvCell(`${finalPositionSize.toFixed(8)} ${baseCurrency}`),
                escapeCsvCell(`${finalPositionValue.toFixed(2)} ${quoteCurrency}`),
                escapeCsvCell(totalBorrowedDisplay),
                escapeCsvCell(remainingBorrowedDisplay),
                escapeCsvCell(`${totalPnl.toFixed(2)} ${quoteCurrency}`),
                escapeCsvCell(`${avgOpenPrice.toFixed(4)} ${quoteCurrency}`),
                escapeCsvCell(netRoi),
                escapeCsvCell(marketDisplay),
                escapeCsvCell(pos.notes),
            ];

            tradesSorted.forEach((trade, index) => {
                const isLastTrade = index === tradesSorted.length - 1;
                
                const isReducingTrade = (originalDirection === 'long' && trade.action === 'Sell') || (originalDirection === 'short' && trade.action === 'Buy');

                const leverage = trade.leverage && trade.leverage > 1 ? trade.leverage : 1;
                const margin = trade.total / leverage;
                const borrowedAmountForTrade = tradeBorrowingMap[trade.id] || 'N/A';

                const marginDisplay = isReducingTrade ? '-' : `${margin.toFixed(2)} ${quoteCurrency}`;
                const leverageDisplay = isReducingTrade ? '-' : (trade.leverage ? String(trade.leverage) : '1');

                const tradeData = [
                    escapeCsvCell(pos.id),
                    escapeCsvCell(new Date(trade.timestamp).toISOString()),
                    escapeCsvCell(pos.pair),
                    escapeCsvCell(trade.action),
                    escapeCsvCell(trade.orderType),
                    escapeCsvCell(`${trade.price.toFixed(4)} ${quoteCurrency}`),
                    escapeCsvCell(marginDisplay),
                    escapeCsvCell(borrowedAmountForTrade),
                    escapeCsvCell(leverageDisplay),
                    escapeCsvCell(`${parseFloat(trade.amount.toFixed(8))} ${baseCurrency}`),
                    escapeCsvCell(`${trade.total.toFixed(2)} ${quoteCurrency}`),
                    escapeCsvCell(`${trade.fee.toFixed(4)} ${quoteCurrency}`)
                ];

                const finalRow = isLastTrade
                    ? [...tradeData, ...summaryData]
                    : [...tradeData, '', '', '', '', '', '', '', '', ''];
                
                csvRows.push(finalRow.join(','));
            });

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
                                    onAddTrade={() => {}}
                                    onEditTrade={() => {}}
                                    onDeleteTrade={() => {}}
                                />
                            ))}
                            </div>
                        )}
                    </div>
                );
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
                    </div>
                </aside>
                <main className="flex-grow">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};