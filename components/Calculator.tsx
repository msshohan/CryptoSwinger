import React, { useState, useEffect, useMemo } from 'react';
import { ExchangeName, Market, OrderType, TradeAction, Position, FeeType, Trade } from '../types';
import { FEES, EXCHANGES, MARKETS, ORDER_TYPES } from '../constants';
import { XCircleIcon } from './icons';

interface CalculatorProps {
  onLogTrade: (tradeData: any) => void;
  positionToUpdate: Position | null;
  tradeToEdit: Trade | null;
  cancelUpdate: () => void;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <input {...props} className="w-full bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition disabled:opacity-50" />
    </div>
);

const SelectField: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string, children: React.ReactNode }> = ({ label, children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-brand-text-secondary mb-1">{label}</label>
        <select {...props} className="w-full bg-brand-surface border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition appearance-none disabled:opacity-50">
            {children}
        </select>
    </div>
);

export const Calculator: React.FC<CalculatorProps> = ({ onLogTrade, positionToUpdate, tradeToEdit, cancelUpdate }) => {
    const [exchange, setExchange] = useState<ExchangeName>('Binance');
    const [market, setMarket] = useState<Market>('Futures');
    const [orderType, setOrderType] = useState<OrderType>('Limit');
    const [action, setAction] = useState<TradeAction>('Buy');
    
    const [pair, setPair] = useState('');
    const [price, setPrice] = useState('');
    const [principal, setPrincipal] = useState('');
    const [amount, setAmount] = useState('');
    const [total, setTotal] = useState('');
    const [leverage, setLeverage] = useState(10);

    const [manualFeeRate, setManualFeeRate] = useState('0.1');
    const [closePercentage, setClosePercentage] = useState(100);
    const [forceClose, setForceClose] = useState(false);

    const isUpdateMode = !!positionToUpdate;
    const isEditMode = !!tradeToEdit;
    const isLeveragedMarket = useMemo(() => ['Futures', 'Cross Margin', 'Isolated Margin'].includes(market), [market]);
    
    // Effect 1: Handles form state when the editing mode changes (new vs. update/edit).
    useEffect(() => {
        if (positionToUpdate) {
            // We are in "Add to Position" or "Edit Trade" mode.
            setPair(positionToUpdate.pair);
            setExchange(positionToUpdate.exchange);
            setMarket(positionToUpdate.market);
            
            if (tradeToEdit) {
                // EDIT MODE: Populate form with the trade's specific data.
                const tradeAction = tradeToEdit.action;
                setAction(tradeAction);
                setOrderType(tradeToEdit.orderType);
                setPrice(String(tradeToEdit.price));
                setLeverage(tradeToEdit.leverage || 1);
                
                const isLeveraged = ['Futures', 'Cross Margin', 'Isolated Margin'].includes(positionToUpdate.market);

                if (tradeAction === 'Buy') {
                    const leverageUsed = tradeToEdit.leverage && isLeveraged ? tradeToEdit.leverage : 1;
                    const originalPrincipal = tradeToEdit.total / leverageUsed;
                    setPrincipal(String(originalPrincipal));
                    setAmount('');
                    setTotal('');
                } else { // Sell action
                    setAmount(String(tradeToEdit.amount));
                    setTotal(String(tradeToEdit.total));
                    setPrincipal('');
                }
            } else {
                // ADD TO POSITION MODE: Reset trade-specific fields.
                setAction('Buy');
                setPrice('');
                setPrincipal('');
                setAmount('');
                setTotal('');
            }
        } else {
            // NEW TRADE MODE: This block runs when `positionToUpdate` becomes null.
            // Reset fields for the next new trade.
            setPair('');
            setPrice('');
            setPrincipal('');
            setAmount('');
            setTotal('');
            setAction('Buy');
            setOrderType('Limit');
        }
    }, [positionToUpdate, tradeToEdit]);

    // Effect 2: Handles leverage adjustment side-effect when the market changes.
    useEffect(() => {
        // Do not adjust leverage automatically if we are in edit mode.
        if (tradeToEdit) return;

        if (isLeveragedMarket) {
            // If we switched to a leveraged market and leverage is 1, it's likely
            // we came from a non-leveraged market. Default to 10x.
            // Otherwise, keep the user's existing leverage setting.
            if (leverage === 1) {
                setLeverage(10);
            }
        } else {
            // If we are on a non-leveraged market, force leverage to 1.
            setLeverage(1);
        }
    }, [market, tradeToEdit]);


    const positionState = useMemo(() => {
        if (!positionToUpdate) {
            return { direction: 'flat', remainingAmount: 0 };
        }
        const totalBuy = positionToUpdate.trades.filter(t => t.action === 'Buy').reduce((sum, t) => sum + t.amount, 0);
        const totalSell = positionToUpdate.trades.filter(t => t.action === 'Sell').reduce((sum, t) => sum + t.amount, 0);
        const remainingAmount = totalBuy - totalSell;
        
        if (Math.abs(remainingAmount) < 1e-9) {
            return { direction: 'flat', remainingAmount: 0 };
        }
        
        return {
            direction: remainingAmount > 0 ? 'long' : 'short',
            remainingAmount: remainingAmount,
        };
    }, [positionToUpdate]);
    
    const isClosingPosition = isUpdateMode && !isEditMode && (
        (positionState.direction === 'long' && action === 'Sell') ||
        (positionState.direction === 'short' && action === 'Buy')
    );
    
    const showForceCloseCheckbox = useMemo(() => {
        if (!isClosingPosition || isEditMode) return false;
        const numAmount = parseFloat(amount) || 0;
        const remaining = Math.abs(positionState.remainingAmount);
        if (numAmount === 0 || remaining === 0) return false;
        
        const difference = Math.abs(numAmount - remaining);
        // Show if there is a small, non-zero difference (typical of floating point issues)
        return difference > 0 && difference < 1e-6; 
    }, [isClosingPosition, isEditMode, amount, positionState.remainingAmount]);

    // Reset forceClose state if the conditions for showing it are no longer met
    useEffect(() => {
        if (!showForceCloseCheckbox) {
            setForceClose(false);
        }
    }, [showForceCloseCheckbox]);


    const isOpeningTradeAction = (!isEditMode && !isClosingPosition) || (isEditMode && action === 'Buy');

    const { feeRate, feeType } = useMemo(() => {
        if (exchange === 'Other') {
            return { feeRate: parseFloat(manualFeeRate) / 100, feeType: 'Manual' as FeeType };
        }
        const isMaker = orderType === 'Limit' || orderType === 'Stop-Limit';
        const type = isMaker ? 'maker' : 'taker';
        const fee = FEES[exchange]?.[market]?.[type] ?? 0;
        return { feeRate: fee, feeType: isMaker ? 'Maker' : 'Taker' as FeeType };
    }, [exchange, market, orderType, manualFeeRate]);

    const { finalAmount, finalTotal, feeAmount, marginUsed } = useMemo(() => {
        if (isOpeningTradeAction) {
            const numPrincipal = parseFloat(principal) || 0;
            const numPrice = parseFloat(price) || 1;
            const calculatedTotal = numPrincipal * (isLeveragedMarket ? leverage : 1);
            const calculatedAmount = numPrice > 0 ? calculatedTotal / numPrice : 0;
            const fee = calculatedTotal * feeRate;
            const margin = numPrincipal;
            return {
                finalAmount: calculatedAmount,
                finalTotal: calculatedTotal,
                feeAmount: fee,
                marginUsed: margin,
            };
        } else { // Closing positions (new or edit)
            const currentTotal = parseFloat(total) || 0;
            const fee = currentTotal * feeRate;
            return {
                finalAmount: parseFloat(amount) || 0,
                finalTotal: currentTotal,
                feeAmount: fee,
                marginUsed: 0,
            };
        }
    }, [isOpeningTradeAction, total, amount, principal, price, feeRate, leverage, isLeveragedMarket]);

    useEffect(() => {
        if (isClosingPosition) {
            const remaining = positionState.remainingAmount;
            const closeAmountVal = (Math.abs(remaining) * (closePercentage / 100));
            const closeAmountStr = closeAmountVal.toFixed(8);
            
            setAmount(closeAmountStr);

            const numPrice = parseFloat(price) || 0;
            const newTotal = (parseFloat(closeAmountStr) * numPrice).toString();
            if (!isNaN(parseFloat(newTotal))) setTotal(newTotal);
        }
    }, [closePercentage, isClosingPosition, positionState.remainingAmount, price]);
    
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newAmount = e.target.value;
        setAmount(newAmount);
        const numPrice = parseFloat(price) || 0;
        const newTotal = (parseFloat(newAmount) * numPrice).toString();
        if (!isNaN(parseFloat(newTotal))) setTotal(newTotal);
    };

    const handleTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTotal = e.target.value;
        setTotal(newTotal);
        const numPrice = parseFloat(price) || 1;
        const newAmount = (parseFloat(newTotal) / numPrice).toString();
        if (!isNaN(parseFloat(newAmount))) setAmount(newAmount);
    };
    
    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPrice = e.target.value;
        setPrice(newPrice);
        if(!isOpeningTradeAction){ // For closing trades (new or edit)
            const newTotal = (parseFloat(amount) * parseFloat(newPrice)).toString();
            if (!isNaN(parseFloat(newTotal))) setTotal(newTotal);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numPrice = parseFloat(price);
        const numAmount = isOpeningTradeAction ? finalAmount : (parseFloat(amount) || 0);
        const numTotal = isOpeningTradeAction ? finalTotal : (parseFloat(total) || 0);
        const finalFee = numTotal * feeRate;

        if (!pair || isNaN(numPrice) || numPrice <= 0 || isNaN(numAmount) || numAmount <= 0 || isNaN(numTotal) || numTotal < 0) {
            alert('Please ensure Pair, Price, Amount are valid positive numbers, and Total is not negative.');
            return;
        }

        if (isOpeningTradeAction) {
            const numPrincipal = parseFloat(principal);
            if (isNaN(numPrincipal) || numPrincipal <= 0) {
                alert(`Please fill in ${isLeveragedMarket ? "Margin" : "Investment Amount"} with a valid positive number.`);
                return;
            }
        }

        const getLeverageForSubmission = () => {
            if (!isLeveragedMarket) return undefined;
            if (isEditMode) {
                // When editing an opening trade, leverage is from the slider.
                // When editing a closing trade, preserve original leverage.
                if (tradeToEdit?.action === 'Buy') return leverage;
                return tradeToEdit?.leverage;
            }
            if (isClosingPosition) return undefined; // No new leverage on closing trades.
            return leverage; // New or adding an opening trade
        };

        onLogTrade({
            positionId: positionToUpdate?.id,
            tradeId: tradeToEdit?.id,
            trade: {
                id: tradeToEdit?.id || crypto.randomUUID(),
                action,
                price: numPrice,
                amount: numAmount,
                total: numTotal,
                fee: finalFee,
                feeRate,
                feeType,
                timestamp: tradeToEdit?.timestamp || new Date(),
                leverage: getLeverageForSubmission(),
                orderType: orderType,
            },
            pair: pair.toUpperCase(),
            exchange: exchange,
            market: market,
            forceClose: forceClose,
        });

    };

    const quoteCurrency = pair.split('/')[1] || 'Quote';
    const baseCurrency = pair.split('/')[0] || 'Base';
    const showCalculatedSummary = isOpeningTradeAction;
    const principalLabel = isLeveragedMarket ? "Margin" : "Investment Amount";

    return (
        <div className="bg-brand-surface p-6 rounded-lg shadow-lg border border-brand-border h-full">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold">{isEditMode ? `Edit Trade in ${positionToUpdate?.pair}` : isUpdateMode ? `Update ${positionToUpdate?.pair}` : 'New Trade Calculator'}</h2>
                 {isUpdateMode && (
                    <button onClick={cancelUpdate} className="text-brand-text-secondary hover:text-brand-danger transition-colors">
                        <XCircleIcon />
                    </button>
                 )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Exchange" value={exchange} onChange={e => setExchange(e.target.value as ExchangeName)} disabled={isUpdateMode}>
                        {EXCHANGES.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </SelectField>
                    <SelectField label="Market" value={market} onChange={e => setMarket(e.target.value as Market)} disabled={isUpdateMode}>
                        {MARKETS.map(m => <option key={m} value={m}>{m}</option>)}
                    </SelectField>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <SelectField label="Order Type" value={orderType} onChange={e => setOrderType(e.target.value as OrderType)}>
                        {ORDER_TYPES.map(ot => <option key={ot} value={ot}>{ot}</option>)}
                    </SelectField>
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Action</label>
                        <div className="flex rounded-md border border-brand-border">
                            <button type="button" onClick={() => setAction('Buy')} className={`flex-1 p-2 rounded-l-md text-sm font-semibold transition ${action === 'Buy' ? 'bg-brand-success text-white' : 'bg-brand-surface hover:bg-white/5'}`} disabled={isEditMode}>BUY</button>
                            <button type="button" onClick={() => setAction('Sell')} className={`flex-1 p-2 rounded-r-md text-sm font-semibold transition ${action === 'Sell' ? 'bg-brand-danger text-white' : 'bg-brand-surface hover:bg-white/5'}`} disabled={isEditMode}>SELL</button>
                        </div>
                    </div>
                </div>
                <InputField label="Pair (e.g., BTC/USDT)" type="text" placeholder="BTC/USDT" value={pair} onChange={e => setPair(e.target.value)} required disabled={isUpdateMode} />
                <InputField label="Price" type="number" placeholder="Price" value={price} onChange={handlePriceChange} required step="any" />
                
                { (isEditMode && action === 'Sell') || isClosingPosition ? (
                    // This block is for all closing trades (new or edit)
                     <>
                        <div className="grid grid-cols-2 gap-4">
                            <InputField label="Amount" type="number" placeholder="0.1" value={amount} onChange={handleAmountChange} required step="any" />
                            <InputField label="Total" type="number" placeholder="6000" value={total} onChange={handleTotalChange} required step="any" />
                        </div>
                        {isClosingPosition && !isEditMode && (
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Close Percentage: {closePercentage}%</label>
                                <input type="range" min="1" max="100" value={closePercentage} onChange={e => setClosePercentage(parseInt(e.target.value))} className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                            </div>
                        )}
                         {isClosingPosition && showForceCloseCheckbox && (
                            <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 p-3 rounded-md text-sm mt-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={forceClose}
                                        onChange={(e) => setForceClose(e.target.checked)}
                                        className="w-4 h-4 rounded bg-brand-bg border-brand-border text-brand-primary focus:ring-brand-primary focus:ring-offset-0"
                                    />
                                    <span>
                                        Position has a tiny remainder. Check this to force close it to exactly zero.
                                    </span>
                                </label>
                            </div>
                        )}
                        {isEditMode && tradeToEdit?.leverage && tradeToEdit.leverage > 1 && isLeveragedMarket && (
                           <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Original Leverage</label>
                                <p className="w-full bg-brand-surface/50 border border-brand-border rounded-md px-3 py-2 text-brand-text-secondary">{tradeToEdit.leverage}x (not editable)</p>
                           </div>
                        )}
                    </>
                ) : (
                    // This block is for all opening trades (new, add, or edit)
                     <>
                        <InputField label={principalLabel} type="number" placeholder="1000" value={principal} onChange={(e) => setPrincipal(e.target.value)} required step="any" />
                        {isLeveragedMarket && (
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Leverage: {leverage}x</label>
                                <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                            </div>
                        )}
                    </>
                )}
                
                {exchange === 'Other' && (
                    <InputField label="Manual Fee Rate (%)" type="number" value={manualFeeRate} onChange={e => setManualFeeRate(e.target.value)} step="any" />
                )}

                <div className="text-center text-sm text-brand-text-secondary pt-2 space-y-1 bg-black/20 p-3 rounded-md">
                    <p>Fee Type: <span className="font-semibold text-brand-text-primary">{feeType}</span></p>
                    <p>Fee Rate: <span className="font-semibold text-brand-text-primary">{(feeRate * 100).toFixed(4)}%</span></p>
                    <p>Estimated Fee: <span className="font-semibold text-brand-text-primary">{feeAmount.toFixed(8)}</span></p>
                    
                    {showCalculatedSummary && (
                        <>
                            {isLeveragedMarket && <p>Margin Used: <span className="font-semibold text-brand-text-primary">{marginUsed.toFixed(4)} {quoteCurrency}</span></p>}
                            <p className="mt-2 pt-2 border-t border-brand-border/50">Calculated Total: <span className="font-semibold text-brand-text-primary">{finalTotal.toFixed(2)} {quoteCurrency}</span></p>
                            <p>Calculated Amount: <span className="font-semibold text-brand-text-primary">{finalAmount.toFixed(8)} {baseCurrency}</span></p>
                        </>
                    )}
                </div>

                <button type="submit" className={`w-full py-3 px-4 text-white font-semibold rounded-md transition-colors ${action === 'Buy' ? 'bg-brand-success hover:bg-green-500' : 'bg-brand-danger hover:bg-red-500'}`}>
                    {isEditMode ? `Save Changes to Trade` : isUpdateMode ? `Log ${action} Trade` : `Log Initial ${action} Trade`}
                </button>
            </form>
        </div>
    );
};