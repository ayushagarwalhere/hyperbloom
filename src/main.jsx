'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Assistant from './Assistant';
const ResourceVisual = dynamic(() => import('./ResourceVisual'), { ssr: false, loading: () => <div className="scene-loading static-scene" aria-hidden="true" /> });

const resources = [
  { type: 'Shelter', title: 'Find an emergency shelter', distance: 'Official directory', detail: 'Search open shelters by ZIP code', meta: 'FEMA · Updated by local agencies', tone: 'violet', href: 'https://www.disasterassistance.gov/' },
  { type: 'Food', title: 'Find food near you', distance: 'Nationwide', detail: 'Connect with a local food bank', meta: 'Feeding America network', tone: 'blue', href: 'https://www.feedingamerica.org/find-your-local-foodbank' },
  { type: 'Mental health', title: '988 Suicide & Crisis Lifeline', distance: 'Call or text 988', detail: 'Free, confidential support · 24 / 7', meta: 'Call, text, or chat with a counselor', tone: 'green', href: 'https://988lifeline.org/' },
  { type: 'Weather', title: 'Official emergency alerts', distance: 'National Weather Service', detail: 'Check current alerts for your area', meta: 'Warnings · Watches · Advisories', tone: 'orange', href: 'https://www.weather.gov/alerts' },
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
  const [weatherMode, setWeatherMode] = useState('storm');
  const heroProgress = useRef(0);
  const [location, setLocation] = useState('Choose a location');
  const [locationMessage, setLocationMessage] = useState('');
  const searchInput = useRef(null);

  const filtered = useMemo(() => resources.filter((resource) => {
    const categoryMatch = active === 'All help' || resource.type === active;
    const queryMatch = `${resource.title} ${resource.type} ${resource.meta}`.toLowerCase().includes(query.toLowerCase());
    return categoryMatch && queryMatch;
  }), [active, query]);

  useEffect(() => {
    const onShortcut = (event) => {
      if ((event.key === '/' && !event.metaKey && !event.ctrlKey) || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k')) {
        const target = event.target;
        if (target instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(target.tagName)) return;
        event.preventDefault();
        searchInput.current?.focus();
      }
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const targets = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
    document.documentElement.classList.add('motion-ready');
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [filtered]);

  useEffect(() => {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const range = Math.max(1, hero.offsetHeight - window.innerHeight * 0.25);
        const progress = Math.max(0, Math.min(1, -rect.top / range));
        heroProgress.current = progress;
        hero.style.setProperty('--hero-scroll', progress.toFixed(3));
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);

  const locate = () => {
    setLocationMessage('');
    if (!navigator.geolocation) {
      setLocationMessage('Location is unavailable in this browser. Search by city or ZIP instead.');
      return;
    }
    setLocation('Finding location…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation(`${coords.latitude.toFixed(2)}, ${coords.longitude.toFixed(2)}`);
        setLocationMessage('Location set. Open a resource directory to check local availability.');
      },
      () => {
        setLocation('Choose a location');
        setLocationMessage('Location access was unavailable. Search by city or ZIP instead.');
      },
      { timeout: 8000, maximumAge: 300000 },
    );
  };

  return (
    <div className="app" data-weather={weatherMode}>
      <div className="grain" />
      <header className="nav shell">
        <a className="brand" href="#top" aria-label="Harborline home"><span className="brand-mark">H</span><span>harborline</span></a>
        <nav className={menuOpen ? 'nav-links open' : 'nav-links'}>
          <a href="#finder" onClick={() => setMenuOpen(false)}>Find help</a>
          <a href="#experience" onClick={() => setMenuOpen(false)}>Experience</a>
          <a href="#projects" onClick={() => setMenuOpen(false)}>Projects</a>
        </nav>
        <div className="nav-actions"><button className="text-button" onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>For organizations <Icon name="arrow" size={15} /></button><button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Icon name={menuOpen ? 'close' : 'menu'} /></button></div>
      </header>

      <main id="top">
        <section className="hero shell">
          <div className="hero-atmosphere" aria-hidden="true"><i /><i /><i /><div className="weather-window"><span /><span /><span /><span /></div></div>
          <div className="hero-copy" data-reveal="up">
            <div className="hero-eyebrow-row"><div className="eyebrow"><span className="pulse" /> Trusted crisis resource guide</div><div className="weather-mode" aria-label="Choose a weather scene"><button type="button" className={weatherMode === 'day' ? 'selected' : ''} onClick={() => setWeatherMode('day')} aria-pressed={weatherMode === 'day'}><span>☼</span> Sunny day</button><button type="button" className={weatherMode === 'storm' ? 'selected' : ''} onClick={() => setWeatherMode('storm')} aria-pressed={weatherMode === 'storm'}><span>☾</span> Stormy night</button></div></div>
            <h1>When things feel<br /><mark className="text-highlight">uncertain,</mark> start here.</h1>
            <p className="hero-subtitle">A calm, clear way to find trusted shelter, food support, emergency information, and someone to talk to — right when you need it.</p>
            <div className="hero-actions"><a className="button primary" href="#finder">Find help near me <Icon name="arrow" /></a><button className="button ghost" onClick={locate}><Icon name="pin" /> {location}</button></div>
            <div className="trust-line"><span>Start with trusted national directories</span><span className="trust-avatars"><i>F</i><i>9</i><i>N</i></span><span>Confirm local details before you travel</span></div>
            <a className="scroll-through-hint" href="#finder"><span /> Scroll through the window</a>
          </div>
          <div className="hero-art" data-reveal="up" style={{ '--reveal-delay': '120ms' }}>
            <ResourceVisual scrollProgress={heroProgress} weather={weatherMode} />
            <div className="float-card weather-card"><span className="mini-icon orange">!</span><div><strong>Check local alerts</strong><small>Official updates · National Weather Service</small></div><span className="card-arrow">↗</span></div>
            <div className="float-card quote-card"><span className="quote-mark">“</span><p>You don’t have to<br />figure this out alone.</p></div>
          </div>
        </section>

        <section className="finder shell" id="finder">
          <div className="section-heading" data-reveal="up"><div><span className="section-kicker">01 / Find what you need</span><h2>Help that meets you<br /><span>where you are.</span></h2></div><p>Start with trusted national directories, then confirm local services, hours, and availability for your area.</p></div>
          <div className="search-row" data-reveal="up"><div className="search-box"><Icon name="search" size={20} /><input ref={searchInput} aria-label="Search resources" placeholder="Search shelter, food, counseling..." value={query} onChange={(event) => setQuery(event.target.value)} /><kbd>/</kbd></div><button className="location-select" onClick={locate}><Icon name="pin" size={17} /> {location}<span>⌄</span></button></div>
          {locationMessage && <p className="location-message" role="status">{locationMessage}</p>}
          <Assistant />
          <div className="category-list" data-reveal="up">{categories.map((category) => <button key={category} className={active === category ? 'category active' : 'category'} onClick={() => setActive(category)}>{category}{category === 'All help' && <span>{resources.length}</span>}</button>)}</div>
          <div className="resource-grid">{filtered.map((resource, index) => <article data-reveal="up" style={{ '--reveal-delay': `${index * 70}ms` }} className={`resource-card ${resource.tone}`} key={resource.title}><div className="resource-top"><span className="resource-type">{resource.type}</span><span>{resource.distance}</span></div><h3>{resource.title}</h3><p className="resource-detail">{resource.detail}</p><div className="resource-bottom"><span>{resource.meta}</span><a href={resource.href} target="_blank" rel="noreferrer" aria-label={`Open ${resource.title} in a new tab`}><Icon name="arrow" size={16} /></a></div></article>)}</div>
          {filtered.length === 0 && <div className="empty-state">No matches yet. Try a broader search or choose “All help”.</div>}
          <div className="view-all"><span>This prototype links to nationwide directories; it does not show live neighborhood listings yet.</span><span>Showing {filtered.length} directories</span></div>
        </section>

        <section className="principles shell" id="experience">
          <div className="section-heading compact" data-reveal="up"><div><span className="section-kicker">02 / Experience</span><h2>Built around the<br /><span>moments that matter.</span></h2></div><p>Every choice is shaped by what people need when time, signal, and energy are limited.</p></div>
          <div className="principle-grid">{[['01 / FIND','One clear next step','Start with shelter, food, weather, or someone to talk to. No account and no long intake form.'],['02 / TRUST','Sources you can verify','Go directly to established public and community directories, with a reminder to check current hours and availability.'],['03 / ACCESS','Designed for a weak signal','Keep the page light, make the essential actions obvious, and avoid making help depend on an assistant or animation.']].map(([number,title,description], index) => <div className="principle" data-reveal="up" style={{ '--reveal-delay': `${index * 90}ms` }} key={number}><span className="number">{number}</span><h3>{title}</h3><p>{description}</p></div>)}</div>
        </section>

        <section className="projects shell" id="projects">
          <div className="section-heading" data-reveal="up"><div><span className="section-kicker">03 / Projects</span><h2>Small tools for<br /><span>hard moments.</span></h2></div><p>Practical pieces of a local support system, gathered into one quiet place.</p></div>
          <div className="project-grid"><a data-reveal="up" className="project-card project-feature" href="#finder"><span className="project-index">01 — QUICK-FINDER</span><span className="project-symbol">⌕</span><h3>Local crisis resource finder</h3><p>A single starting point for essential needs, with trusted directories for local follow-through.</p><span className="project-link">Explore resources <Icon name="arrow" size={15} /></span></a><a data-reveal="up" style={{ '--reveal-delay': '80ms' }} className="project-card" href="https://www.weather.gov/alerts" target="_blank" rel="noreferrer"><span className="project-index">02 — STORM READY</span><span className="project-symbol">↗</span><h3>Emergency information</h3><p>Quick access to official weather alerts and response information.</p><span className="project-link">Open alerts <Icon name="arrow" size={15} /></span></a><a data-reveal="up" style={{ '--reveal-delay': '160ms' }} className="project-card" href="https://988lifeline.org/" target="_blank" rel="noreferrer"><span className="project-index">03 — HUMAN SUPPORT</span><span className="project-symbol">♡</span><h3>Mental health support</h3><p>A direct route to free, confidential crisis counseling in the US.</p><span className="project-link">Reach 988 <Icon name="arrow" size={15} /></span></a></div>
        </section>

        <section className="cta shell" id="about" data-reveal="up"><div><span className="section-kicker">04 / You are not alone</span><h2>Keep a little<br /><em>light</em> nearby.</h2></div><div className="cta-copy"><p>Save Harborline for later, share it with someone you love, or help us make trusted local information easier to reach.</p><a className="button light" href="#finder">Explore Harborline <Icon name="arrow" /></a></div><div className="cta-orbit" aria-hidden="true"><div className="orbit-dot" /><div className="orbit-ring" /></div></section>
      </main>
      <footer className="showcase-footer" id="footer" data-reveal="up">
        <span className="footer-beacon" aria-hidden="true" />
        <div className="footer-panel">
          <div className="footer-topline">
            <div className="footer-message"><span className="footer-kicker">HARBORLINE · LOCAL SUPPORT GUIDE</span><h2>When it feels hard<br />to know where to start.</h2></div>
            <nav className="footer-nav" aria-label="Footer navigation"><a href="#finder">Find help</a><a href="#experience">How it works</a><a href="#projects">Resources</a><a href="#top">Back to top ↑</a></nav>
          </div>
          <a className="footer-wordmark" href="#top" aria-label="Harborline home">Harborline</a>
          <div className="footer-baseline"><span>Trusted directories for the moments that matter.</span><span>U.S. resources · Confirm local hours and availability</span></div>
        </div>
      </footer>
    </div>
  );
}
