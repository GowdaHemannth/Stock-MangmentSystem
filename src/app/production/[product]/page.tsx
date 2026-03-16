import { getStock, getProductionRules, getProductionHistory } from '@/app/actions';
import ProductionForm from '@/components/ProductionForm';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const productMeta: Record<string, { emoji: string, image: string, accent: string, bgOverlay: string }> = {
  Book:    { emoji: '📖', image: '/images/book.png',    accent: '#818cf8', bgOverlay: 'rgba(30, 27, 75, 0.82)' },
  Uniform: { emoji: '👔', image: '/images/uniform.png', accent: '#34d399', bgOverlay: 'rgba(6, 40, 30, 0.82)' },
  Bag:     { emoji: '🎒', image: '/images/bag.png',     accent: '#fbbf24', bgOverlay: 'rgba(45, 30, 10, 0.82)' },
  Shoe:    { emoji: '👟', image: '/images/shoe.png',     accent: '#6b6b82', bgOverlay: 'rgba(20, 20, 30, 0.82)' },
};

export default async function ProductionPage({ params }: { params: { product: string } }) {
  const { product } = await params;
  const stock = await getStock();
  const allRules = await getProductionRules();
  const productRules = allRules.filter((r: any) => r.product === product);
  const history = await getProductionHistory(product);
  const meta = productMeta[product] || { emoji: '🏭', image: '/images/hero.png', accent: '#818cf8', bgOverlay: 'rgba(6, 5, 14, 0.85)' };

  return (
    <>
      {/* Full-page background image */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -2,
      }}>
        <Image src={meta.image} alt="" fill
          style={{ objectFit: 'cover', objectPosition: 'center', filter: 'blur(8px) brightness(0.4) saturate(1.3)' }}
          priority quality={90} />
      </div>
      {/* Dark overlay for readability */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1,
        background: meta.bgOverlay,
        backdropFilter: 'blur(2px)',
      }} />

      <main style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Product Hero */}
        <div className="hero-banner" style={{ marginBottom: '2.5rem' }}>
          <Image src={meta.image} alt={product} width={900} height={200}
            style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
          <div className="hero-overlay">
            <div className="hero-content" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%' }}>
              <Link href="/">
                <button className="back-button">← Back</button>
              </Link>
              <h1 style={{ fontSize: '2rem' }}>{meta.emoji} {product} Production</h1>
            </div>
          </div>
        </div>

        {/* Current Stock */}
        <section style={{ marginBottom: '2.5rem', animation: 'fadeSlideUp 0.5s ease-out 0.2s both' }}>
          <h2 className="section-heading">Current Stock Available</h2>
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
            {productRules.length > 0 ? productRules.map((rule: any) => {
              const stockItem = stock.find((s: any) => s.materialName === rule.material);
              return (
                <div key={rule.id} style={{ flex: '1 1 180px' }}>
                  <span style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {rule.material}
                  </span>
                  <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: meta.accent, letterSpacing: '-0.02em' }}>
                    {stockItem ? stockItem.quantity.toLocaleString() : 0}
                    <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-tertiary)', marginLeft: '0.3rem' }}>
                      {stockItem?.unit}
                    </span>
                  </strong>
                </div>
              );
            }) : (
              <div style={{ color: 'var(--text-tertiary)' }}>No production rules defined for {product}.</div>
            )}
          </div>
        </section>

        {/* Production Form */}
        {productRules.length > 0 && (
          <section style={{ animation: 'fadeSlideUp 0.5s ease-out 0.35s both' }}>
            <h2 className="section-heading">🚀 Production Details</h2>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <ProductionForm product={product} rules={productRules} currentStock={stock} history={history} />
            </div>
          </section>
        )}
      </main>
    </>
  );
}
