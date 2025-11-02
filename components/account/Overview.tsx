
import React, { useMemo } from 'react';
import { Position } from '../../types';
import { PnlChart } from '../charts/PnlChart';

interface OverviewProps {
  positions: Position[];
}

const StatCard: React.FC<{ title: string; value: string; isPositive?: boolean; isNegative?: boolean }> = ({ title, value, isPositive, isNegative }) => (
    <div className="bg-brand-surface p-4 rounded-lg border border-brand-border">
        <p className="text-sm text-brand-text-secondary">{title}</p>
        <p className={`text-2xl font-bold ${isPositive ? 'text-brand-success' : ''} ${isNegative ? 'text-brand-danger' : ''}`}>
            {value}
        </p>
    </div>
);


export const Overview: React.FC<OverviewProps> = ({ positions }) => {

    const stats = useMemo(() => {
        let totalRealizedPnl = 0;
        let totalFees = 0;
        let closedPositions = 0;
        let winningPositions = 0;

        positions.forEach(position => {
            let totalBuyAmount = 0;
            let totalBuyCost = 0;
            let totalSellAmount = 0;
            let totalSellValue = 0;
            let positionFees = 0;

            position.trades.forEach(trade => {
                positionFees += trade.fee;
                if (trade.action === 'Buy') {
                    totalBuyAmount += trade.amount;
                    totalBuyCost += trade.total;
                } else {
                    totalSellAmount += trade.amount;
                    totalSellValue += trade.total;
                }
            });

            totalFees += positionFees;
            const remainingAmount = totalBuyAmount - totalSellAmount;
            const isClosed = Math.abs(remainingAmount) < 1e-9 && totalSellAmount > 0;
            
            if (isClosed) {
                closedPositions++;
                const avgBuyPrice = totalBuyCost / totalBuyAmount;
                const realizedPnl = (totalSellValue - (totalSellAmount * avgBuyPrice)) - positionFees;
                totalRealizedPnl += realizedPnl;
                if (realizedPnl > 0) {
                    winningPositions++;
                }
            }
        });

        const winRate = closedPositions > 0 ? (winningPositions / closedPositions) * 100 : 0;
        
        return {
            totalRealizedPnl,
            totalTrades: positions.flatMap(p => p.trades).length,
            openPositions: positions.length - closedPositions,
            winRate,
        };
    }, [positions]);

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold">Account Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard 
                    title="Total Realized PnL" 
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalRealizedPnl)}
                    isPositive={stats.totalRealizedPnl > 0}
                    isNegative={stats.totalRealizedPnl < 0}
                />
                <StatCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
                <StatCard title="Open Positions" value={stats.openPositions.toString()} />
                <StatCard title="Total Trades" value={stats.totalTrades.toString()} />
            </div>

            <div className="bg-brand-surface p-6 rounded-lg border border-brand-border">
                <h3 className="text-xl font-bold mb-4">Performance</h3>
                 <div style={{ height: '350px' }}>
                    <PnlChart positions={positions} />
                </div>
            </div>
        </div>
    );
};
