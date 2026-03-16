import { getStock, seedDatabaseIfEmpty } from '@/app/actions';
import Link from 'next/link';
import AuthModal from '@/components/AuthModal';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

const stockIcons: Record<string, string> = {
  'Pages': '📄',
  'Book Covers': '📕',
  'Ink': '🖋️',
  'Cloth': '🧵',
  'Uniform Buttons': '🔘',
  'Bag Material': '🎒',
  'Shoe Material': '👟',
};

const productionItems = [
  {
    name: 'Book',
    label: 'Book Production',
    image: '/images/book.png',
    accentColor: '#818cf8',
    badgeBg: 'rgba(99, 102, 241, 0.2)',
    badgeColor: '#a5b4fc',
    href: '/production/Book',
    active: true,
  },
  {
    name: 'Uniform',
    label: 'Uniform Production',
    image: '/images/uniform.png',
    accentColor: '#34d399',
    badgeBg: 'rgba(16, 185, 129, 0.2)',
    badgeColor: '#6ee7b7',
    href: '/production/Uniform',
    active: true,
  },
  {
    name: 'Bag',
    label: 'Bag Production',
    image: '/images/bag.png',
    accentColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.2)',
    badgeColor: '#fde68a',
    href: '/production/Bag',
    active: true,
  },
  {
    name: 'Shoe',
    label: 'Shoe Production',
    image: '/images/shoe.png',
    accentColor: '#6b6b82',
    badgeBg: 'rgba(107, 107, 130, 0.2)',
    badgeColor: '#9b9bb4',
    href: null,
    active: false,
  },
];

export default async function Dashboard() {
  await seedDatabaseIfEmpty();
  const stock = await getStock();

  return (
    <main style={{ padding: '2rem 2rem 4rem', maxWidth: '1320px', margin: '0 auto' }}>
      {/* Hero Banner */}
      <div className="hero-banner">
        <Image src="/images/hero.png" alt="Dashboard" width={1320} height={220} priority
          style={{ width: '100%', height: '220px', objectFit: 'cover' }} />
        <div className="hero-overlay">
          <div className="hero-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-indigo-light)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '0.5rem' }}>
                Dashboard
              </p>
              <h1>Welcome Back, Praful 👋</h1>
              <p>Production &amp; Stock Management Dashboard</p>
            </div>
            <AuthModal stock={stock} />
          </div>
        </div>
      </div>

      {/* Stock Availability */}
      <section style={{ marginBottom: '3.5rem' }}>
        <h2 className="section-heading">📦 Stock Availability</h2>
        <div className="stock-grid">
          {stock.map((item: any) => (
            <div key={item.id} className="stock-card">
              <div className="material-icon">{stockIcons[item.materialName] || '📋'}</div>
              <div className="material-name">{item.materialName}</div>
              <div className="material-value">
                {item.quantity.toLocaleString()}
                <span className="material-unit">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Production Options */}
      <section>
        <h2 className="section-heading">⚙️ Production Lines</h2>
        <div className="production-grid">
          {productionItems.map((item) => {
            const card = (
              <div className="production-card" style={{ opacity: item.active ? 1 : 0.5, cursor: item.active ? 'pointer' : 'not-allowed' }}>
                <div className="card-image-wrapper">
                  <Image src={item.image} alt={item.label} width={400} height={160}
                    style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                  <div className="card-image-overlay" />
                  <div className="card-badge"
                    style={{ background: item.badgeBg, color: item.badgeColor }}>
                    {item.active ? 'Active' : 'Coming Soon'}
                  </div>
                </div>
                <div className="card-body">
                  <h3>Start {item.label}</h3>
                  <span className="card-action" style={{ color: item.accentColor }}>
                    {item.active ? <>Produce <span>→</span></> : 'Coming Soon'}
                  </span>
                </div>
              </div>
            );

            return item.href ? (
              <Link href={item.href} key={item.name}>{card}</Link>
            ) : (
              <div key={item.name}>{card}</div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
