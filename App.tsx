
import React, { useState, useCallback, useMemo } from 'react';
import { Calculator } from './components/Calculator';
import { TradeLogger } from './components/TradeLogger';
import { Position, Trade, ExchangeName, Market, User } from './types';
import { Header } from './components/layout/Header';
import { MyAccountPage } from './components/account/MyAccountPage';


type Page = 'main' | 'account';

interface TradeData {
    positionId?: string;
    tradeId?: string;
    trade: Trade;
    pair: string;
    exchange: ExchangeName;
    market: Market;
    forceClose?: boolean;
    accountBalance?: number;
    isFutures?: boolean;
}

const MOCK_USER: User = {
    name: 'Alex Crypto',
    email: 'alex.crypto@example.com',
};


function App() {
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [ledgerPositions, setLedgerPositions] = useState<Position[]>([]);
  const [editingState, setEditingState] = useState<{ positionId: string; tradeId?: string } | null>(null);

  const navigate = (page: Page) => setCurrentPage(page);

  const handleLogTrade = useCallback((tradeData: TradeData) => {
    const { positionId, tradeId, trade, pair, exchange, market, forceClose, accountBalance, isFutures } = tradeData;

    setActivePositions(prevPositions => {
        let positionToUpdate: Position | undefined;
        let isNewPosition = false;

        // Handle trade editing or new/add trade
        if (positionId && tradeId) { // Editing existing trade
            const originalPosition = prevPositions.find(p => p.id === positionId);
            if (originalPosition) {
                // forceClose doesn't apply to editing, so we just use the trade as is.
                const updatedTrades = originalPosition.trades.map(t => (t.id === tradeId ? trade : t));
                positionToUpdate = { ...originalPosition, trades: updatedTrades };
            }
        } else { // Adding a new trade to an existing or new position
            const targetId = positionId || prevPositions.find(p => p.pair === pair && p.market === market && p.isFutures === isFutures)?.id;
            
            let finalTrade = trade;
            
            if (targetId) { // Adding to existing position
                const originalPosition = prevPositions.find(p => p.id === targetId)!;
                
                if (forceClose) {
                    const totalBuy = originalPosition.trades.reduce((sum, t) => t.action === 'Buy' ? sum + t.amount : sum, 0);
                    const totalSell = originalPosition.trades.reduce((sum, t) => t.action === 'Sell' ? sum + t.amount : sum, 0);
                    const remainingAmount = totalBuy - totalSell;

                    const closeAmount = Math.abs(remainingAmount);
                    const closeTotal = closeAmount * trade.price;
                    const closeFee = closeTotal * trade.feeRate;
                    
                    finalTrade = {
                        ...trade,
                        amount: closeAmount,
                        total: closeTotal,
                        fee: closeFee,
                    };
                }
                positionToUpdate = { ...originalPosition, trades: [...originalPosition.trades, finalTrade] };

            } else { // Creating a new position
                positionToUpdate = {
                    id: crypto.randomUUID(),
                    pair: pair,
                    exchange: exchange,
                    market: market,
                    trades: [finalTrade], // finalTrade is just trade here since it's a new pos
                    accountBalance: market === 'Cross Margin' ? accountBalance : undefined,
                    isFutures: isFutures,
                };
                isNewPosition = true;
            }
        }

        if (!positionToUpdate) {
            return prevPositions;
        }

        positionToUpdate.trades.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (isNewPosition) {
            return [positionToUpdate, ...prevPositions];
        } else {
            return prevPositions.map(p => p.id === positionToUpdate!.id ? positionToUpdate! : p);
        }
    });

    setEditingState(null);
  }, []);

  const handleDeletePosition = useCallback((positionId: string) => {
    setActivePositions(prevPositions => prevPositions.filter(p => p.id !== positionId));
    setEditingState(currentEditingState => {
      if (currentEditingState?.positionId === positionId) {
        return null;
      }
      return currentEditingState;
    });
  }, []);
  
  const handleDeleteLedgerPosition = useCallback((positionId: string) => {
    setLedgerPositions(prev => prev.filter(p => p.id !== positionId));
  }, []);

  const handleSavePositionToLedger = useCallback((positionId: string, notes: string) => {
    const positionToMove = activePositions.find(p => p.id === positionId);
    if (positionToMove) {
        const ledgerEntry = { ...positionToMove, notes };
        setLedgerPositions(prev => [ledgerEntry, ...prev.sort((a, b) => new Date(b.trades[0]?.timestamp).getTime() - new Date(a.trades[0]?.timestamp).getTime())]);
        
        // Mark the position in the active log as saved, instead of removing it.
        setActivePositions(prev => prev.map(p => p.id === positionId ? { ...p, savedToLedger: true } : p));
    }
  }, [activePositions]);

  const handleDeleteTrade = (positionId: string, tradeId: string) => {
    setActivePositions(prevPositions => {
      const positionsWithTradeRemoved = prevPositions.map(position => {
        if (position.id === positionId) {
          const updatedTrades = position.trades.filter(trade => trade.id !== tradeId);
          return { ...position, trades: updatedTrades };
        }
        return position;
      });

      const finalPositions = positionsWithTradeRemoved.filter(position => position.trades.length > 0);

      const wasPositionRemoved = finalPositions.length < prevPositions.length;
      if (wasPositionRemoved) {
        setEditingState(currentEditingState => {
          if (currentEditingState?.positionId === positionId) {
            return null;
          }
          return currentEditingState;
        });
      }
      return finalPositions;
    });
  };
  
  const handleAddTradeToPosition = useCallback((positionId: string) => {
    setEditingState({ positionId });
    if (window.innerWidth < 1024) { // Corresponds to Tailwind's 'lg' breakpoint
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleEditTrade = useCallback((positionId: string, tradeId: string) => {
    setEditingState({ positionId, tradeId });
    if (window.innerWidth < 1024) { // Corresponds to Tailwind's 'lg' breakpoint
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleCancelUpdate = useCallback(() => {
    setEditingState(null);
  }, []);

  const { positionToUpdate, tradeToEdit } = useMemo(() => {
    if (!editingState) return { positionToUpdate: null, tradeToEdit: null };
    
    const position = activePositions.find(p => p.id === editingState.positionId) || null;
    if (!position) return { positionToUpdate: null, tradeToEdit: null };

    if (editingState.tradeId) {
        const trade = position.trades.find(t => t.id === editingState.tradeId) || null;
        return { positionToUpdate: position, tradeToEdit: trade };
    }

    return { positionToUpdate: position, tradeToEdit: null };
  }, [editingState, activePositions]);

  const renderPage = () => {
    switch (currentPage) {
        case 'account':
            return (
                <MyAccountPage 
                    user={MOCK_USER}
                    ledgerPositions={ledgerPositions}
                    onDeleteLedgerPosition={handleDeleteLedgerPosition}
                />
            );
        case 'main':
        default:
            return (
                <div className="container mx-auto p-4 md:p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        <div className="lg:col-span-2">
                            <Calculator 
                                onLogTrade={handleLogTrade} 
                                positionToUpdate={positionToUpdate}
                                tradeToEdit={tradeToEdit}
                                cancelUpdate={handleCancelUpdate}
                            />
                        </div>
                        <div className="lg:col-span-3">
                            <TradeLogger 
                                positions={activePositions}
                                onAddTradeToPosition={handleAddTradeToPosition}
                                onEditTrade={handleEditTrade}
                                onDeleteTrade={handleDeleteTrade}
                                onDeletePosition={handleDeletePosition}
                                onSavePositionToLedger={handleSavePositionToLedger}
                            />
                        </div>
                    </div>
                    <footer className="text-center mt-12 text-xs text-brand-text-secondary/50">
                        <p>Crypto Day Trading Calculator</p>
                        <p>Disclaimer: This tool is for informational purposes only. Not financial advice.</p>
                    </footer>
                </div>
            );
    }
  };
  
  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text-primary">
      <Header user={MOCK_USER} navigate={navigate} />
      {renderPage()}
    </div>
  );
}

export default App;
