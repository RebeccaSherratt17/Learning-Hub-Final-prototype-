// Homepage — three hero variants, all sections wired
const { useState, useEffect, useRef, useMemo } = React;

// ---------- HERO VARIANT A: Split with red accent graphic ----------
const HeroA = () => (
  <section className="hero">
    <div className="container">
      <div className="hero-grid">
        <div>
          <p className="eyebrow" style={{ marginBottom: 28 }}>Diligent Learning Hub · Est. 2026</p>
          <h1>
            Diligent<br/>
            Learning <span className="red">Hub</span>
          </h1>
          <p className="hero-sub">
            Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness.
          </p>
          <p className="hero-overview">
            Across key governance, risk, and compliance topics — for directors, company secretaries, general counsel and executives.
          </p>
        </div>
        <div className="hero-graphic-a">
          <HeroAccentA />
        </div>
      </div>
      <Signposts />
    </div>
  </section>
);

const HeroAccentA = () => (
  <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    {/* Concentric semicircle motif — precise, editorial, non-decorative */}
    <rect x="0" y="0" width="480" height="480" fill="#FAFAFA" />
    {/* Fine grid */}
    <g opacity="0.4">
      {[...Array(9)].map((_, i) => (
        <line key={'v'+i} x1={i*60} y1="0" x2={i*60} y2="480" stroke="#DADADA" strokeWidth="0.5" />
      ))}
      {[...Array(9)].map((_, i) => (
        <line key={'h'+i} x1="0" y1={i*60} x2="480" y2={i*60} stroke="#DADADA" strokeWidth="0.5" />
      ))}
    </g>
    {/* Red arcs — layered semicircles */}
    {[0, 1, 2, 3, 4, 5].map(i => (
      <path
        key={i}
        d={`M ${60 + i*30} 380 A ${180 - i*30} ${180 - i*30} 0 0 1 ${420 - i*30} 380`}
        fill="none"
        stroke="#EE312E"
        strokeWidth={i === 0 ? "2" : "1"}
        opacity={1 - i * 0.14}
      />
    ))}
    {/* Thicker anchor arc */}
    <path d="M 60 380 A 180 180 0 0 1 420 380" fill="none" stroke="#EE312E" strokeWidth="2" />
    {/* Center marker */}
    <circle cx="240" cy="380" r="4" fill="#282E37" />
    <line x1="60" y1="380" x2="420" y2="380" stroke="#282E37" strokeWidth="1" />
    {/* Minimal labels */}
    <text x="60" y="410" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6F7377" letterSpacing="1">
      GOVERNANCE
    </text>
    <text x="420" y="410" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6F7377" letterSpacing="1" textAnchor="end">
      COMPLIANCE
    </text>
    <text x="240" y="170" fontFamily="Plus Jakarta Sans, sans-serif" fontSize="13" fontWeight="600" fill="#282E37" textAnchor="middle" letterSpacing="-0.3">
      Board-level education
    </text>
  </svg>
);

// ---------- HERO VARIANT B: Oversized editorial ----------
const HeroB = () => (
  <section className="hero hero-b">
    <div className="container">
      <div className="hero-b-grid">
        <div className="hero-b-text">
          <p className="eyebrow" style={{ marginBottom: 32, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 14, fontWeight: 600, color: 'var(--gray-5)' }}>Diligent Learning Hub</p>
          <h1>
            Education for<br/>
            the <span style={{color:'var(--red)'}}>modern</span> board
          </h1>
          <p className="hero-sub">
            Our Learning Hub brings together practical tools and expert insights to help business leaders strengthen their governance, risk, and compliance practices. Here, you'll find a curated collection of ready-to-use templates, professionally crafted courses and videos drawn from our premium eLearning platform, the Education & Templates Library.
          </p>
          <p className="hero-sub" style={{ marginTop: 16 }}>
            Whether you're building foundational frameworks or refining board operations, these resources are designed to save time and improve effectiveness.
          </p>
          <div style={{ marginTop: 32 }}>
            <a
              href="#library"
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('library');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Explore Resource Library
            </a>
          </div>
        </div>
        <div className="hero-b-image">
          <img src={window.__heroImg} alt="Professional reviewing content on a tablet" />
        </div>
      </div>
      <Signposts />
    </div>
  </section>
);

// ---------- HERO VARIANT C: Index / editorial columns ----------
const HeroC = () => (
  <section className="hero hero-c">
    <div className="container">
      <div className="hero-c-grid">
        <div>
          <p className="eyebrow" style={{ marginBottom: 32 }}>§ 01 — Welcome</p>
          <h1>
            Diligent<br/>
            Learning Hub
          </h1>
          <p className="hero-sub" style={{ marginTop: 32, fontSize: 20 }}>
            Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.
          </p>
        </div>
        <div>
          <p className="eyebrow" style={{ marginBottom: 0 }}>In this hub</p>
          <div className="hero-c-index">
            {window.LH_DATA.signposts.map((s, i) => (
              <a key={s.type} href={s.href} className="hero-c-row">
                <span className="hero-c-num">0{i+1}</span>
                <div>
                  <div className="hero-c-title">{s.type}</div>
                  <div style={{fontSize:13, color:'var(--gray-4)', marginTop:2}}>{s.count} resources</div>
                </div>
                <Icon name="arrow_outward" size={20} style={{color:'var(--gray-4)'}} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ---------- Signposts row ----------
const Signposts = () => (
  <div className="signposts">
    {window.LH_DATA.signposts.map(s => (
      <a key={s.type} href={s.href} className="signpost">
        <div className="signpost-icon"><Icon name={s.icon} size={32} /></div>
        <div className="signpost-title">{s.type}</div>
        <div className="signpost-count">{s.desc}</div>
        <Icon name="arrow_outward" size={18} className="signpost-arrow" />
      </a>
    ))}
  </div>
);

// ---------- Section 2: Popular + Newest ----------
const PopularSection = ({ showTier, setLibrarySort }) => {
  const WidgetItem = ({ item, rank }) => (
    <a href={item.href} className="widget-item">
      <CardThumb item={item} />
      <div>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <TypeBadge type={item.type} />
          {showTier && <TierBadge tier={item.tier} compact />}
        </div>
        <div className="widget-item-title">{item.title}</div>
        <div className="widget-item-meta">
          {rank && <span className="widget-item-rank">{rank}</span>}
          <span style={{fontSize:13, color:'var(--gray-4)'}}>{item.duration}</span>
        </div>
      </div>
    </a>
  );
  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <h2>Jump in: Popular and featured content</h2>
        </div>
        <div className="widgets">
          <div>
            <div className="widget-head">
              <h3>Most popular</h3>
              <a
                href="#library"
                onClick={(e) => {
                  e.preventDefault();
                  setLibrarySort && setLibrarySort('Most popular');
                  setTimeout(() => {
                    const el = document.getElementById('library');
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
                  }, 0);
                }}
              >
                See all <Icon name="arrow_forward" size={14} />
              </a>
            </div>
            <div className="widget-list">
              {window.LH_DATA.popular.map((item, i) => (
                <WidgetItem key={item.id} item={item} rank={`0${i+1}`} />
              ))}
            </div>
          </div>
          <div>
            <div className="widget-head">
              <h3>Newest</h3>
              <a
                href="#library"
                onClick={(e) => {
                  e.preventDefault();
                  setLibrarySort && setLibrarySort('Newest');
                  setTimeout(() => {
                    const el = document.getElementById('library');
                    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 24, behavior: 'smooth' });
                  }, 0);
                }}
              >
                See all <Icon name="arrow_forward" size={14} />
              </a>
            </div>
            <div className="widget-list">
              {window.LH_DATA.newest.map(item => (
                <WidgetItem key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------- Section 3: Partners marquee ----------
const PartnersSection = () => (
  <section className="section" style={{ padding: '48px 0' }}>
    <div className="container">
      <h2 style={{ marginBottom: 48, fontSize: 48, letterSpacing: '-0.03em', lineHeight: 1.05 }}>Our educational partners</h2>
    </div>
    <div className="marquee">
      <div className="marquee-track">
        {[...window.LH_DATA.partners, ...window.LH_DATA.partners].map((p, i) => (
          <div key={i} className="partner-logo">
            <img src={p.image} alt={p.name} />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Content type dropdown (multi-select, mirrors SortDropdown) ----------
const ContentTypeDropdown = ({ selected, toggle, options }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const active = selected.length;
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" className="select" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <Icon name="category" size={16} /> Sort: Content type{active > 0 && <>: <strong>{active === 1 ? selected[0] : `${active} selected`}</strong></>}
        <Icon name="expand_more" size={16} style={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease'}} />
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 220,
          background: '#fff', border: '1px solid var(--gray-2)', borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 30, padding: 4,
        }}>
          {options.map(opt => {
            const isOn = selected.includes(opt.label);
            return (
              <button
                key={opt.label}
                role="option"
                aria-selected={isOn}
                onClick={() => toggle(opt.label)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '10px 12px', fontSize: 14, textAlign: 'left',
                  background: isOn ? 'var(--gray-1)' : 'transparent',
                  color: 'var(--gray-5)', fontWeight: isOn ? 600 : 500,
                  borderRadius: 2, cursor: 'pointer',
                }}
              >
                <span>{opt.label} <span style={{color:'var(--gray-4)', fontWeight:500, marginLeft:6}}>{opt.count}</span></span>
                {isOn && <Icon name="check" size={16} style={{color:'var(--red)'}} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------- Sort dropdown ----------
const SortDropdown = ({ sort, setSort }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const options = ['Newest', 'Most popular', 'A–Z'];
  return (
    <div ref={ref} style={{position:'relative'}}>
      <button type="button" className="select" onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}>
        <Icon name="sort" size={16} /> Sort: <strong>{sort}</strong>
        <Icon name="expand_more" size={16} style={{transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease'}} />
      </button>
      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0, minWidth: 200,
          background: '#fff', border: '1px solid var(--gray-2)', borderRadius: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 30, padding: 4,
        }}>
          {options.map(opt => (
            <button
              key={opt}
              role="option"
              aria-selected={sort === opt}
              onClick={() => { setSort(opt); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 12px', fontSize: 14, textAlign: 'left',
                background: sort === opt ? 'var(--gray-1)' : 'transparent',
                color: 'var(--gray-5)', fontWeight: sort === opt ? 600 : 500,
                borderRadius: 2, cursor: 'pointer',
              }}
            >
              {opt}
              {sort === opt && <Icon name="check" size={16} style={{color:'var(--red)'}} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Section 4: Library ----------
const LibrarySection = ({ showTier, filtersExpanded, sort, setSort, selected, setSelected }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    let items = window.LH_DATA.library;

    // Apply each active filter group
    Object.entries(selected).forEach(([group, vals]) => {
      if (!vals || vals.length === 0) return;
      if (group === 'Content type') {
        items = items.filter(it => vals.includes(it.type));
      } else if (group === 'Tier') {
        items = items.filter(it => vals.includes(it.tier));
      } else if (group === 'Persona') {
        items = items.filter(it => (it.personas || []).some(s => vals.includes(s)));
      } else if (group === 'Region') {
        items = items.filter(it => (it.regions || []).some(s => vals.includes(s)));
      } else {
        // Subject (and any other group) → match against item.subjects
        items = items.filter(it => (it.subjects || []).some(s => vals.includes(s)));
      }
    });

    // Search query
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(it => it.title.toLowerCase().includes(q) || (it.desc || '').toLowerCase().includes(q));
    }

    // Sort
    if (sort === 'A–Z') {
      items = [...items].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'Most popular') {
      items = [...items].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    }
    // 'Newest' → keep source order

    return items;
  }, [selected, query, sort]);

  const toggleFilter = (group, label) => {
    setSelected(prev => {
      const cur = prev[group] || [];
      return { ...prev, [group]: cur.includes(label) ? cur.filter(x => x !== label) : [...cur, label] };
    });
  };

  const activeCount = Object.values(selected).reduce((a, v) => a + v.length, 0);

  return (
    <section className="section" id="library">
      <div className="container">
        <div className="section-head" style={{flexDirection:'column', alignItems:'flex-start', gap:16}}>
          <h2>Resource library</h2>
          <p style={{maxWidth: 700}}>Explore educational courses, ready-to-use templates, and videos to develop your expertise and enhance board effectiveness across key governance, risk, and compliance topics.</p>
        </div>

        <div className="library-bar">
          <div className="search">
            <Icon name="search" size={20} style={{color:'var(--gray-4)'}} />
            <input placeholder="Search courses, templates, videos…" value={query} onChange={e=>setQuery(e.target.value)} />
            {query && <button className="btn-ghost" onClick={()=>setQuery('')} style={{padding:4}}><Icon name="close" size={18} style={{color:'var(--gray-4)'}} /></button>}
          </div>
          <ContentTypeDropdown
            selected={selected['Content type'] || []}
            toggle={(label) => toggleFilter('Content type', label)}
            options={window.LH_DATA.filters['Content type']}
          />
          <SortDropdown sort={sort} setSort={setSort} />
        </div>

        <div className="library-grid">
          <aside>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
              <p className="eyebrow" style={{margin:0}}>Filters {activeCount > 0 && <span style={{color:'var(--red)', marginLeft:6}}>({activeCount})</span>}</p>
              {activeCount > 0 && <button className="btn-ghost" onClick={()=>setSelected({})} style={{fontSize:12, color:'var(--blue-3)'}}>Clear all</button>}
            </div>
            <div className="filters">
              {Object.entries(window.LH_DATA.filters).filter(([group]) => group !== 'Content type').map(([group, opts]) => {
                // Nested subject groups (object, not array)
                if (!Array.isArray(opts)) {
                  return (
                    <details key={group} className="filter-group" open={filtersExpanded}>
                      <summary>
                        {group}
                        <Icon name="expand_more" size={18} className="chev" />
                      </summary>
                      <div className="filter-opts" style={{gap:4}}>
                        {Object.entries(opts).map(([sub, subOpts]) => (
                          <details key={sub} className="filter-subgroup">
                            <summary>
                              <span>{sub}</span>
                              <Icon name="expand_more" size={16} className="chev" />
                            </summary>
                            <div className="filter-opts" style={{paddingLeft:18, paddingTop:6}}>
                              {subOpts.map(label => {
                                const checked = (selected[group] || []).includes(label);
                                return (
                                  <label key={label} className="filter-opt">
                                    <input type="checkbox" checked={checked} onChange={()=>toggleFilter(group, label)} />
                                    <span>{label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  );
                }
                // Flat array groups
                return (
                  <details key={group} className="filter-group" open={filtersExpanded}>
                    <summary>
                      {group}
                      <Icon name="expand_more" size={18} className="chev" />
                    </summary>
                    <div className="filter-opts">
                      {opts.map(o => {
                        const checked = (selected[group] || []).includes(o.label);
                        return (
                          <label key={o.label} className="filter-opt">
                            <input type="checkbox" checked={checked} onChange={()=>toggleFilter(group, o.label)} />
                            <span>{o.label}</span>
                            <span className="count">{o.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </aside>

          <div>
            <div className="results-head">
              <div className="results-count"><strong>{results.length}</strong> resources</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {Object.entries(selected).flatMap(([g,vals]) => vals.map(v => (
                  <span key={g+v} className="pill" style={{background:'var(--gray-1)', cursor:'pointer'}} onClick={()=>toggleFilter(g,v)}>
                    {v} <Icon name="close" size={12} />
                  </span>
                )))}
              </div>
            </div>
            <div className="results-grid">
              {results.map(item => (
                <ContentCard key={item.id} item={item} showTier={showTier} />
              ))}
            </div>
            <div className="pagination">
              <button className="page-btn"><Icon name="chevron_left" size={18} /></button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">4</button>
              <span className="page-btn" style={{cursor:'default'}}>…</span>
              <button className="page-btn">17</button>
              <button className="page-btn"><Icon name="chevron_right" size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ---------- Section 5: Got questions ----------
const QuestionsSection = () => (
  <section className="section">
    <div className="container">
      <div className="questions">
        <div>
          <h2>Got questions?</h2>
        </div>
        <div>
          <p className="questions-body">
            We're here to help! If you have any questions, email us:
          </p>
          <a href="mailto:certifications@diligent.com" className="questions-email">
            <Icon name="mail" size={18} />
            certifications@diligent.com
          </a>
        </div>
      </div>
    </div>
  </section>
);

// ---------- Section 6: Certifications ----------
const CertificationsSection = () => (
  <section className="section" id="certifications">
    <div className="container">
      <div className="section-head">
        <h2>Professionally-accredited certifications</h2>
        <p>Empower your business to achieve governance excellency. With Diligent One Platform, you can unlock unlimited access to Diligent's <a href="https://www.diligent.com/solutions/board-education" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--red)', textDecoration: 'underline' }}>Education & Templates Library</a>, featuring six professionally-accredited certifications.</p>
      </div>
      <div className="certs-grid">
        {window.LH_DATA.certifications.map((c) => (
          <a
            key={c.title}
            href={c.url || '#'}
            target={c.url && c.url !== '#' ? '_blank' : undefined}
            rel={c.url && c.url !== '#' ? 'noopener noreferrer' : undefined}
            className="cert-badge"
            aria-label={`Learn more about ${c.title}`}
          >
            <img src={c.image} alt={c.title} />
            <span className="cert-badge-sr">{c.title}</span>
          </a>
        ))}
      </div>
    </div>
  </section>
);

// ---------- Tweaks Panel ----------
const TweaksPanel = ({ visible, tweaks, setTweak }) => {
  const row = (key, label, options) => (
    <div className="tweak-row">
      <label>{label}</label>
      <div className="tweak-opts">
        {options.map(opt => (
          <button key={opt.value} className={`tweak-opt ${tweaks[key] === opt.value ? 'active' : ''}`} onClick={()=>setTweak(key, opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
  return (
    <div className={`tweaks ${visible ? 'visible' : ''}`}>
      <div className="tweaks-head">
        <span className="tweaks-title">Tweaks · Homepage</span>
        <Icon name="tune" size={16} style={{color:'var(--gray-4)'}} />
      </div>
      <div className="tweaks-body">
        {row('hero', 'Hero variant', [
          { value: 'A', label: 'Split' },
          { value: 'B', label: 'Editorial' },
          { value: 'C', label: 'Index' },
        ])}
        {row('showTier', 'Access tier badges', [
          { value: true, label: 'Show' },
          { value: false, label: 'Hide' },
        ])}
        {row('filtersExpanded', 'Filter panel', [
          { value: true, label: 'Expanded' },
          { value: false, label: 'Collapsed' },
        ])}
      </div>
    </div>
  );
};

// ---------- App ----------
const DEFAULTS = /*EDITMODE-BEGIN*/{
  "hero": "B",
  "showTier": false,
  "filtersExpanded": false
}/*EDITMODE-END*/;

const Homepage = () => {
  const [editMode, setEditMode] = useState(false);
  const [tweaks, setTweaks] = useState(() => {
    const stored = localStorage.getItem('lh-tweaks-v2');
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  });

  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setEditMode(true);
      if (e.data?.type === '__deactivate_edit_mode') setEditMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (key, value) => {
    const next = { ...tweaks, [key]: value };
    setTweaks(next);
    localStorage.setItem('lh-tweaks-v2', JSON.stringify(next));
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
  };

  const Hero = { A: HeroA, B: HeroB, C: HeroC }[tweaks.hero];
  const [librarySort, setLibrarySort] = useState('Newest');
  const [librarySelected, setLibrarySelected] = useState({});

  // Listen for hash-driven filter requests from signposts
  useEffect(() => {
    const apply = () => {
      const map = {
        '#courses': { 'Content type': ['Course'] },
        '#templates': { 'Content type': ['Template'] },
        '#videos': { 'Content type': ['Video'] },
        '#paths': { 'Content type': ['Learning Path'] },
      };
      const filter = map[window.location.hash];
      if (filter) {
        setLibrarySelected(filter);
        const el = document.getElementById('library');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);

  return (
    <>
      <TopNav active="hub" />
      <Hero />
      <PopularSection showTier={tweaks.showTier} setLibrarySort={setLibrarySort} />
      <PartnersSection />
      <LibrarySection showTier={tweaks.showTier} filtersExpanded={tweaks.filtersExpanded} sort={librarySort} setSort={setLibrarySort} selected={librarySelected} setSelected={setLibrarySelected} />
      <CertificationsSection />
      <SiteFooter />
      <TweaksPanel visible={editMode} tweaks={tweaks} setTweak={setTweak} />
    </>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Homepage />);
