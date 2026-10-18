'use client';

import { useMemo, useState } from 'react';
import Assistant from './Assistant';
import CrisisScene from './CrisisScene';

const resources = [
  { type: 'Shelter', title: 'Northside Community Shelter', distance: '0.8 mi', detail: 'Open · 24 beds available', meta: 'Warm beds · Showers · Pets welcome', tone: 'violet' },
  { type: 'Food', title: 'Riverside Food Pantry', distance: '1.4 mi', detail: 'Open until 6:00 PM', meta: 'Groceries · No ID required', tone: 'blue' },
  { type: 'Mental health', title: '988 Suicide & Crisis Lifeline', distance: 'Call or text', detail: 'Available 24 / 7 · 150+ languages', meta: 'Confidential · Free · Trained counselors', tone: 'green' },
  { type: 'Weather', title: 'County Emergency Operations', distance: 'Updated 8 min ago', detail: 'Flash flood warning in your area', meta: 'Official alerts · Evacuation routes', tone: 'orange' },
];

const categories = ['All help', 'Shelter', 'Food', 'Mental health', 'Weather'];

function Icon({ name, size = 18 }) {
  const paths = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.2-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.8 2.1Z" />,
    menu: <><path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    heart: <path d="M20.8 8.6c0 5.4-8.8 10.4-8.8 10.4S3.2 14 3.2 8.6A4.6 4.6 0 0 1 12 6.2a4.6 4.6 0 0 1 8.8 2.4Z" />,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function App() {
  const [active, setActive] = useState('All help');
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useState('Brooklyn, NY');
  const [activeScene, setActiveScene] = useState(0);

  const filtered = useMemo(() => resources.filter((resource) => {
    const categoryMatch = active === 'All help' || resource.type === active;
    const queryMatch = `${resource.title} ${resource.type} ${resource.meta}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  }), [active, query]);

  const locate = () => {
    setLocation('Current location');
    navigator.geolocation?.getCurrentPosition(() => {}, () => setLocation('Brooklyn, NY'));
  };

  return (
    <div className="app">
      <div className="grain" />
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Harborline home"><span className="brand-mark">H</span><span>harborline</span></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#finder" onClick={() => setMenuOpen(false)}>Find help</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
        </nav>
        <div className="nav-actions"><button className="text-button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>For organizations <Icon name="arrow" size={15} /></button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse" /> Live local support directory</div>
            <h1>When things feel<br /><em>uncertain,</em> start here.</h1>
            <p className="hero-subtitle">A calm, clear way to find verified shelter, food, emergency updates, and someone to talk to — right when you need it.</p>
            <div className="hero-actions"><a className="button primary" href="#finder">Find help near me <Icon name="arrow" /></a><button className="button ghost" onClick={locate}><Icon name="pin" /> {location}</button></div>
            <div className="trust-line"><span>Updated by people who care</span><span className="trust-avatars"><i>J</i><i>M</i><i>A</i></span><span>12,480 resources checked</span></div>
          </div>
          <div className="hero-art">
            <CrisisScene activeScene={activeScene} />
            <div className="float-card weather-card"><span className="mini-icon orange">!</span><div><strong>Flash flood warning</strong><small>Brooklyn · Updated just now</small></div><span className="card-arrow">↗</span></div>
            <div className="float-card quote-card"><span className="quote-mark">“</span><p>You don’t have to<br />figure this out alone.</p></div>
            <div className="scene-switcher">{[0, 1, 2].map((scene) => <button key={scene} className={activeScene === scene ? 'selected' : ''} onClick={() => setActiveScene(scene)} aria-label={`Show 3D scene ${scene + 1}`} />)}</div>
          </div>
        </section>

        <section className="finder shell" id="finder">
          <div className="section-heading"><div><span className="section-kicker">01 / Find what you need</span><h2>Help that meets you<br /><span>where you are.</span></h2></div><p>Search a trusted, human-reviewed directory built for the moments when every second matters.</p></div>
          <div className="search-row"><div className="search-box"><Icon name="search" size={20} /><input aria-label="Search resources" placeholder="Search shelter, food, counseling..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>⌘ K</kbd></div><button className="location-select" onClick={locate}><Icon name="pin" size={17} /> {location}<span>⌄</span></button></div>
          <Assistant />
          <div className="category-list">{categories.map((category) => <button key={category} className={active === category ? 'category active' : 'category'} onClick={() => setActive(category)}>{category}{category === 'All help' && <span>{resources.length}</span>}</button>)}</div>
          <div className="resource-grid">{filtered.map((resource) => <article className={`resource-card ${resource.tone}`} key={resource.title}><div className="resource-top"><span className="resource-type">{resource.type}</span><span>{resource.distance}</span></div><h3>{resource.title}</h3><p className="resource-detail">{resource.detail}</p><div className="resource-bottom"><span>{resource.meta}</span><button aria-label={`Open ${resource.title}`}><Icon name="arrow" size={16} /></button></div></article>)}</div>
          {filtered.length === 0 && <div className="empty-state">No matches yet. Try a broader search or choose “All help”.</div>}
          <div className="view-all"><a href="#finder">View all resources <Icon name="arrow" size={16} /></a><span>Showing {filtered.length} of 128 nearby resources</span></div>
        </section>

        <section className="principles shell" id="how-it-works">
          <div className="section-heading compact"><div><span className="section-kicker">02 / Designed for real life</span><h2>Simple by design.<br /><span>Thoughtful by default.</span></h2></div></div>
          <div className="principle-grid"><div className="principle"><span className="number">01</span><h3>Useful in a hurry</h3><p>No maze of menus. The right resource is never more than a few taps away, even on a weak connection.</p></div><div className="principle"><span className="number">02</span><h3>Local, not generic</h3><p>Results are shaped around your neighborhood, with hours, availability, and access details you can trust.</p></div><div className="principle"><span className="number">03</span><h3>Human-reviewed</h3><p>We prioritize reliable public and community sources, and make it easy to flag information that needs an update.</p></div></div>
        </section>

        <section className="cta shell" id="about"><div><span className="section-kicker">03 / You are not alone</span><h2>Keep a little<br /><em>light</em> nearby.</h2></div><div className="cta-copy"><p>Save Harborline for later, share it with someone you love, or help us keep local information accurate.</p><a className="button light" href="#finder">Explore Harborline <Icon name="arrow" /></a></div><div className="cta-orbit" aria-hidden="true"><div className="orbit-dot" /><div className="orbit-ring" /></div></section>
      </main>
      <footer className="footer shell"><a className="brand" href="#top"><span className="brand-mark">H</span><span>harborline</span></a><span>Made for the moments in between.</span><div><a href="#about">About</a><a href="#finder">Resources</a><a href="#top">Back to top ↑</a></div></footer>
    </div>
  );
}
