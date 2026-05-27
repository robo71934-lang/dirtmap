import React, { useState, useEffect, useRef } from 'react';

const T = {
  nightCamp: '#1a0f08', leather: '#3d2b1f', leatherDark: '#2a1d14',
  gold: '#c29b61', border: '#4a3728', text: '#e2d5c3', muted: '#887766',
  good: '#7fa650', warn: '#d49344', bad: '#c54f4f', cool: '#6082c2', star: '#9b6dd1',
};
const DIFF_COLORS  = [null, T.good, '#a3c168', T.warn, '#c0723a', T.bad];
const DIFF_LABELS  = ['', 'Easy', 'Moderate', 'Challenging', 'Strenuous', 'Expert'];
const COMFORT_COLORS = [null, T.muted, T.cool, T.good, T.warn, '#d469a3'];
const COMFORT_LABELS = ['', 'Primitive', 'Basic', 'Comfortable', 'Well-Equipped', 'Resort'];
const WATER_STATUS = {
  reliable: { label: 'Reliable',  color: T.good,    desc: 'Flows year-round' },
  seasonal: { label: 'Seasonal',  color: T.warn,    desc: 'Flows Nov-May typically' },
  iffy:     { label: 'Often Dry', color: '#c0723a', desc: 'Unreliable, call ahead' },
  dry:      { label: 'No Water',  color: T.bad,     desc: 'Pack in all water' },
};
const CELL_COVERAGE = {
  strong: { label: 'Strong',      color: T.good,    desc: 'All carriers usable' },
  spotty: { label: 'Spotty',      color: T.warn,    desc: 'Verizon best, AT&T weak' },
  weak:   { label: 'Weak',        color: '#c0723a', desc: 'Roam high points only' },
  none:   { label: 'No Service',  color: T.bad,     desc: 'Bring satellite comms' },
};
const BEAR_REQUIREMENTS = {
  canister: { label: 'Canister Required', color: T.bad,   desc: 'Hard-sided canister mandatory' },
  box:      { label: 'Bear Box On-Site',  color: T.good,  desc: 'Metal lockers provided' },
  hang:     { label: 'Hang Acceptable',   color: T.warn,  desc: 'PCT-style hang OK' },
  none:     { label: 'No Bears',          color: T.muted, desc: 'Not bear country' },
};
const STARGAZING_LEVELS = [
  { val: 5, label: 'Pristine Dark', color: T.star,    desc: 'Milky Way visible, Bortle 1-2' },
  { val: 4, label: 'Excellent',     color: '#b489d9', desc: 'Bortle 3, clear deep sky' },
  { val: 3, label: 'Good',          color: T.cool,    desc: 'Bortle 4, decent stargazing' },
  { val: 2, label: 'Fair',          color: T.warn,    desc: 'Some light pollution' },
  { val: 1, label: 'Poor',          color: T.bad,     desc: 'Bortle 7+, city sky' },
];
const BUTTON_RESET = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer',
  appearance: 'none', width: '100%',
};

const Pill = ({ label, color }) => (
  <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '12px',
    background: color + 'cc', color: '#fff', border: '1px solid ' + color + '88', fontWeight: '600' }}>
    {label}
  </span>
);
const InfoCell = ({ label, icon, statusObj }) => (
  <div style={{ padding: '10px', background: T.leatherDark, borderRadius: '4px', border: '1px solid ' + T.border }}>
    <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: statusObj.color }}>{statusObj.label}</div>
    <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: '2px', fontStyle: 'italic' }}>{statusObj.desc}</div>
  </div>
);

export default function MapTab({ spots: allSpots = [], savedTrails = {}, onSaveTrail = () => {}, jumpToSpot = null }) {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [selectedTrail, setSelectedTrail] = useState(null);
  const [RL, setRL] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    Promise.all([import('leaflet'), import('react-leaflet')])
      .then(([lf, rl]) => {
        const L = lf.default;
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        setRL({ L, MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Marker: rl.Marker, Circle: rl.Circle });
      })
      .catch(err => console.warn('Leaflet load failed:', err));
  }, []);

  // When planner sends us a spot, fly to it and open sidebar
  useEffect(() => {
    if (!jumpToSpot) return;
    const spots = allSpots.filter(s => s.lat && s.lng);
    const match = spots.find(s => s.name === jumpToSpot.name) || jumpToSpot;
    setSelectedSpot(match);
    if (mapRef.current && match.lat && match.lng) {
      mapRef.current.flyTo([match.lat, match.lng], 12, { duration: 1.4 });
    }
  }, [jumpToSpot]);

  const spots = allSpots.filter(s => s.lat && s.lng);

  // Compute terrain label positions (centroid of each terrain's spots)
  const terrainCenters = {};
  spots.forEach(s => {
    if (!s.terrainName) return;
    if (!terrainCenters[s.terrainName]) terrainCenters[s.terrainName] = { lats: [], lngs: [] };
    terrainCenters[s.terrainName].lats.push(s.lat);
    terrainCenters[s.terrainName].lngs.push(s.lng);
  });
  const terrainLabels = Object.entries(terrainCenters).map(([name, { lats, lngs }]) => ({
    name,
    lat: lats.reduce((a, b) => a + b, 0) / lats.length,
    lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
  }));

  if (!RL) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 74px)', color: T.muted, fontStyle: 'italic', fontSize: '0.9rem' }}>
        Loading map…
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Circle } = RL;

  const parseMeters = (dist) => {
    if (!dist || dist === 'Open' || dist === 'Varies') return 4000;
    const mi = dist.match(/([\d.]+)\s*mi/i);
    if (mi) return parseFloat(mi[1]) * 1609;
    const km = dist.match(/([\d.]+)\s*km/i);
    if (km) return parseFloat(km[1]) * 1000;
    return 4000;
  };

  // SVG icons per terrain type
  const TERRAIN_SVGS = {
    desert: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <rect x='10' y='5' width='4' height='14' rx='2' fill='#7fa650'/>
      <rect x='3' y='10' width='9' height='3' rx='1.5' fill='#7fa650'/>
      <rect x='3' y='8' width='3' height='5' rx='1.5' fill='#7fa650'/>
      <rect x='12' y='12' width='9' height='3' rx='1.5' fill='#7fa650'/>
      <rect x='18' y='10' width='3' height='5' rx='1.5' fill='#7fa650'/>
      <ellipse cx='12' cy='20' rx='5' ry='1.5' fill='#d4b483' opacity='0.5'/>
    </svg>`,
    beach: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <circle cx='12' cy='9' r='4' fill='#d49344'/>
      <line x1='12' y1='4' x2='12' y2='2' stroke='#d49344' stroke-width='1.5'/>
      <line x1='16.2' y1='5.8' x2='17.6' y2='4.4' stroke='#d49344' stroke-width='1.5'/>
      <line x1='18' y1='9' x2='20' y2='9' stroke='#d49344' stroke-width='1.5'/>
      <path d='M2,17 Q6,13 10,17 Q14,21 18,17 Q21,14 22,17' stroke='#6082c2' stroke-width='2' fill='none' stroke-linecap='round'/>
    </svg>`,
    mountain: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <polygon points='12,3 22,20 2,20' fill='#6082c2'/>
      <polygon points='7,11 15,20 0,20' fill='#4a6aaa'/>
      <polygon points='11,5 15,12 8,12' fill='white' opacity='0.55'/>
    </svg>`,
    redwood: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <rect x='10.5' y='15' width='3' height='7' fill='#8B5E3C'/>
      <polygon points='12,2 20,13 4,13' fill='#4a8a32'/>
      <polygon points='12,6 19,16 5,16' fill='#3d7a28'/>
      <polygon points='12,10 18,19 6,19' fill='#2d6a1e'/>
    </svg>`,
    lake: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <polygon points='6,14 12,5 18,14' fill='#5a8a3a'/>
      <rect x='10' y='14' width='4' height='4' fill='#4a7a2a'/>
      <path d='M1,18 Q5,14 9,18 Q13,22 17,18 Q21,14 23,18' stroke='#6082c2' stroke-width='2.5' fill='none' stroke-linecap='round'/>
    </svg>`,
    volcanic: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <polygon points='12,3 22,20 2,20' fill='#887766'/>
      <polygon points='9,11 15,11 12,4' fill='#c54f4f' opacity='0.85'/>
      <path d='M10,3 Q11,1 12,3 Q13,1 14,3' stroke='#d49344' stroke-width='1.2' fill='none'/>
      <ellipse cx='12' cy='20' rx='7' ry='1.5' fill='#6a5a4a' opacity='0.4'/>
    </svg>`,
    lostcoast: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <rect x='10' y='6' width='4' height='11' rx='1' fill='#c29b61'/>
      <polygon points='8,6 12,2 16,6' fill='#c29b61'/>
      <rect x='11' y='9' width='2' height='3' fill='#1a1008'/>
      <path d='M1,18 Q5,14 9,18 Q13,22 17,18 Q21,14 23,18' stroke='#6082c2' stroke-width='2.5' fill='none' stroke-linecap='round'/>
    </svg>`,
    dispersed: `<svg viewBox='0 0 24 24' width='22' height='22'>
      <polygon points='12,4 21,18 3,18' fill='#c29b61'/>
      <polygon points='12,4 17,18 7,18' fill='#3d2b1f'/>
      <rect x='9' y='14' width='6' height='4' fill='#1a1008'/>
      <circle cx='18' cy='7' r='2.5' fill='#d49344' opacity='0.8'/>
    </svg>`,
  };

  const getTerrainSVG = (terrainName) => {
    const n = (terrainName || '').toLowerCase();
    if (n.includes('desert') || n.includes('mojave') || n.includes('joshua')) return TERRAIN_SVGS.desert;
    if (n.includes('beach') || n.includes('coast') && !n.includes('lost')) return TERRAIN_SVGS.beach;
    if (n.includes('mountain') || n.includes('sierra') || n.includes('alpine')) return TERRAIN_SVGS.mountain;
    if (n.includes('redwood') || n.includes('forest') || n.includes('grove')) return TERRAIN_SVGS.redwood;
    if (n.includes('lake') || n.includes('river') || n.includes('water')) return TERRAIN_SVGS.lake;
    if (n.includes('volcan') || n.includes('lassen')) return TERRAIN_SVGS.volcanic;
    if (n.includes('lost')) return TERRAIN_SVGS.lostcoast;
    return TERRAIN_SVGS.dispersed;
  };

  const makeIcon = (sp, isSelected) => {
    const isFree      = /^free$/i.test(sp.fee?.trim());
    const isHidden    = sp.cat === 'hidden';
    const raw         = sp.fee?.match(/\$\d+/)?.[0] || sp.fee?.split('/')[0] || '?';
    const label       = isFree ? 'Free' : raw;
    const accentColor = isHidden ? T.star : isFree ? T.good : T.gold;
    const svg         = getTerrainSVG(sp.terrainName);

    const scale  = isSelected ? 'scale(1.18)' : 'scale(1)';
    const shadow = isSelected
      ? `0 4px 18px rgba(0,0,0,0.38), 0 0 0 3px ${accentColor}55`
      : '0 2px 8px rgba(0,0,0,0.22)';
    const border = isSelected ? `2.5px solid ${accentColor}` : `2px solid ${accentColor}`;
    const circleBg = isSelected ? accentColor + '22' : '#fffdf8';

    return L.divIcon({
      className: '',
      html: `<div style='display:flex;flex-direction:column;align-items:center;gap:3px;cursor:pointer;transform:${scale};transition:transform 120ms ease;'>
        <div style='width:42px;height:42px;border-radius:50%;background:${circleBg};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;'>
          ${svg}
        </div>
        <div style='background:#fffdf8;color:#1a1008;border:1.5px solid ${accentColor};border-radius:999px;padding:2px 9px;font-family:Georgia,serif;font-size:0.65rem;font-weight:bold;white-space:nowrap;box-shadow:0 1px 5px rgba(0,0,0,0.18);'>${label}</div>
      </div>`,
      iconSize: null,
      iconAnchor: [21, 21],
    });
  };

  // Terrain label markers — subtle all-caps text floating over the map
  const makeTerrainLabel = (name) => L.divIcon({
    className: '',
    html: `<div style="
      font-family:'Cinzel',Georgia,serif;font-size:0.6rem;font-weight:700;
      letter-spacing:2.5px;color:#3d2b1f;text-transform:uppercase;
      background:rgba(255,253,248,0.72);padding:4px 10px;border-radius:3px;
      border:1px solid rgba(61,43,31,0.18);white-space:nowrap;
      backdrop-filter:blur(2px);pointer-events:none;
      text-shadow:0 1px 2px rgba(255,255,255,0.6);
    ">${name}</div>`,
    iconSize: null,
    iconAnchor: [0, 0],
  });

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 74px)', overflow: 'hidden' }}>
      {/* MAP CANVAS — ESRI World Topo: free, no API key, terrain + park detail */}
      <MapContainer
        ref={mapRef}
        center={[37.5, -119.5]}
        zoom={6}
        minZoom={6}
        maxBounds={[[32.4, -124.6], [42.1, -114.0]]}
        maxBoundsViscosity={1.0}
        style={{ flex: 1, height: '100%' }}
      >
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          attribution='Tiles &copy; <a href="https://www.esri.com/">Esri</a>'
          maxZoom={19}
        />

        {/* Terrain region labels */}
        {terrainLabels.map((tl, i) => (
          <Marker
            key={'terrain-' + i}
            position={[tl.lat, tl.lng]}
            icon={makeTerrainLabel(tl.name)}
            zIndexOffset={-1000}
            interactive={false}
          />
        ))}

        {/* Campsite price pins */}
        {spots.map((sp, i) => (
          <Marker
            key={i}
            position={[sp.lat, sp.lng]}
            icon={makeIcon(sp, selectedSpot === sp)}
            eventHandlers={{ click: () => { setSelectedSpot(prev => prev === sp ? null : sp); setSelectedTrail(null); } }}
            zIndexOffset={selectedSpot === sp ? 1000 : 0}
          />
        ))}

        {/* Trail radius circle */}
        {selectedSpot && selectedTrail && (
          <Circle
            center={[selectedSpot.lat, selectedSpot.lng]}
            radius={parseMeters(selectedTrail.dist)}
            pathOptions={{
              color: T.gold, fillColor: T.gold, fillOpacity: 0.07,
              dashArray: '7 5', weight: 2,
            }}
          />
        )}
      </MapContainer>

      {/* SPOT SIDEBAR */}
      {selectedSpot && (
        <div style={{
          width: '360px', flexShrink: 0, overflowY: 'auto',
          background: T.leather, borderLeft: '1px solid ' + T.border,
          boxShadow: '-6px 0 24px rgba(0,0,0,0.45)',
        }}>
          {/* sticky header */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 2,
            background: T.leather, borderBottom: '1px solid ' + T.border,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ color: T.gold, fontSize: '0.6rem', letterSpacing: '2.5px', marginBottom: '3px', fontFamily: 'Cinzel, serif' }}>
                  {selectedSpot.terrainName?.toUpperCase()}
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem', fontFamily: 'Georgia, serif', lineHeight: 1.2 }}>
                  {selectedSpot.name}
                </div>
                <div style={{ color: T.muted, fontSize: '0.78rem', marginTop: '4px' }}>
                  {selectedSpot.fee} · {selectedSpot.type}
                </div>
              </div>
              <button type="button" onClick={() => setSelectedSpot(null)}
                style={{ ...BUTTON_RESET, width: 'auto', color: T.muted, fontSize: '1.6rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}>
                ×
              </button>
            </div>
          </div>

          {/* photo */}
          {(selectedSpot.img || selectedSpot.terrainImg) && (
            <img src={selectedSpot.img || selectedSpot.terrainImg} alt=""
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
          )}

          <div style={{ padding: '16px' }}>
            {/* pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {selectedSpot.cat === 'hidden'
                ? <Pill label="Hidden Gem" color={T.star} />
                : <Pill label="Popular" color={T.gold} />}
              {selectedSpot.iconic && <Pill label="Iconic" color={T.good} />}
              <Pill label={COMFORT_LABELS[selectedSpot.comfort]} color={COMFORT_COLORS[selectedSpot.comfort]} />
              {selectedSpot.permits?.required
                ? <Pill label="Permit Req" color={T.warn} />
                : <Pill label="No Permit" color={T.good} />}
            </div>

            {/* notes */}
            <p style={{ fontSize: '0.82rem', color: T.text, lineHeight: 1.6, marginBottom: '14px', fontStyle: 'italic' }}>
              {selectedSpot.notes}
            </p>

            {/* info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <InfoCell label="WATER" icon="WTR" statusObj={WATER_STATUS[selectedSpot.water] || WATER_STATUS.dry} />
              <InfoCell label="CELL"  icon="SIG" statusObj={CELL_COVERAGE[selectedSpot.cell] || CELL_COVERAGE.none} />
              <InfoCell label="BEAR"  icon="BEAR" statusObj={BEAR_REQUIREMENTS[selectedSpot.bear] || BEAR_REQUIREMENTS.none} />
              <InfoCell label="STARS" icon="★"  statusObj={STARGAZING_LEVELS.find(x => x.val === selectedSpot.stargaze) || STARGAZING_LEVELS[4]} />
            </div>

            {/* permits */}
            <div style={{ padding: '10px 12px', background: T.leatherDark, borderRadius: '10px',
              marginBottom: '16px', border: '1px solid ' + (selectedSpot.permits?.required ? T.warn : T.border) }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '2px' }}>PERMITS</span>
                {selectedSpot.permits?.required
                  ? <Pill label="Required" color={T.warn} />
                  : <Pill label="Not Required" color={T.good} />}
              </div>
              <div style={{ fontSize: '0.78rem', color: T.text }}>{selectedSpot.permits?.notes}</div>
            </div>

            {/* trails */}
            <div style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '2px', marginBottom: '10px', fontFamily: 'Cinzel, serif' }}>TRAILS</div>
            {selectedSpot.trails?.map((tr, ti) => {
              const trailKey = selectedSpot.name + '||' + tr.name;
              const isSaved  = !!savedTrails[trailKey];
              const rating   = (4 + ((tr.name.length * 7) % 10) / 10).toFixed(1);
              const isActive = selectedTrail?.name === tr.name;
              return (
                <div key={ti} onClick={() => setSelectedTrail(isActive ? null : tr)}
                  style={{ padding: '10px 12px', background: isActive ? T.leatherDark + 'ee' : T.leatherDark,
                    borderRadius: '10px', marginBottom: '8px', cursor: 'pointer',
                    border: '1px solid ' + (isActive ? T.gold : T.border),
                    transition: 'border-color 150ms', }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px', gap: '6px' }}>
                    <div style={{ color: isActive ? T.gold : '#fff', fontWeight: 'bold', fontSize: '0.88rem', fontFamily: 'Georgia, serif', lineHeight: 1.3, transition: 'color 150ms' }}>
                      {tr.name}
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onSaveTrail(trailKey); }}
                      style={{ ...BUTTON_RESET, width: 'auto', color: isSaved ? T.star : T.muted, fontSize: '1rem', padding: '0 2px', flexShrink: 0 }}>
                      {isSaved ? '♥' : '♡'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem', marginBottom: '4px' }}>
                    <span style={{ color: T.gold }}>★ {rating}</span>
                    <span style={{ color: DIFF_COLORS[tr.diff] }}>{DIFF_LABELS[tr.diff]}</span>
                    <span style={{ color: T.text }}>{tr.dist}</span>
                    <span style={{ color: T.muted }}>{tr.type}</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: T.muted, fontStyle: 'italic' }}>{tr.notes}</div>
                  {isActive && (
                    <div style={{ marginTop: '8px', fontSize: '0.68rem', color: T.gold, display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span>◎</span>
                      <span>Showing trail radius on map · {tr.dist}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
