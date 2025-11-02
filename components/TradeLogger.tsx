import React from 'react';
import { Position } from '../types';
import { PositionCard } from './PositionCard';

interface TradeLoggerProps {
  positions: Position[];
  onAddTradeToPosition: (positionId: string) => void;
  onEditTrade: (positionId: string, tradeId: string) => void;
  onDeleteTrade: (positionId: string, tradeId: string) => void;
  onDeletePosition: (positionId: string) => void;
  onSavePositionToLedger: (positionId: string, notes: string) => void;
}

export const TradeLogger: React.FC<TradeLoggerProps> = ({ positions, onAddTradeToPosition, onEditTrade, onDeleteTrade, onDeletePosition, onSavePositionToLedger }) => {
  return (
    <div className="bg-brand-surface p-6 rounded-lg shadow-lg border border-brand-border h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Trade Log</h2>
      {positions.length === 0 ? (
        <div className="text-center text-brand-text-secondary py-16">
          <p>No trades logged yet.</p>
          <p>Use the calculator to start tracking your positions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map(pos => (
            <PositionCard 
              key={pos.id} 
              position={pos} 
              onAddTrade={onAddTradeToPosition} 
              onEditTrade={onEditTrade}
              onDeleteTrade={onDeleteTrade}
              onDeletePosition={onDeletePosition}
              onSaveToLedger={onSavePositionToLedger}
            />
          ))}
        </div>
      )}
    </div>
  );
};