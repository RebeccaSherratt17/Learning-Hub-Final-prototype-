// Shared UI primitives for the Diligent Learning Hub
// Exposed on window so other babel scripts can use them.

const Icon = ({ name, size = 20, style = {}, className = '' }) => (
  <span
    className={`material-symbols-sharp ${className}`}
    style={{ fontSize: size, fontVariationSettings: `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${Math.min(48, Math.max(20, size))}`, ...style }}
  >{name}</span>
);

const Placeholder = ({ label, aspect = '16 / 10', style = {}, dark = false, children }) => (
  <div
    className="ph"
    style={{
      aspectRatio: aspect,
      width: '100%',
      background: dark ? '#20242B' : undefined,
      backgroundImage: dark
        ? 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(255,255,255,0.04) 14px 15px)'
        : undefined,
      ...style,
    }}
  >
    {children || (label && <span className="ph-label" style={dark ? {background:'#2A2F37', color:'#A0A2A5'} : {}}>{label}</span>)}
  </div>
);

const TopNav = ({ active = 'hub', onNav = () => {} }) => (
  <header className="topnav">
    <div className="topnav-inner">
      <a href="index.html" className="brand" onClick={(e) => { e.preventDefault(); onNav('index.html'); }} aria-label="Diligent — Home">
        <img src={window.__logoLight} alt="Diligent" className="brand-logo" style={{ height: 26, width: 'auto', display: 'block' }} />
      </a>
      <nav className="topnav-links">
        <a href="https://www.diligent.com/products" target="_blank" rel="noopener noreferrer">Products</a>
        <a href="https://www.diligent.com/solutions" target="_blank" rel="noopener noreferrer">Solutions</a>
        <a href="https://www.diligent.com/resources" target="_blank" rel="noopener noreferrer">Resources</a>
      </nav>
      <div className="topnav-right">
        <a href="admin.html" onClick={(e)=>{e.preventDefault(); onNav('admin.html');}} style={{ color: 'var(--gray-4)', fontSize: 14, fontWeight: 500 }}>Admin</a>
      </div>
    </div>
  </header>
);

// ---------- Card thumb (real image or placeholder) ----------
const CardThumb = ({ item }) => {
  if (item.image) {
    const fit = item.type === 'Learning Path' ? 'contain' : 'cover';
    return (
      <div className="ph" style={{ aspectRatio: '16 / 10', width: '100%', background: '#fff' }}>
        <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: fit, display: 'block' }} />
      </div>
    );
  }
  return <Placeholder label={`${item.type.toUpperCase()} · ${item.id}`} aspect="16 / 10" />;
};

const tierMeta = {
  Free: { bg: '#E8F1EC', fg: '#1F6B3A', icon: 'check_circle' },
  Gated: { bg: '#FEF4E6', fg: '#8A5A00', icon: 'mail' },
  Premium: { bg: '#282E37', fg: '#FFFFFF', icon: 'workspace_premium' },
};
const TierBadge = ({ tier = 'Free', compact = false }) => {
  const m = tierMeta[tier];
  if (!m) return null;
  return (
    <span
      className="pill"
      style={{
        background: m.bg,
        color: m.fg,
        fontSize: compact ? 11 : 12,
        padding: compact ? '3px 8px' : '4px 10px',
        fontWeight: 500,
        letterSpacing: 0.1,
      }}
    >
      <Icon name={m.icon} size={compact ? 13 : 14} />
      {tier}
    </span>
  );
};

// ---------- Content type ----------
const typeMeta = {
  Course: { icon: 'school', color: 'var(--gray-5)' },
  Template: { icon: 'description', color: 'var(--gray-5)' },
  Video: { icon: 'play_circle', color: 'var(--gray-5)' },
  'Learning Path': { icon: 'route', color: 'var(--gray-5)' },
};
const TypeBadge = ({ type }) => {
  const m = typeMeta[type] || typeMeta.Course;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 12, fontWeight: 500, color: m.color, letterSpacing: '0.02em',
      textTransform: 'uppercase',
    }}>
      <Icon name={m.icon} size={15} />
      {type}
    </span>
  );
};

// ---------- CONTENT CARD ----------
// Props: item = { id, type, title, desc, tier, subjects:[], duration, img, href }
// variant = 'default' | 'minimal' | 'editorial'
// showTier = bool (tweakable)
const ContentCard = ({ item, variant = 'default', showTier = true, onClick, compact = false }) => {
  const href = item.href || `${item.type.toLowerCase().replace(' ', '-')}.html`;
  const go = (e) => { e.preventDefault(); onClick ? onClick(item) : (window.location.href = href); };

  if (variant === 'minimal') {
    return (
      <a href={href} onClick={go} className="cc cc-minimal">
        <CardThumb item={item} />
        <div className="cc-body">
          <div className="cc-row">
            <TypeBadge type={item.type} />
            {showTier && <TierBadge tier={item.tier} compact />}
          </div>
          <h3 className="cc-title">{item.title}</h3>
          {item.desc && <p className="cc-desc">{item.desc}</p>}
        </div>
      </a>
    );
  }

  if (variant === 'editorial') {
    return (
      <a href={href} onClick={go} className="cc cc-editorial">
        <div className="cc-edi-top">
          <TypeBadge type={item.type} />
          {showTier && <TierBadge tier={item.tier} compact />}
        </div>
        <h3 className="cc-title" style={{ fontSize: 22, marginTop: 20 }}>{item.title}</h3>
        {item.desc && <p className="cc-desc" style={{ marginTop: 12 }}>{item.desc}</p>}
        <div style={{ flex: 1 }} />
        <div className="cc-edi-meta">
          {item.subjects?.slice(0, 2).map(s => <span key={s} className="cc-tag">{s}</span>)}
          {item.duration && <span className="cc-duration"><Icon name="schedule" size={14} /> {item.duration}</span>}
        </div>
      </a>
    );
  }

  // default — airy card with thumb + body
  return (
    <a href={href} onClick={go} className={`cc cc-default ${compact ? 'cc-compact' : ''}`}>
      <CardThumb item={item} />
      <div className="cc-body">
        <div className="cc-row">
          <TypeBadge type={item.type} />
          {showTier && <TierBadge tier={item.tier} compact />}
        </div>
        <h3 className="cc-title">{item.title}</h3>
        {item.desc && <p className="cc-desc">{item.desc}</p>}
        <div className="cc-foot">
          {item.subjects?.slice(0, 2).map(s => (
            <span key={s} className="cc-tag">{s}</span>
          ))}
          {item.duration && (
            <span className="cc-duration">
              <Icon name="schedule" size={14} />
              {item.duration}
            </span>
          )}
        </div>
      </div>
    </a>
  );
};

// ---------- Footer ----------
const DemoForm = () => {
  const [form, setForm] = useState({ first: '', last: '', email: '', phone: '', company: '', country: '' });
  const [focus, setFocus] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const Field = ({ k, label, icon, type = 'text', placeholder, children }) => (
    <div className={`demo-field ${focus === k ? 'focus' : ''}`}>
      <span className="demo-field-label">{label}</span>
      <div className="demo-field-inner">
        <Icon name={icon} size={18} />
        {children || (
          <input
            type={type}
            value={form[k]}
            placeholder={placeholder}
            onChange={set(k)}
            onFocus={() => setFocus(k)}
            onBlur={() => setFocus(null)}
          />
        )}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div className="demo-form" style={{ textAlign: 'center', padding: '64px 40px' }}>
        <Icon name="check_circle" size={48} style={{ color: 'var(--red)' }} />
        <h3 style={{ fontSize: 24, marginTop: 20 }}>Thank you</h3>
        <p style={{ color: 'var(--gray-4)', marginTop: 12 }}>A member of our team will be in touch within one business day.</p>
      </div>
    );
  }

  return (
    <form className="demo-form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
      <div className="demo-form-grid">
        <div className={`demo-field ${focus === 'first' ? 'focus' : ''}`}>
          <span className="demo-field-label">First Name</span>
          <div className="demo-field-inner">
            <input value={form.first} placeholder="First Name" onChange={set('first')} onFocus={() => setFocus('first')} onBlur={() => setFocus(null)} />
          </div>
        </div>
        <div className={`demo-field ${focus === 'last' ? 'focus' : ''}`}>
          <span className="demo-field-label">Last Name</span>
          <div className="demo-field-inner">
            <input value={form.last} placeholder="Last Name" onChange={set('last')} onFocus={() => setFocus('last')} onBlur={() => setFocus(null)} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
        <div className={`demo-field ${focus === 'email' ? 'focus' : ''}`}>
          <span className="demo-field-label">Work Email</span>
          <div className="demo-field-inner">
            <Icon name="mail" size={18} />
            <input type="email" value={form.email} placeholder="Enter your work email address" onChange={set('email')} onFocus={() => setFocus('email')} onBlur={() => setFocus(null)} />
          </div>
        </div>
        <div className={`demo-field ${focus === 'phone' ? 'focus' : ''}`}>
          <span className="demo-field-label">Phone Number</span>
          <div className="demo-field-inner">
            <Icon name="call" size={18} />
            <input type="tel" value={form.phone} placeholder="Enter your phone number" onChange={set('phone')} onFocus={() => setFocus('phone')} onBlur={() => setFocus(null)} />
          </div>
        </div>
        <div className={`demo-field ${focus === 'company' ? 'focus' : ''}`}>
          <span className="demo-field-label">Company Name</span>
          <div className="demo-field-inner">
            <Icon name="business" size={18} />
            <input value={form.company} placeholder="Enter your company name" onChange={set('company')} onFocus={() => setFocus('company')} onBlur={() => setFocus(null)} />
          </div>
        </div>
        <div className={`demo-field ${focus === 'country' ? 'focus' : ''}`}>
          <span className="demo-field-label">Country</span>
          <div className="demo-field-inner">
            <Icon name="location_on" size={18} />
            <select value={form.country} onChange={set('country')} onFocus={() => setFocus('country')} onBlur={() => setFocus(null)}>
              <option value="">Select your country</option>
              <option>United States</option>
              <option>United Kingdom</option>
              <option>Canada</option>
              <option>Australia</option>
              <option>Germany</option>
              <option>France</option>
              <option>Singapore</option>
              <option>Other</option>
            </select>
          </div>
          <Icon name="expand_more" size={18} className="demo-field-chev" />
        </div>
      </div>
      <p className="demo-form-legal">
        By submitting this form, you agree to receive the information requested as well as sales and/or marketing communication on resources, news, and events related to the Diligent suite of solutions. You can unsubscribe at any time or manage the types of communication you would like to receive by visiting our <a href="https://learn.diligent.com/preference-center.html?_gl=1*13rwi8e*_gcl_aw*R0NMLjE3NzU4Mjg3MTguQ2owS0NRand2LUxPQmhDZEFSSXNBTTVoZEtjajk5R0RQODlmQmtoV0RMSzFtMElsbVJra2JFbm1pQUMzaEVwWTJ6SDN5cWx4emxlMTlSOGFBamFWRUFMd193Y0I.*_gcl_dc*R0NMLjE3NzU4Mjg3MTguQ2owS0NRand2LUxPQmhDZEFSSXNBTTVoZEtjajk5R0RQODlmQmtoV0RMSzFtMElsbVJra2JFbm1pQUMzaEVwWTJ6SDN5cWx4emxlMTlSOGFBamFWRUFMd193Y0I.*_gcl_au*NTA0NDM4NDI2LjE3NzAwMjMyOTIuMTgwOTM2MDQ0MC4xNzcyNDUyMzc4LjE3NzI0NTIzNzg.*_ga*MjA0NDk1NDcxOS4xNzQ2NTM5MzA3*_ga_E8B5GF0KLY*czE3NzY5NTg3MDEkbzY1NSRnMSR0MTc3Njk1OTA2OCRqMzQkbDAkaDA." target="_blank" rel="noopener noreferrer">Preference Center</a>. For further details regarding how Diligent processes your personal information, please refer to our <a href="https://www.diligent.com/legal/privacy" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.
      </p>
      <button type="submit" className="demo-submit">Submit</button>
    </form>
  );
};

const SiteFooter = ({ onNav = () => {} }) => (
  <>
    <section className="cta-strip" id="demo">
      <div className="container">
        <div className="cta-strip-inner">
          <div>
            <h2 style={{ fontSize: 56, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.05 }}>Upskill your board today</h2>
            <p style={{ color: '#C2C5C9', fontSize: 18, maxWidth: 520, marginTop: 20, lineHeight: 1.55 }}>
              Empower directors, executives and board professionals with the <a href="https://www.diligent.com/solutions/board-education" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>Education & Templates Library</a> — Diligent's premium eLearning platform packed with best practice education, templates and certifications to make every meeting prepared, compliant and impactful.
            </p>
            <p style={{ color: '#fff', fontSize: 18, maxWidth: 520, marginTop: 16, lineHeight: 1.55, fontWeight: 700 }}>
              Request a demo
            </p>
            <p style={{ color: '#fff', fontSize: 18, maxWidth: 520, marginTop: 48, lineHeight: 1.55, fontWeight: 700 }}>
              Got questions?
            </p>
            <p style={{ color: '#C2C5C9', fontSize: 18, maxWidth: 520, marginTop: 8, lineHeight: 1.55 }}>
              Email <a href="mailto:certifications@diligent.com" style={{ color: '#fff', textDecoration: 'underline' }}>certifications@diligent.com</a>
            </p>
          </div>
          <DemoForm />
        </div>
      </div>
    </section>
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ color: '#fff' }}>
              <img src={window.__logoDark} alt="Diligent" style={{ height: 36, width: 'auto', display: 'block' }} />
            </div>
          </div>
          <div>
            <p className="footer-heading">Solutions</p>
            <a href="https://www.diligent.com/products/boards" target="_blank" rel="noopener noreferrer">Board Management</a>
            <a href="https://www.diligent.com/products/enterprise-risk-management" target="_blank" rel="noopener noreferrer">Enterprise Risk Management</a>
            <a href="https://www.diligent.com/products/internal-audit" target="_blank" rel="noopener noreferrer">Audit Management</a>
            <a href="https://www.diligent.com/products/market-intelligence" target="_blank" rel="noopener noreferrer">Market Intelligence</a>
          </div>
          <div>
            <p className="footer-heading">Resources</p>
            <a href="https://www.diligent.com/resources/blog" target="_blank" rel="noopener noreferrer">Blog</a>
            <a href="https://www.diligent.com/resources/research" target="_blank" rel="noopener noreferrer">Research & Reports</a>
            <a href="https://www.diligent.com/resources/podcasts" target="_blank" rel="noopener noreferrer">Podcasts</a>
            <a href="https://www.diligent.com/resources/guides" target="_blank" rel="noopener noreferrer">Guides</a>
            <a href="https://www.diligent.com/newsletter-signup" target="_blank" rel="noopener noreferrer">Newsletter Signup</a>
          </div>
          <div>
            <p className="footer-heading">Company</p>
            <a href="https://www.diligent.com/company/about-us" target="_blank" rel="noopener noreferrer">About us</a>
            <a href="https://www.diligent.com/company/careers" target="_blank" rel="noopener noreferrer">Careers</a>
            <a href="https://www.diligent.com/support" target="_blank" rel="noopener noreferrer">Support</a>
            <a href="https://www.diligent.com/partners/showcase" target="_blank" rel="noopener noreferrer">Partners</a>
          </div>
        </div>
        <div className="footer-bottom" style={{ justifyContent: 'space-between' }}>
          <div className="footer-socials">
            <a href="https://www.linkedin.com/company/diligent-board-member-services/posts/?feedView=all" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8h4.56v14H.22V8zm7.5 0h4.37v1.91h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.45h-4.56v-6.6c0-1.57-.03-3.6-2.2-3.6-2.2 0-2.54 1.71-2.54 3.48v6.72H7.72V8z"/>
              </svg>
            </a>
            <a href="https://x.com/diligentHQ" target="_blank" rel="noopener noreferrer" aria-label="X">
              <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817-5.967 6.817H1.677l7.73-8.835L1.252 2.25h6.83l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z"/>
              </svg>
            </a>
            <a href="https://www.youtube.com/@diligent_hq" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/DiligentCorporation" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12z"/>
              </svg>
            </a>
          </div>
          <span>© 2026 Diligent Corporation. All rights reserved.</span>
        </div>
      </div>
    </footer>
  </>
);

// Expose
Object.assign(window, {
  Icon, Placeholder, CardThumb, TopNav, TierBadge, TypeBadge, ContentCard, SiteFooter, DemoForm,
  tierMeta, typeMeta,
});
