import React, { useState, useCallback, useMemo } from 'react';
import { Calculator } from './components/Calculator';
import { TradeLogger } from './components/TradeLogger';
import { Position, Trade, ExchangeName, Market, User } from './types';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { ForgotPasswordPage } from './components/auth/ForgotPasswordPage';
import { Header } from './components/layout/Header';
import { MyAccountPage } from './components/account/MyAccountPage';


type Page = 'main' | 'login' | 'signup' | 'forgot-password' | 'account';

interface TradeData {
    positionId?: string;
    tradeId?: string;
    trade: Trade;
    pair: string;
    exchange: ExchangeName;
    market: Market;
    forceClose?: boolean;
}

const MOCK_USER: User = {
    name: 'Alex Crypto',
    email: 'alex.crypto@example.com',
};


function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>('main');

  const [activePositions, setActivePositions] = useState<Position[]>([]);
  const [ledgerPositions, setLedgerPositions] = useState<Position[]>([]);
  const [editingState, setEditingState] = useState<{ positionId: string; tradeId?: string } | null>(null);

  const navigate = (page: Page) => setCurrentPage(page);

  const handleLogin = useCallback(async (email?: string, password?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace this mock logic with a real API call to your backend
    if (email === 'fail@example.com') {
        throw new Error('Invalid email or password.');
    }

    console.log('Logging in with:', email, password);
    setUser(MOCK_USER);
    navigate('main');
  }, []);

  const handleSignup = useCallback(async (name?: string, email?: string, password?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // TODO: Replace this mock logic with a real API call to your backend
    if (email === 'exists@example.com') {
        throw new Error('An account with this email already exists.');
    }

    console.log('Signing up with:', name, email, password);
    setUser(MOCK_USER);
    navigate('main');
  }, []);
  
  const handleLogout = () => {
    setUser(null);
    navigate('main');
  };

  const handleLogTrade = useCallback((tradeData: TradeData) => {
    const { positionId, tradeId, trade, pair, exchange, market, forceClose } = tradeData;

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
            const targetId = positionId || prevPositions.find(p => p.pair === pair && p.market === market)?.id;
            
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
  }, []);

  const handleEditTrade = useCallback((positionId: string, tradeId: string) => {
    setEditingState({ positionId, tradeId });
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
        case 'login':
            return <LoginPage onLogin={handleLogin} navigate={navigate} />;
        case 'signup':
            return <SignupPage onSignup={handleSignup} navigate={navigate} />;
        case 'forgot-password':
            return <ForgotPasswordPage navigate={navigate} />;
        case 'account':
            if (user) {
                return (
                    <MyAccountPage 
                        user={user}
                        ledgerPositions={ledgerPositions}
                        onDeleteLedgerPosition={handleDeleteLedgerPosition}
                        onLogout={handleLogout}
                    />
                );
            }
            // If user tries to access account page while logged out, show login page
            return <LoginPage onLogin={handleLogin} navigate={navigate} />;
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
  
  const showHeader = !['login', 'signup', 'forgot-password'].includes(currentPage);

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text-primary">
      {showHeader && <Header user={user} onLogout={handleLogout} navigate={navigate} />}
      {renderPage()}
    </div>
  );
}

export default App;
