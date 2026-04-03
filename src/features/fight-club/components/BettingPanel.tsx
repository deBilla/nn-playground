import { useState } from 'react';
import { Plus, X, Trophy } from 'lucide-react';
import { useFightStore } from '../stores/fightStore';

export function BettingPanel() {
  const { bets, addBet, removeBet, clearBets, lastSettlement } = useFightStore();
  const [name, setName] = useState('');
  const [pick, setPick] = useState<'red' | 'blue'>('red');
  const [amount, setAmount] = useState('10');

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    addBet(name.trim(), pick, Number(amount));
    setName('');
    setAmount('10');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', margin: 0 }}>Bets</h3>
        {bets.length > 0 && (
          <button onClick={clearBets} style={{ fontSize: '10px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>
            Clear all
          </button>
        )}
      </div>

      {/* Add bet form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Name"
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ padding: '6px 10px', borderRadius: '4px', fontSize: '11px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', outline: 'none' }} />
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setPick('red')}
            style={{ flex: 1, padding: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: pick === 'red' ? '#991b1b' : '#1e293b', color: pick === 'red' ? '#fca5a5' : '#64748b' }}>
            RED
          </button>
          <button onClick={() => setPick('blue')}
            style={{ flex: 1, padding: '5px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 600, background: pick === 'blue' ? '#1e3a5f' : '#1e293b', color: pick === 'blue' ? '#93c5fd' : '#64748b' }}>
            BLUE
          </button>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" type="number" min="1"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', fontSize: '11px', background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', outline: 'none' }} />
          <button onClick={handleAdd} disabled={!name.trim()}
            style={{ padding: '6px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#2563eb', color: '#fff', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', opacity: name.trim() ? 1 : 0.4 }}>
            <Plus size={12} /> Bet
          </button>
        </div>
      </div>

      {/* Bet list */}
      {bets.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {bets.map((bet, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '5px 8px', borderRadius: '4px', background: '#0f172a',
              borderLeft: `3px solid ${bet.pick === 'red' ? '#ef4444' : '#3b82f6'}`,
            }}>
              <div>
                <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 500 }}>{bet.name}</span>
                <span style={{ fontSize: '10px', color: bet.pick === 'red' ? '#ef4444' : '#3b82f6', marginLeft: '6px' }}>
                  {bet.pick.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace' }}>${bet.amount}</span>
                <button onClick={() => removeBet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }}>
                  <X size={10} style={{ color: '#475569' }} />
                </button>
              </div>
            </div>
          ))}
          <div style={{ fontSize: '10px', color: '#475569', textAlign: 'right' }}>
            Total pool: ${bets.reduce((s, b) => s + b.amount, 0)}
          </div>
        </div>
      )}

      {/* Settlement results */}
      {lastSettlement && lastSettlement.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: '6px', padding: '10px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Trophy size={12} style={{ color: '#fbbf24' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#fbbf24' }}>Settlement</span>
          </div>
          {lastSettlement.map((s, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '11px' }}>
              <span style={{ color: '#94a3b8' }}>{s.name} ({s.pick})</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: s.won ? '#22c55e' : s.draw ? '#64748b' : '#ef4444' }}>
                {s.won ? `+$${s.amount}` : s.draw ? '$0' : `-$${s.amount}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
