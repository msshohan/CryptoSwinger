import React, { useMemo, useState } from 'react';
import { Position, Trade } from '../types';
import { ArrowDownIcon, ArrowUpIcon, PlusCircleIcon, InformationCircleIcon, EditIcon, TrashIcon, BookmarkIcon, CheckCircleIcon } from './icons';

interface PositionCardProps {
  position: Position;
  onAddTrade: (positionId: string) => void;
  onEditTrade: (positionId: string, tradeId: string) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onDeletePosition: (positionId: string) => void;
  onSaveToLedger?: (positionId: string, notes: string) => void;
  isLedgerView?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
};

const formatNumber = (value: number, precision: number = 8) => {
    const fixedValue = value.toFixed(precision);
    // Avoids returning "-0.00" for very small negative numbers
    if (parseFloat(fixedValue) === 0) return (0).toFixed(precision).replace(/\.?0+$/, "");
    return fixedValue.replace(/\.?0+$/, "");
};

const SaveToLedgerModal: React.FC<{
    onSave: (notes: string) => void;
    onCancel: () => void;
}> = ({ onSave, onCancel }) => {
    const [notes, setNotes] = useState('');

    const handleSave = () => {
        onSave(notes);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-30 flex items-center justify-center p-4">
            <div className="bg-brand-surface border border-brand-border rounded-lg shadow-xl w-full max-w-md">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">Save to Ledger</h3>
                    <p className="text-sm text-brand-text-secondary mb-4">Add your thoughts and analysis for this trade. This will be saved permanently in your ledger for future review.</p>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g., 'Entered on bullish news, but got stopped out due to market volatility. Should have waited for confirmation...'"
                        className="w-full h-32 bg-brand-bg border border-brand-border rounded-md p-2 text-sm focus:ring-2 focus:ring-brand-primary focus:outline-none"
                    />
                </div>
                <div className="bg-black/20 px-6 py-3 flex justify-end items-center gap-3 rounded-b-lg">
                    <button onClick={onCancel} className="py-2 px-4 text-sm font-semibold rounded-md hover:bg-white/10 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="py-2 px-4 bg-brand-primary text-white text-sm font-semibold rounded-md hover:bg-blue-500 transition-colors">
                        Save to Ledger
                    </button>
                </div>
            </div>
        </div>
    );
};


export const PositionCard: React.FC<PositionCardProps> = ({ position, onAddTrade, onEditTrade, onDeleteTrade, onDeletePosition, onSaveToLedger, isLedgerView = false }) => {
  const [tradeToDeleteConfirm, setTradeToDeleteConfirm] = useState<string | null>(null);
  const [confirmPositionDelete, setConfirmPositionDelete] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);

  const stats = useMemo(() => {
    const tradesSorted = [...position.trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (tradesSorted.length === 0) {
      return {
        positionSize: 0, remainingAmount: 0, isClosed: false, avgOpenPrice: 0, realizedPnl: 0,
        quoteCurrency: 'USD', baseCurrency: '', avgLeverage: 1, liquidationPrice: 0,
        netRoi: 0, totalBorrowed: 0, borrowedCurrency: 'USD', remainingBorrowed: 0, tradeBorrowingInfo: {},
        originalDirection: 'flat' as 'long' | 'short' | 'flat'
      };
    }

    const originalDirection = tradesSorted[0].action === 'Buy' ? 'long' : 'short';
    const quoteCurrency = position.pair.split('/')[1] || 'USD';
    const baseCurrency = position.pair.split('/')[0] || '';
    
    let totalBuyAmount = 0, totalBuyCost = 0, totalSellAmount = 0, totalSellValue = 0, totalFees = 0;
    let totalWeightedBuyLeverage = 0, totalBuyValueForLeverage = 0, totalWeightedSellLeverage = 0, totalSellValueForLeverage = 0;
    let totalInvestment = 0;
    
    // Chronological borrowing calculation
    let totalBorrowed = 0;
    let remainingBorrowed = 0;
    const tradeBorrowingInfo: { [key: string]: { amount: number; currency: string } } = {};

    tradesSorted.forEach(trade => {
      totalFees += trade.fee;
      const leverage = trade.leverage && trade.leverage > 1 ? trade.leverage : 1;

      if ((originalDirection === 'long' && trade.action === 'Buy') || (originalDirection === 'short' && trade.action === 'Sell')) {
        totalInvestment += trade.total / leverage;
      }
      
      if (trade.action === 'Buy') {
        totalBuyAmount += trade.amount;
        totalBuyCost += trade.total;
        if (leverage > 1) {
            totalWeightedBuyLeverage += trade.total * leverage;
            totalBuyValueForLeverage += trade.total;
        }
      } else { // Sell
        totalSellAmount += trade.amount;
        totalSellValue += trade.total;
        if (leverage > 1) {
            totalWeightedSellLeverage += trade.total * leverage;
            totalSellValueForLeverage += trade.total;
        }
      }

      if (leverage > 1) {
        if (originalDirection === 'long') {
          if (trade.action === 'Buy') {
            const borrowedThisTrade = trade.total * (1 - 1/leverage);
            remainingBorrowed += borrowedThisTrade;
            totalBorrowed += borrowedThisTrade;
            tradeBorrowingInfo[trade.id] = { amount: borrowedThisTrade, currency: quoteCurrency };
          } else { // Sell
            const repaymentAmount = Math.min(trade.total, remainingBorrowed);
            if (repaymentAmount > 0) {
              remainingBorrowed -= repaymentAmount;
              tradeBorrowingInfo[trade.id] = { amount: -repaymentAmount, currency: quoteCurrency };
            }
          }
        } else { // Short position
          if (trade.action === 'Sell') {
            const borrowedThisTrade = trade.amount * (1 - 1/leverage);
            remainingBorrowed += borrowedThisTrade;
            totalBorrowed += borrowedThisTrade;
            tradeBorrowingInfo[trade.id] = { amount: borrowedThisTrade, currency: baseCurrency };
          } else { // Buy to cover
            const repaymentAmount = Math.min(trade.amount, remainingBorrowed);
            if (repaymentAmount > 0) {
              remainingBorrowed -= repaymentAmount;
              tradeBorrowingInfo[trade.id] = { amount: -repaymentAmount, currency: baseCurrency };
            }
          }
        }
      }
    });

    const remainingAmount = totalBuyAmount - totalSellAmount;
    const isClosed = Math.abs(remainingAmount) <= 1e-9 && totalBuyAmount > 0 && totalSellAmount > 0;
    
    const avgBuyPrice = totalBuyAmount > 0 ? totalBuyCost / totalBuyAmount : 0;
    const avgSellPrice = totalSellAmount > 0 ? totalSellValue / totalSellAmount : 0;
    
    const avgBuyLeverage = totalBuyValueForLeverage > 0 ? totalWeightedBuyLeverage / totalBuyValueForLeverage : 1;
    const avgSellLeverage = totalSellValueForLeverage > 0 ? totalWeightedSellLeverage / totalSellValueForLeverage : 1;
    
    const effectiveLeverage = originalDirection === 'long' ? avgBuyLeverage : avgSellLeverage;
    const avgOpenPrice = originalDirection === 'long' ? avgBuyPrice : avgSellPrice;

    let realizedPnl = 0;
    if (originalDirection === 'long') {
        const costOfSold = avgBuyPrice * totalSellAmount;
        realizedPnl = totalSellValue - costOfSold;
    } else { // short
        const valueOfCovered = avgSellPrice * totalBuyAmount;
        realizedPnl = valueOfCovered - totalBuyCost;
    }
    
    const netPnlForDisplay = realizedPnl - totalFees;
    const netRoi = totalInvestment > 0 ? (netPnlForDisplay / totalInvestment) * 100 : 0;

    let liquidationPrice = 0;
    if (!isClosed && effectiveLeverage > 1) {
      const direction = remainingAmount > 0 ? 'long' : 'short';
      if (direction === 'long') {
          const initialLiq = avgOpenPrice * (1 - (1 / effectiveLeverage));
          const pnlAdjustment = remainingAmount !== 0 ? realizedPnl / remainingAmount : 0;
          liquidationPrice = initialLiq - pnlAdjustment;
      } else { // short
          const initialLiq = avgOpenPrice * (1 + (1 / effectiveLeverage));
          const pnlAdjustment = remainingAmount !== 0 ? realizedPnl / remainingAmount : 0;
          liquidationPrice = initialLiq - pnlAdjustment;
      }
    }
    
    const positionSize = originalDirection === 'long' ? totalBuyAmount : totalSellAmount;
    const borrowedCurrency = originalDirection === 'long' ? quoteCurrency : baseCurrency;

    return {
      positionSize,
      remainingAmount,
      isClosed,
      avgOpenPrice,
      realizedPnl: netPnlForDisplay,
      quoteCurrency,
      baseCurrency,
      avgLeverage: effectiveLeverage,
      liquidationPrice,
      netRoi,
      totalBorrowed,
      borrowedCurrency,
      remainingBorrowed,
      tradeBorrowingInfo,
      originalDirection
    };
  }, [position.trades, position.pair]);
  
  const handleConfirmSaveToLedger = (notes: string) => {
    if (onSaveToLedger) {
        onSaveToLedger(position.id, notes);
    }
    setShowNotesModal(false);
  };

  const TradeRow: React.FC<{trade: Trade}> = ({ trade }) => {
    let borrowingDisplay = '-';
    const borrowingInfo = stats.tradeBorrowingInfo[trade.id];
    if (borrowingInfo) {
        const { amount, currency } = borrowingInfo;
        const precision = currency === stats.baseCurrency ? 8 : 4;
        const formattedAmount = formatNumber(Math.abs(amount), precision);
        borrowingDisplay = `${amount < 0 ? '-' : ''}${formattedAmount} ${currency}`;
    }

    const leverage = trade.leverage && trade.leverage > 1 ? trade.leverage : 1;
    const margin = trade.total / leverage;

    const isReducingTrade = (stats.originalDirection === 'long' && trade.action === 'Sell') || (stats.originalDirection === 'short' && trade.action === 'Buy');

    return (
        <div className={`grid ${isLedgerView ? 'grid-cols-9' : 'grid-cols-10'} gap-2 p-2 border-b border-brand-border/50 text-sm items-center`}>
            <div>{new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className={`flex items-center gap-1 font-semibold ${trade.action === 'Buy' ? 'text-brand-success' : 'text-brand-danger'}`}>
                {trade.action === 'Buy' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                {trade.action}
            </div>
            <div>{formatCurrency(trade.price)}</div>
            <div>{isReducingTrade ? '-' : formatCurrency(margin)}</div>
            <div>{borrowingDisplay}</div>
            <div>{formatNumber(trade.amount)}</div>
            <div>{formatCurrency(trade.total)}</div>
            <div>{formatCurrency(trade.fee).substring(1)}</div>
            <div className="text-center">{isReducingTrade ? '-' : (trade.leverage ? `${trade.leverage}x` : '-')}</div>
            {!isLedgerView && (
                <div className="flex items-center justify-center gap-2 text-xs relative">
                    {tradeToDeleteConfirm === trade.id && (
                        <div className="absolute -top-12 right-0 w-max bg-brand-bg border border-brand-border rounded-md shadow-lg p-2 z-10">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-brand-text-secondary">Delete trade?</span>
                                <button
                                    onClick={() => {
                                    onDeleteTrade(position.id, trade.id);
                                    setTradeToDeleteConfirm(null);
                                    }}
                                    className="text-xs font-bold text-brand-danger hover:underline"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => setTradeToDeleteConfirm(null)}
                                    className="text-xs font-bold text-brand-text-primary hover:underline"
                                >
                                    No
                                </button>
                            </div>
                            <div className="absolute -bottom-2 right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-brand-border"></div>
                            <div className="absolute -bottom-[7px] right-4 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-brand-bg"></div>
                        </div>
                    )}
                    <button
                        onClick={() => onEditTrade(position.id, trade.id)}
                        className="text-brand-text-secondary hover:text-brand-primary"
                        title="Edit Trade"
                        aria-label="Edit Trade"
                        >
                        <EditIcon />
                    </button>
                    <button
                        onClick={() => setTradeToDeleteConfirm(trade.id)}
                        className="text-brand-text-secondary hover:text-brand-danger"
                        title="Delete Trade"
                        aria-label="Delete Trade"
                        >
                        <TrashIcon />
                    </button>
                </div>
            )}
        </div>
    );
  };


  return (
    <>
    {showNotesModal && <SaveToLedgerModal onSave={handleConfirmSaveToLedger} onCancel={() => setShowNotesModal(false)} />}
    <div className="bg-brand-surface rounded-lg shadow-lg border border-brand-border">
      <div className="p-4">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-xl font-bold">{position.pair}</h3>
                <p className="text-xs text-brand-text-secondary">{position.exchange} &middot; {position.market}</p>
            </div>
            <div className="flex items-center gap-2 relative">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${stats.isClosed ? 'bg-gray-500 text-white' : 'bg-brand-primary text-white'}`}>
                    {stats.isClosed ? 'Closed' : 'Open'}
                </span>
                <button
                  onClick={() => setConfirmPositionDelete(true)}
                  className="text-brand-text-secondary hover:text-brand-danger"
                  title="Delete Position"
                  aria-label="Delete Position"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
                {confirmPositionDelete && (
                  <div className="absolute -top-12 right-0 w-max bg-brand-bg border border-brand-border rounded-md shadow-lg p-2 z-10">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-brand-text-secondary">Delete Position?</span>
                      <button
                        onClick={() => onDeletePosition(position.id)}
                        className="text-xs font-bold text-brand-danger hover:underline"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmPositionDelete(false)}
                        className="text-xs font-bold text-brand-text-primary hover:underline"
                      >
                        No
                      </button>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-2 right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-brand-border"></div>
                    <div className="absolute -bottom-[7px] right-2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-brand-bg"></div>
                  </div>
                )}
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 text-sm">
          <div>
            <p className="text-brand-text-secondary">Avg. Open</p>
            <p className="font-semibold">{formatCurrency(stats.avgOpenPrice)}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Position Size</p>
            <p className="font-semibold">{formatNumber(stats.positionSize)} {stats.baseCurrency}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Remaining</p>
            <p className="font-semibold">{formatNumber(stats.remainingAmount)} {stats.baseCurrency}</p>
          </div>
          <div>
             <p className="text-brand-text-secondary flex items-center gap-1">
                Liq. Price (est.)
                <span title="Estimated liquidation price based on average open price and weighted average leverage. Does not include fees or maintenance margin.">
                  <InformationCircleIcon className="w-4 h-4 text-brand-text-secondary/80" />
                </span>
              </p>
            <p className="font-semibold">{stats.liquidationPrice > 0 ? formatCurrency(stats.liquidationPrice) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Total Borrowed</p>
            <p className="font-semibold">{stats.totalBorrowed > 0 ? `${formatNumber(stats.totalBorrowed, 4)} ${stats.borrowedCurrency}` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Rem. Borrowed</p>
            <p className="font-semibold">{stats.totalBorrowed > 0 ? `${formatNumber(stats.remainingBorrowed, 4)} ${stats.borrowedCurrency}` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Avg. Leverage</p>
            <p className="font-semibold">{stats.avgLeverage > 1 ? `${stats.avgLeverage.toFixed(1)}x` : 'N/A'}</p>
          </div>
          <div>
            <p className="text-brand-text-secondary">{stats.isClosed ? 'Total PnL' : 'Realized PnL'}</p>
            <p className={`font-semibold ${stats.realizedPnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
              {formatCurrency(stats.realizedPnl)}
            </p>
          </div>
          <div>
            <p className="text-brand-text-secondary">Net ROI</p>
            <p className={`font-semibold ${stats.netRoi >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
              {stats.netRoi.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {isLedgerView && position.notes && (
         <div className="p-4 border-t border-brand-border bg-black/10">
            <h4 className="font-semibold text-sm mb-2 text-brand-text-primary">Trade Opinion & Notes</h4>
            <p className="text-sm text-brand-text-secondary whitespace-pre-wrap leading-relaxed">{position.notes}</p>
         </div>
      )}
      
      <details className="bg-black/20" open={isLedgerView}>
        <summary className="cursor-pointer p-2 text-center text-xs text-brand-text-secondary hover:bg-black/30">
          Toggle Trade History
        </summary>
        <div className="p-2">
            <div className={`grid ${isLedgerView ? 'grid-cols-9' : 'grid-cols-10'} gap-2 p-2 font-bold text-xs text-brand-text-secondary border-b border-brand-border`}>
                <div>Time</div>
                <div>Action</div>
                <div>Price</div>
                <div>Margin</div>
                <div>Borrowed</div>
                <div>Amount</div>
                <div>Total</div>
                <div>Fee</div>
                <div className="text-center">Leverage</div>
                {!isLedgerView && <div className="text-center">Actions</div>}
            </div>
            {position.trades.map(trade => <TradeRow key={trade.id} trade={trade} />)}
        </div>
      </details>
      {!stats.isClosed && !isLedgerView && (
        <div className="p-2 bg-brand-surface border-t border-brand-border">
            <button onClick={() => onAddTrade(position.id)} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-brand-secondary/20 hover:bg-brand-secondary/40 text-brand-text-primary text-sm font-semibold rounded-md transition-colors">
                <PlusCircleIcon className="w-5 h-5" />
                Add Trade to Position
            </button>
        </div>
      )}
      {stats.isClosed && !isLedgerView && onSaveToLedger && !position.savedToLedger && (
         <div className="p-2 bg-brand-surface border-t border-brand-border">
            <button onClick={() => setShowNotesModal(true)} className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-brand-primary/80 hover:bg-brand-primary text-white text-sm font-semibold rounded-md transition-colors">
                <BookmarkIcon className="w-5 h-5" />
                Save to Trade Ledger
            </button>
        </div>
      )}
      {position.savedToLedger && !isLedgerView && (
        <div className="p-2 bg-brand-surface border-t border-brand-border">
            <div className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-brand-success/10 text-brand-success text-sm font-semibold rounded-md">
                <CheckCircleIcon className="w-5 h-5" />
                Saved to Ledger
            </div>
        </div>
      )}
    </div>
    </>
  );
};