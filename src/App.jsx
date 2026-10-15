import { BusFront, MapPinned, ShieldCheck, WalletCards } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase.js';

const modules = [
  { icon: MapPinned, title: 'Live tracking', description: 'Passenger route view and operations map are planned for the next implementation steps.' },
  { icon: BusFront, title: 'Staff shifts', description: 'Driver, conductor, and inspector shift records with GPS trail.' },
  { icon: WalletCards, title: 'Payroll', description: 'Semi-monthly summaries, configurable rates, and CSV export.' },
];

export default function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <div className="brand-mark"><BusFront size={24} /></div>
        <div>
          <p className="eyebrow">TRANSPORT OPERATIONS</p>
          <h1>BusTrack <span>HRIS</span></h1>
        </div>
        <div className="status-pill"><span className={isSupabaseConfigured ? 'status-dot live' : 'status-dot'} />{isSupabaseConfigured ? 'Supabase configured' : 'Setup mode'}</div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">ONE VIEW. EVERY SHIFT.</p>
          <h2>Know where your buses are. Keep every shift accountable.</h2>
          <p className="hero-description">A mobile-first workspace for public bus tracking, staff attendance, and payroll management.</p>
          <div className="route-chip"><span className="route-dot" /> PITX <span className="route-line" /> MOA South Wing</div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="map-grid" />
          <div className="route-path"><span className="map-pin pin-a" /><span className="map-pin pin-b" /><span className="map-pin pin-c" /></div>
          <div className="bus-card"><BusFront size={27} /><div><strong>BusTrack</strong><small>Route tracking workspace</small></div><span className="live-label">READY</span></div>
        </div>
      </section>

      <section className="setup-banner">
        <div className="setup-icon"><ShieldCheck size={22} /></div>
        <div><strong>{isSupabaseConfigured ? 'Supabase environment detected' : 'Connect your Supabase project to continue'}</strong><p>{isSupabaseConfigured ? 'The app can now be wired to your project as authentication and data features are implemented.' : 'Copy .env.example to .env.local and add your Supabase project URL and anon/publishable key. Never place a service-role key in frontend variables.'}</p></div>
      </section>

      <section className="module-grid" aria-label="Planned modules">
        {modules.map(({ icon: Icon, title, description }, index) => (
          <article className="module-card" key={title}>
            <div className="module-icon"><Icon size={22} /></div>
            <p className="module-number">0{index + 1}</p>
            <h3>{title}</h3>
            <p>{description}</p>
          </article>
        ))}
      </section>
      <footer>BusTrack HRIS <span>•</span> Initial setup scaffold <span>•</span> Route geometry pending verification</footer>
    </main>
  );
}