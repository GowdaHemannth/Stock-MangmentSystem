'use client';

import { useState } from 'react';
import { authorizeManager, updateStock } from '@/app/actions';

export default function AuthModal({ stock }: { stock: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [localStock, setLocalStock] = useState(
    stock.map(s => ({ materialName: s.materialName, quantity: s.quantity }))
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const res = await authorizeManager(password);
    if (res.success) {
      setIsAuthorized(true);
    } else {
      setError(res.error || 'Access Denied. Only authorized personnel can update stock.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    const res = await updateStock(localStock);
    if (res.success) {
      setIsOpen(false);
      setPassword('');
      setIsAuthorized(false);
    } else {
      setError(res.error || 'Update failed');
    }
    setIsUpdating(false);
  };

  const handleStockChange = (materialName: string, quantityStr: string) => {
    const qty = parseFloat(quantityStr) || 0;
    setLocalStock(prev =>
      prev.map(item => item.materialName === materialName ? { ...item, quantity: qty } : item)
    );
  };

  return (
    <>
      <button className="btn-primary" onClick={() => setIsOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>🔐</span> Update Stock
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsOpen(false)}>✕</button>

            {!isAuthorized ? (
              <form onSubmit={handleLogin}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'rgba(251, 113, 133, 0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    margin: '0 auto 1rem'
                  }}>⚠️</div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
                    Manager Authorization
                  </h2>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                    Only authorized managers can update stock
                  </p>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Username</label>
                  <input className="form-input" type="text" value="manager" disabled />
                </div>

                <div style={{ marginBottom: '1.75rem' }}>
                  <label className="form-label">Password</label>
                  <input className="form-input" type="password" value={password}
                    onChange={e => setPassword(e.target.value)} required
                    placeholder="Enter password" autoFocus />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
              </form>
            ) : (
              <form onSubmit={handleUpdate}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'rgba(99, 102, 241, 0.12)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    margin: '0 auto 1rem'
                  }}>📦</div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Update Raw Materials
                  </h2>
                </div>

                {error && <div className="alert-error">{error}</div>}

                <div style={{ maxHeight: '45vh', overflowY: 'auto', marginBottom: '1.75rem', paddingRight: '0.5rem' }}>
                  {localStock.map(item => (
                    <div key={item.materialName} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem 0', borderBottom: '1px solid var(--border-subtle)'
                    }}>
                      <label style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
                        {item.materialName}
                      </label>
                      <input className="form-input"
                        type="number" value={item.quantity}
                        onChange={e => handleStockChange(item.materialName, e.target.value)}
                        required
                        style={{ width: '120px', textAlign: 'right' }}
                      />
                    </div>
                  ))}
                </div>

                <button type="submit" className="btn-primary" disabled={isUpdating} style={{ width: '100%' }}>
                  {isUpdating ? 'Updating...' : 'Update Stock'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
