
import React, { useMemo } from 'react';
import { Position } from '../../types';

interface PnlChartProps {
    positions: Position[];
}

interface DataPoint {
    date: Date;
    pnl: number;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
};

export const PnlChart: React.FC<PnlChartProps> = ({ positions }) => {
    const dataPoints = useMemo<DataPoint[]>(() => {
        const closedTradesPnl: { timestamp: Date, pnl: number }[] = [];

        positions.forEach(position => {
            const buys = position.trades.filter(t => t.action === 'Buy').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const sells = position.trades.filter(t => t.action === 'Sell').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            if (buys.length > 0 && sells.length > 0) {
                 const totalBuyAmount = buys.reduce((sum, t) => sum + t.amount, 0);
                 const totalBuyCost = buys.reduce((sum, t) => sum + t.total, 0);
                 const avgBuyPrice = totalBuyCost / totalBuyAmount;

                 sells.forEach(sell => {
                    const costOfSold = sell.amount * avgBuyPrice;
                    const pnl = (sell.total - costOfSold) - sell.fee;
                    closedTradesPnl.push({ timestamp: sell.timestamp, pnl });
                 });
                 // Also account for fees on buy trades
                 buys.forEach(buy => {
                    closedTradesPnl.push({ timestamp: buy.timestamp, pnl: -buy.fee });
                 })
            }
        });
        
        if (closedTradesPnl.length === 0) return [];
        
        closedTradesPnl.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        let cumulativePnl = 0;
        return closedTradesPnl.map(trade => {
            cumulativePnl += trade.pnl;
            return { date: trade.timestamp, pnl: cumulativePnl };
        });

    }, [positions]);

    if (dataPoints.length < 2) {
        return (
            <div className="w-full h-full flex items-center justify-center text-brand-text-secondary">
                <p>Not enough data for chart. Log some closed trades to see your performance.</p>
            </div>
        );
    }
    
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    const minPnl = Math.min(...dataPoints.map(d => d.pnl), 0);
    const maxPnl = Math.max(...dataPoints.map(d => d.pnl), 0);
    const minTime = dataPoints[0].date.getTime();
    const maxTime = dataPoints[dataPoints.length - 1].date.getTime();

    const xScale = (time: number) => margin.left + (time - minTime) / (maxTime - minTime) * (width - margin.left - margin.right);
    const yScale = (pnl: number) => margin.top + (maxPnl - pnl) / (maxPnl - minPnl) * (height - margin.top - margin.bottom);

    const path = dataPoints.map(d => `${xScale(d.date.getTime())},${yScale(d.pnl)}`).join(' L ');
    
    const zeroLineY = yScale(0);
    const isZeroLineVisible = zeroLineY > margin.top && zeroLineY < height - margin.bottom;

    const yAxisTicks = [minPnl, minPnl + (maxPnl - minPnl) / 2, maxPnl];
    
    const overallPnl = dataPoints[dataPoints.length - 1].pnl;
    const gradientColor = overallPnl >= 0 ? '#22c55e' : '#ef4444';


    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Y-Axis grid lines */}
            {yAxisTicks.map((tick, i) => (
                <g key={i}>
                    <line
                        x1={margin.left}
                        y1={yScale(tick)}
                        x2={width - margin.right}
                        y2={yScale(tick)}
                        stroke="#374151"
                        strokeWidth="0.5"
                        strokeDasharray="2,2"
                    />
                     <text
                        x={margin.left - 8}
                        y={yScale(tick)}
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fill="#9ca3af"
                        fontSize="10"
                    >
                        {formatCurrency(tick)}
                    </text>
                </g>
            ))}

            {isZeroLineVisible && (
                 <line x1={margin.left} y1={zeroLineY} x2={width-margin.right} y2={zeroLineY} stroke="#9ca3af" strokeWidth="1" />
            )}
            
            {/* X-Axis labels */}
             <text x={margin.left} y={height - margin.bottom + 15} textAnchor="start" fill="#9ca3af" fontSize="10">
                {new Date(minTime).toLocaleDateString()}
            </text>
            <text x={width-margin.right} y={height - margin.bottom + 15} textAnchor="end" fill="#9ca3af" fontSize="10">
                 {new Date(maxTime).toLocaleDateString()}
            </text>

             {/* Gradient for area under the line */}
            <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={gradientColor} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={gradientColor} stopOpacity={0.0}/>
                </linearGradient>
            </defs>

            {/* Area path */}
             <path
                d={`M ${margin.left},${height - margin.bottom} L ${path} L ${xScale(maxTime)},${height - margin.bottom} Z`}
                fill="url(#pnlGradient)"
            />

            {/* Line path */}
            <path
                d={`M ${path}`}
                fill="none"
                stroke={gradientColor}
                strokeWidth="2"
            />
        </svg>
    );
};
