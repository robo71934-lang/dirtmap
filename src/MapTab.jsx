import React, { useState, useEffect, useRef } from 'react';

// Module-level cache so trail routes persist across re-renders
const TRAIL_CACHE = new Map();
const ELEV_CACHE = new Map();

// Elevation profile chart
const ElevationChart = ({ elevations, dist, diff }) => {
  if (!elevations?.length) return null;
  const toFt = m => Math.round(m * 3.281);
  const elevFt = elevations.map(toFt);
  const min = Math.min(...elevFt), max = Math.max(...elevFt);
  const range = max - min || 1;
  const W = 320, H = 72;
  const xs = elevFt.map((_, i) => (i / (elevFt.length - 1)) * W);
  const ys = elevFt.map(e => H - ((e - min) / range) * (H - 8) - 4);
  const coords = xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`);
  const line = `M${coords.join(' L')}`;
  const area = `M0,${H} L${coords.join(' L')} L${W},${H} Z`;

  // Total elevation gain (sum of all positive steps)
  let gain = 0;
  for (let i = 1; i < elevFt.length; i++) if (elevFt[i] > elevFt[i-1]) gain += elevFt[i] - elevFt[i-1];

  // Est time from distance + difficulty
  const speeds = [null, 3.0, 2.5, 2.0, 1.5, 1.0];
  const mph = speeds[diff] || 2.0;
  const miles = parseFloat(dist);
  const estMins = miles && !isNaN(miles) ? Math.round((miles / mph) * 60) : null;
  const estStr = estMins ? estMins >= 60 ? `${Math.floor(estMins/60)}h ${estMins%60}m` : `${estMins}m` : null;

  return (
    <div style={{ marginTop: '10px', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', border: '1px solid rgba(124,58,237,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#b89fd4', marginBottom: '8px', fontWeight: '600' }}>
        <span>↑ {gain.toLocaleString()} ft gain</span>
        {estStr && <span>⏱ Est. {estStr}</span>}
        <span>{min.toLocaleString()} – {max.toLocaleString()} ft</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '60px', display: 'block' }}>
        <defs>
          <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <path d={area} fill="url(#elevGrad)" />
        <path d={line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#887766', marginTop: '4px' }}>
        <span>0 mi</span><span>{dist}</span>
      </div>
    </div>
  );
};

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
  const [trailRoute, setTrailRoute] = useState(null);
  const [trailLoading, setTrailLoading] = useState(false);
  const [elevationProfile, setElevationProfile] = useState(null);
  const [selectedTerrain, setSelectedTerrain] = useState(null);
  const [hoveredTerrain, setHoveredTerrain] = useState(null);
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
        setRL({ L, MapContainer: rl.MapContainer, TileLayer: rl.TileLayer, Marker: rl.Marker, Circle: rl.Circle, Polyline: rl.Polyline, CircleMarker: rl.CircleMarker });
      })
      .catch(err => console.warn('Leaflet load failed:', err));
  }, []);

  // When planner sends us a spot, fly to it, expand its terrain, and open sidebar
  useEffect(() => {
    if (!jumpToSpot) return;
    const spots = allSpots.filter(s => s.lat && s.lng);
    const match = spots.find(s => s.name === jumpToSpot.name) || jumpToSpot;
    setSelectedSpot(match);
    if (match.terrainName) setSelectedTerrain(match.terrainName);
    if (mapRef.current && match.lat && match.lng) {
      mapRef.current.flyTo([match.lat, match.lng], 12, { duration: 1.4 });
    }
  }, [jumpToSpot]);

  // Fetch real trail geometry from USFS ArcGIS then OSM Overpass fallback
  useEffect(() => {
    if (!selectedTrail || !selectedSpot?.lat) { setTrailRoute(null); return; }
    setTrailLoading(true);
    setTrailRoute(null);

    if (mapRef.current) {
      mapRef.current.flyTo([selectedSpot.lat, selectedSpot.lng], 13, { duration: 1 });
    }

    const shortName = selectedTrail.name.replace(/['"()\[\]]/g, '').trim().split(/\s+/).slice(0, 4).join(' ');
    const { lat, lng } = selectedSpot;
    const cacheKey = `${shortName}|${lat.toFixed(3)}|${lng.toFixed(3)}`;

    if (TRAIL_CACHE.has(cacheKey)) {
      const cached = TRAIL_CACHE.get(cacheKey);
      setTrailRoute(cached);
      if (cached && mapRef.current) {
        const pts = cached.segments.flat();
        const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
        mapRef.current.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [50, 50], maxZoom: 15 });
      }
      setTrailLoading(false);
      return;
    }

    const processSegments = (segments) => {
      if (!segments.length) return null;
      const dist = ([a, b], [c, d]) => Math.hypot(a - c, b - d);
      const camp = [lat, lng];
      const nearby = segments.filter(seg => seg.some(pt => dist(pt, camp) < 0.18));
      const finalSegs = nearby.length > 0 ? nearby : segments;
      let trailhead = null, minD = Infinity;
      finalSegs.flat().forEach(pt => { const d = dist(pt, camp); if (d < minD) { minD = d; trailhead = pt; } });
      return { segments: finalSegs, trailhead };
    };

    const applyResult = (result) => {
      TRAIL_CACHE.set(cacheKey, result);
      setTrailRoute(result);
      if (result && mapRef.current) {
        const pts = result.segments.flat();
        const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
        mapRef.current.fitBounds([[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]], { padding: [50, 50], maxZoom: 15 });
      }
      setTrailLoading(false);
    };

    const usfsUrl = `https://apps.fs.usda.gov/arcx/rest/services/EDW/EDW_TrailNFS_01/MapServer/0/query?where=TRAIL_NAME+LIKE+'%25${encodeURIComponent(shortName)}%25'&outFields=TRAIL_NAME&outSR=4326&f=geojson&geometryType=esriGeometryPolyline`;

    fetch(usfsUrl, { signal: AbortSignal.timeout(6000) })
      .then(r => r.json())
      .then(data => {
        const segments = (data.features || []).flatMap(f => {
          const g = f.geometry;
          if (!g) return [];
          if (g.type === 'LineString') return [g.coordinates.map(([ln, lt]) => [lt, ln])];
          if (g.type === 'MultiLineString') return g.coordinates.map(line => line.map(([ln, lt]) => [lt, ln]));
          return [];
        }).filter(s => s.length > 1);

        if (segments.length > 0) {
          applyResult(processSegments(segments));
        } else {
          throw new Error('not found in USFS');
        }
      })
      .catch(() => {
        const query = `[out:json][timeout:18];way["name"~"${shortName}",i](around:40000,${lat},${lng});out geom;`;
        Promise.race([
          fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`),
          fetch(`https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(query)}`),
        ])
          .then(r => r.json())
          .then(data => {
            const segments = (data.elements || []).filter(el => el.geometry?.length > 1).map(el => el.geometry.map(p => [p.lat, p.lon]));
            applyResult(processSegments(segments));
          })
          .catch(() => applyResult(null));
      });
  }, [selectedTrail, selectedSpot]);

  // Fetch elevation profile once trail route is loaded
  useEffect(() => {
    if (!trailRoute?.segments || !selectedTrail || !selectedSpot) {
      setElevationProfile(null);
      return;
    }
    const cacheKey = `elev|${selectedTrail.name}|${selectedSpot.lat?.toFixed(3)}|${selectedSpot.lng?.toFixed(3)}`;
    if (ELEV_CACHE.has(cacheKey)) {
      setElevationProfile(ELEV_CACHE.get(cacheKey));
      return;
    }

    const allPts = trailRoute.segments.flat();
    const step = Math.max(1, Math.floor(allPts.length / 50));
    const sampled = allPts.filter((_, i) => i % step === 0).slice(0, 50);
    if (sampled.length < 3) return;

    const locStr = sampled.map(([lt, ln]) => `${lt.toFixed(5)},${ln.toFixed(5)}`).join('|');
    fetch(`https://api.opentopodata.org/v1/srtm90m?locations=${encodeURIComponent(locStr)}`, {
      signal: AbortSignal.timeout(12000),
    })
      .then(r => r.json())
      .then(data => {
        const elevs = (data.results || []).map(r => r.elevation).filter(e => e != null && e > -500);
        if (elevs.length > 3) {
          ELEV_CACHE.set(cacheKey, elevs);
          setElevationProfile(elevs);
        }
      })
      .catch(() => {});
  }, [trailRoute]);

  const spots = allSpots.filter(s => s.lat && s.lng);

  // Curated label positions — hand-placed to avoid edges/overlap
  const TERRAIN_PINS = {
    'Redwood Forest':    [41.05, -123.80],
    'Volcanic / Alpine': [40.55, -121.10],
    'Lake / River':      [40.80, -122.60],
    'Lost Coast':        [40.00, -124.05],
    'Mountain / Forest': [37.30, -119.40],
    'Dispersed / BLM':   [35.60, -117.00],
    'Coastal / Beach':   [34.10, -120.40],
    'Desert':            [33.70, -116.80],
  };

  // Collect which terrain names actually have spots (for badge counts)
  const terrainCounts = {};
  spots.forEach(s => { if (s.terrainName) terrainCounts[s.terrainName] = (terrainCounts[s.terrainName] || 0) + 1; });

  // Build label list — use curated pin if available, fall back to centroid
  const terrainCenters = {};
  spots.forEach(s => {
    if (!s.terrainName) return;
    if (!terrainCenters[s.terrainName]) terrainCenters[s.terrainName] = { lats: [], lngs: [] };
    terrainCenters[s.terrainName].lats.push(s.lat);
    terrainCenters[s.terrainName].lngs.push(s.lng);
  });
  const terrainLabels = Object.keys(terrainCenters).map(name => {
    const pin = TERRAIN_PINS[name];
    const { lats, lngs } = terrainCenters[name];
    return {
      name,
      lat: pin ? pin[0] : lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: pin ? pin[1] : lngs.reduce((a, b) => a + b, 0) / lngs.length,
    };
  });

  if (!RL) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 'calc(100vh - 74px)', color: T.muted, fontStyle: 'italic', fontSize: '0.9rem' }}>
        Loading map…
      </div>
    );
  }

  const { L, MapContainer, TileLayer, Marker, Circle, Polyline, CircleMarker } = RL;

  const parseMeters = (dist) => {
    if (!dist || dist === 'Open' || dist === 'Varies') return 4000;
    const mi = dist.match(/([\d.]+)\s*mi/i);
    if (mi) return parseFloat(mi[1]) * 1609;
    const km = dist.match(/([\d.]+)\s*km/i);
    if (km) return parseFloat(km[1]) * 1000;
    return 4000;
  };

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

  const makeTerrainLabel = (name, isSelected, isHovered, count) => {
    const bg      = isSelected ? 'rgba(61,43,31,0.88)'   : isHovered ? 'rgba(255,253,248,0.95)' : 'rgba(255,253,248,0.76)';
    const color   = isSelected ? '#c29b61'                : '#3d2b1f';
    const border  = isSelected ? '1.5px solid #c29b61'   : isHovered ? '1px solid rgba(61,43,31,0.45)' : '1px solid rgba(61,43,31,0.18)';
    const shadow  = isSelected ? '0 3px 14px rgba(194,155,97,0.35)' : isHovered ? '0 2px 10px rgba(0,0,0,0.18)' : 'none';
    const badge   = (isHovered || isSelected) && count
      ? `<span style="margin-left:7px;background:${isSelected ? '#c29b61' : '#3d2b1f'};color:${isSelected ? '#1a0f08' : '#e2d5c3'};border-radius:999px;padding:1px 7px;font-size:0.58rem;font-weight:700;">${count}</span>`
      : '';
    const close   = isSelected ? `<span style="margin-left:6px;opacity:0.6;font-size:0.7rem;">×</span>` : '';
    return L.divIcon({
      className: '',
      html: `<div style="
        font-family:'Cinzel',Georgia,serif;font-size:0.62rem;font-weight:700;
        letter-spacing:2px;color:${color};text-transform:uppercase;
        background:${bg};padding:5px 12px;border-radius:4px;
        border:${border};white-space:nowrap;cursor:pointer;
        backdrop-filter:blur(3px);
        box-shadow:${shadow};
        display:flex;align-items:center;
      ">${name}${badge}${close}</div>`,
      iconSize: null,
      iconAnchor: [0, 12],
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 74px)', overflow: 'hidden' }}>
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
          url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          subdomains="abc"
          maxZoom={17}
        />

        {/* Terrain biome labels — click to expand, hover for count */}
        {terrainLabels.map((tl, i) => {
          const isSelected = selectedTerrain === tl.name;
          const isHovered  = hoveredTerrain  === tl.name;
          const count      = terrainCounts[tl.name] || 0;
          return (
            <Marker
              key={'terrain-' + i}
              position={[tl.lat, tl.lng]}
              icon={makeTerrainLabel(tl.name, isSelected, isHovered, count)}
              zIndexOffset={isSelected ? 500 : 0}
              eventHandlers={{
                click:     () => { setSelectedTerrain(prev => prev === tl.name ? null : tl.name); setSelectedSpot(null); setSelectedTrail(null); },
                mouseover: () => setHoveredTerrain(tl.name),
                mouseout:  () => setHoveredTerrain(null),
              }}
            />
          );
        })}

        {/* Campsite pins — only visible when their terrain biome is selected */}
        {selectedTerrain && spots
          .filter(sp => sp.terrainName === selectedTerrain)
          .map((sp, i) => (
            <Marker
              key={i}
              position={[sp.lat, sp.lng]}
              icon={makeIcon(sp, selectedSpot === sp)}
              eventHandlers={{ click: () => { setSelectedSpot(prev => prev === sp ? null : sp); setSelectedTrail(null); } }}
              zIndexOffset={selectedSpot === sp ? 1000 : 0}
            />
          ))
        }

        {selectedSpot && selectedTrail && trailRoute && trailRoute.segments.map((seg, i) => (
          <React.Fragment key={i}>
            <Polyline positions={seg} pathOptions={{ color: '#fff', weight: 8, opacity: 0.6, lineCap: 'round', lineJoin: 'round' }} />
            <Polyline positions={seg} pathOptions={{ color: '#7c3aed', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
          </React.Fragment>
        ))}

        {selectedSpot && selectedTrail && trailRoute?.trailhead && (
          <>
            <CircleMarker center={trailRoute.trailhead} radius={10}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#22c55e', fillOpacity: 1 }} />
            <CircleMarker center={trailRoute.trailhead} radius={4}
              pathOptions={{ color: '#fff', weight: 0, fillColor: '#fff', fillOpacity: 1 }} />
          </>
        )}

        {selectedSpot && selectedTrail && !trailRoute && !trailLoading && (
          <>
            <Circle
              center={[selectedSpot.lat, selectedSpot.lng]}
              radius={parseMeters(selectedTrail.dist)}
              pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.08, dashArray: '8 5', weight: 3, opacity: 0.7 }}
            />
            <CircleMarker center={[selectedSpot.lat, selectedSpot.lng]} radius={8}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#22c55e', fillOpacity: 1 }} />
          </>
        )}
      </MapContainer>

      {selectedSpot && (
        <div style={{
          width: '360px', flexShrink: 0, overflowY: 'auto',
          background: T.leather, borderLeft: '1px solid ' + T.border,
          boxShadow: '-6px 0 24px rgba(0,0,0,0.45)',
        }}>
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

          {(selectedSpot.img || selectedSpot.terrainImg) && (
            <img src={selectedSpot.img || selectedSpot.terrainImg} alt=""
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
          )}

          <div style={{ padding: '16px' }}>
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

            <p style={{ fontSize: '0.82rem', color: T.text, lineHeight: 1.6, marginBottom: '14px', fontStyle: 'italic' }}>
              {selectedSpot.notes}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <InfoCell label="WATER" statusObj={WATER_STATUS[selectedSpot.water] || WATER_STATUS.dry} />
              <InfoCell label="CELL"  statusObj={CELL_COVERAGE[selectedSpot.cell] || CELL_COVERAGE.none} />
              <InfoCell label="BEAR"  statusObj={BEAR_REQUIREMENTS[selectedSpot.bear] || BEAR_REQUIREMENTS.none} />
              <InfoCell label="STARS" statusObj={STARGAZING_LEVELS.find(x => x.val === selectedSpot.stargaze) || STARGAZING_LEVELS[4]} />
            </div>

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
                    transition: 'border-color 150ms' }}>
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
                    <>
                      <div style={{ marginTop: '8px', fontSize: '0.68rem', color: T.gold, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>◎</span>
                        <span>
                          {trailLoading
                            ? 'Searching for trail route...'
                            : trailRoute
                              ? 'Trail route found - ' + tr.dist
                              : (tr.dist === 'Open' || tr.dist === 'Varies')
                                ? 'No fixed path - open terrain'
                                : 'No mapped route found - showing area radius'}
                        </span>
                      </div>
                      <ElevationChart elevations={elevationProfile} dist={tr.dist} diff={tr.diff} />
                    </>
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
