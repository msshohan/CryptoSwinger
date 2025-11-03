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
        <input {...props} className="w-full bg-brand-bg border border-brand-border rounded-md px-3 py-2 text-brand-text-primary focus:ring-2 focus:ring-brand-primary focus:outline-none transition read-only:bg-brand-surface disabled:opacity-50" />
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

type CalculationMode = 'principal' | 'amount' | 'total';

export const Calculator: React.FC<CalculatorProps> = ({ onLogTrade, positionToUpdate, tradeToEdit, cancelUpdate }) => {
    const [exchange, setExchange] = useState<ExchangeName>('Binance');
    const [market, setMarket] = useState<Market>('Isolated Margin');
    const [orderType, setOrderType] = useState<OrderType>('Limit');
    const [action, setAction] = useState<TradeAction>('Buy');
    
    const [pair, setPair] = useState('');
    const [price, setPrice] = useState('');
    const [leverage, setLeverage] = useState(10);
    const [isFutures, setIsFutures] = useState(true);

    // State for the new flexible calculator
    const [calculationMode, setCalculationMode] = useState<CalculationMode>('principal');
    const [inputValue, setInputValue] = useState(''); // The value of the active input field

    // State for closing trades
    const [accountBalance, setAccountBalance] = useState('');
    const [closeAmount, setCloseAmount] = useState('');
    const [closeTotal, setCloseTotal] = useState('');
    
    const [manualFeeRate, setManualFeeRate] = useState('0.1');
    const [closePercentage, setClosePercentage] = useState(100);
    const [forceClose, setForceClose] = useState(false);

    const isUpdateMode = !!positionToUpdate;
    const isEditMode = !!tradeToEdit;
    const isLeveragedMarket = useMemo(() => ['Cross Margin', 'Isolated Margin'].includes(market), [market]);
    
    const quoteCurrency = useMemo(() => pair.split('/')[1]?.toUpperCase() || 'QUOTE', [pair]);
    const baseCurrency = useMemo(() => pair.split('/')[0]?.toUpperCase() || 'BASE', [pair]);
    const principalLabel = isLeveragedMarket ? "Margin" : "Investment";

    const originalPositionDirection = useMemo(() => {
        if (!positionToUpdate || positionToUpdate.trades.length === 0) {
            return 'flat';
        }
        const sortedTrades = [...positionToUpdate.trades].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        return sortedTrades[0].action === 'Buy' ? 'long' : 'short';
    }, [positionToUpdate]);

    // Effect 1: Handles form state when the editing mode changes (new vs. update/edit).
    useEffect(() => {
        if (positionToUpdate) {
            setPair(positionToUpdate.pair);
            setExchange(positionToUpdate.exchange);
            setMarket(positionToUpdate.market);
            setIsFutures(positionToUpdate.isFutures || false);
            
            if (tradeToEdit) { // EDIT MODE
                setAction(tradeToEdit.action);
                setOrderType(tradeToEdit.orderType);
                setPrice(String(tradeToEdit.price));
                setLeverage(tradeToEdit.leverage || 1);
                
                const isOpeningEdit = (originalPositionDirection === 'long' && tradeToEdit.action === 'Buy') || (originalPositionDirection === 'short' && tradeToEdit.action === 'Sell');

                if (isOpeningEdit) {
                    setCalculationMode('total');
                    setInputValue(String(tradeToEdit.total));
                    setCloseAmount('');
                    setCloseTotal('');
                } else { // Editing a closing trade
                    setCloseAmount(String(tradeToEdit.amount));
                    setCloseTotal(String(tradeToEdit.total));
                    setInputValue('');
                }
            } else { // ADD TO POSITION MODE
                setAction('Buy');
                setPrice('');
                setInputValue('');
                setCloseAmount('');
                setCloseTotal('');
                // Set default calculation mode based on the position's market
                const isPosLeveraged = ['Cross Margin', 'Isolated Margin'].includes(positionToUpdate.market);
                setCalculationMode(isPosLeveraged ? 'principal' : 'total');
            }
        } else { // NEW TRADE MODE
            setPair('');
            setPrice('');
            setInputValue('');
            setCloseAmount('');
            setAccountBalance('');
            setCloseTotal('');
            setAction('Buy');
            setOrderType('Limit');
            setIsFutures(true);
            // Set default based on the currently selected market state
            setCalculationMode(isLeveragedMarket ? 'principal' : 'total');
        }
    }, [positionToUpdate, tradeToEdit, isLeveragedMarket, originalPositionDirection]);

    // Effect 2: Handles leverage adjustment side-effect when the market changes.
    useEffect(() => {
        if (tradeToEdit) return;
        if (isLeveragedMarket) {
            if (leverage === 1) setLeverage(10);
        } else {
            setLeverage(1);
            setIsFutures(false);
        }
    }, [market, tradeToEdit, isLeveragedMarket]);

    // Effect 3: Switch calculation mode if it's invalid for the selected market.
    useEffect(() => {
        if (!isLeveragedMarket && calculationMode === 'principal') {
            handleModeChange('total');
        }
    }, [isLeveragedMarket, calculationMode]);

    const positionState = useMemo(() => {
        if (!positionToUpdate) return { direction: 'flat', remainingAmount: 0 };
        const totalBuy = positionToUpdate.trades.filter(t => t.action === 'Buy').reduce((sum, t) => sum + t.amount, 0);
        const totalSell = positionToUpdate.trades.filter(t => t.action === 'Sell').reduce((sum, t) => sum + t.amount, 0);
        const remainingAmount = totalBuy - totalSell;
        
        return {
            direction: Math.abs(remainingAmount) < 1e-9 ? 'flat' : remainingAmount > 0 ? 'long' : 'short',
            remainingAmount,
        };
    }, [positionToUpdate]);
    
    const isClosingPosition = isUpdateMode && !isEditMode && (
        (positionState.direction === 'long' && action === 'Sell') ||
        (positionState.direction === 'short' && action === 'Buy')
    );
    
    const isOpeningTradeAction = useMemo(() => {
        if (!isUpdateMode) { // This is a new position, so it's always "opening"
            return true;
        }

        if (isEditMode && tradeToEdit) { // We are editing an existing trade
            return (originalPositionDirection === 'long' && tradeToEdit.action === 'Buy') || 
                   (originalPositionDirection === 'short' && tradeToEdit.action === 'Sell');
        }

        // We are adding a new trade to an existing position
        return !isClosingPosition;

    }, [isUpdateMode, isEditMode, tradeToEdit, isClosingPosition, originalPositionDirection]);

    const { principal, amount, total } = useMemo(() => {
        const val = parseFloat(inputValue) || 0;
        const numPrice = parseFloat(price) || 1;
        const numLeverage = isLeveragedMarket ? leverage : 1;

        if (val === 0 || numPrice <= 0) return { principal: '', amount: '', total: '' };

        let p = 0, a = 0, t = 0;
        const mode = calculationMode;

        if (mode === 'principal') {
            p = val;
            t = p * numLeverage;
            a = t / numPrice;
        } else if (mode === 'amount') {
            a = val;
            t = a * numPrice;
            p = t / numLeverage;
        } else { // mode === 'total'
            t = val;
            a = t / numPrice;
            p = t / numLeverage;
        }

        return {
            principal: p.toFixed(4),
            amount: a.toFixed(8),
            total: t.toFixed(4),
        };
    }, [inputValue, calculationMode, price, leverage, isLeveragedMarket]);

    const handleModeChange = (newMode: CalculationMode) => {
        const newInputValue = { principal, amount, total }[newMode] || '';
        setInputValue(newInputValue);
        setCalculationMode(newMode);
    };

    const { feeRate, feeType } = useMemo(() => {
        if (exchange === 'Other') {
            return { feeRate: parseFloat(manualFeeRate) / 100, feeType: 'Manual' as FeeType };
        }
        const isMaker = orderType === 'Limit' || orderType === 'Stop-Limit';
        const type = isMaker ? 'maker' : 'taker';
        const marketForFee = isFutures ? 'Futures' : market;
        const fee = FEES[exchange]?.[marketForFee]?.[type] ?? 0;
        return { feeRate: fee, feeType: isMaker ? 'Maker' : 'Taker' as FeeType };
    }, [exchange, market, orderType, manualFeeRate, isFutures]);

    const feeAmount = useMemo(() => {
        const totalForFee = parseFloat(isOpeningTradeAction ? total : closeTotal) || 0;
        return totalForFee * feeRate;
    }, [total, closeTotal, feeRate, isOpeningTradeAction]);

    const { borrowedAmountValue, borrowedCurrency, borrowedAmountPrecision } = useMemo(() => {
        if (!isLeveragedMarket || !isOpeningTradeAction) return { borrowedAmountValue: 0, borrowedCurrency: '', borrowedAmountPrecision: 4 };
        
        const numTotal = parseFloat(total) || 0;
        const numPrincipal = parseFloat(principal) || 0;
        const numAmount = parseFloat(amount) || 0;
        const numPrice = parseFloat(price) || 1;
        
        if (action === 'Buy') {
            return {
                borrowedAmountValue: numTotal - numPrincipal,
                borrowedCurrency: quoteCurrency,
                borrowedAmountPrecision: 4
            };
        } else { // Sell
            const marginInBaseCurrency = numPrincipal / numPrice;
            const borrowedValue = Math.max(0, numAmount - marginInBaseCurrency);
            return {
                borrowedAmountValue: borrowedValue,
                borrowedCurrency: baseCurrency,
                borrowedAmountPrecision: 8
            };
        }
    }, [isLeveragedMarket, isOpeningTradeAction, action, total, principal, amount, price, quoteCurrency, baseCurrency]);

    useEffect(() => {
        if (isClosingPosition) {
            const remaining = positionState.remainingAmount;
            const closeAmountVal = (Math.abs(remaining) * (closePercentage / 100));
            const closeAmountStr = closeAmountVal.toFixed(8);
            setCloseAmount(closeAmountStr);
        }
    }, [closePercentage, isClosingPosition, positionState.remainingAmount]);

    useEffect(() => {
        const numPrice = parseFloat(price) || 0;
        const numAmount = parseFloat(isClosingPosition ? closeAmount : '') || 0;
        if(numPrice > 0 && numAmount > 0) {
            const newTotal = numAmount * numPrice;
            setCloseTotal(newTotal.toFixed(4));
        }
    }, [closeAmount, price, isClosingPosition])

    const showForceCloseCheckbox = useMemo(() => {
        if (!isClosingPosition || isEditMode) return false;
        const numAmount = parseFloat(closeAmount) || 0;
        const remaining = Math.abs(positionState.remainingAmount);
        if (numAmount === 0 || remaining === 0) return false;
        const difference = Math.abs(numAmount - remaining);
        return difference > 0 && difference < 1e-6; 
    }, [isClosingPosition, isEditMode, closeAmount, positionState.remainingAmount]);

    useEffect(() => { if (!showForceCloseCheckbox) setForceClose(false); }, [showForceCloseCheckbox]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const numPrice = parseFloat(price);
        const numAmount = parseFloat(isOpeningTradeAction ? amount : closeAmount);
        const numTotal = parseFloat(isOpeningTradeAction ? total : closeTotal);
        const numPrincipal = parseFloat(principal);

        if (!pair || isNaN(numPrice) || numPrice <= 0 || isNaN(numAmount) || numAmount <= 0 || isNaN(numTotal) || numTotal < 0) {
            alert('Please ensure Pair, Price, Amount, and Total are valid positive numbers.');
            return;
        }

        if (isOpeningTradeAction && (isNaN(numPrincipal) || numPrincipal <= 0)) {
            alert(`Please fill in a valid positive number for ${principalLabel}, Amount or Total.`);
            return;
        }

        const finalFee = numTotal * feeRate;

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
                leverage: isLeveragedMarket ? leverage : undefined,
                orderType: orderType,
            },
            pair: pair.toUpperCase(),
            exchange: exchange,
            market: market,
            isFutures: isLeveragedMarket ? isFutures : undefined,
            forceClose,
            accountBalance: market === 'Cross Margin' ? parseFloat(accountBalance) : undefined,
        });
    };
    
    const renderOpeningTradeInputs = () => {
        const modeButtonClass = "flex-1 p-2 text-xs font-semibold transition rounded-md";
        const activeClass = "bg-brand-primary text-white";
        const inactiveClass = "bg-brand-bg hover:bg-white/10";
        
        const calculationModes: CalculationMode[] = isLeveragedMarket 
            ? ['principal', 'amount', 'total'] 
            : ['amount', 'total'];
        
        return (
            <div className="space-y-4">
                <InputField label="Price" type="number" placeholder={`Price in ${quoteCurrency}`} value={price} onChange={e => setPrice(e.target.value)} required step="any" />

                <div className="bg-black/20 p-3 rounded-md space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-2">Calculate Position By</label>
                        <div className={`grid ${isLeveragedMarket ? 'grid-cols-3' : 'grid-cols-2'} gap-1 rounded-md bg-brand-bg p-1 border border-brand-border`}>
                            {isLeveragedMarket && (
                                <button type="button" onClick={() => handleModeChange('principal')} className={`${modeButtonClass} ${calculationMode === 'principal' ? activeClass : inactiveClass}`} disabled={isEditMode}>{principalLabel}</button>
                            )}
                            <button type="button" onClick={() => handleModeChange('amount')} className={`${modeButtonClass} ${calculationMode === 'amount' ? activeClass : inactiveClass}`} disabled={isEditMode}>Amount</button>
                            <button type="button" onClick={() => handleModeChange('total')} className={`${modeButtonClass} ${calculationMode === 'total' ? activeClass : inactiveClass}`} disabled={isEditMode}>Total</button>
                        </div>
                    </div>
                    
                    {isLeveragedMarket && (
                        <InputField label={principalLabel} type="number" value={calculationMode === 'principal' ? inputValue : principal} onChange={e => setInputValue(e.target.value)} readOnly={calculationMode !== 'principal'} step="any" placeholder={`Your capital in ${quoteCurrency}`} />
                    )}
                    <InputField label={`Amount (${baseCurrency})`} type="number" value={calculationMode === 'amount' ? inputValue : amount} onChange={e => setInputValue(e.target.value)} readOnly={calculationMode !== 'amount'} step="any" placeholder={`Quantity of ${baseCurrency}`} />
                    <InputField label={`Total (${quoteCurrency})`} type="number" value={calculationMode === 'total' ? inputValue : total} onChange={e => setInputValue(e.target.value)} readOnly={calculationMode !== 'total'} step="any" placeholder={`Total position value in ${quoteCurrency}`} />
                </div>

                {isLeveragedMarket && (
                    <div>
                        <label className="block text-sm font-medium text-brand-text-secondary mb-1">Leverage: {leverage}x</label>
                        <input type="range" min="1" max="125" value={leverage} onChange={e => setLeverage(parseInt(e.target.value))} className="w-full h-2 bg-brand-border rounded-lg appearance-none cursor-pointer accent-brand-primary" />
                    </div>
                )}
            </div>
        );
    };

    const renderClosingTradeInputs = () => (
        <>
            <InputField label="Price" type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required step="any" />
            <div className="grid grid-cols-2 gap-4">
                <InputField label={`Amount (${baseCurrency})`} type="number" placeholder="0.1" value={closeAmount} onChange={e => setCloseAmount(e.target.value)} required step="any" />
                <InputField label={`Total (${quoteCurrency})`} type="number" placeholder="6000" value={closeTotal} onChange={e => setCloseTotal(e.target.value)} required step="any" />
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
                        <input type="checkbox" checked={forceClose} onChange={(e) => setForceClose(e.target.checked)} className="w-4 h-4 rounded bg-brand-bg border-brand-border text-brand-primary focus:ring-brand-primary focus:ring-offset-0" />
                        <span>Position has a tiny remainder. Check this to force close it to exactly zero.</span>
                    </label>
                </div>
            )}
        </>
    );

    return (
        <div className="bg-brand-surface p-6 rounded-lg shadow-lg border border-brand-border h-full">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-bold">{isEditMode ? `Edit Trade` : isUpdateMode ? `Update Position` : 'New Trade Calculator'}</h2>
                 {isUpdateMode && (
                    <button onClick={cancelUpdate} className="text-brand-text-secondary hover:text-brand-danger transition-colors" aria-label="Cancel update">
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

                {isLeveragedMarket && (
                    <div className="flex items-center gap-2 -mt-2">
                        <input
                            type="checkbox"
                            id="isFutures"
                            checked={isFutures}
                            onChange={e => setIsFutures(e.target.checked)}
                            disabled={isUpdateMode}
                            className="w-4 h-4 rounded bg-brand-bg border-brand-border text-brand-primary focus:ring-brand-primary focus:ring-offset-brand-surface"
                        />
                        <label htmlFor="isFutures" className="text-sm font-medium text-brand-text-secondary">
                            Is Futures/Derivatives? (Uses different fee rates)
                        </label>
                    </div>
                 )}

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
                
                {!isUpdateMode && market === 'Cross Margin' && (
                    <InputField label="Account Balance" type="number" placeholder={`Total balance in ${quoteCurrency}`} value={accountBalance} onChange={e => setAccountBalance(e.target.value)} required step="any" />
                )}

                {isOpeningTradeAction ? renderOpeningTradeInputs() : renderClosingTradeInputs()}
                
                {exchange === 'Other' && (
                    <InputField label="Manual Fee Rate (%)" type="number" value={manualFeeRate} onChange={e => setManualFeeRate(e.target.value)} step="any" />
                )}

                <div className="text-center text-sm text-brand-text-secondary pt-2 space-y-1 bg-black/20 p-3 rounded-md">
                    <p>Fee Type: <span className="font-semibold text-brand-text-primary">{feeType}</span></p>
                    <p>Fee Rate: <span className="font-semibold text-brand-text-primary">{(feeRate * 100).toFixed(4)}%</span></p>
                    {isLeveragedMarket && isOpeningTradeAction && borrowedAmountValue > 0 && (
                        <p>Borrowing: <span className="font-semibold text-brand-text-primary">{borrowedAmountValue.toFixed(borrowedAmountPrecision).replace(/\.?0+$/, "")} {borrowedCurrency}</span></p>
                    )}
                    <p>Estimated Fee: <span className="font-semibold text-brand-text-primary">{feeAmount.toFixed(8)} {quoteCurrency}</span></p>
                </div>

                <button type="submit" className={`w-full py-3 px-4 text-white font-semibold rounded-md transition-colors ${action === 'Buy' ? 'bg-brand-success hover:bg-green-500' : 'bg-brand-danger hover:bg-red-500'}`}>
                    {isEditMode ? `Save Changes to Trade` : isUpdateMode ? `Log ${action} Trade` : `Log Initial ${action} Trade`}
                </button>
                 <p className="text-xs text-brand-text-secondary/80 text-center mt-3 px-2">
                    Disclaimer: Calculations are an estimate and may not be exactly accurate. Other factors like Margin Level, hourly interest etc. can vary by exchange and impact actual calculation.
                </p>
            </form>
        </div>
    );
};