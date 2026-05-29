import { useState, useEffect, useCallback } from 'react';

// ─── Theme (mirrors App.jsx T object) ────────────────────────────────────────
const T = {
  nightCamp:  '#1a1208',
  leather:    '#2a1d14',
  leatherDark:'#1f1510',
  gold:       '#c29b61',
  text:       '#e8dcc8',
  muted:      '#7a6a55',
  border:     'rgba(194,155,97,0.18)',
  good:       '#6aaa5a',
  warn:       '#d49344',
  bad:        '#b04040',
  star:       '#e8b84b',
  cool:       '#5a8aaa',
};

const BUTTON_RESET = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer',
  appearance: 'none', width: '100%',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const EXPERIENCE_LEVELS = [
  { id: 'beginner',  label: 'Beginner',        icon: '🌱', desc: 'First few trips, learning the ropes', color: T.good },
  { id: 'weekend',   label: 'Weekend Warrior',  icon: '⛺', desc: 'Regular overnighter, solid fundamentals', color: T.gold },
  { id: 'experienced', label: 'Experienced',    icon: '🏔', desc: 'Multi-day trips, knows their gear cold', color: T.warn },
  { id: 'ultralight', label: 'Ultralight',      icon: '🪶', desc: 'Grams matter. Base weight under 10 lbs.', color: '#a78bfa' },
];

const GEAR_CATEGORIES = [
  'Shelter', 'Sleep System', 'Water', 'Food & Cooking',
  'Navigation', 'Safety', 'Clothing', 'Hygiene',
  'Pack & Carry', 'Footwear', 'Camp Extras',
];

const CONDITIONS = [
  { id: 'good',    label: 'Good',         color: T.good },
  { id: 'worn',    label: 'Getting worn', color: T.warn },
  { id: 'replace', label: 'Needs replacing', color: T.bad },
];

// ─── Mock community kits ──────────────────────────────────────────────────────
const MOCK_COMMUNITY_KITS = [
  {
    id: 'ck1', author: 'sierra_ghost', level: 'ultralight',
    title: 'Sierra High Route — 9.2 lb base',
    desc: 'Refined over 4 SHR attempts. Tarp + bivy in granite country, no stove above 10k.',
    baseLbs: 9.2, items: 18, upvotes: 47, terrain: 'Volcanic / Alpine',
    highlights: ['Zpacks Duplex tarp', 'Enlightened Equipment quilt', 'Sawyer Squeeze', 'Altras'],
  },
  {
    id: 'ck2', author: 'lostcoast_liz', level: 'experienced',
    title: 'Lost Coast Thru — rain-ready 22 lb',
    desc: 'Tides, mud, and King Range wind. This kit handles all of it.',
    baseLbs: 22.1, items: 31, upvotes: 38, terrain: 'Lost Coast',
    highlights: ['Big Agnes Copper Spur UL2', 'Patagonia Torrentshell', 'Garmin inReach', 'Darn Tough socks'],
  },
  {
    id: 'ck3', author: 'desert_rat_dan', level: 'ultralight',
    title: 'Anza Borrego Minimalist — 7.8 lb',
    desc: 'No tent. Cowboy camp on warm nights, cuben bivy when wind picks up.',
    baseLbs: 7.8, items: 14, upvotes: 31, terrain: 'Desert',
    highlights: ['Enlightened Eq Revelation quilt', 'Gossamer Gear Thinlight pad', 'BeFree filter', 'NB MT110'],
  },
  {
    id: 'ck4', author: 'tahoe_fam', level: 'weekend',
    title: 'Lake Tahoe Family 3-Night — 31 lb',
    desc: 'Two adults, real food, camp chairs. We\'re not ultralight and we\'re fine with that.',
    baseLbs: 31.4, items: 44, upvotes: 29, terrain: 'Lake / River',
    highlights: ['REI Base Camp 6 tent', 'Big Agnes sleep bags', 'JetBoil Flash', 'Osprey Atmos 65'],
  },
  {
    id: 'ck5', author: 'redwood_ranger', level: 'experienced',
    title: 'Humboldt Hammock Kit — 18.5 lb',
    desc: 'Old-growth hammock camping. Always damp, always magical.',
    baseLbs: 18.5, items: 26, upvotes: 22, terrain: 'Redwood Forest',
    highlights: ['ENO DoubleNest + Dynaglide straps', 'Kammock underquilt', 'Frog Togs rain jacket', 'Platypus GravityWorks'],
  },
  {
    id: 'ck6', author: 'firsttrip_felix', level: 'beginner',
    title: 'My First Overnight — Big Bear Lake',
    desc: 'Borrowed most of this from REI. Ended up at 38 lbs. Learned a lot.',
    baseLbs: 38.2, items: 39, upvotes: 41, terrain: 'Mountain / Forest',
    highlights: ['Coleman tent', 'REI rental sleep bag', 'LifeStraw', 'Merrell Moab boots'],
  },
];

// ─── Mock trip reports ────────────────────────────────────────────────────────
const MOCK_TRIP_REPORTS = [
  {
    id: 'tr1', author: 'sierra_ghost', spot: 'Whitney Portal', trail: 'Mt. Whitney Main Trail',
    date: '2026-05-20', rating: 4,
    trail_status: 'open', water: 'reliable', snow: 'moderate',
    notes: 'Microspikes required above Trail Camp (12,000ft). Cables at top are clear. Start by 4am to beat afternoon lightning. No permit issues at the portal.',
    level: 'experienced',
  },
  {
    id: 'tr2', author: 'lostcoast_liz', spot: 'Shelter Cove', trail: 'Lost Coast Trail',
    date: '2026-05-18', rating: 5,
    trail_status: 'open', water: 'reliable', snow: 'none',
    notes: 'Incredible week. Tides were manageable — check NOAA before Kings Peak section. Black sand impassable at high tide near Punta Gorda. Water at Cooskie Creek running strong.',
    level: 'experienced',
  },
  {
    id: 'tr3', author: 'tahoe_fam', spot: 'Eagle Lake Trailhead', trail: 'Eagle Lake Trail',
    date: '2026-05-15', rating: 3,
    trail_status: 'open', water: 'reliable', snow: 'light',
    notes: 'Parking lot was full by 8am on Saturday. Snowpack melting fast — muddy through the first mile. Lake still partially frozen on north side. Mosquitoes starting — bring DEET.',
    level: 'weekend',
  },
  {
    id: 'tr4', author: 'desert_rat_dan', spot: 'Borrego Palm Canyon', trail: 'Palm Canyon Trail',
    date: '2026-05-10', rating: 5,
    trail_status: 'open', water: 'seasonal', snow: 'none',
    notes: 'Spring wildflowers are done but temps are still manageable early morning. Stream in the canyon running well. Start by 6am — it\'s 95°F by noon. No shade past the oasis.',
    level: 'experienced',
  },
  {
    id: 'tr5', author: 'firsttrip_felix', spot: 'Little Lakes Valley', trail: 'Rock Creek Trail',
    date: '2026-05-08', rating: 4,
    trail_status: 'open', water: 'reliable', snow: 'heavy',
    notes: 'Snow above 10,500ft is significant. Postholing without snowshoes past Mono Pass junction. Stunning scenery. The high route is still buried. Permits easy to get this early.',
    level: 'beginner',
  },
];

// ─── Mock brand board ─────────────────────────────────────────────────────────
const BRAND_CATEGORIES = [
  {
    name: 'Shelter',
    brands: [
      { id: 'ba', name: 'Big Agnes', notes: 'Copper Spur UL series — popular for a reason' },
      { id: 'nemo', name: 'NEMO Equipment', notes: 'Hornet line is competitive with Big Agnes' },
      { id: 'msr', name: 'MSR', notes: 'Hubba Hubba — tank-like in wind' },
      { id: 'tarptent', name: 'Tarptent', notes: 'Single-wall champions, CA-made' },
      { id: 'zpacks_shelter', name: 'Zpacks', notes: 'Duplex / Plex Solo — ultralight gold standard' },
    ],
  },
  {
    name: 'Sleep System',
    brands: [
      { id: 'wm', name: 'Western Mountaineering', notes: 'Best warmth-to-weight in the game' },
      { id: 'ee', name: 'Enlightened Equipment', notes: 'Quilts — revelation for UL sleep' },
      { id: 'ff', name: 'Feathered Friends', notes: 'Legendary quality, made in Seattle' },
      { id: 'sea2summit', name: 'Sea to Summit', notes: 'Reactor liners, Spark bags' },
      { id: 'thermarest', name: 'Therm-a-Rest', notes: 'NeoAir XTherm — still the R-value benchmark' },
    ],
  },
  {
    name: 'Water',
    brands: [
      { id: 'sawyer', name: 'Sawyer', notes: 'Squeeze — 3oz, 100k gallon life. Hard to beat.' },
      { id: 'katadyn', name: 'Katadyn', notes: 'BeFree — fastest flow of any squeeze filter' },
      { id: 'msr_water', name: 'MSR', notes: 'Guardian — bulletproof for international trips' },
      { id: 'steripen', name: 'SteriPen', notes: 'UV purification — fast, no squeeze needed' },
    ],
  },
  {
    name: 'Footwear',
    brands: [
      { id: 'hoka', name: 'Hoka', notes: 'Speedgoat — max cushion for high miles' },
      { id: 'altra', name: 'Altra', notes: 'Lone Peak — wide toe box, zero drop cult favorite' },
      { id: 'salomon', name: 'Salomon', notes: 'Speedcross — excellent grip on loose CA soil' },
      { id: 'brooks', name: 'Brooks', notes: 'Cascadia — underrated for Sierra granite' },
      { id: 'darntough', name: 'Darn Tough', notes: 'Lifetime guarantee socks — worth every cent' },
    ],
  },
  {
    name: 'Packs',
    brands: [
      { id: 'osprey', name: 'Osprey', notes: 'Atmos / Aether — comfort at heavier loads' },
      { id: 'gregory', name: 'Gregory', notes: 'Baltoro — fit system is unmatched for big loads' },
      { id: 'hyperlite', name: 'Hyperlite Mountain Gear', notes: 'Dyneema UL — 20L–40L sweet spot' },
      { id: 'zpacks_pack', name: 'Zpacks Arc Blast', notes: '1 lb 1 oz for a 50L. Absurd.' },
      { id: 'ula', name: 'ULA Equipment', notes: 'Circuit — bomber mid-range UL pack' },
    ],
  },
  {
    name: 'Navigation & Comms',
    brands: [
      { id: 'garmin', name: 'Garmin inReach Mini 2', notes: 'Two-way satellite messaging — the standard' },
      { id: 'gaia', name: 'Gaia GPS', notes: 'Best offline topo for CA — worth the subscription' },
      { id: 'caltopo', name: 'CalTopo', notes: 'Planning tool — unmatched for route research' },
      { id: 'spot', name: 'SPOT Gen4', notes: 'Cheaper inReach alternative for emergencies' },
    ],
  },
  {
    name: 'Cooking',
    brands: [
      { id: 'jetboil', name: 'JetBoil Flash', notes: 'Fast. The classic car-camping stove.' },
      { id: 'msr_cook', name: 'MSR PocketRocket 2', notes: '2.6oz. Pairs with any titanium pot.' },
      { id: 'brs', name: 'BRS-3000T', notes: '0.9oz canister stove. Dirt cheap. It works.' },
      { id: 'snowpeak', name: 'Snow Peak', notes: 'LiteMax — titanium, beautiful, pricey' },
      { id: 'toaks', name: 'Toaks', notes: '550ml titanium pot — the UL kitchen standard' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const useLocalStorage = (key, initial) => {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  const set = useCallback(v => {
    setVal(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key]);
  return [val, set];
};

const lpad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${lpad(d.getMonth()+1)}-${lpad(d.getDate())}`; };
const uid = () => Math.random().toString(36).slice(2, 9);
const ozToLbs = oz => (oz / 16).toFixed(1);

const RatingStars = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: '4px' }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} type="button" onClick={() => onChange && onChange(n)}
        style={{ ...BUTTON_RESET, width: 'auto', fontSize: '1.1rem', color: n <= value ? T.star : T.border, cursor: onChange ? 'pointer' : 'default' }}>
        ★
      </button>
    ))}
  </div>
);

const LevelBadge = ({ levelId, small }) => {
  const lvl = EXPERIENCE_LEVELS.find(l => l.id === levelId);
  if (!lvl) return null;
  return (
    <span style={{
      fontSize: small ? '0.6rem' : '0.65rem', padding: small ? '1px 7px' : '2px 9px',
      borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap',
      background: lvl.color + '22', color: lvl.color, border: '1px solid ' + lvl.color + '44',
    }}>
      {lvl.icon} {lvl.label}
    </span>
  );
};

const INPUT_STYLE = {
  width: '100%', padding: '8px 10px', background: T.leatherDark,
  border: '1px solid ' + T.border, borderRadius: '8px',
  color: T.text, fontSize: '0.85rem', fontFamily: 'Georgia, serif',
  outline: 'none',
};

const SELECT_STYLE = { ...INPUT_STYLE };

// ─── MY KIT TAB ──────────────────────────────────────────────────────────────
const MyKitTab = () => {
  const [profile, setProfile] = useLocalStorage('dm_kit_profile', null);
  const [gear, setGear] = useLocalStorage('dm_kit_gear', []);
  const [editingProfile, setEditingProfile] = useState(!profile);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Shelter', oz: '', notes: '', condition: 'good' });
  const [draftProfile, setDraftProfile] = useState(profile || { name: '', level: 'weekend', bio: '' });

  const baseOz = gear.reduce((s, g) => s + (parseFloat(g.oz) || 0), 0);
  const wornItems = gear.filter(g => g.condition === 'replace');
  const needsAttention = gear.filter(g => g.condition !== 'good');

  const saveProfile = () => {
    if (!draftProfile.name.trim()) return;
    setProfile(draftProfile);
    setEditingProfile(false);
  };

  const addItem = () => {
    if (!newItem.name.trim() || !newItem.oz) return;
    setGear([...gear, { ...newItem, id: uid(), oz: parseFloat(newItem.oz) }]);
    setNewItem({ name: '', category: 'Shelter', oz: '', notes: '', condition: 'good' });
    setShowAddForm(false);
  };

  const removeItem = (id) => setGear(gear.filter(g => g.id !== id));
  const toggleCondition = (id) => {
    setGear(gear.map(g => {
      if (g.id !== id) return g;
      const order = ['good', 'worn', 'replace'];
      return { ...g, condition: order[(order.indexOf(g.condition) + 1) % 3] };
    }));
  };

  if (editingProfile) return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '3px', marginBottom: '16px' }}>
          {profile ? 'EDIT PROFILE' : 'SET UP YOUR PROFILE'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: T.muted, display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>TRAIL NAME</label>
            <input style={INPUT_STYLE} placeholder="How the community knows you" value={draftProfile.name}
              onChange={e => setDraftProfile(p => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: T.muted, display: 'block', marginBottom: '8px', letterSpacing: '1px' }}>EXPERIENCE LEVEL</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {EXPERIENCE_LEVELS.map(lvl => {
                const active = draftProfile.level === lvl.id;
                return (
                  <button key={lvl.id} type="button"
                    onClick={() => setDraftProfile(p => ({ ...p, level: lvl.id }))}
                    style={{ ...BUTTON_RESET, padding: '12px', borderRadius: '10px', textAlign: 'left',
                      border: '1px solid ' + (active ? lvl.color : T.border),
                      background: active ? lvl.color + '18' : 'transparent', transition: 'all 150ms' }}>
                    <div style={{ fontSize: '1.1rem', marginBottom: '4px' }}>{lvl.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: active ? lvl.color : T.text }}>{lvl.label}</div>
                    <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: '2px', lineHeight: 1.4 }}>{lvl.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: T.muted, display: 'block', marginBottom: '5px', letterSpacing: '1px' }}>BIO (optional)</label>
            <textarea style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '64px' }}
              placeholder="Where you hike, your setup philosophy..."
              value={draftProfile.bio}
              onChange={e => setDraftProfile(p => ({ ...p, bio: e.target.value }))} />
          </div>
          <button type="button" onClick={saveProfile}
            style={{ ...BUTTON_RESET, padding: '11px', background: T.gold, color: T.nightCamp,
              borderRadius: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer' }}>
            {profile ? 'Save changes' : 'Create my kit'}
          </button>
          {profile && (
            <button type="button" onClick={() => setEditingProfile(false)}
              style={{ ...BUTTON_RESET, textAlign: 'center', fontSize: '0.8rem', color: T.muted, cursor: 'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>{profile.name}</div>
          <LevelBadge levelId={profile.level} />
          {profile.bio && <div style={{ fontSize: '0.78rem', color: T.muted, marginTop: '8px', lineHeight: 1.6, maxWidth: '380px' }}>{profile.bio}</div>}
        </div>
        <button type="button" onClick={() => { setDraftProfile(profile); setEditingProfile(true); }}
          style={{ ...BUTTON_RESET, width: 'auto', fontSize: '0.72rem', color: T.muted, borderBottom: '1px solid ' + T.border, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          edit profile
        </button>
      </div>

      {/* Weight summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'BASE WEIGHT', value: baseOz > 0 ? ozToLbs(baseOz) + ' lbs' : '—', color: baseOz > 0 ? (baseOz/16 < 10 ? '#a78bfa' : baseOz/16 < 20 ? T.good : baseOz/16 < 35 ? T.gold : T.warn) : T.muted },
          { label: 'ITEMS', value: gear.length, color: T.gold },
          { label: 'NEEDS ATTENTION', value: needsAttention.length, color: needsAttention.length > 0 ? T.warn : T.good },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px', background: T.leatherDark, borderRadius: '10px', border: '1px solid ' + T.border, textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.58rem', color: T.muted, letterSpacing: '1.5px', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Worn out warning */}
      {wornItems.length > 0 && (
        <div style={{ padding: '12px 14px', background: 'rgba(176,64,64,0.1)', border: '1px solid rgba(176,64,64,0.3)', borderRadius: '10px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.65rem', color: T.bad, letterSpacing: '2px', marginBottom: '6px' }}>⚠ REPLACE BEFORE NEXT TRIP</div>
          {wornItems.map(item => (
            <div key={item.id} style={{ fontSize: '0.8rem', color: T.text, marginBottom: '3px' }}>
              · {item.name} <span style={{ color: T.muted }}>({item.category})</span>
            </div>
          ))}
        </div>
      )}

      {/* Add gear button */}
      {!showAddForm && (
        <button type="button" onClick={() => setShowAddForm(true)}
          style={{ ...BUTTON_RESET, width: '100%', padding: '11px', marginBottom: '16px',
            border: '1px dashed ' + T.gold, borderRadius: '10px', textAlign: 'center',
            color: T.gold, fontSize: '0.82rem', cursor: 'pointer' }}>
          + Add gear item
        </button>
      )}

      {/* Add gear form */}
      {showAddForm && (
        <div style={{ padding: '14px', background: T.leatherDark, border: '1px solid ' + T.gold, borderRadius: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '2px', marginBottom: '12px' }}>ADD GEAR ITEM</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input style={INPUT_STYLE} placeholder="Gear name (e.g. Big Agnes Copper Spur UL2)"
              value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <select style={SELECT_STYLE} value={newItem.category}
                onChange={e => setNewItem(p => ({ ...p, category: e.target.value }))}>
                {GEAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input style={INPUT_STYLE} placeholder="Weight (oz)" type="number" min="0" step="0.1"
                value={newItem.oz} onChange={e => setNewItem(p => ({ ...p, oz: e.target.value }))} />
            </div>
            <input style={INPUT_STYLE} placeholder="Notes (optional — model, year, mods)"
              value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} />
            <div>
              <div style={{ fontSize: '0.68rem', color: T.muted, marginBottom: '6px', letterSpacing: '1px' }}>CONDITION</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {CONDITIONS.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => setNewItem(p => ({ ...p, condition: c.id }))}
                    style={{ ...BUTTON_RESET, width: 'auto', padding: '5px 12px', borderRadius: '8px',
                      border: '1px solid ' + (newItem.condition === c.id ? c.color : T.border),
                      background: newItem.condition === c.id ? c.color + '20' : 'transparent',
                      color: newItem.condition === c.id ? c.color : T.muted,
                      fontSize: '0.75rem', cursor: 'pointer' }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={addItem}
                style={{ ...BUTTON_RESET, flex: 1, padding: '9px', background: T.gold, color: T.nightCamp,
                  borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>
                Add to kit
              </button>
              <button type="button" onClick={() => setShowAddForm(false)}
                style={{ ...BUTTON_RESET, width: 'auto', padding: '9px 16px', border: '1px solid ' + T.border,
                  borderRadius: '8px', color: T.muted, fontSize: '0.82rem', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gear list grouped by category */}
      {GEAR_CATEGORIES.map(cat => {
        const catItems = gear.filter(g => g.category === cat);
        if (catItems.length === 0) return null;
        const catOz = catItems.reduce((s, g) => s + (parseFloat(g.oz) || 0), 0);
        return (
          <div key={cat} style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px 8px 0 0',
              border: '1px solid ' + T.border, borderBottom: 'none' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: T.text }}>{cat}</span>
              <span style={{ fontSize: '0.68rem', color: T.muted }}>{ozToLbs(catOz)} lb · {catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ border: '1px solid ' + T.border, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              {catItems.map((item, i) => {
                const cond = CONDITIONS.find(c => c.id === item.condition);
                return (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 12px',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.12)',
                    borderTop: i > 0 ? '1px solid ' + T.border : 'none' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.85rem', color: T.text }}>{item.name}</span>
                        <span style={{ fontSize: '0.6rem', padding: '1px 7px', borderRadius: '8px', background: cond.color + '20', color: cond.color, border: '1px solid ' + cond.color + '40' }}>{cond.label}</span>
                        <span style={{ fontSize: '0.72rem', color: T.muted, marginLeft: 'auto' }}>{item.oz}oz</span>
                      </div>
                      {item.notes && <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: '2px', fontStyle: 'italic' }}>{item.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button type="button" onClick={() => toggleCondition(item.id)}
                        title="Cycle condition" style={{ ...BUTTON_RESET, width: 'auto', fontSize: '0.7rem', color: T.muted, cursor: 'pointer', padding: '2px 4px' }}>↻</button>
                      <button type="button" onClick={() => removeItem(item.id)}
                        style={{ ...BUTTON_RESET, width: 'auto', fontSize: '1rem', color: T.muted, cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {gear.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted, fontStyle: 'italic', fontSize: '0.85rem' }}>
          Your kit is empty — add your first piece of gear above.
        </div>
      )}
    </div>
  );
};

// ─── COMMUNITY KITS TAB ───────────────────────────────────────────────────────
const CommunityKitsTab = () => {
  const [votes, setVotes] = useLocalStorage('dm_community_kit_votes', {});
  const [filterLevel, setFilterLevel] = useState('all');

  const toggle = (id) => {
    const kitData = MOCK_COMMUNITY_KITS.find(k => k.id === id);
    const currentVotes = votes[id] || kitData.upvotes;
    const voted = !!votes[id + '_voted'];
    setVotes({
      ...votes,
      [id]: voted ? currentVotes - 1 : currentVotes + 1,
      [id + '_voted']: !voted,
    });
  };

  const filtered = filterLevel === 'all' ? MOCK_COMMUNITY_KITS : MOCK_COMMUNITY_KITS.filter(k => k.level === filterLevel);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '18px' }}>
        {[{ id: 'all', label: 'All kits' }, ...EXPERIENCE_LEVELS.map(l => ({ id: l.id, label: l.label }))].map(f => {
          const active = filterLevel === f.id;
          return (
            <button key={f.id} type="button" onClick={() => setFilterLevel(f.id)}
              style={{ ...BUTTON_RESET, width: 'auto', padding: '6px 14px', borderRadius: '999px',
                border: '1px solid ' + (active ? T.gold : T.border),
                background: active ? T.gold + '18' : 'transparent',
                color: active ? T.gold : T.muted, fontSize: '0.75rem', cursor: 'pointer' }}>
              {f.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(kit => {
          const voteCount = votes[kit.id] !== undefined ? votes[kit.id] : kit.upvotes;
          const voted = !!votes[kit.id + '_voted'];
          return (
            <div key={kit.id} style={{ padding: '16px', background: T.leatherDark, borderRadius: '12px', border: '1px solid ' + T.border }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>{kit.title}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <LevelBadge levelId={kit.level} small />
                    <span style={{ fontSize: '0.68rem', color: T.muted }}>by {kit.author}</span>
                    <span style={{ fontSize: '0.68rem', color: T.muted }}>· {kit.terrain}</span>
                  </div>
                </div>
                <button type="button" onClick={() => toggle(kit.id)}
                  style={{ ...BUTTON_RESET, width: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                    padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                    border: '1px solid ' + (voted ? T.gold : T.border),
                    background: voted ? T.gold + '18' : 'transparent',
                    color: voted ? T.gold : T.muted, transition: 'all 150ms', flexShrink: 0 }}>
                  <span style={{ fontSize: '0.8rem' }}>▲</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>{voteCount}</span>
                </button>
              </div>
              <div style={{ fontSize: '0.8rem', color: T.muted, lineHeight: 1.6, marginBottom: '10px' }}>{kit.desc}</div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.72rem', color: T.text }}><span style={{ color: T.gold, fontWeight: 'bold' }}>{kit.baseLbs} lbs</span> base weight</span>
                <span style={{ fontSize: '0.72rem', color: T.muted }}>{kit.items} items</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {kit.highlights.map(h => (
                  <span key={h} style={{ fontSize: '0.68rem', padding: '2px 9px', borderRadius: '999px',
                    background: 'rgba(194,155,97,0.1)', color: T.muted, border: '1px solid ' + T.border }}>
                    {h}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── TRIP REPORTS TAB ─────────────────────────────────────────────────────────
const TRAIL_STATUS_OPTS = ['open', 'partial', 'closed', 'unknown'];
const WATER_OPTS = ['reliable', 'seasonal', 'dry', 'unknown'];
const SNOW_OPTS = ['none', 'light', 'moderate', 'heavy', 'impassable'];
const STATUS_COLORS = { open: T.good, partial: T.warn, closed: T.bad, unknown: T.muted, reliable: T.good, seasonal: T.warn, dry: T.bad, none: T.good, light: T.gold, moderate: T.warn, heavy: T.bad, impassable: T.bad };

const TripReportsTab = () => {
  const [reports, setReports] = useLocalStorage('dm_trip_reports', MOCK_TRIP_REPORTS);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ spot: '', trail: '', date: today(), rating: 4, trail_status: 'open', water: 'reliable', snow: 'none', notes: '', author: '', level: 'weekend' });

  const submit = () => {
    if (!draft.spot.trim() || !draft.notes.trim()) return;
    setReports([{ ...draft, id: uid() }, ...reports]);
    setDraft({ spot: '', trail: '', date: today(), rating: 4, trail_status: 'open', water: 'reliable', snow: 'none', notes: '', author: '', level: 'weekend' });
    setShowForm(false);
  };

  return (
    <div>
      <button type="button" onClick={() => setShowForm(v => !v)}
        style={{ ...BUTTON_RESET, width: '100%', padding: '11px', marginBottom: '18px',
          border: showForm ? '1px solid ' + T.gold : '1px dashed ' + T.gold,
          borderRadius: '10px', textAlign: 'center',
          color: T.gold, fontSize: '0.82rem', cursor: 'pointer',
          background: showForm ? T.gold + '10' : 'transparent' }}>
        {showForm ? '— Cancel report' : '+ File a trip report'}
      </button>

      {showForm && (
        <div style={{ padding: '16px', background: T.leatherDark, border: '1px solid ' + T.gold, borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '2px', marginBottom: '14px' }}>NEW TRIP REPORT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input style={INPUT_STYLE} placeholder="Your trail name" value={draft.author}
                onChange={e => setDraft(p => ({ ...p, author: e.target.value }))} />
              <input style={INPUT_STYLE} type="date" value={draft.date}
                onChange={e => setDraft(p => ({ ...p, date: e.target.value }))} />
            </div>
            <input style={INPUT_STYLE} placeholder="Spot / campsite name" value={draft.spot}
              onChange={e => setDraft(p => ({ ...p, spot: e.target.value }))} />
            <input style={INPUT_STYLE} placeholder="Trail name (optional)" value={draft.trail}
              onChange={e => setDraft(p => ({ ...p, trail: e.target.value }))} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'TRAIL', key: 'trail_status', opts: TRAIL_STATUS_OPTS },
                { label: 'WATER', key: 'water', opts: WATER_OPTS },
                { label: 'SNOW', key: 'snow', opts: SNOW_OPTS },
              ].map(({ label, key, opts }) => (
                <div key={key}>
                  <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1.5px', marginBottom: '5px' }}>{label}</div>
                  <select style={SELECT_STYLE} value={draft[key]}
                    onChange={e => setDraft(p => ({ ...p, [key]: e.target.value }))}>
                    {opts.map(o => <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1.5px', marginBottom: '5px' }}>OVERALL RATING</div>
              <RatingStars value={draft.rating} onChange={r => setDraft(p => ({ ...p, rating: r }))} />
            </div>
            <textarea style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: '80px' }}
              placeholder="What did you find? Trail conditions, hazards, water sources, tips..."
              value={draft.notes} onChange={e => setDraft(p => ({ ...p, notes: e.target.value }))} />
            <select style={SELECT_STYLE} value={draft.level}
              onChange={e => setDraft(p => ({ ...p, level: e.target.value }))}>
              {EXPERIENCE_LEVELS.map(l => <option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
            </select>
            <button type="button" onClick={submit}
              style={{ ...BUTTON_RESET, padding: '10px', background: T.gold, color: T.nightCamp,
                borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.88rem', cursor: 'pointer' }}>
              Submit report
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {reports.map(r => (
          <div key={r.id} style={{ padding: '14px 16px', background: T.leatherDark, borderRadius: '12px', border: '1px solid ' + T.border }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#fff', marginBottom: '3px' }}>{r.spot}</div>
                {r.trail && <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: '4px' }}>{r.trail}</div>}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <RatingStars value={r.rating} />
                  <LevelBadge levelId={r.level} small />
                  <span style={{ fontSize: '0.68rem', color: T.muted }}>by {r.author || 'anonymous'}</span>
                  <span style={{ fontSize: '0.68rem', color: T.muted }}>· {r.date}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              {[
                { label: 'Trail', val: r.trail_status },
                { label: 'Water', val: r.water },
                { label: 'Snow', val: r.snow },
              ].map(({ label, val }) => (
                <span key={label} style={{ fontSize: '0.65rem', padding: '2px 9px', borderRadius: '999px',
                  background: (STATUS_COLORS[val] || T.muted) + '22',
                  color: STATUS_COLORS[val] || T.muted,
                  border: '1px solid ' + (STATUS_COLORS[val] || T.muted) + '44' }}>
                  {label}: {val}
                </span>
              ))}
            </div>
            <div style={{ fontSize: '0.8rem', color: T.text, lineHeight: 1.7 }}>{r.notes}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── BRAND BOARD TAB ──────────────────────────────────────────────────────────
const BrandBoardTab = () => {
  const [votes, setVotes] = useLocalStorage('dm_brand_votes', {});
  const [openCat, setOpenCat] = useState('Shelter');

  const toggleVote = (brandId) => {
    const voted = !!votes[brandId + '_voted'];
    const current = votes[brandId] || 0;
    setVotes({ ...votes, [brandId]: voted ? current - 1 : current + 1, [brandId + '_voted']: !voted });
  };

  return (
    <div>
      <div style={{ padding: '12px 14px', background: 'rgba(194,155,97,0.07)', borderRadius: '10px', border: '1px solid rgba(194,155,97,0.2)', marginBottom: '18px' }}>
        <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', marginBottom: '6px' }}>HOW THIS WORKS</div>
        <div style={{ fontSize: '0.8rem', color: T.muted, lineHeight: 1.65 }}>
          Vote up gear you actually trust. The most-voted brands per category will surface as community recommendations in the Pack tab. No sponsorships — just field-tested opinions.
        </div>
      </div>

      {BRAND_CATEGORIES.map(cat => {
        const isOpen = openCat === cat.name;
        const totalVotes = cat.brands.reduce((s, b) => s + (votes[b.id] || 0), 0);
        const sorted = [...cat.brands].sort((a, b) => (votes[b.id] || 0) - (votes[a.id] || 0));
        return (
          <div key={cat.name} style={{ marginBottom: '6px' }}>
            <button type="button" onClick={() => setOpenCat(isOpen ? null : cat.name)}
              style={{ ...BUTTON_RESET, padding: '12px 14px', background: isOpen ? T.leather : 'rgba(0,0,0,0.2)',
                borderRadius: isOpen ? '10px 10px 0 0' : '10px',
                border: '1px solid ' + (isOpen ? T.gold : T.border),
                borderBottom: isOpen ? 'none' : undefined,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff' }}>{cat.name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {totalVotes > 0 && <span style={{ fontSize: '0.68rem', color: T.muted }}>{totalVotes} votes</span>}
                <span style={{ color: T.gold, fontSize: '1.1rem', lineHeight: 1 }}>{isOpen ? '−' : '+'}</span>
              </div>
            </button>
            {isOpen && (
              <div style={{ background: T.leatherDark, border: '1px solid ' + T.gold, borderTop: 'none', borderRadius: '0 0 10px 10px', overflow: 'hidden' }}>
                {sorted.map((brand, i) => {
                  const voteCount = votes[brand.id] || 0;
                  const voted = !!votes[brand.id + '_voted'];
                  const maxVotes = Math.max(...cat.brands.map(b => votes[b.id] || 0), 1);
                  const barPct = (voteCount / maxVotes) * 100;
                  return (
                    <div key={brand.id} style={{ padding: '12px 14px', borderTop: i > 0 ? '1px solid ' + T.border : 'none', position: 'relative' }}>
                      {voteCount > 0 && (
                        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: barPct + '%', background: 'rgba(194,155,97,0.06)', pointerEvents: 'none' }} />
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', position: 'relative' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: 'bold', color: '#fff', marginBottom: '3px' }}>{brand.name}</div>
                          <div style={{ fontSize: '0.75rem', color: T.muted, lineHeight: 1.5 }}>{brand.notes}</div>
                        </div>
                        <button type="button" onClick={() => toggleVote(brand.id)}
                          style={{ ...BUTTON_RESET, width: 'auto', flexShrink: 0,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            padding: '7px 12px', borderRadius: '8px', cursor: 'pointer',
                            border: '1px solid ' + (voted ? T.gold : T.border),
                            background: voted ? T.gold + '18' : 'transparent',
                            color: voted ? T.gold : T.muted, transition: 'all 150ms', minWidth: '48px' }}>
                          <span style={{ fontSize: '0.75rem' }}>▲</span>
                          <span style={{ fontSize: '0.78rem', fontWeight: 'bold' }}>{voteCount}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── COMMUNITY TAB ROOT ───────────────────────────────────────────────────────
const SUB_TABS = [
  { id: 'mykit',     label: 'My Kit' },
  { id: 'kits',      label: 'Community Kits' },
  { id: 'reports',   label: 'Trip Reports' },
  { id: 'brands',    label: 'Brand Board' },
];

export default function CommunityTab() {
  const [sub, setSub] = useState('mykit');

  return (
    <div>
      {/* Sub-tab bar */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', borderBottom: '1px solid ' + T.border, overflowX: 'auto' }}>
        {SUB_TABS.map(t => {
          const active = sub === t.id;
          return (
            <button key={t.id} type="button" onClick={() => setSub(t.id)}
              style={{ ...BUTTON_RESET, width: 'auto', whiteSpace: 'nowrap',
                padding: '10px 20px', fontSize: '0.8rem', letterSpacing: '1.5px', fontWeight: 'bold',
                color: active ? T.gold : T.muted,
                borderBottom: '2px solid ' + (active ? T.gold : 'transparent'),
                fontFamily: 'Georgia, serif', cursor: 'pointer',
                transition: 'color 150ms, border-color 150ms',
                marginBottom: '-1px' }}>
              {t.label.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      {sub === 'mykit'   && <MyKitTab />}
      {sub === 'kits'    && <CommunityKitsTab />}
      {sub === 'reports' && <TripReportsTab />}
      {sub === 'brands'  && <BrandBoardTab />}
    </div>
  );
}
