'use client';

import { useState, useMemo } from 'react';
import { produceProduct } from '@/app/actions';

export default function ProductionForm({
  product,
  rules,
  currentStock,
  history,
}: {
  product: string,
  rules: any[],
  currentStock: any[],
  history: any[],
}) {
  const [productionType, setProductionType] = useState(`Full ${product} Production`);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [pagesPerBook, setPagesPerBook] = useState<number>(100);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatedStock, setUpdatedStock] = useState<any[] | null>(null);
  const [productionResult, setProductionResult] = useState<any>(null);
  const [viewingHistoryEntry, setViewingHistoryEntry] = useState<any>(null);

  const productionOptions = product === 'Book'
    ? ['Full Book Production', 'Pages Production Only', 'Cover Production Only']
    : [`Full ${product} Production`];

  const previewAmount = Number(quantity) || 0;

  // Custom rules logic for step-by-step production
  const effectiveRules = useMemo(() => {
    if (product !== 'Book') return rules;

    return rules.map((rule: any) => {
      if (rule.material === 'Pages') {
        if (productionType === 'Cover Production Only') return { ...rule, quantityRequired: 0 };
        return { ...rule, quantityRequired: pagesPerBook };
      }
      if (rule.material === 'Book Covers') {
        if (productionType === 'Pages Production Only') return { ...rule, quantityRequired: 0 };
        return rule;
      }
      if (rule.material === 'Ink') {
        if (productionType === 'Cover Production Only') return { ...rule, quantityRequired: 0 };
        return { ...rule, quantityRequired: (pagesPerBook / 100) * 0.02 };
      }
      return rule;
    }).filter((r: any) => r.quantityRequired > 0);
  }, [product, rules, pagesPerBook, productionType]);

  // Stock Validation
  const validation = useMemo(() => {
    if (previewAmount <= 0) return { valid: true, errors: [] as string[] };
    const errors: string[] = [];
    for (const rule of effectiveRules) {
      const needed = rule.quantityRequired * previewAmount;
      const stockItem = currentStock.find((s: any) => s.materialName === rule.material);
      const available = stockItem ? stockItem.quantity : 0;
      if (available < needed) {
        errors.push(`${rule.material}: need ${needed.toLocaleString()}, only ${available.toLocaleString()} available`);
      }
    }
    return { valid: errors.length === 0, errors };
  }, [previewAmount, effectiveRules, currentStock]);

  const remainingPreview = useMemo(() => {
    if (previewAmount <= 0) return [];
    return effectiveRules.map((rule: any) => {
      const stockItem = currentStock.find((s: any) => s.materialName === rule.material);
      const available = stockItem ? stockItem.quantity : 0;
      const needed = rule.quantityRequired * previewAmount;
      const remaining = available - needed;
      return { material: rule.material, current: available, consumed: needed, remaining, unit: stockItem?.unit || '', isShort: remaining < 0 };
    });
  }, [previewAmount, effectiveRules, currentStock]);

  const maxProducible = useMemo(() => {
    if (product !== 'Book' || effectiveRules.length === 0) return null;
    let maxBooks = Infinity;
    for (const rule of effectiveRules) {
      const stockItem = currentStock.find((s: any) => s.materialName === rule.material);
      const available = stockItem ? stockItem.quantity : 0;
      const maxForThis = rule.quantityRequired > 0 ? Math.floor(available / rule.quantityRequired) : Infinity;
      if (maxForThis < maxBooks) maxBooks = maxForThis;
    }
    return maxBooks === Infinity ? 0 : maxBooks;
  }, [product, effectiveRules, currentStock]);

  const totalProduced = useMemo(() => {
    return history.reduce((sum: number, entry: any) => sum + entry.quantity, 0);
  }, [history]);

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || quantity <= 0 || !validation.valid) return;

    setIsSubmitting(true);
    setStatus({ type: null, message: '' });
    setUpdatedStock(null);
    setProductionResult(null);

    // Prepare metadata
    const metadataObject: any = { type: productionType };
    if (product === 'Book') {
      metadataObject.pagesPerBook = pagesPerBook;
      // Calculate consumed materials for metadata storage
      effectiveRules.forEach(rule => {
        metadataObject[`consumed_${rule.material}`] = rule.quantityRequired * Number(quantity);
      });
    }

    const res = await produceProduct(product, Number(quantity), JSON.stringify(metadataObject));

    if (res.success) {
      setUpdatedStock(remainingPreview);
      if (product === 'Book') {
        setProductionResult({
          books: Number(quantity),
          pagesPerBook,
          type: productionType,
          totalProduced: totalProduced + Number(quantity)
        });
      }
      setStatus({ type: 'success', message: `✅ Production successful! ${quantity} items produced.` });
      setQuantity('');
    } else {
      setStatus({ type: 'error', message: res.error || 'Production failed.' });
    }
    setIsSubmitting(false);
  };

  return (
    <div style={{ animation: 'fadeSlideUp 0.5s ease-out' }}>
      {/* 📘 BOOK PRODUCTION INSTRUCTIONS (NEW) */}
      {product === 'Book' && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)', padding: '1.25rem', borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '2rem',
          backdropFilter: 'blur(10px)',
        }}>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--accent-indigo-light)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📖</span> Production Guide
          </h3>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', listStyle: 'none' }}>
            <li style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-amber)' }}>1.</span> 
              <span>Produce <strong>Book Covers</strong> and <strong>Pages</strong> separately using the dropdown below.</span>
            </li>
            <li style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-amber)' }}>2.</span> 
              <span>Use "Full Book Production" once both materials are ready to finalize books.</span>
            </li>
            <li style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-amber)' }}>3.</span> 
              <span>Check the <strong>History</strong> below to view exact details for each batch.</span>
            </li>
          </ul>
        </div>
      )}

      {/* STATS SUMMARY */}
      {product === 'Book' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Books Produced', value: totalProduced.toLocaleString(), icon: '📖', color: '#818cf8' },
            { label: 'Pages in Stock', value: (currentStock.find((s: any) => s.materialName === 'Pages')?.quantity || 0).toLocaleString(), icon: '📄', color: '#fbbf24' },
            { label: 'Covers in Stock', value: (currentStock.find((s: any) => s.materialName === 'Book Covers')?.quantity || 0).toLocaleString(), icon: '📕', color: '#34d399' },
            { label: 'Max Possible Now', value: maxProducible?.toLocaleString() || '0', icon: '🎯', color: '#fb7185' },
          ].map(stat => (
            <div key={stat.label} className="glass-panel" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleProduce} className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Workflow Step</label>
          <select className="form-input" value={productionType} onChange={(e) => setProductionType(e.target.value)}>
            {productionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>

        {product === 'Book' && productionType !== 'Cover Production Only' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Pages Per Book</label>
            <input className="form-input" type="number" value={pagesPerBook} onChange={e => setPagesPerBook(Number(e.target.value))} min="1" />
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <label className="form-label">Batch Quantity</label>
          <input className="form-input" type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} placeholder="Quantity" required />
          {product === 'Book' && previewAmount <= 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
              💡 Available for {maxProducible?.toLocaleString()} batches
            </div>
          )}
        </div>

        {/* VALIDATION & PREVIEW */}
        {previewAmount > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            {!validation.valid ? (
              <div className="alert-error" style={{ fontSize: '0.85rem' }}>
                {validation.errors.map((err, i) => <div key={i}>• {err}</div>)}
              </div>
            ) : (
              <div style={{ color: 'var(--accent-emerald)', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                <span>✅</span> Stock valid for {previewAmount} items
              </div>
            )}

            <div style={{ border: '1px solid var(--border-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <tr>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'left' }}>Material</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Deduct</th>
                    <th style={{ padding: '0.5rem 1rem', textAlign: 'right' }}>Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingPreview.map(item => (
                    <tr key={item.material} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.5rem 1rem' }}>{item.material}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: 'var(--accent-amber)' }}>-{item.consumed.toLocaleString()}</td>
                      <td style={{ padding: '0.5rem 1rem', textAlign: 'right', color: item.isShort ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>{item.remaining.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status.message && <div className={status.type === 'success' ? 'alert-success' : 'alert-error'}>{status.message}</div>}

        <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSubmitting || !validation.valid || !quantity}>
          {isSubmitting ? 'Starting Batch...' : `Run ${productionType}`}
        </button>
      </form>

      {/* 📜 RECENT HISTORY WITH VIEW DETAILS (NEW) */}
      <section style={{ marginTop: '3rem' }}>
        <h3 className="section-heading">📜 Production History</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {history.length === 0 ? (
            <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>No history found</div>
          ) : history.map((entry: any) => {
            const meta = entry.metadata ? JSON.parse(entry.metadata) : null;
            return (
              <div key={entry.id} className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{entry.quantity} {entry.product}(s) produced</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{new Date(entry.date).toLocaleString()}</div>
                  {meta && <div style={{ fontSize: '0.75rem', color: 'var(--accent-indigo-light)', marginTop: '0.25rem' }}>Type: {meta.type}</div>}
                </div>
                <button 
                  className="back-button" 
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--accent-indigo)' }}
                  onClick={() => setViewingHistoryEntry({ ...entry, meta })}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETAILS MODAL (NEW) */}
      {viewingHistoryEntry && (
        <div className="modal-overlay" onClick={() => setViewingHistoryEntry(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <button className="close-button" onClick={() => setViewingHistoryEntry(null)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Production Details</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Date & Time</div>
              <div style={{ fontSize: '0.95rem' }}>{new Date(viewingHistoryEntry.date).toLocaleString()}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Total Quantity</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{viewingHistoryEntry.quantity} {viewingHistoryEntry.product}(s)</div>
              </div>
              {viewingHistoryEntry.meta?.pagesPerBook && (
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Pages Per Book</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{viewingHistoryEntry.meta.pagesPerBook}</div>
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>Materials Consumed</div>
              {viewingHistoryEntry.meta && Object.entries(viewingHistoryEntry.meta).map(([key, val]) => {
                if (key.startsWith('consumed_')) {
                  const matName = key.replace('consumed_', '');
                  return (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{matName}</span>
                      <strong style={{ color: 'var(--accent-amber)' }}>{Number(val).toLocaleString()}</strong>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setViewingHistoryEntry(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
