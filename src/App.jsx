import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import MapTab from './MapTab.jsx';
import CommunityTab from './CommunityTab.jsx';

// =============================================================================
// THEME + STATIC LOOKUPS  (unchanged from baseline)
// =============================================================================
const T = {
  nightCamp: '#1a0f08',
  leather: '#3d2b1f',
  leatherDark: '#2a1d14',
  gold: '#c29b61',
  goldBright: '#d4a574',
  border: '#4a3728',
  text: '#e2d5c3',
  muted: '#887766',
  good: '#7fa650',
  warn: '#d49344',
  bad: '#c54f4f',
  cool: '#6082c2',
  star: '#9b6dd1',
};

const DIFF_COLORS = [null, T.good, '#a3c168', T.warn, '#c0723a', T.bad];
const DIFF_LABELS = ['', 'Easy', 'Moderate', 'Challenging', 'Strenuous', 'Expert'];
const COMFORT_COLORS = [null, T.muted, T.cool, T.good, T.warn, '#d469a3'];
const COMFORT_LABELS = ['', 'Primitive', 'Basic', 'Comfortable', 'Well-Equipped', 'Resort'];

const WATER_STATUS = {
  reliable: { label: 'Reliable', color: T.good, desc: 'Flows year-round' },
  seasonal: { label: 'Seasonal', color: T.warn, desc: 'Flows Nov-May typically' },
  iffy: { label: 'Often Dry', color: '#c0723a', desc: 'Unreliable, call ahead' },
  dry: { label: 'No Water', color: T.bad, desc: 'Pack in all water' },
};
const CELL_COVERAGE = {
  strong: { label: 'Strong', color: T.good, desc: 'All carriers usable' },
  spotty: { label: 'Spotty', color: T.warn, desc: 'Verizon best, AT&T weak' },
  weak: { label: 'Weak', color: '#c0723a', desc: 'Roam high points only' },
  none: { label: 'No Service', color: T.bad, desc: 'Bring satellite comms' },
};
const BEAR_REQUIREMENTS = {
  canister: { label: 'Canister Required', color: T.bad, desc: 'Hard-sided bear canister mandatory' },
  box: { label: 'Bear Box On-Site', color: T.good, desc: 'Metal bear lockers provided' },
  hang: { label: 'Hang Acceptable', color: T.warn, desc: 'PCT-style hang OK if done right' },
  none: { label: 'No Bears', color: T.muted, desc: 'Not bear country' },
};
const STARGAZING_LEVELS = [
  { val: 5, label: 'Pristine Dark', color: T.star, desc: 'Milky Way visible, Bortle 1-2' },
  { val: 4, label: 'Excellent', color: '#b489d9', desc: 'Bortle 3, clear deep sky' },
  { val: 3, label: 'Good', color: T.cool, desc: 'Bortle 4, decent stargazing' },
  { val: 2, label: 'Fair', color: T.warn, desc: 'Some light pollution' },
  { val: 1, label: 'Poor', color: T.bad, desc: 'Bortle 7+, city sky' },
];

const TERRAINS = {
  'Southern California': [
    { id: 'desert', name: 'Desert', desc: 'Joshua Tree & Anza Borrego', vibe: 'Stark, silent, otherworldly', bestTime: 'Oct-Apr', diff: 3,
      img: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&q=80&w=800' },
    { id: 'beach', name: 'Coastal / Beach', desc: 'San Elijo & Jalama', vibe: 'Salt air, surf sounds, fire rings', bestTime: 'Year-round', diff: 1,
      img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800' },
    { id: 'mountain', name: 'Mountain / Forest', desc: 'Big Bear & Idyllwild', vibe: 'Pine shade, cool elevation', bestTime: 'May-Oct', diff: 2,
      img: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800' },
    { id: 'dispersed', name: 'Dispersed / BLM', desc: 'Mojave Road & Saline Valley', vibe: 'No hookups, no rules', bestTime: 'Oct-Mar', diff: 5,
      img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800' },
  ],
  'Northern California': [
    { id: 'redwood', name: 'Redwood Forest', desc: 'Humboldt & Jedediah Smith', vibe: 'Cathedral silence, filtered light', bestTime: 'Jun-Sep', diff: 1,
      img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800' },
    { id: 'lake', name: 'Lake / River', desc: 'Shasta & Trinity', vibe: 'Fishing, kayaking, golden afternoons', bestTime: 'May-Sep', diff: 2,
      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800' },
    { id: 'volcanic', name: 'Volcanic / Alpine', desc: 'Lassen & Mount Shasta', vibe: 'Lava fields, alpine lakes', bestTime: 'Jul-Sep', diff: 4,
      img: 'https://images.unsplash.com/photo-1434394354979-a235cd36269d?auto=format&fit=crop&q=80&w=800' },
    { id: 'lostcoast', name: 'Lost Coast', desc: 'King Range Wilderness', vibe: 'Rugged, remote, primally wild', bestTime: 'Aug-Oct', diff: 4,
      img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800' },
  ],
};

const SLEEP_STYLES = [
  { id: 'tent', name: 'Tent', emoji: 'TENT', comfort: 3, desc: 'Classic full-protection',
    pros: ['Works any terrain', 'Wind & rain protection', 'Privacy'], cons: ['Setup time', 'Condensation', 'Heavier'],
    good: ['desert','beach','mountain','dispersed','redwood','lake','volcanic','lostcoast'], bad: [] },
  { id: 'hammock', name: 'Hammock', emoji: 'HMK', comfort: 4, desc: 'Suspended between trees',
    pros: ['Incredible comfort','No uneven ground','Ultralight'], cons: ['Needs two trees','Cold underneath','Wind exposure'],
    good: ['mountain','redwood','lake'], bad: ['desert','beach','volcanic','lostcoast'] },
  { id: 'car', name: 'Car Camping', emoji: 'CAR', comfort: 4, desc: 'Sleep in or next to your car',
    pros: ['No weight limit','Easy resupply','Drive out anytime'], cons: ['Developed sites only','Not remote','Hot in summer'],
    good: ['beach','lake','redwood'], bad: ['dispersed','volcanic','lostcoast'] },
  { id: 'rooftop', name: 'Rooftop Tent', emoji: 'RTT', comfort: 3, desc: 'Mounted on roof rack',
    pros: ['Off ground','Great views','Quick setup'], cons: ['Expensive','Affects MPG','Cant drive once up'],
    good: ['desert','dispersed'], bad: ['beach','mountain'] },
  { id: 'bivy', name: 'Bivy Sack', emoji: 'BVY', comfort: 1, desc: 'Ultraminimalist shell',
    pros: ['Extremely light','No setup','Stealth-friendly'], cons: ['Claustrophobic','Zero living space','Condensation'],
    good: ['volcanic','dispersed','lostcoast'], bad: ['redwood','beach','lake'] },
  { id: 'cowboy', name: 'Cowboy Camp', emoji: 'CWB', comfort: 1, desc: 'Sleeping bag on the ground',
    pros: ['Zero setup','Unobstructed stars','Total freedom'], cons: ['Weather dependent','Bug exposure','Ground moisture'],
    good: ['desert','dispersed'], bad: ['redwood','lostcoast','beach'] },
  { id: 'van', name: 'Van / Overland', emoji: 'VAN', comfort: 4, desc: 'Converted van or truck camper',
    pros: ['Full shelter','Move anytime','All gear inside'], cons: ['Fuel cost','Trail size limits','Stealth rules'],
    good: ['desert','dispersed','beach','lake'], bad: ['volcanic','lostcoast'] },
  { id: 'tarp', name: 'Tarp', emoji: 'TRP', comfort: 2, desc: 'Open-air minimalist shelter',
    pros: ['Ultralight','Great airflow','Versatile'], cons: ['No bug protection','Skill needed','Limited rain cover'],
    good: ['desert','mountain','dispersed'], bad: ['redwood','lostcoast'] },
  { id: 'cabin', name: 'Cabin / Glamp', emoji: 'CAB', comfort: 5, desc: 'Furnished lodging in nature',
    pros: ['Full comfort','No gear needed','Great for groups'], cons: ['Most expensive','Less immersive','Books fast'],
    good: ['mountain','lake','redwood','beach'], bad: ['dispersed','volcanic','lostcoast'] },
];

// Maps each sleep style to which shelter/sleep items are relevant, skip-able, or need a note
const SLEEP_PACK_MAP = {
  tent:    {
    label: 'Tent', icon: '⛺',
    note: 'Full tent setup. Footprint and repair kit are worth the weight on multi-night.',
    needed: ['Tent or hammock', 'Tent footprint', 'Tent repair kit'],
    skip:   ['Tarp backup'],
    sleepSkip: [],
  },
  hammock: {
    label: 'Hammock', icon: '🌿',
    note: 'Swap freestanding tent for hammock. Add an underquilt if temps drop below 50°F — hammocks are cold underneath.',
    needed: ['Tent or hammock', 'Tarp backup'],
    skip:   ['Tent footprint', 'Tent repair kit'],
    sleepSkip: [],
  },
  car:     {
    label: 'Car Camping', icon: '🚗',
    note: 'You\'re sleeping in or beside your car — skip the backpacking shelter entirely. Weight limits don\'t apply.',
    needed: [],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tarp backup', 'Tent repair kit'],
    sleepSkip: [],
  },
  rooftop: {
    label: 'Rooftop Tent', icon: '🚙',
    note: 'Your RTT is the shelter. Leave the freestanding tent at home.',
    needed: [],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tarp backup', 'Tent repair kit'],
    sleepSkip: [],
  },
  bivy:    {
    label: 'Bivy Sack', icon: '🪨',
    note: 'Bivy + tarp is a classic ultralight combo. The tarp handles rain — the bivy handles condensation and bugs.',
    needed: ['Tarp backup'],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tent repair kit'],
    sleepSkip: [],
  },
  cowboy:  {
    label: 'Cowboy Camp', icon: '🌙',
    note: 'Nothing above you but stars. Skip all shelter. Sleeping pad insulation matters even more on the bare ground.',
    needed: [],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tarp backup', 'Tent repair kit'],
    sleepSkip: [],
  },
  van:     {
    label: 'Van / Overland', icon: '🚐',
    note: 'The van is the shelter. Skip tent, footprint, and tarp — use that weight budget for comfort or extra food.',
    needed: [],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tarp backup', 'Tent repair kit'],
    sleepSkip: [],
  },
  tarp:    {
    label: 'Tarp', icon: '🏕',
    note: 'Tarp as primary shelter — pair with a bivy or bug net for insect protection. Skill-intensive but very light.',
    needed: ['Tarp backup'],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tent repair kit'],
    sleepSkip: [],
  },
  cabin:   {
    label: 'Cabin / Glamp', icon: '🏡',
    note: 'Furnished lodging — sleeping bag, pad, and all shelter gear stays home. Just bring your personal kit.',
    needed: [],
    skip:   ['Tent or hammock', 'Tent footprint', 'Tarp backup', 'Tent repair kit'],
    sleepSkip: ['Sleeping bag', 'Sleeping pad', 'Camp pillow', 'Ear plugs'],
  },
};

const SEASONAL = {
  desert:    { months: [2,3,3,3,2,1,0,0,1,2,3,3], notes: { best: 'Oct-Apr', avoid: 'Jun-Aug (100F+)', bugs: 'Minimal year-round', crowds: 'Spring weekends peak' } },
  beach:     { months: [2,2,2,2,1,1,2,3,3,2,2,2], notes: { best: 'Aug-Oct (clear skies)', avoid: 'May-Jun (marine layer)', bugs: 'Light', crowds: 'Summer weekends mobbed' } },
  mountain:  { months: [0,0,1,2,3,3,3,3,3,2,1,0], notes: { best: 'May-Oct', avoid: 'Dec-Feb (snow closure)', bugs: 'Mosquitos Jun-Jul', crowds: 'Summer weekends booked 6mo out' } },
  dispersed: { months: [3,3,3,2,1,0,0,0,1,2,3,3], notes: { best: 'Oct-Mar', avoid: 'Jun-Aug heat', bugs: 'Minimal', crowds: 'Almost always empty' } },
  redwood:   { months: [1,1,1,2,2,3,3,3,3,2,1,1], notes: { best: 'Jun-Sep', avoid: 'Winter (rain, road closures)', bugs: 'Light', crowds: 'Summer holidays mobbed' } },
  lake:      { months: [0,0,1,2,3,3,3,3,3,2,1,0], notes: { best: 'May-Sep', avoid: 'Winter', bugs: 'Mosquitos near water Jul-Aug', crowds: 'Holiday weekends maxed' } },
  volcanic:  { months: [0,0,0,1,1,2,3,3,3,1,0,0], notes: { best: 'Jul-Sep (snow-free)', avoid: 'Oct-Jun (snow on peaks)', bugs: 'Mosquitos Jul', crowds: 'Lassen rarely full' } },
  lostcoast: { months: [1,1,1,2,2,2,2,3,3,3,2,1], notes: { best: 'Aug-Oct', avoid: 'Winter (storms, tide hazards)', bugs: 'Ticks spring/summer', crowds: 'Permits required, limited' } },
};
const MONTH_NAMES = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const SPOTS = {
  desert: {
    known: [
      { name: 'Joshua Tree - Jumbo Rocks', lat: 33.9825, lng: -116.1175, type: 'Developed', fee: '$20/night', reservations: 'Recreation.gov', comfort: 2, access: 1, iconic: true, img: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=480&q=60',
        amenities: ['Vault toilets','Fire rings','No water on-site'],
        notes: 'Most iconic JT campground. Sites nestled between massive boulder formations. Bring all water.',
        water: 'dry', cell: 'spotty', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'Reservations open 6 months ahead at 10am ET' },
        wildlife: ['Bighorn sheep','Coyotes','Sidewinder rattlesnakes','Roadrunners','Kangaroo rats','Tarantulas (fall)'],
        trails: [
          { name: 'Skull Rock Nature Trail', dist: '1.7 mi', diff: 1, type: 'Loop', notes: 'Family-friendly boulder loop' },
          { name: 'Ryan Mountain Trail', dist: '3 mi', diff: 3, type: 'Out & Back', notes: 'Best panoramic view in the park, 1000ft gain' },
          { name: 'Barker Dam Loop', dist: '1.3 mi', diff: 1, type: 'Loop', notes: 'Historic dam, bighorn sheep sightings' }
        ]},
      { name: 'Anza-Borrego - Borrego Palm Canyon', lat: 33.2581, lng: -116.4170, type: 'Developed', fee: '$35/night', reservations: 'ReserveCA', comfort: 3, access: 1, iconic: true, img: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=480&q=60',
        amenities: ['Flush toilets','Hot showers','Hook-ups','Water on-site'],
        notes: 'Most developed in Anza-Borrego. Full hook-ups for RVs. Great spring wildflower base camp.',
        water: 'reliable', cell: 'weak', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'Book 6 months ahead for spring bloom weekends' },
        wildlife: ['Bighorn sheep','Roadrunners','Mule deer','Western diamondbacks','Cactus wrens'],
        trails: [
          { name: 'Borrego Palm Canyon Trail', dist: '3 mi', diff: 2, type: 'Out & Back', notes: 'Native fan palm oasis' },
          { name: 'Elephant Trees Discovery Trail', dist: '1.5 mi', diff: 1, type: 'Loop', notes: 'Rare trees, only here in the US' }
        ]}
    ],
    hidden: [
      { name: 'Joshua Tree - Black Rock BLM Dispersed', lat: 34.0716, lng: -116.3970, type: 'Dispersed / Free', fee: 'Free', reservations: 'None', comfort: 1, access: 3,
        amenities: ['Fully self-sufficient'],
        notes: 'BLM land north of the park. Incredible dark skies. High clearance recommended.',
        water: 'dry', cell: 'none', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'No fees, max 14-day stay per BLM rules' },
        wildlife: ['Desert tortoise','Joshua tree groves','Coyotes','Bobcats','Golden eagles'],
        trails: [
          { name: 'Warren Peak Trail', dist: '6 mi', diff: 3, type: 'Out & Back', notes: 'Highest point in Black Rock area' },
          { name: 'CA Riding & Hiking Trail', dist: '8 mi', diff: 3, type: 'P2P', notes: 'True desert solitude' }
        ]},
      { name: 'Mojave Preserve - Mid Hills', lat: 35.0683, lng: -115.4333, type: 'Primitive', fee: 'Free', reservations: 'First-come', comfort: 1, access: 2,
        amenities: ['Vault toilets','Picnic tables','No water'],
        notes: '5,600ft elevation. Pine trees in the Mojave feel surreal. Almost always empty.',
        water: 'dry', cell: 'none', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'No permits, free' },
        wildlife: ['Pinyon jays','Mule deer','Mountain lions (rare sightings)','Golden eagles'],
        trails: [
          { name: 'Mid Hills to Hole-in-the-Wall', dist: '8 mi', diff: 3, type: 'P2P', notes: 'Best desert hike in CA, slot canyon exit' },
          { name: 'Rings Loop Trail', dist: '1.4 mi', diff: 2, type: 'Loop', notes: 'Metal rings through slot canyon' }
        ]}
    ]
  },
  beach: {
    known: [
      { name: 'San Elijo State Beach - Cardiff', lat: 33.0142, lng: -117.2817, type: 'Developed', fee: '$65-80/night', reservations: 'ReserveCA (6 months out)', comfort: 4, access: 1, iconic: true, img: 'https://images.unsplash.com/photo-1493558103817-58b2924bce98?auto=format&fit=crop&w=480&q=60',
        amenities: ['Hot showers','Flush toilets','Hook-ups','Beach access','Camp store'],
        notes: 'Best all-around beach camp in SoCal. Sites perched above the Pacific.',
        water: 'reliable', cell: 'strong', bear: 'none', stargaze: 1,
        permits: { required: true, notes: 'Book at midnight exactly 6 months ahead - sells out in seconds' },
        wildlife: ['Sea lions','Dolphins (offshore)','Pelicans','Sand crabs','Gray whales (Dec-Apr)'],
        trails: [{ name: 'San Elijo Lagoon Trail', dist: '4 mi', diff: 1, type: 'Loop', notes: 'Flat birding trail through wetlands' }]},
      { name: 'Leo Carrillo State Beach', lat: 34.0459, lng: -118.9357, type: 'Developed', fee: '$55/night', reservations: 'ReserveCA', comfort: 4, access: 1, iconic: true, img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=480&q=60',
        amenities: ['Hot showers','Flush toilets','Fire rings','Sea cave access'],
        notes: 'Sea caves, tide pools, surf-friendly waves. Northern Malibu.',
        water: 'reliable', cell: 'strong', bear: 'none', stargaze: 2,
        permits: { required: true, notes: 'Reserve 6 months ahead' },
        wildlife: ['Tide pool crabs','Sea anemones','Pelicans','Garibaldi','Sea lions'],
        trails: [
          { name: 'Nicholas Flat Trail', dist: '7 mi', diff: 3, type: 'Loop', notes: 'Climbs above PCH, ocean views' },
          { name: 'Yellow Hill Fire Road', dist: '3.5 mi', diff: 2, type: 'Out & Back', notes: 'Ridge views' }
        ]}
    ],
    hidden: [
      { name: 'Point Mugu - Thornhill Broome', lat: 34.0791, lng: -119.0614, type: 'Primitive Beach', fee: '$35/night', reservations: 'ReserveCA', comfort: 2, access: 1,
        amenities: ['Chemical toilets','Fire rings','No showers'],
        notes: 'Tent sites literally between PCH and the Pacific. 40 miles from LA but feels remote.',
        water: 'iffy', cell: 'spotty', bear: 'none', stargaze: 3,
        permits: { required: true, notes: 'Book in advance, no walk-ups' },
        wildlife: ['Dolphins','Pelicans','Tide pool life','Whales (Dec-Apr migration)'],
        trails: [
          { name: 'Chumash Trail', dist: '3.5 mi', diff: 3, type: 'Out & Back', notes: 'Steep climb from sea level' },
          { name: 'Big Sycamore Canyon Loop', dist: '9.5 mi', diff: 3, type: 'Loop', notes: 'Best Santa Monica Mtns day hike' }
        ]},
      { name: 'Jalama Beach County Park', lat: 34.5031, lng: -120.5017, type: 'County Developed', fee: '$45/night', reservations: 'SB County Parks', comfort: 3, access: 1,
        amenities: ['Hot showers','Flush toilets','Small store','Burger stand'],
        notes: 'Long winding road near Lompoc. Famous Jalama Burger. Edge-of-California feel.',
        water: 'reliable', cell: 'weak', bear: 'none', stargaze: 4,
        permits: { required: false, notes: 'First-come partly, some reservable' },
        wildlife: ['Elephant seals (Nov-Mar)','Gray whales','Brown pelicans','Western gulls'],
        trails: [{ name: 'Jalama Coastal Walk', dist: '2-4 mi', diff: 1, type: 'Out & Back', notes: 'Tide pools, no trail needed' }]}
    ]
  },
  mountain: {
    known: [
      { name: 'Idyllwild - Idyllwild County Park', lat: 33.7406, lng: -116.7133, type: 'Developed', fee: '$30-45/night', reservations: 'Riverside County Parks', comfort: 3, access: 1,
        amenities: ['Flush toilets','Hot showers','Fire rings','Town walkable'],
        notes: 'Gateway to San Jacinto. Huge pines, charming mountain town.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 4,
        permits: { required: false, notes: 'Wilderness permit needed for San Jacinto backcountry' },
        wildlife: ['Black bears','Mule deer','Mountain lions','Western tanagers','Stellers jays','Acorn woodpeckers'],
        trails: [
          { name: 'Tahquitz Peak via South Ridge', dist: '8 mi', diff: 4, type: 'Out & Back', notes: '2800ft gain, fire lookout summit' },
          { name: 'Devils Slide Trail', dist: '8 mi', diff: 4, type: 'Out & Back', notes: 'Access to San Jacinto PCT junction' },
          { name: 'Ernie Maxwell Scenic Trail', dist: '5.5 mi', diff: 2, type: 'Out & Back', notes: 'Gentle forest walk' }
        ]},
      { name: 'Big Bear - Serrano Campground', lat: 34.2442, lng: -116.8606, type: 'Developed', fee: '$40/night', reservations: 'Recreation.gov', comfort: 4, access: 1,
        amenities: ['Flush toilets','Showers','Fire rings','Boat launch nearby'],
        notes: 'Right on the lake. Extremely popular - book 6 months out.',
        water: 'reliable', cell: 'strong', bear: 'box', stargaze: 3,
        permits: { required: true, notes: 'Adventure Pass required for trailhead parking' },
        wildlife: ['Black bears','Bald eagles (winter)','Mule deer','Coyotes'],
        trails: [
          { name: 'Castle Rock Trail', dist: '2 mi', diff: 2, type: 'Out & Back', notes: 'Short climb to granite formation' },
          { name: 'Cougar Crest to PCT', dist: '7 mi', diff: 3, type: 'Out & Back', notes: 'Reaches the Pacific Crest Trail' }
        ]},
      { name: 'Tuolumne Meadows - Yosemite', lat: 37.8734, lng: -119.3569, type: 'Developed', fee: '$35/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Potable water','Fire rings','Ranger station','Camp store'],
        notes: 'High Sierra at 8,600ft. Open granite domes, sweeping meadows. One of the most iconic camps in the US — books out the moment reservations open.',
        water: 'reliable', cell: 'none', bear: 'canister', stargaze: 5,
        permits: { required: true, notes: 'Yosemite reservation required. Trailhead quotas for wilderness.' },
        wildlife: ['Black bears','Mule deer','Coyotes','Pikas','Clark\'s nutcrackers','Marmots'],
        trails: [
          { name: 'Half Dome via JMT', dist: '16 mi', diff: 5, type: 'Out & Back', notes: 'Cable permit required for final 400ft ascent' },
          { name: 'Cathedral Lakes', dist: '7 mi', diff: 3, type: 'Out & Back', notes: 'Lower and Upper lakes, stunning granite cirques' },
          { name: 'Lembert Dome', dist: '2.8 mi', diff: 3, type: 'Out & Back', notes: 'Scramble to bare granite summit, panoramic views' },
          { name: 'Dog Lake Loop', dist: '3.5 mi', diff: 2, type: 'Loop', notes: 'Easy wildflower meadows and alpine lake' }
        ]},
      { name: 'Upper Pines - Yosemite Valley', lat: 37.7366, lng: -119.5594, type: 'Developed', fee: '$36/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Potable water','Fire rings','Shuttle access','Village amenities nearby'],
        notes: 'Valley floor camping under huge ponderosas, steps from the Merced River. El Capitan and Half Dome frame your mornings.',
        water: 'reliable', cell: 'spotty', bear: 'canister', stargaze: 2,
        permits: { required: true, notes: 'Reservation required — one of the hardest to get in NPS system' },
        wildlife: ['Black bears','Mule deer','Gray squirrels','Stellers jays','Great horned owls'],
        trails: [
          { name: 'Mirror Lake Loop', dist: '5 mi', diff: 1, type: 'Loop', notes: 'Flat valley floor, Half Dome reflection' },
          { name: 'Valley Floor Loop', dist: '13 mi', diff: 2, type: 'Loop', notes: 'Full valley circuit past El Cap meadow' },
          { name: 'Mist Trail to Vernal Fall', dist: '5 mi', diff: 3, type: 'Out & Back', notes: 'Spray-soaked granite steps to the fall lip' }
        ]},
      { name: 'D.L. Bliss State Park - Lake Tahoe', lat: 38.9629, lng: -120.1127, type: 'Developed', fee: '$45/night', reservations: 'ReserveCA', comfort: 3, access: 1,
        amenities: ['Flush toilets','Hot showers','Fire rings','Beach access'],
        notes: 'West shore Tahoe with direct access to Rubicon Bay. Some of the clearest freshwater in North America right at your doorstep.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 3,
        permits: { required: true, notes: 'ReserveCA reservation required for summer' },
        wildlife: ['Black bears','Mule deer','Osprey','Bald eagles','Coyotes','Marmots'],
        trails: [
          { name: 'Rubicon Trail to Emerald Bay', dist: '9 mi', diff: 3, type: 'Out & Back', notes: 'Best trail on Tahoe, hugs the cliff above the water' },
          { name: 'Lighthouse Loop', dist: '1.5 mi', diff: 1, type: 'Loop', notes: 'Short beach and bluff walk to old lighthouse' }
        ]},
      { name: 'Lodgepole - Sequoia National Park', lat: 36.5895, lng: -118.7270, type: 'Developed', fee: '$35/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Showers','Fire rings','Market','Visitor center nearby'],
        notes: 'Base camp for the Giant Forest. General Sherman Tree is a 2-mile walk. Towering sequoias dwarf everything.',
        water: 'reliable', cell: 'none', bear: 'box', stargaze: 4,
        permits: { required: true, notes: 'Park entry fee $35/vehicle. Wilderness permits for overnight' },
        wildlife: ['Black bears','Mule deer','Stellers jays','Mountain chickadees','Pikas','Martens'],
        trails: [
          { name: 'Congress Trail (General Sherman)', dist: '2 mi', diff: 1, type: 'Loop', notes: 'Paved loop past the largest tree on Earth' },
          { name: 'High Sierra Trail', dist: 'Varies', diff: 4, type: 'Out & Back', notes: 'Leads to Mt. Whitney, 72 miles total' },
          { name: 'Tokopah Falls', dist: '3.4 mi', diff: 2, type: 'Out & Back', notes: 'Glacier-carved canyon to a dramatic falls' }
        ]},
      { name: 'Cedar Grove - Kings Canyon NP', lat: 36.7924, lng: -118.9578, type: 'Developed', fee: '$30/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Potable water','Fire rings','Market','Showers nearby'],
        notes: 'Deep in one of the deepest canyons in North America. The Kings River runs clear and cold right through camp. Crowds are a fraction of Yosemite.',
        water: 'reliable', cell: 'none', bear: 'box', stargaze: 5,
        permits: { required: true, notes: 'Wilderness permit required for Rae Lakes Loop' },
        wildlife: ['Black bears','Mule deer','River otters','Golden eagles','Pikas'],
        trails: [
          { name: 'Mist Falls Trail', dist: '9.4 mi', diff: 3, type: 'Out & Back', notes: 'One of the largest waterfalls in the Sierra' },
          { name: 'Rae Lakes Loop', dist: '41 mi', diff: 5, type: 'Loop', notes: 'Multi-day classic, Sierra crest, permit required' },
          { name: 'Zumwalt Meadow Loop', dist: '1.5 mi', diff: 1, type: 'Loop', notes: 'Riverside wildflowers, canyon walls soaring 8000ft' }
        ]}
    ],
    hidden: [
      { name: 'Mt. Pinos - McGill Campground', lat: 34.8194, lng: -119.1517, type: 'Developed (Low Use)', fee: '$20/night', reservations: 'First-come', comfort: 2, access: 1,
        amenities: ['Vault toilets','Fire rings','No water'],
        notes: '8,200ft - one of the best dark sky sites in SoCal. 2 hrs from the IE.',
        water: 'dry', cell: 'none', bear: 'hang', stargaze: 5,
        permits: { required: false, notes: 'No permits needed, first-come basis' },
        wildlife: ['California condors (regular sightings)','Black bears (rare)','Mule deer','Pinyon jays'],
        trails: [
          { name: 'Mt. Pinos Summit Trail', dist: '4 mi', diff: 2, type: 'Out & Back', notes: '8,831ft summit, 360 deg views' },
          { name: 'Sawmill Trail', dist: '6 mi', diff: 3, type: 'Out & Back', notes: 'Remote, low traffic' }
        ]},
      { name: 'Holcomb Valley - BLM Dispersed', lat: 34.3119, lng: -116.8394, type: 'Dispersed / Free', fee: 'Free', reservations: 'None', comfort: 1, access: 2,
        amenities: ['None'],
        notes: 'Hidden valley above Big Bear. Gold rush history, mine ruins.',
        water: 'iffy', cell: 'spotty', bear: 'hang', stargaze: 4,
        permits: { required: false, notes: 'BLM 14-day stay limit' },
        wildlife: ['Black bears','Bald eagles','Mule deer','Bobcats','Wild turkeys'],
        trails: [{ name: 'Holcomb Valley Pinnacles', dist: '2.5 mi', diff: 2, type: 'Loop', notes: 'Hidden rock formations' }]},
      { name: 'Convict Lake Campground', lat: 37.5879, lng: -118.8562, type: 'Developed', fee: '$28/night', reservations: 'Recreation.gov', comfort: 2, access: 1,
        amenities: ['Vault toilets','Potable water','Fire rings'],
        notes: 'Teal glacial lake ringed by 12,000ft peaks. Eastern Sierra at its most dramatic. Fewer crowds than Mammoth Lakes proper.',
        water: 'reliable', cell: 'weak', bear: 'box', stargaze: 5,
        permits: { required: false, notes: 'No wilderness permit needed for day hikes' },
        wildlife: ['Black bears','Mule deer','Osprey','Bald eagles','Trout (excellent fishing)'],
        trails: [
          { name: 'Convict Lake Loop', dist: '3 mi', diff: 2, type: 'Loop', notes: 'Flat lakeshore trail, stunning basin views' },
          { name: 'Convict Canyon to Genevieve Lake', dist: '10 mi', diff: 4, type: 'Out & Back', notes: 'Steep canyon into remote lake basin' }
        ]},
      { name: 'Oh! Ridge - June Lake', lat: 37.7888, lng: -119.0736, type: 'Developed', fee: '$27/night', reservations: 'Recreation.gov', comfort: 2, access: 1,
        amenities: ['Vault toilets','Potable water','Fire rings','Beach nearby'],
        notes: 'June Lake Loop is Yosemite\'s quieter sibling. Four lakes, actual locals, no lottery. Go in fall when the aspens turn gold.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 5,
        permits: { required: false, notes: 'No permit needed' },
        wildlife: ['Mule deer','Osprey','Brown trout','Pikas','Coyotes'],
        trails: [
          { name: 'Parker Lake Trail', dist: '3.8 mi', diff: 2, type: 'Out & Back', notes: 'Quiet alpine lake, aspen groves in fall' },
          { name: 'Yost Lake via Yost Creek', dist: '9 mi', diff: 3, type: 'Out & Back', notes: 'Off-the-radar lake above the June Loop' }
        ]},
      { name: 'Buttermilk Road - BLM Dispersed', lat: 37.3521, lng: -118.6347, type: 'Dispersed / Free', fee: 'Free', reservations: 'None', comfort: 1, access: 2,
        amenities: ['None — self sufficient'],
        notes: 'World-class bouldering meets open-sky camping. Camp among the Buttermilk boulders above Bishop. Jaw-dropping Eastern Sierra panorama at sunrise.',
        water: 'dry', cell: 'weak', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'BLM 14-day limit. No fee.' },
        wildlife: ['Coyotes','Mule deer','Golden eagles','Jackrabbits','Rattlesnakes'],
        trails: [
          { name: 'Buttermilk Boulders (open)', dist: 'Open', diff: 3, type: 'Exploratory', notes: 'Iconic granite bouldering — V0 to V15' },
          { name: 'Bishop Pass Trail', dist: '12 mi', diff: 4, type: 'Out & Back', notes: 'South Lake to Bishop Pass, stunning alpine basin' }
        ]},
      { name: 'Lake Alpine - Ebbetts Pass', lat: 38.4733, lng: -119.9954, type: 'Developed', fee: '$26/night', reservations: 'Recreation.gov', comfort: 2, access: 1,
        amenities: ['Vault toilets','Potable water','Fire rings','Lake swimming'],
        notes: 'Hwy 4 corridor is one of the least-driven alpine passes in California. Lake Alpine sits at 7,400ft with pines to the edge. Crowds are a fraction of Tahoe.',
        water: 'reliable', cell: 'none', bear: 'box', stargaze: 5,
        permits: { required: false, notes: 'No permit required' },
        wildlife: ['Black bears','Mule deer','Osprey','Golden eagles','Pikas'],
        trails: [
          { name: 'Lake Alpine Loop', dist: '4.2 mi', diff: 2, type: 'Loop', notes: 'Forested lakeside trail, solitude almost guaranteed' },
          { name: 'Chickenfoot Lake', dist: '5 mi', diff: 3, type: 'Out & Back', notes: 'Into the Mokelumne Wilderness, virtually no one goes here' }
        ]}
    ]
  },
  dispersed: {
    known: [
      { name: 'Mojave Road - Government Holes', lat: 34.9167, lng: -115.6167, type: 'Dispersed BLM', fee: 'Free', reservations: 'None', comfort: 1, access: 3,
        amenities: ['Self-sufficient','Spring water (filter required)'],
        notes: 'Historic wagon trail. 4WD required. Satellite communicator essential.',
        water: 'seasonal', cell: 'none', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'No permits, free dispersed BLM' },
        wildlife: ['Desert bighorn','Coyotes','Jackrabbits','Wild burros','Golden eagles'],
        trails: [{ name: 'Teutonia Peak', dist: '4 mi', diff: 2, type: 'Out & Back', notes: 'Above a Joshua Tree forest' }]}
    ],
    hidden: [
      { name: 'Saline Valley - Lower Warm Springs', lat: 36.7167, lng: -117.7333, type: 'Dispersed BLM', fee: 'Free', reservations: 'None', comfort: 2, access: 5,
        amenities: ['Hot springs (105F)','Communal fire rings'],
        notes: '50+ miles of rough washboard road. Off-grid community. Oct-Apr only.',
        water: 'reliable', cell: 'none', bear: 'none', stargaze: 5,
        permits: { required: false, notes: 'No fees, signing the trail register is tradition' },
        wildlife: ['Wild burros','Coyotes','Desert bighorn','Sidewinders','Roadrunners'],
        trails: [
          { name: 'Saline Valley Sand Dunes', dist: 'Open', diff: 1, type: 'Exploratory', notes: 'Freeform, no trail' },
          { name: 'Hunter Mountain Road hike', dist: 'Varies', diff: 4, type: 'Out & Back', notes: 'Climbs to pinyon pine forest' }
        ]}
    ]
  },
  redwood: {
    known: [
      { name: 'Jedediah Smith Campground', lat: 41.7997, lng: -124.0647, type: 'Developed', fee: '$35/night', reservations: 'ReserveCA', comfort: 3, access: 1,
        amenities: ['Flush toilets','Hot showers','Fire rings','Water'],
        notes: 'Sites literally inside old-growth groves. Stout Grove is a 10-min walk.',
        water: 'reliable', cell: 'weak', bear: 'box', stargaze: 3,
        permits: { required: true, notes: 'Reserve 6 months ahead - books fast for summer' },
        wildlife: ['Roosevelt elk','Black bears','Banana slugs','Spotted owls','Pacific giant salamanders'],
        trails: [
          { name: 'Stout Memorial Grove Loop', dist: '0.7 mi', diff: 1, type: 'Loop', notes: 'Most impressive short walk in NorCal' },
          { name: 'Boy Scout Tree Trail', dist: '5.6 mi', diff: 2, type: 'Out & Back', notes: 'Massive double-trunk tree' },
          { name: 'Hiouchi + Millpond Trail', dist: '4 mi', diff: 2, type: 'Loop', notes: 'Follows the Smith River' }
        ]},
      { name: 'Prairie Creek - Elk Prairie', lat: 41.3642, lng: -124.0297, type: 'Developed', fee: '$35/night', reservations: 'ReserveCA', comfort: 3, access: 1,
        amenities: ['Flush toilets','Hot showers','Fire rings'],
        notes: 'Roosevelt elk graze freely next to camp. Fern Canyon is 20 mins away.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 3,
        permits: { required: true, notes: 'ReserveCA, book 6 months out' },
        wildlife: ['Roosevelt elk (huge herds)','Black bears','Banana slugs','River otters','Black-tailed deer'],
        trails: [
          { name: 'Fern Canyon Loop', dist: '0.7 mi', diff: 1, type: 'Loop', notes: '50ft fern walls, Jurassic Park location' },
          { name: 'James Irvine Trail to Fern Canyon', dist: '10 mi', diff: 3, type: 'P2P', notes: 'Through cathedral redwoods' }
        ]}
    ],
    hidden: [
      { name: 'Humboldt Redwoods - Albee Creek', lat: 40.3436, lng: -123.9678, type: 'Developed (Low Use)', fee: '$35/night', reservations: 'ReserveCA', comfort: 3, access: 1,
        amenities: ['Flush toilets','Showers','Fire rings'],
        notes: 'Surrounded by Rockefeller Forest - largest old-growth redwood forest on Earth.',
        water: 'reliable', cell: 'none', bear: 'box', stargaze: 4,
        permits: { required: true, notes: 'ReserveCA - less competitive than coastal parks' },
        wildlife: ['Black bears','Roosevelt elk','Northern spotted owls','Pacific marten','Banana slugs'],
        trails: [
          { name: 'Bull Creek Flats Loop', dist: '9.7 mi', diff: 2, type: 'Loop', notes: 'Through Rockefeller Forest' },
          { name: 'Grasshopper Peak Trail', dist: '7 mi', diff: 4, type: 'Out & Back', notes: 'Fire lookout above canopy' }
        ]},
      { name: 'Del Norte - Nickel Creek Primitive', lat: 41.6833, lng: -124.1333, type: 'Hike-In Primitive', fee: '$8/night', reservations: 'ReserveCA (permit)', comfort: 1, access: 3,
        amenities: ['Pit toilet','Bear boxes','No water (filter creek)'],
        notes: 'Only accessible by trail, 1.5 mi in. Camp above a dramatic black sand beach.',
        water: 'reliable', cell: 'none', bear: 'box', stargaze: 4,
        permits: { required: true, notes: 'Wilderness permit required, limited issued daily' },
        wildlife: ['Black bears','Sea lions','River otters','Pacific harbor seals'],
        trails: [
          { name: 'Damnation Creek Trail', dist: '4.2 mi', diff: 4, type: 'Out & Back', notes: 'Steep descent to secluded beach' },
          { name: 'Coastal Trail', dist: '8 mi', diff: 3, type: 'P2P', notes: 'Redwood forest meets coastal bluffs' }
        ]}
    ]
  },
  lake: {
    known: [
      { name: 'Shasta Lake - Antlers', lat: 40.7817, lng: -122.2681, type: 'Developed', fee: '$30/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Water','Fire rings','Boat ramp nearby'],
        notes: '365 miles of shoreline to explore. Great kayaking and fishing.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 3,
        permits: { required: false, notes: 'Adventure Pass for trailhead parking' },
        wildlife: ['Bald eagles','Ospreys','Black bears','Trout','River otters'],
        trails: [{ name: 'Waters Gulch Loop', dist: '3.5 mi', diff: 2, type: 'Loop', notes: 'Forest trail with lake views' }]},
      { name: 'Trinity Lake - Pinewood Cove', lat: 40.8561, lng: -122.7511, type: 'Private Resort', fee: '$45-65/night', reservations: 'Direct booking', comfort: 4, access: 1,
        amenities: ['Showers','Flush toilets','Marina','Kayak rentals','Store'],
        notes: 'Cleaner and less crowded than Shasta. Mountain backdrop.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 4,
        permits: { required: false, notes: 'Trinity Alps Wilderness permit needed for backcountry' },
        wildlife: ['Black bears','Mule deer','Bald eagles','Mountain lions','Trout','Pine martens'],
        trails: [
          { name: 'Stuart Fork to Emerald Lake', dist: '17 mi', diff: 5, type: 'Out & Back', notes: 'Multi-day into Trinity Alps' },
          { name: 'Stoney Creek Trail', dist: '6 mi', diff: 3, type: 'Out & Back', notes: 'Into Trinity Alps Wilderness' }
        ]}
    ],
    hidden: [
      { name: 'Lake Almanor - Plumas NF', lat: 40.2167, lng: -121.1667, type: 'Developed (Underrated)', fee: '$25/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Vault toilets','Water','Fire rings','Lake access'],
        notes: 'Lassen Peak backdrop. Way less known than Shasta or Trinity.',
        water: 'reliable', cell: 'weak', bear: 'hang', stargaze: 4,
        permits: { required: false, notes: 'Adventure Pass for trail parking' },
        wildlife: ['Bald eagles','Ospreys','Black bears','Mule deer','Brown trout (legendary fishing)'],
        trails: [{ name: 'Feather River Trail', dist: '5 mi', diff: 2, type: 'Out & Back', notes: 'Through canyon' }]}
    ]
  },
  volcanic: {
    known: [
      { name: 'Lassen - Manzanita Lake', lat: 40.5328, lng: -121.5703, type: 'Developed', fee: '$26/night', reservations: 'Recreation.gov', comfort: 3, access: 1,
        amenities: ['Flush toilets','Showers','Camp store','Water','Kayak rentals'],
        notes: 'Manzanita Lake reflects Lassen Peak. Best base in the park.',
        water: 'reliable', cell: 'weak', bear: 'canister', stargaze: 5,
        permits: { required: true, notes: 'Wilderness permit needed for backcountry overnight' },
        wildlife: ['Black bears','Mule deer','Mountain lions','Yellow-bellied marmots','Pikas','Bald eagles'],
        trails: [
          { name: 'Manzanita Lake Loop', dist: '1.8 mi', diff: 1, type: 'Loop', notes: 'Flat lakeside, best peak reflection' },
          { name: 'Lassen Peak Trail', dist: '5 mi', diff: 5, type: 'Out & Back', notes: '2000ft gain, active volcanic summit' },
          { name: 'Bumpass Hell Trail', dist: '3 mi', diff: 2, type: 'Out & Back', notes: 'Boiling mudpots, steam vents' }
        ]}
    ],
    hidden: [
      { name: 'Lassen - Warner Valley', lat: 40.4333, lng: -121.3833, type: 'Developed (Remote)', fee: '$16/night', reservations: 'First-come', comfort: 2, access: 2,
        amenities: ['Vault toilets','Water','Fire rings'],
        notes: '17 miles of dirt road from Chester. Best hydrothermal features, fewest crowds.',
        water: 'reliable', cell: 'none', bear: 'canister', stargaze: 5,
        permits: { required: false, notes: 'No reservations, arrive early on summer weekends' },
        wildlife: ['Black bears','Mule deer','Mountain lions','Marmots','Ground squirrels'],
        trails: [
          { name: 'Boiling Springs Lake Trail', dist: '3 mi', diff: 1, type: 'Out & Back', notes: 'Steaming lake, mud pots' },
          { name: 'Devils Kitchen Trail', dist: '4.2 mi', diff: 2, type: 'Out & Back', notes: 'Best hydrothermal feature, no crowds' }
        ]}
    ]
  },
  lostcoast: {
    known: [
      { name: 'Point Reyes - Coast Camp', lat: 38.0369, lng: -122.9781, type: 'Hike-In', fee: '$20/night', reservations: 'Recreation.gov', comfort: 2, access: 2,
        amenities: ['Pit toilets','Treated water','Bear boxes','Wind shelters'],
        notes: '1.8 miles from trailhead. Cliffside above the Pacific. Wind is relentless.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 3,
        permits: { required: true, notes: 'Permit required, books up months ahead' },
        wildlife: ['Tule elk','Coyotes','Bobcats','Gray whales (Dec-May migration)','Harbor seals'],
        trails: [
          { name: 'Coast Trail to Sculptured Beach', dist: '5 mi', diff: 2, type: 'Out & Back', notes: 'Arch formations' },
          { name: 'Bear Valley Trail to Arch Rock', dist: '8.2 mi', diff: 2, type: 'Out & Back', notes: 'Classic Point Reyes walk' }
        ]}
    ],
    hidden: [
      { name: 'Lost Coast - Mattole Beach BLM', lat: 40.2833, lng: -124.3667, type: 'Primitive', fee: '$8/night', reservations: 'First-come (BLM)', comfort: 1, access: 4,
        amenities: ['Pit toilets','No water (filter river)','Driftwood fires OK'],
        notes: 'Drive to the edge of the world, camp on black sand. Most remote coastal trail in continental US.',
        water: 'seasonal', cell: 'none', bear: 'canister', stargaze: 5,
        permits: { required: true, notes: 'Lost Coast Trail permit required via Recreation.gov - lottery' },
        wildlife: ['Black bears','Roosevelt elk','Gray whales','Sea lions','Bald eagles'],
        trails: [
          { name: 'Lost Coast Trail (Full)', dist: '25 mi', diff: 5, type: 'P2P (3+ days)', notes: 'Tidal sections require tide chart' },
          { name: 'Punta Gorda Lighthouse', dist: '6 mi', diff: 2, type: 'Out & Back', notes: 'Abandoned 1912 lighthouse' }
        ]},
      { name: 'MacKerricher SP - Walk-In', lat: 39.4939, lng: -123.8003, type: 'Walk-In Primitive', fee: '$35/night', reservations: 'ReserveCA', comfort: 2, access: 1,
        amenities: ['Flush toilets nearby','Fire rings'],
        notes: '100 yards from parking but totally isolated. Mendocino Coast.',
        water: 'reliable', cell: 'spotty', bear: 'box', stargaze: 4,
        permits: { required: true, notes: 'ReserveCA' },
        wildlife: ['Harbor seals (huge rookery)','Sea otters','Gray whales','Black oystercatchers'],
        trails: [{ name: 'Haul Road Coastal Trail', dist: '8 mi', diff: 1, type: 'Out & Back', notes: 'Bluff-top, seals & tide pools' }]}
    ]
  }
};

// All spots across every terrain, pre-computed for Explore All mode
const ALL_SPOTS_GLOBAL = (() => {
  const allTerrainsList = Object.values(TERRAINS).flat();
  return Object.entries(SPOTS).flatMap(([tId, data]) => {
    const t = allTerrainsList.find(x => x.id === tId);
    return [
      ...(data.known || []).map(s => ({ ...s, cat: 'known', terrainImg: t?.img || '', terrainName: t?.name || tId })),
      ...(data.hidden || []).map(s => ({ ...s, cat: 'hidden', terrainImg: t?.img || '', terrainName: t?.name || tId })),
    ];
  });
})();

// =============================================================================
// PACKING DATA  (unchanged from baseline)
// =============================================================================
function getDayCats() { return [
  { name: 'Water', items: [
    { t: 'Water 2L minimum', n: '1L/hr in desert heat', oz: 72 },
    { t: 'Filter or purification tabs', n: 'Sawyer Squeeze', oz: 3 },
    { t: 'Electrolyte packets', n: 'Nuun or Liquid IV', oz: 1 }
  ]},
  { name: 'Food', items: [
    { t: 'Trail snacks', n: '~200 cal/hr hiking', oz: 8 },
    { t: 'Lunch', n: 'No cooking needed', oz: 8 },
    { t: 'Emergency bar', n: 'Clif bar at bottom', oz: 2 }
  ]},
  { name: 'Navigation', items: [
    { t: 'Offline map', n: 'AllTrails or Gaia GPS downloaded', oz: 0 },
    { t: 'Paper trail map', n: 'Backup always', oz: 1 },
    { t: 'Compass', n: 'Know how to use it', oz: 2 }
  ]},
  { name: 'Safety', items: [
    { t: 'Basic first aid kit', n: 'Blister pads, gauze, tape', oz: 4 },
    { t: 'Whistle', n: '3 blasts = emergency', oz: 1 },
    { t: 'Headlamp + batteries', n: 'Even on day hikes', oz: 4 },
    { t: 'Mylar emergency blanket', n: 'Weighs nothing', oz: 1 },
    { t: 'Phone or PLB', n: 'Garmin inReach for remote', oz: 6 }
  ]},
  { name: 'Sun & Clothing', items: [
    { t: 'Moisture-wicking base layer', n: 'No cotton', oz: 6 },
    { t: 'Sunscreen SPF 50+', n: 'Reapply every 2 hrs', oz: 3 },
    { t: 'Sun hat', n: 'Non-negotiable in SoCal', oz: 3 },
    { t: 'Wind/rain layer', n: 'Weather changes fast', oz: 10 },
    { t: 'Sunglasses', n: 'UV-rated', oz: 1 }
  ]},
  { name: 'Footwear', items: [
    { t: 'Trail runners or boots', n: 'Ankle support on rocky terrain', oz: 24 },
    { t: 'Wicking socks x2', n: 'Darn Tough or Smartwool', oz: 4 },
    { t: 'Trekking poles', n: 'Saves knees on descent', oz: 16 }
  ]}
];}
function getOvernightCats() { return [
  { name: 'Shelter', items: [
    { t: 'Tent or hammock', n: 'Check weather first', oz: 52 },
    { t: 'Tent footprint', n: 'Protects floor', oz: 8 },
    { t: 'Tarp backup', n: 'Cheap insurance', oz: 10 },
    { t: 'Tent repair kit', n: 'Seam sealer + pole sleeve', oz: 2 }
  ]},
  { name: 'Sleep System', items: [
    { t: 'Sleeping bag', n: 'Rated 10°F below expected low', oz: 28 },
    { t: 'Sleeping pad', n: 'R-2+ SoCal, R-4+ NorCal — pad matters MORE than bag', oz: 16 },
    { t: 'Camp pillow', n: 'Compressible', oz: 3 },
    { t: 'Ear plugs', n: 'Animals, wind, snorers', oz: 0 }
  ]},
  { name: 'Water', items: [
    { t: '3L carry capacity', n: '', oz: 4 },
    { t: 'Water filter', n: 'Sawyer Squeeze or BeFree', oz: 3 },
    { t: 'Backup purification tabs', n: '', oz: 1 },
    { t: 'Electrolyte mix', n: 'Daily', oz: 2 }
  ]},
  { name: 'Food & Cooking', items: [
    { t: 'Camp stove + fuel', n: 'JetBoil Flash is fast', oz: 14 },
    { t: 'Titanium pot', n: 'Doubles as bowl', oz: 3 },
    { t: 'Spork', n: '', oz: 1 },
    { t: 'Freeze-dried meals', n: '~5oz each, plan 2 per night', oz: 10 },
    { t: 'Instant coffee', n: 'Morning ritual matters', oz: 1 },
    { t: 'Bear canister', n: 'Required Yosemite, Kings Canyon, Desolation', oz: 33, warn: 'heavy', swap: 'Ursack Major — 7.6oz, allowed most CA wilderness' }
  ]},
  { name: 'Navigation', items: [
    { t: 'Gaia GPS downloaded', n: '', oz: 0 },
    { t: 'Paper topo map', n: '', oz: 1 },
    { t: 'Compass', n: '', oz: 2 },
    { t: 'Satellite communicator', n: 'Garmin inReach', oz: 4 }
  ]},
  { name: 'Safety', items: [
    { t: 'Full first aid kit', n: 'Leukotape, SAM splint', oz: 8 },
    { t: 'Headlamp x2', n: 'Plus spare batteries', oz: 6 },
    { t: 'Fire starter + lighter + matches', n: 'Triple redundancy', oz: 4 },
    { t: 'Bear spray', n: 'NorCal especially', oz: 9 },
    { t: 'Multi-tool', n: '', oz: 6 },
    { t: 'Duct tape small roll', n: '', oz: 3 },
    { t: 'Personal meds', n: 'Ibuprofen, antihistamine, Pepto', oz: 3 }
  ]},
  { name: 'Clothing', items: [
    { t: 'Base layer x2', n: 'Merino or synthetic ONLY — cotton kills in wet/cold', oz: 8 },
    { t: 'Cotton base layer', n: '', oz: 8, warn: 'nobp', swap: 'Merino wool — regulates temp, stays warm when wet' },
    { t: 'Insulating mid layer', n: 'Even summer nights get cold above 7,000ft', oz: 10 },
    { t: 'Rain jacket', n: '', oz: 12 },
    { t: 'Hiking pants', n: '', oz: 12 },
    { t: 'Camp pants', n: '', oz: 10 },
    { t: 'Warm hat + gloves', n: '', oz: 4 },
    { t: 'Merino socks x3', n: 'Darn Tough or Smartwool', oz: 6 },
    { t: 'Camp shoes', n: 'Crocs — feet need rest after miles', oz: 16, warn: 'heavy', swap: 'Flip flops — 5oz, your feet still rest' }
  ]},
  { name: 'Hygiene', items: [
    { t: 'Trowel for cat holes', n: '6-8 in, 200ft from water', oz: 3 },
    { t: 'Biodegradable TP', n: '', oz: 2 },
    { t: 'Hand sanitizer', n: '', oz: 2 },
    { t: 'Toothbrush + tooth tabs', n: '', oz: 1 },
    { t: 'Camp towel', n: 'Packtowl Ultralite', oz: 3 },
    { t: 'Bug spray', n: 'Picaridin', oz: 3 }
  ]},
  { name: 'Camp Extras', items: [
    { t: 'Camp chair', n: 'Car camping only', oz: 48, warn: 'heavy', swap: 'Foam sit pad — 4oz, $12' },
    { t: 'Sit pad', n: 'For backpacking', oz: 4 },
    { t: 'Camp lantern', n: '', oz: 18, warn: 'heavy', swap: 'Headlamp on red mode — already in your kit' },
    { t: 'Book or journal', n: '', oz: 8 },
    { t: 'Battery bank', n: 'Anker 10k', oz: 7 },
    { t: 'Dry bags', n: 'For electronics', oz: 2 },
    { t: 'Fishing rod', n: 'Tenkara only — ultralight', oz: 10 }
  ]}
];}
function getMultiCats() { return [
  ...getOvernightCats(),
  { name: 'Pack & Carry', items: [
    { t: 'Backpack 50-65L', n: 'Osprey Atmos or Gregory Baltoro', oz: 64 },
    { t: 'Pack rain cover', n: 'Or compactor bag liner', oz: 4 },
    { t: 'Trekking poles', n: '25% less knee stress', oz: 16 },
    { t: 'Pack liner', n: 'Trash compactor bag inside', oz: 2 }
  ]},
  { name: 'Extended Comms', items: [
    { t: 'Trip plan with someone at home', n: 'Route + expected return', oz: 0 },
    { t: 'Paper topo for full route', n: '', oz: 2 },
    { t: 'Garmin inReach Mini 2', n: 'Two-way satellite', oz: 4 }
  ]}
];}
function getExtendedCats() { return [
  ...getMultiCats(),
  { name: 'Resupply Strategy', items: [
    { t: 'Mail drop boxes', n: '~5 day food intervals', oz: 0 },
    { t: 'Cash for trail towns', n: '$200+ per stop', oz: 1 },
    { t: 'Card + ID waterproof pouch', n: '', oz: 1 }
  ]},
  { name: 'Gear Durability', items: [
    { t: 'Seam sealer pre-applied', n: '', oz: 2 },
    { t: 'Shoe Goo', n: 'Boot sole repair', oz: 4 },
    { t: 'Tenacious Tape', n: 'Fixes tents, jackets, packs', oz: 1 },
    { t: 'Spare tent stakes x4', n: 'They bend and disappear', oz: 4 }
  ]},
  { name: 'Power Strategy', items: [
    { t: 'Solar charger', n: 'BioLite or Anker', oz: 6 },
    { t: 'Extra battery bank', n: '', oz: 7 },
    { t: 'inReach subscription pre-paid', n: '', oz: 0 }
  ]}
];}

const PACKING = {
  day:       { label: 'Day Hike',           weight: '10-20 lbs', lbs: [10,20], cats: getDayCats() },
  overnight: { label: 'Overnight 1-2 nights', weight: '25-35 lbs', lbs: [25,35], cats: getOvernightCats() },
  multi:     { label: 'Multi-Day 3-5 nights', weight: '35-50 lbs', lbs: [35,50], cats: getMultiCats() },
  extended:  { label: 'Extended 6+ nights',   weight: '40-55 lbs', lbs: [40,55], cats: getExtendedCats() },
};

const COMMUNITY_TIPS = {
  'Shelter':       { tip: 'A cuben fiber tarp + bivy = under 1lb of shelter and handles 90% of CA conditions. Freestanding tents are comfort weight.', src: 'r/ultralight' },
  'Sleep System':  { tip: 'Your sleeping pad R-value matters more than your bag temp rating. Cold ground steals heat 25x faster than cold air.', src: 'r/CampingandHiking' },
  'Water':         { tip: 'Never carry more than 2L between sources on a mapped route. The Sawyer Squeeze weighs 3oz and lasts 100,000 gallons. Tabs as backup weigh nothing.', src: 'r/Ultralight' },
  'Food & Cooking':{ tip: 'Cold soaking is the move for multi-day — a Talenti jar and Knorr sides = zero stove weight. For hot meals, alcohol stoves weigh under 1oz.', src: 'r/ultralight' },
  'Navigation':    { tip: 'Download offline maps BEFORE you leave cell range. Gaia GPS is worth the subscription. A paper topo + compass never needs a charge.', src: 'r/Backcountry' },
  'Safety':        { tip: 'A Garmin inReach Mini has literally saved lives. For any remote CA route — Lost Coast, Sierra, Marble Mountains — satellite comms are non-negotiable.', src: 'r/WildernessBackpacking' },
  'Clothing':      { tip: '"Cotton kills" is real. Hypothermia risk spikes when wet cotton clings to skin. Merino stays warm even soaked. No exceptions for overnight+.', src: 'r/CampingandHiking' },
  'Hygiene':       { tip: 'WAG bags for high-traffic peaks (Whitney, Half Dome). Pack out all TP even biodegradable — Desolation Wilderness rangers are finding TP piles everywhere.', src: 'r/WildernessBackpacking' },
  'Camp Extras':   { tip: 'A foam sit pad (4oz, $12) replaces a camp chair (3lbs). A Kindle weighs less than one paperback. Ruthlessly audit luxury weight before any trip 3+ days.', src: 'r/ultralight' },
  'Pack & Carry':  { tip: 'Target base weight (everything except food/water/fuel): under 10lbs for true UL, under 15lbs for lightweight. Your loaded pack should be max 20% of body weight.', src: 'r/ultralight' },
  'Footwear':      { tip: 'Trail runners beat boots for 90% of Sierra Nevada terrain. 1lb on your feet feels like 5lbs on your back. Only go to boots for technical scrambling or heavy loads.', src: 'r/ultralight' },
  'Sun & Clothing':{ tip: 'A sun hoody (UPF 50) is lighter than sunscreen + reapplying all day. Reapply sunscreen every 90 min anyway at altitude — UV radiation increases 10% per 1,000ft.', src: 'r/CampingandHiking' },
};

// =============================================================================
// SEASONAL GEAR — dynamic add-ons + tip banner keyed to current month
// Items appear inside their category when that category is open.
// Checked state is namespaced separately so regular pack keys don't shift.
// =============================================================================
const getSeason = (month) => {
  if ([11, 0, 1].includes(month)) return 'winter';
  if ([2, 3, 4].includes(month)) return 'spring';
  if ([5, 6, 7].includes(month)) return 'summer';
  return 'fall';
};

const SEASONAL_GEAR = {
  winter: {
    label: 'Winter Conditions',
    months: 'Dec – Feb',
    icon: '❄',
    color: '#7bbfdc',
    tip: 'CA mountains can see 3ft of snow overnight above 6,000ft. Even SoCal gets freezing nights in the San Gabriels Dec–Feb. Plan for it or stay lower.',
    adds: {
      'Clothing':     [
        { t: 'Microspikes', n: 'Essential on any trail above 5,000ft Dec–Mar — ice forms before snow does', seasonal: true },
        { t: 'Balaclava', n: 'Wind chill in exposed passes can drop apparent temp 30°F', seasonal: true },
      ],
      'Sleep System': [
        { t: 'Vapor barrier liner', n: 'Boosts bag warmth ~10°F and keeps insulation dry in wet cold', seasonal: true },
      ],
      'Safety': [
        { t: 'Hand warmers ×4', n: 'Chemical backup if your hands go too numb mid-gear-swap', seasonal: true },
        { t: 'Avalanche beacon', n: 'If you\'re going off-trail in the Sierra backcountry — non-negotiable', seasonal: true },
      ],
      'Shelter': [
        { t: '4-season tent or bivy', n: 'Or a tarp + bivy rated for wind and snow load', seasonal: true },
      ],
    },
  },
  spring: {
    label: 'Spring Conditions',
    months: 'Mar – May',
    icon: '🌧',
    color: '#78b87a',
    tip: 'NorCal rivers run dangerously fast April–June. Never cross moving water above the knee without a trekking pole plant and a line. Snow bridges collapse without warning.',
    adds: {
      'Water': [
        { t: 'Trekking poles', n: 'Stream crossings are serious business in spring snowmelt — poles keep you upright', seasonal: true },
      ],
      'Clothing': [
        { t: 'Bug head net', n: 'Mosquitoes emerge fast once snowmelt hits — Sierra peaks around late June', seasonal: true },
        { t: 'Waterproof gaiters', n: 'Post-holing through soft spring snow soaks regular shoes instantly', seasonal: true },
      ],
      'Safety': [
        { t: 'Emergency bivy sack', n: 'Spring temps swing 40°F+ between noon and midnight — always have a bail option', seasonal: true },
      ],
      'Shelter': [
        { t: 'Extra guylines + stakes', n: 'Spring windstorms are vicious — a poorly staked tent is a kite', seasonal: true },
      ],
    },
  },
  summer: {
    label: 'Summer Conditions',
    months: 'Jun – Aug',
    icon: '☀',
    color: T.gold,
    tip: 'Peak bear activity June–September — especially Yosemite, Kings Canyon, and Desolation Wilderness. Start early (5am), off ridges by noon — afternoon lightning builds daily above treeline.',
    adds: {
      'Water': [
        { t: 'Electrolyte tabs or powder', n: 'Sweating 1L+/hr in desert heat = serious sodium loss, not just thirst', seasonal: true },
        { t: 'Extra 1L water capacity', n: 'Desert sources dry up in summer — never assume the map is current', seasonal: true },
      ],
      'Sun & Clothing': [
        { t: 'Sun hoody UPF 50+', n: 'Lighter and more effective than reapplying sunscreen all day at altitude', seasonal: true },
        { t: 'Wide-brim hat', n: 'Neck protection matters — UV increases ~10% per 1,000ft gain', seasonal: true },
      ],
      'Clothing': [
        { t: 'Insect repellent (Picaridin or DEET)', n: 'Mosquitoes peak at dawn/dusk near water in Sierra July–Aug', seasonal: true },
      ],
      'Safety': [
        { t: 'Satellite communicator', n: 'Lightning can strand you fast on exposed Sierra ridges — get weather alerts before you leave', seasonal: true },
      ],
    },
  },
  fall: {
    label: 'Fall Conditions',
    months: 'Sep – Nov',
    icon: '🍂',
    color: '#c0813a',
    tip: 'Days shorten fast after equinox. Hikers routinely get caught out after dark in October. Add 90 min to every turnaround time from September on.',
    adds: {
      'Safety': [
        { t: 'Extra headlamp batteries or backup light', n: 'Sunset hits 5pm by November — plan to hike out in the dark or start earlier', seasonal: true },
      ],
      'Clothing': [
        { t: 'Wind layer or softshell', n: 'Fall high-pressure brings cold nights even in SoCal — temps crash after sundown', seasonal: true },
      ],
      'Sleep System': [
        { t: 'Sleeping bag liner', n: 'Adds 5–15°F buffer as shoulder season temps drop faster than expected', seasonal: true },
      ],
      'Navigation': [
        { t: 'Paper topo map', n: 'Always a good idea — but fall hunting season means you want to know exactly where you are', seasonal: true },
      ],
    },
  },
};

const WEIGHT_GUIDE = [
  { range: '< 10 lbs',  label: 'Ultralight',      color: T.good,    desc: 'Experienced only' },
  { range: '10-20 lbs', label: 'Day hike',        color: '#a3c168', desc: 'Essentials only' },
  { range: '20-30 lbs', label: 'Light overnight', color: T.gold,    desc: 'Lean weekend' },
  { range: '30-40 lbs', label: 'Standard',        color: T.warn,    desc: 'Overnight to 3 nights' },
  { range: '40-50 lbs', label: 'Extended',        color: '#c0723a', desc: 'Long trip ceiling' },
  { range: '50+ lbs',   label: 'Heavy haul',      color: T.bad,     desc: 'Reassess every item' },
];

// =============================================================================
// NPS API — set VITE_NPS_API_KEY in your .env file
// Get a free key: https://www.nps.gov/subjects/developer/get-started.htm
// =============================================================================
const NPS_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NPS_API_KEY) || '';

async function fetchNPSCampgrounds(stateCode = 'CA') {
  if (!NPS_API_KEY) return { ok: false, error: 'no_key', data: [] };
  try {
    const url = `https://developer.nps.gov/api/v1/campgrounds?stateCode=${stateCode}&limit=50&api_key=${NPS_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: 'http_' + res.status, data: [] };
    const json = await res.json();
    return { ok: true, data: json.data || [] };
  } catch (e) {
    return { ok: false, error: e.message || 'fetch_failed', data: [] };
  }
}

function useNPSCampgrounds(stateCode) {
  const [state, setState] = useState({ loading: true, error: null, data: [] });
  useEffect(() => {
    let alive = true;
    setState({ loading: true, error: null, data: [] });
    fetchNPSCampgrounds(stateCode).then(res => {
      if (!alive) return;
      setState({ loading: false, error: res.ok ? null : res.error, data: res.data });
    });
    return () => { alive = false; };
  }, [stateCode]);
  return state;
}

// =============================================================================
// SLICE 1 (UX) — Season-aware sleep fit
// Combines terrain match with the current month's seasonal score for the
// active terrain. "Good fit" requires both terrain compatibility AND
// that we're in or near a green/gold month for that terrain.
// =============================================================================
function getSeasonAwareFit(sleepStyle, terrainId, monthIdx) {
  const terrainFit = sleepStyle.good.includes(terrainId)
    ? 'good'
    : sleepStyle.bad.includes(terrainId) ? 'caution' : 'neutral';
  const seasonScore = SEASONAL[terrainId]?.months?.[monthIdx];
  // seasonScore: 0=avoid, 1=fair, 2=good, 3=peak
  if (terrainFit === 'caution') return { verdict: 'caution', label: 'Heads up', why: 'Better suited to other terrain — still doable' };
  if (seasonScore === 0) return { verdict: 'caution', label: 'Off-season', why: 'Quieter now — plan for conditions' };
  if (terrainFit === 'good' && seasonScore >= 2) return { verdict: 'good', label: 'Good fit', why: 'Great match and in-season' };
  if (terrainFit === 'good' && seasonScore === 1) return { verdict: 'neutral', label: 'OK fit', why: 'Good shelter, shoulder season' };
  if (terrainFit === 'neutral' && seasonScore >= 2) return { verdict: 'neutral', label: 'Workable', why: 'In-season but shelter is so-so' };
  return { verdict: 'neutral', label: 'Workable', why: 'Mixed signals' };
}

// Group-size cap inferred from spot.type until real API data fills it in
function inferMaxGroup(sp) {
  if (/Dispersed|Primitive|BLM/i.test(sp.type)) return 8;
  if (/Hike-In/i.test(sp.type)) return 4;
  if (/Resort|Cabin/i.test(sp.type)) return 10;
  return 6;
}

// =============================================================================
// SLICE 3 (a11y) — Shared button-reset style for clickable cards
// =============================================================================
const BUTTON_RESET = {
  background: 'none', border: 'none', padding: 0, margin: 0,
  font: 'inherit', color: 'inherit', textAlign: 'left', cursor: 'pointer',
  appearance: 'none', width: '100%',
};

// =============================================================================
// SAVED TRAILS DRAWER
// =============================================================================
const SavedDrawer = ({ savedTrails, onUnsave, onGoToMap, onClose }) => {
  const saved = Object.entries(savedTrails).filter(([, v]) => v);
  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000,
      }} />
      {/* panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: '340px',
        background: T.leather, borderLeft: '1px solid ' + T.border,
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)', zIndex: 2001,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{
          padding: '18px 18px 14px', borderBottom: '1px solid ' + T.border,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ color: T.gold, fontSize: '0.6rem', letterSpacing: '2.5px', fontFamily: 'Cinzel, serif', marginBottom: '3px' }}>YOUR LIST</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', fontFamily: 'Georgia, serif' }}>
              Saved Trails <span style={{ color: T.star }}>♥ {saved.length}</span>
            </div>
          </div>
          <button type="button" onClick={onClose}
            style={{ ...BUTTON_RESET, width: 'auto', color: T.muted, fontSize: '1.6rem', lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '14px' }}>
          {saved.length === 0 ? (
            <div style={{ textAlign: 'center', color: T.muted, fontStyle: 'italic', marginTop: '40px', fontSize: '0.88rem' }}>
              No saved trails yet — heart a trail to add it here.
            </div>
          ) : saved.map(([key]) => {
            const [spotName, trailName] = key.split('||');
            const spotData = ALL_SPOTS_GLOBAL.find(s => s.name === spotName);
            const trailData = spotData?.trails?.find(t => t.name === trailName);
            return (
              <div key={key} style={{
                padding: '12px 14px', background: T.leatherDark, borderRadius: '12px',
                marginBottom: '10px', border: '1px solid ' + T.border,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', fontFamily: 'Georgia, serif', lineHeight: 1.3, marginBottom: '3px' }}>
                      {trailName}
                    </div>
                    <div style={{ color: T.gold, fontSize: '0.7rem', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {spotName}
                    </div>
                    {trailData && (
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', flexWrap: 'wrap' }}>
                        <span style={{ color: DIFF_COLORS[trailData.diff] }}>{DIFF_LABELS[trailData.diff]}</span>
                        <span style={{ color: T.muted }}>·</span>
                        <span style={{ color: T.text }}>{trailData.dist}</span>
                        <span style={{ color: T.muted }}>·</span>
                        <span style={{ color: T.muted }}>{trailData.type}</span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={() => onUnsave(key)}
                    style={{ ...BUTTON_RESET, width: 'auto', color: T.star, fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }}>♥</button>
                </div>
                {spotData?.lat && spotData?.lng && (
                  <button type="button" onClick={() => { onGoToMap(spotData); onClose(); }}
                    style={{
                      marginTop: '10px', width: '100%', padding: '7px',
                      background: 'transparent', border: '1px solid ' + T.border,
                      borderRadius: '8px', color: T.muted, fontSize: '0.75rem',
                      fontFamily: 'Georgia, serif', cursor: 'pointer', transition: 'border-color 150ms, color 150ms',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.color = T.gold; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                  >⌖ View on Map</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// =============================================================================
// SHARED PRIMITIVES
// =============================================================================
const Dots = ({ value, max = 5, color, label }) => (
  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} style={{ width: '10px', height: '10px', borderRadius: '2px',
        backgroundColor: i < value ? color : 'rgba(255,255,255,0.1)' }} />
    ))}
    {label && <span style={{ fontSize: '0.7rem', color: T.muted, marginLeft: '4px' }}>{label}</span>}
  </div>
);

const Pill = ({ label, color }) => (
  <span style={{ fontSize: '0.65rem', padding: '4px 10px', borderRadius: '12px',
    background: color + 'cc', color: '#fff', border: '1px solid ' + color + '88', fontWeight: '600' }}>{label}</span>
);

const InfoCell = ({ label, icon, statusObj }) => (
  <div style={{ padding: '10px', background: T.leatherDark, borderRadius: '4px', border: '1px solid ' + T.border }}>
    <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1.5px', marginBottom: '4px' }}>{label}</div>
    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: statusObj.color }}>{statusObj.label}</div>
    <div style={{ fontSize: '0.7rem', color: T.muted, marginTop: '2px', fontStyle: 'italic' }}>{statusObj.desc}</div>
  </div>
);

const SeasonalBar = ({ months, currentMonth }) => (
  <div style={{ display: 'flex', gap: '3px', alignItems: 'flex-end', height: '48px' }}>
    {months.map((val, i) => {
      const color = [T.bad, T.warn, T.good, T.gold][val];
      const height = [25, 50, 75, 100][val];
      const isCurrent = i === currentMonth;
      return (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
          <div style={{ width: '100%', height: height + '%', background: color, borderRadius: '2px 2px 0 0',
            outline: isCurrent ? '2px solid ' + T.gold : 'none', outlineOffset: '1px' }} />
          <div style={{ fontSize: '0.6rem', color: isCurrent ? T.gold : T.muted, fontWeight: isCurrent ? 'bold' : 'normal' }}>{MONTH_NAMES[i]}</div>
        </div>
      );
    })}
  </div>
);

// =============================================================================
// SLICE 1 (UX) — Stepper that shows where the user is in the planner
// =============================================================================
const Stepper = ({ current, onJump }) => {
  const steps = [
    { n: 1, label: 'Region' },
    { n: 2, label: 'Terrain' },
    { n: 3, label: 'Sleep style' },
    { n: 4, label: 'Spots & trails' },
  ];
  return (
    <nav aria-label="Planner progress" style={{
      display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px',
      padding: '12px 16px', borderRadius: '999px',
      background: 'rgba(0,0,0,0.25)', border: '1px solid ' + T.border, overflowX: 'auto',
    }}>
      {steps.map((s, i) => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <React.Fragment key={s.n}>
            <button
              type="button"
              onClick={() => onJump(s.n)}
              aria-current={active ? 'step' : undefined}
              className="step-chip"
              style={{
                ...BUTTON_RESET,
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '6px 14px', borderRadius: '999px',
                width: 'auto', whiteSpace: 'nowrap',
                background: active ? T.gold : done ? T.leather : 'transparent',
                border: '1px solid ' + (active ? T.gold : done ? T.gold : T.border),
                color: active ? T.nightCamp : done ? T.gold : T.muted,
                fontFamily: 'Georgia, serif', fontSize: '0.78rem', letterSpacing: '1px',
              }}>
              <span style={{ fontWeight: 'bold' }}>{s.n}</span>
              <span>{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span aria-hidden style={{ width: '14px', height: '1px', background: T.border, flexShrink: 0 }} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// =============================================================================
// SLICE 3 (a11y) — Spot card converted to button-based disclosure
// =============================================================================
const SPOT_FILTERS = [['all','All Spots'], ['iconic','Iconic'], ['known','Popular'], ['hidden','Hidden Gems']];

const SpotCard = ({ sp, isOpen, onClick, savedTrails = {}, onSaveTrail = () => {}, onGoToMap = () => {} }) => {
  const [hovered, setHovered] = useState(false);
  const [activeTrailIdx, setActiveTrailIdx] = useState(null);
  const stargazeObj = STARGAZING_LEVELS.find(x => x.val === sp.stargaze);
  const photo = sp.img || sp.terrainImg || '';
  const transform = isOpen ? 'translateY(-2px) scale(1.01)' : hovered ? 'translateY(-2px) scale(1.005)' : 'translateY(0)';
  const shadow = isOpen ? '0 24px 80px rgba(0,0,0,0.32)' : hovered ? '0 22px 70px rgba(0,0,0,0.28)' : '0 20px 60px rgba(0,0,0,0.24)';
  const panelId = 'spot-panel-' + (sp.id || sp.name.replace(/\s+/g, '-'));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.leather, borderRadius: '18px',
        border: '1px solid ' + T.border, overflow: 'hidden',
        boxShadow: shadow, transition: 'transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease',
        transform,
      }}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="spot-toggle"
        style={{ ...BUTTON_RESET, display: 'block' }}>
        <div style={{ position: 'relative', height: '150px', overflow: 'hidden', background: '#111' }}>
          <img src={photo} alt="" aria-hidden
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 260ms ease', transform: hovered ? 'scale(1.04)' : 'scale(1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.7) 100%)' }} />
          <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '16px', color: '#fff', background: 'rgba(0,0,0,0.32)', padding: '12px 14px 14px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {sp.cat === 'hidden' ? <Pill label="Hidden Gem" color={T.star} /> : <Pill label="Popular" color={T.gold} />}
              {sp.iconic && <Pill label="Iconic" color={T.good} />}
              <Pill label={sp.type} color={T.muted} />
              {sp.terrainName && <Pill label={sp.terrainName} color={T.leatherDark} />}
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', lineHeight: 1.1 }}>{sp.name}</div>
            <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.88)', marginTop: '6px' }}>{sp.fee} · {sp.trails.length} trail{sp.trails.length === 1 ? '' : 's'}</div>
          </div>
        </div>
        <div style={{ padding: '16px', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <Pill label={COMFORT_LABELS[sp.comfort]} color={COMFORT_COLORS[sp.comfort]} />
            <Pill label={stargazeObj.label} color={stargazeObj.color} />
            {sp.permits.required ? <Pill label="Permit Req" color={T.warn} /> : <Pill label="No Permit" color={T.good} />}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ color: T.text, fontSize: '0.88rem', lineHeight: 1.6 }}>{sp.notes}</div>
            <div style={{ color: T.gold, fontWeight: 'bold', fontSize: '0.85rem', flexShrink: 0 }}>{isOpen ? 'Hide details' : 'View details'}</div>
          </div>
        </div>
      </button>

      <div
        id={panelId}
        role="region"
        aria-label={sp.name + ' details'}
        hidden={!isOpen}
        style={{
          maxHeight: isOpen ? '2000px' : '0',
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 280ms ease, opacity 220ms ease',
          borderTop: isOpen ? '1px solid ' + T.border : 'none',
        }}>
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <InfoCell label="WATER" icon="WTR" statusObj={WATER_STATUS[sp.water]} />
            <InfoCell label="CELL SERVICE" icon="SIG" statusObj={CELL_COVERAGE[sp.cell]} />
            <InfoCell label="BEAR/FOOD" icon="BEAR" statusObj={BEAR_REQUIREMENTS[sp.bear]} />
            <InfoCell label="STARGAZING" icon="STAR" statusObj={stargazeObj} />
          </div>
          <div style={{ padding: '14px', background: T.leatherDark, borderRadius: '12px', marginBottom: '14px', border: '1px solid ' + (sp.permits.required ? T.warn : T.border) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <div style={{ fontSize: '0.72rem', color: T.gold, letterSpacing: '2px' }}>PERMITS</div>
              {sp.permits.required ? <Pill label="Required" color={T.warn} /> : <Pill label="Not Required" color={T.good} />}
            </div>
            <div style={{ fontSize: '0.82rem', color: T.text, marginBottom: '4px' }}>{sp.permits.notes}</div>
            {sp.reservations && <div style={{ fontSize: '0.75rem', color: T.muted }}>Book via <span style={{ color: T.text }}>{sp.reservations}</span></div>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', marginBottom: '8px' }}>WILDLIFE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sp.wildlife.map(w => <Pill key={w} label={w} color={T.cool} />)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', marginBottom: '8px' }}>AMENITIES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sp.amenities.map(a => <Pill key={a} label={a} color={T.muted} />)}
              </div>
            </div>
          </div>
          {sp.lat && sp.lng && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onGoToMap(sp); }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '11px', marginBottom: '16px',
                background: 'transparent', border: '1px solid ' + T.gold, borderRadius: '10px',
                color: T.gold, fontSize: '0.82rem', fontFamily: 'Georgia, serif', fontWeight: 'bold',
                cursor: 'pointer', letterSpacing: '0.5px',
                transition: 'background 160ms ease, color 160ms ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = T.gold; e.currentTarget.style.color = T.nightCamp; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.gold; }}
            >
              ⌖ View on Map
            </button>
          )}
          <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', marginBottom: '10px' }}>TRAILS</div>
          {sp.trails.map((tr, ti) => {
            // Mock rating until real reviews land — deterministic so it doesn't flicker
            const rating = (4 + ((tr.name.length * 7) % 10) / 10).toFixed(1);
            const isTrailActive = activeTrailIdx === ti;
            return (
              <div key={ti} onClick={() => setActiveTrailIdx(isTrailActive ? null : ti)} style={{
                padding: '12px 14px', background: T.leatherDark, borderRadius: '12px',
                marginBottom: '10px', border: '1px solid ' + (isTrailActive ? T.gold : T.border),
                transition: 'border-color 200ms ease, transform 200ms ease', cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isTrailActive ? T.gold : T.border; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px', gap: '8px' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', lineHeight: 1.3, fontFamily: 'Georgia, serif' }}>{tr.name}</div>
                  {(() => {
                    const trailKey = sp.name + '||' + tr.name;
                    const isSaved = !!savedTrails[trailKey];
                    return (
                      <button type="button" aria-label={(isSaved ? 'Unsave ' : 'Save ') + tr.name}
                        onClick={(e) => { e.stopPropagation(); onSaveTrail(trailKey); }}
                        style={{ ...BUTTON_RESET, width: 'auto', color: isSaved ? T.star : T.muted, fontSize: '1.1rem', flexShrink: 0, padding: '0 4px', lineHeight: 1, transition: 'color 150ms ease' }}>
                        {isSaved ? '♥' : '♡'}
                      </button>
                    );
                  })()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '0.78rem', marginBottom: '6px' }}>
                  <span style={{ color: T.gold, fontWeight: 'bold' }}>★ {rating}</span>
                  <span style={{ color: T.border }}>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span aria-hidden style={{ width: '8px', height: '8px', borderRadius: '2px', background: DIFF_COLORS[tr.diff], display: 'inline-block' }} />
                    <span style={{ color: DIFF_COLORS[tr.diff], fontWeight: '600' }}>{DIFF_LABELS[tr.diff]}</span>
                  </span>
                  <span style={{ color: T.border }}>·</span>
                  <span style={{ color: T.text }}>{tr.dist}</span>
                  <span style={{ color: T.border }}>·</span>
                  <span style={{ color: T.muted }}>{tr.type}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: T.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{tr.notes}</div>
                {isTrailActive && sp.lat && sp.lng && (
                  <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid ' + T.border }}>
                    <img
                      src={`https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/export?bbox=${sp.lng-0.06},${sp.lat-0.04},${sp.lng+0.06},${sp.lat+0.04}&size=380,180&format=png&f=image`}
                      alt={`Map of ${sp.name}`}
                      style={{ width: '100%', display: 'block' }}
                    />
                    <div style={{ padding: '8px 10px', background: T.nightCamp, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: T.muted, fontStyle: 'italic' }}>
                        {tr.dist} · {tr.type}
                      </span>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); onGoToMap(sp); }}
                        style={{ ...BUTTON_RESET, width: 'auto', fontSize: '0.7rem', color: T.gold, fontFamily: 'Georgia, serif' }}>
                        ⌖ Full map →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// SLICE 2 (bug fixes) + SLICE 3 (a11y) — PackTracker
// - SSR-safe init (no window access in useState initial)
// - 5px drag threshold so taps reliably toggle
// - Clamps both bubble and expanded panel into viewport
// - Window resize listener
// - aria-label + aria-expanded on bubble; close button is a real <button>
// =============================================================================
const PackTracker = ({ checked, packType, onClick }) => {
  const plan = PACKING[packType];
  const [expanded, setExpanded] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0, moved: false });

  // SLICE 2 — initial position computed after mount only
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setPos({ x: window.innerWidth - 80, y: window.innerHeight - 100 });
    setMounted(true);
    const onResize = () => {
      setPos(p => ({
        x: Math.max(10, Math.min(window.innerWidth - 70, p.x)),
        y: Math.max(10, Math.min(window.innerHeight - 70, p.y)),
      }));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const startDrag = (clientX, clientY) => {
    dragRef.current = {
      dragging: true,
      startX: clientX, startY: clientY,
      offsetX: clientX - pos.x, offsetY: clientY - pos.y,
      moved: false,
    };
  };
  const onMouseDown = (e) => startDrag(e.clientX, e.clientY);
  const onTouchStart = (e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY); };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current.dragging) return;
      const cx = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
      const cy = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
      if (cx === undefined || cy === undefined) return;
      // SLICE 2 — 5px deadzone before counting as a drag
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      if (!dragRef.current.moved && Math.hypot(dx, dy) < 5) return;
      dragRef.current.moved = true;
      setPos({
        x: Math.max(10, Math.min(window.innerWidth - 70, cx - dragRef.current.offsetX)),
        y: Math.max(10, Math.min(window.innerHeight - 70, cy - dragRef.current.offsetY)),
      });
    };
    const onUp = () => { dragRef.current.dragging = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  const totalItems = plan.cats.reduce((a, c) => a + c.items.length, 0);
  const doneItems = Object.values(checked).filter(Boolean).length;
  const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const handleClick = () => {
    if (dragRef.current.moved) return;
    setExpanded(v => !v);
  };

  if (!mounted) return null; // SLICE 2 — don't render at (0,0) before measure

  // SLICE 2 — clamp panel into viewport
  const PANEL_W = 280, PANEL_H = 300;
  const panelLeft = Math.max(10, Math.min(window.innerWidth - PANEL_W - 10, pos.x - PANEL_W + 40));
  const panelTop  = Math.max(10, Math.min(window.innerHeight - PANEL_H - 10, pos.y - PANEL_H));

  if (expanded) {
    return (
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        role="dialog"
        aria-label="Pack tracker"
        style={{
          position: 'fixed', left: panelLeft, top: panelTop, width: PANEL_W + 'px',
          background: T.leather, borderRadius: '12px', border: '2px solid ' + T.gold,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', zIndex: 1000, padding: '14px',
          fontFamily: 'Georgia, serif', cursor: 'move',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ color: T.gold, fontSize: '0.7rem', letterSpacing: '2px' }}>PACK TRACKER</div>
            <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{plan.label}</div>
          </div>
          <button
            type="button"
            aria-label="Close pack tracker"
            onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
            style={{ ...BUTTON_RESET, width: 'auto', color: T.muted, fontSize: '1.4rem', padding: '0 6px', cursor: 'pointer' }}>
            ×
          </button>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '4px' }}>
            <span style={{ color: T.muted }}>Overall</span>
            <span style={{ color: T.gold, fontWeight: 'bold' }}>{doneItems}/{totalItems} ({overallPct}%)</span>
          </div>
          <div role="progressbar" aria-valuenow={overallPct} aria-valuemin={0} aria-valuemax={100}
            style={{ height: '6px', background: T.leatherDark, borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: overallPct + '%', background: T.gold, transition: 'width 0.3s' }} />
          </div>
        </div>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {plan.cats.map((cat, ci) => {
            const catTotal = cat.items.length;
            const catDone = cat.items.filter((_, ii) => checked[packType + '-' + ci + '-' + ii]).length;
            const pct = catTotal > 0 ? (catDone / catTotal) * 100 : 0;
            const color = pct === 100 ? T.good : pct >= 50 ? T.warn : pct > 0 ? T.muted : T.border;
            return (
              <div key={ci} style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '3px' }}>
                  <span style={{ color: T.text }}>{cat.name}</span>
                  <span style={{ color: T.muted }}>{catDone}/{catTotal}</span>
                </div>
                <div style={{ height: '4px', background: T.leatherDark, borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: color, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{
            ...BUTTON_RESET, width: '100%', marginTop: '12px', padding: '8px',
            background: T.gold, color: T.nightCamp, borderRadius: '4px',
            textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem',
          }}>
          Open Full Packlist
        </button>
        <div style={{ marginTop: '8px', fontSize: '0.65rem', color: T.muted, textAlign: 'center', fontStyle: 'italic' }}>
          Drag header to move
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onClick={handleClick}
      aria-label={'Pack tracker, ' + overallPct + ' percent complete. Click to expand.'}
      aria-expanded={expanded}
      style={{
        ...BUTTON_RESET, position: 'fixed', left: pos.x, top: pos.y, width: '60px', height: '60px',
        background: T.leather, borderRadius: '50%', border: '2px solid ' + T.gold,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)', zIndex: 1000, cursor: 'move',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', fontFamily: 'Georgia, serif',
      }}>
      <span style={{ color: T.gold, fontSize: '0.65rem', fontWeight: 'bold', lineHeight: 1 }}>PACK</span>
      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '2px' }}>{overallPct}%</span>
    </button>
  );
};

// =============================================================================
// SLICE 1 (UX) + SLICE 3 (a11y) — PlannerTab
// =============================================================================
const labelStyle = { color: T.gold, fontSize: '0.7rem', letterSpacing: '4px', marginBottom: '15px' };
const statCardStyle = { padding: '14px', background: T.leatherDark, borderRadius: '6px', border: '1px solid ' + T.border };
const emptyStyle = { textAlign: 'center', padding: '40px', color: T.muted, fontStyle: 'italic' };

const PlannerTab = ({ region, setRegion, terrainId, setTerrainId, sleepId, setSleepId, savedTrails = {}, onSaveTrail = () => {}, onGoToMap = () => {} }) => {
  const [spotFilter, setSpotFilter] = useState('all');
  const [openSpotId, setOpenSpotId] = useState(null);
  const [groupSize, setGroupSize] = useState(2);
  const [exploreAll, setExploreAll] = useState(false);
  const npsState = useNPSCampgrounds(region.includes('California') ? 'CA' : 'CA');

  // SLICE 1 — scroll refs
  const regionRef = useRef(null);
  const terrainRef = useRef(null);
  const sleepRef = useRef(null);
  const spotsRef = useRef(null);

  const terrains = TERRAINS[region];
  const activeTerrain = terrains.find(t => t.id === terrainId) || terrains[0];
  const seasonal = SEASONAL[activeTerrain.id];
  // SLICE 2 — use activeTerrain.id (not stale terrainId) for spots lookup
  const spots = SPOTS[activeTerrain.id];
  const allSpots = spots ? [
    ...(spots.known || []).map(s => ({ ...s, cat: 'known', terrainImg: activeTerrain.img })),
    ...(spots.hidden || []).map(s => ({ ...s, cat: 'hidden', terrainImg: activeTerrain.img })),
  ] : [];
  const groupFit = (s) => inferMaxGroup(s) >= groupSize;
  const sourceSpots = exploreAll ? ALL_SPOTS_GLOBAL : allSpots;
  const spotsBeforeGroup = spotFilter === 'all'
    ? sourceSpots
    : spotFilter === 'iconic' ? sourceSpots.filter(s => s.iconic) : sourceSpots.filter(s => s.cat === spotFilter);
  const filteredSpots = spotsBeforeGroup.filter(groupFit);
  const trailCount = filteredSpots.reduce((sum, spot) => sum + (spot.trails?.length || 0), 0);

  // SLICE 1 — current step derives from state, not a separate counter
  const currentStep = !sleepId ? (!terrainId ? 1 : 2) : openSpotId ? 4 : 3;
  // simpler: 1 region picked always; 2 = picked terrain; 3 = picked sleep; 4 = opened a spot
  const effectiveStep = openSpotId ? 4 : sleepId ? 3 : terrainId ? 2 : 1;

  // SLICE 2 — drop dead `step` state and `nextStepLabel`
  const scrollTo = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const jumpToStep = (n) => {
    if (n === 1) scrollTo(regionRef);
    if (n === 2) scrollTo(terrainRef);
    if (n === 3) scrollTo(sleepRef);
    if (n === 4) scrollTo(spotsRef);
  };

  // SLICE 1 — season-aware sleep fit, uses current month
  const monthIdx = useMemo(() => new Date().getMonth(), []);

  return (
    <>
      <Stepper current={effectiveStep} onJump={jumpToStep} />

      <div className="planner-grid">
        <div>
          {/* STEP 1 */}
          <section ref={regionRef} aria-labelledby="step-1-label" style={{ scrollMarginTop: '90px' }}>
            <h2 id="step-1-label" style={labelStyle}>1 — SELECT REGION</h2>
            <div role="radiogroup" aria-label="Region" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
              {Object.keys(TERRAINS).map(r => {
                const active = region === r;
                return (
                  <button key={r}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setRegion(r);
                      setTerrainId(TERRAINS[r][0].id);
                      setSleepId(null);
                      setOpenSpotId(null);
                    }}
                    className="region-btn"
                    style={{
                      ...BUTTON_RESET, flex: '1 1 180px', textAlign: 'center',
                      padding: '16px 18px', borderRadius: '999px',
                      background: active ? T.gold : 'rgba(255,255,255,0.04)',
                      border: '1px solid ' + (active ? T.gold : T.border),
                      color: active ? T.nightCamp : T.text,
                      fontFamily: 'Georgia, serif', fontSize: '0.95rem', fontWeight: '600',
                    }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2 */}
          <section ref={terrainRef} aria-labelledby="step-2-label" style={{ scrollMarginTop: '90px' }}>
            <h2 id="step-2-label" style={labelStyle}>2 — TERRAIN TYPE</h2>
            <div role="radiogroup" aria-label="Terrain" className="terrain-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '14px' }}>
              {terrains.map(t => {
                const active = terrainId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      setTerrainId(t.id);
                      setSleepId(null);
                      setOpenSpotId(null);
                    }}
                    className="terrain-card"
                    style={{
                      ...BUTTON_RESET, cursor: 'pointer', borderRadius: '18px', overflow: 'hidden',
                      border: active ? '2px solid ' + T.gold : '1px solid ' + T.border,
                      background: T.leather, transition: 'all 0.2s',
                    }}>
                    <div style={{ position: 'relative', minHeight: '180px', overflow: 'hidden' }}>
                      <img src={t.img} alt="" aria-hidden style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.78) 100%)' }} />
                      <div style={{ position: 'absolute', left: '14px', bottom: '14px', color: '#fff' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{t.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', marginTop: '4px' }}>{t.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 3 */}
          <section ref={sleepRef} aria-labelledby="step-3-label" style={{ scrollMarginTop: '90px', marginTop: '32px' }}>
            <h2 id="step-3-label" style={labelStyle}>3 — SLEEP STYLE</h2>
            <div role="radiogroup" aria-label="Sleep style" className="sleep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '12px' }}>
              {SLEEP_STYLES.map(s => {
                // SLICE 1 — season-aware fit
                const fit = getSeasonAwareFit(s, activeTerrain.id, monthIdx);
                const active = sleepId === s.id;
                const borderColor = fit.verdict === 'good' ? T.good : T.border;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={s.name + ', ' + fit.label + '. ' + fit.why}
                    onClick={() => {
                      setSleepId(s.id);
                    }}
                    className="sleep-card"
                    style={{
                      ...BUTTON_RESET, padding: '16px 14px', borderRadius: '18px', cursor: 'pointer',
                      fontFamily: 'Georgia, serif',
                      background: active ? T.gold : T.leatherDark,
                      border: active ? '1px solid ' + T.gold : '1px solid ' + borderColor,
                      color: active ? T.nightCamp : '#fff', minHeight: '120px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', marginBottom: '6px' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: active ? '#2a1d14' : T.muted }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 'bold',
                      color: active ? '#2a1d14' : (fit.verdict === 'good' ? T.good : fit.verdict === 'caution' ? T.warn : T.muted) }}>
                      {active ? 'Selected' : fit.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* FEATURED PANEL — SLICE 1: sticky on desktop */}
        <aside className="featured-panel" aria-label={activeTerrain.name + ' summary'}>
          <img src={activeTerrain.img} alt=""
            style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: '4px', marginBottom: '20px' }} />
          <h2 style={{ color: T.gold, margin: '0 0 8px 0', fontSize: '1.4rem' }}>{activeTerrain.name}</h2>
          <p style={{ fontSize: '0.85rem', color: T.muted, fontStyle: 'italic', marginBottom: '16px' }}>{activeTerrain.vibe}</p>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '0.7rem', color: T.muted, marginBottom: '4px' }}>TERRAIN DIFFICULTY</div>
            <Dots value={activeTerrain.diff} color={DIFF_COLORS[activeTerrain.diff]} label={DIFF_LABELS[activeTerrain.diff]} />
          </div>
          <div style={{ borderTop: '1px solid ' + T.border, paddingTop: '14px' }}>
            <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', marginBottom: '8px' }}>SEASONAL CONDITIONS</div>
            <SeasonalBar months={seasonal.months} currentMonth={monthIdx} />
            <div style={{ marginTop: '10px', fontSize: '0.75rem', color: T.text, lineHeight: '1.6' }}>
              <div><span style={{ color: T.good }}>Best:</span> {seasonal.notes.best}</div>
              <div><span style={{ color: T.bad }}>Avoid:</span> {seasonal.notes.avoid}</div>
              <div><span style={{ color: T.warn }}>Bugs:</span> {seasonal.notes.bugs}</div>
              <div><span style={{ color: T.muted }}>Crowds:</span> {seasonal.notes.crowds}</div>
            </div>
          </div>
          {sleepId && (() => {
            const s = SLEEP_STYLES.find(x => x.id === sleepId);
            const fit = getSeasonAwareFit(s, activeTerrain.id, monthIdx);
            const color = fit.verdict === 'good' ? T.good : fit.verdict === 'caution' ? T.warn : T.muted;
            return (
              <div style={{ borderTop: '1px solid ' + T.border, paddingTop: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ color: T.gold, fontWeight: 'bold' }}>{s.name}</div>
                  <span style={{ fontSize: '0.7rem', padding: '3px 8px', borderRadius: '4px',
                    background: 'rgba(255,255,255,0.04)', color, border: '1px solid ' + color }}>
                    {fit.label}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: T.muted, fontStyle: 'italic', marginBottom: '12px' }}>{fit.why}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: T.good, marginBottom: '4px' }}>WORKS WELL</div>
                    {s.pros.map(p => <div key={p} style={{ fontSize: '0.75rem', color: T.text, marginBottom: '2px' }}>+ {p}</div>)}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.65rem', color: T.bad, marginBottom: '4px' }}>WATCH OUT</div>
                    {s.cons.map(c => <div key={c} style={{ fontSize: '0.75rem', color: T.text, marginBottom: '2px' }}>- {c}</div>)}
                  </div>
                </div>
              </div>
            );
          })()}
        </aside>
      </div>

      {/* STEP 4 — SPOTS */}
      <section ref={spotsRef} aria-labelledby="step-4-label"
        style={{ scrollMarginTop: '90px', borderTop: '1px solid ' + T.border, marginTop: '60px', paddingTop: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <p id="step-4-label" style={{ color: T.gold, fontSize: '0.7rem', letterSpacing: '4px', marginBottom: '8px' }}>4 — SPOTS & TRAILS</p>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: 0, fontWeight: 'normal' }}>
            {exploreAll ? 'All California' : activeTerrain.name}
            <span style={{ color: T.muted, fontSize: '1rem' }}> · {filteredSpots.length} spot{filteredSpots.length === 1 ? '' : 's'} · {trailCount} trail{trailCount === 1 ? '' : 's'}</span>
          </h2>
          <p style={{ color: T.muted, fontSize: '0.85rem', marginTop: '8px', fontStyle: 'italic' }}>
            Tap any spot to see water, cell coverage, permits, wildlife, and trails
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setExploreAll(v => !v); setSpotFilter('all'); setOpenSpotId(null); }}
          style={{
            ...BUTTON_RESET, width: '100%', marginBottom: '16px',
            padding: '11px', borderRadius: '999px', textAlign: 'center',
            background: exploreAll ? T.gold + '18' : 'transparent',
            border: '1px dashed ' + (exploreAll ? T.gold : T.border),
            color: exploreAll ? T.gold : T.muted,
            fontSize: '0.75rem', letterSpacing: '2px', cursor: 'pointer',
          }}>
          {exploreAll ? '✦ SHOWING ALL CALIFORNIA · click to filter by terrain' : '✦ EXPLORE ALL CALIFORNIA SPOTS'}
        </button>
        <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '12px', background: 'rgba(0,0,0,0.25)', border: '1px solid ' + T.border }}>
          <label htmlFor="group-size-slider" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.72rem', color: T.gold, letterSpacing: '2px' }}>
            <span>GROUP SIZE</span>
            <span style={{ color: '#fff', fontFamily: 'Georgia, serif', letterSpacing: 'normal', fontSize: '0.85rem' }}>
              {groupSize === 1 ? 'Solo' : groupSize + ' people'}
            </span>
          </label>
          <input id="group-size-slider" type="range" min="1" max="12" step="1" value={groupSize}
            onChange={e => setGroupSize(parseInt(e.target.value, 10))}
            style={{ width: '100%', accentColor: T.gold, cursor: 'pointer' }} />
          <div aria-hidden style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: T.muted, marginTop: '4px' }}>
            <span>1</span><span>6</span><span>12</span>
          </div>
        </div>
        <div role="tablist" aria-label="Spot filters" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {SPOT_FILTERS.map(([v,l]) => {
            const active = spotFilter === v;
            return (
              <button key={v} type="button" role="tab" aria-selected={active}
                onClick={() => setSpotFilter(v)}
                className="spot-filter-btn"
                style={{
                  ...BUTTON_RESET, flex: v === 'all' ? '1 1 100%' : '1 1 120px', textAlign: 'center',
                  padding: '12px 14px', borderRadius: '999px',
                  background: active ? T.leather : 'rgba(255,255,255,0.04)',
                  border: '1px solid ' + (active ? T.gold : T.border),
                  color: active ? T.gold : T.muted, fontFamily: 'Georgia, serif',
                  fontSize: '0.85rem', minWidth: '110px',
                }}>
                {l}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredSpots.length === 0 ? (
            <div style={emptyStyle}>
              {spotsBeforeGroup.length > 0
                ? `No spots fit a group of ${groupSize === 1 ? 'solo' : groupSize} — try sliding the group size down, or switch filter to "All Spots".`
                : 'No spots in this filter — try "All Spots" to see everything.'}
            </div>
          ) : (
            filteredSpots.map((sp, i) => {
              const key = sp.cat + '-' + i;
              return (
                <SpotCard
                  key={key}
                  sp={{ ...sp, id: key }}
                  isOpen={openSpotId === key}
                  onClick={() => setOpenSpotId(openSpotId === key ? null : key)}
                  savedTrails={savedTrails}
                  onSaveTrail={onSaveTrail}
                  onGoToMap={onGoToMap}
                />
              );
            })
          )}
        </div>
      </section>

      {/* OFFICIAL NPS SITES — live from api.nps.gov */}
      <section style={{ borderTop: '1px solid ' + T.border, marginTop: '60px', paddingTop: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <p style={{ color: T.gold, fontSize: '0.7rem', letterSpacing: '4px', marginBottom: '8px' }}>OFFICIAL NPS SITES</p>
          <h2 style={{ color: '#fff', fontSize: '1.5rem', margin: 0, fontWeight: 'normal' }}>
            Pulled live from nps.gov
          </h2>
        </div>
        {npsState.loading && <div style={emptyStyle}>Loading from nps.gov…</div>}
        {npsState.error === 'no_key' && (
          <div style={emptyStyle}>
            Add <code style={{ color: T.gold }}>VITE_NPS_API_KEY</code> to a <code style={{ color: T.gold }}>.env</code> file in your project root to load official park data.
          </div>
        )}
        {npsState.error && npsState.error !== 'no_key' && (
          <div style={emptyStyle}>Could not reach NPS API: {npsState.error}</div>
        )}
        {!npsState.loading && !npsState.error && npsState.data.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {npsState.data.slice(0, 12).map(c => (
              <article key={c.id} style={{ background: T.leather, borderRadius: '14px', overflow: 'hidden', border: '1px solid ' + T.border }}>
                {c.images && c.images[0] && c.images[0].url && (
                  <img src={c.images[0].url} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />
                )}
                <div style={{ padding: '14px' }}>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '6px' }}>{c.name}</div>
                  <div style={{ color: T.muted, fontSize: '0.75rem', lineHeight: 1.5 }}>
                    {(c.description || '').slice(0, 180)}{c.description && c.description.length > 180 ? '…' : ''}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
};

// =============================================================================
// PACK — Full rebuild: weight tracking, warning badges, swap suggestions, tips
// =============================================================================
const PackTab = ({ checked, setChecked, packType, setPackType, sleepId, onGoToPlan }) => {
  const [openCat, setOpenCat] = useState(null);
  const plan = PACKING[packType];
  const total = plan.cats.reduce((a, c) => a + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  // Seasonal context
  const month = useMemo(() => new Date().getMonth(), []);
  const season = getSeason(month);
  const sg = SEASONAL_GEAR[season];

  // Sleep style context
  const sleepStyle = sleepId ? SLEEP_STYLES.find(s => s.id === sleepId) : null;
  const sleepMap = sleepId ? SLEEP_PACK_MAP[sleepId] : null;

  // Estimated weight from oz fields on checked items
  const estOz = plan.cats.reduce((sum, cat, ci) =>
    sum + cat.items.reduce((s, item, ii) =>
      s + (checked[packType + '-' + ci + '-' + ii] && item.oz ? item.oz : 0), 0), 0);
  const estLbs = (estOz / 16).toFixed(1);

  // Flagged items across all categories
  const flaggedItems = plan.cats.reduce((arr, cat) => {
    cat.items.forEach(item => { if (item.warn) arr.push(item); });
    return arr;
  }, []);

  // Weight bar geometry
  const [targetMin, targetMax] = plan.lbs || [20, 35];
  const barMax = targetMax * 1.5;
  const barPct = Math.min(100, (estOz / 16 / barMax) * 100);
  const targetMinPct = (targetMin / barMax) * 100;
  const targetMaxPct = (targetMax / barMax) * 100;
  const barColor = estOz / 16 > targetMax ? T.bad : estOz / 16 > targetMin ? T.warn : T.good;

  return (
    <div>
      {/* Pack type selector */}
      <div role="radiogroup" aria-label="Pack type" className="pack-type-grid">
        {Object.entries(PACKING).map(([k, p]) => {
          const active = packType === k;
          return (
            <button key={k} type="button" role="radio" aria-checked={active}
              onClick={() => { setPackType(k); setChecked({}); setOpenCat(null); }}
              style={{
                ...BUTTON_RESET, padding: '12px', borderRadius: '10px',
                background: active ? T.leather : 'transparent',
                border: '1px solid ' + (active ? T.gold : T.border),
                color: active ? T.gold : T.muted,
                fontFamily: 'Georgia, serif', fontSize: '0.85rem',
                transition: 'all 150ms',
              }}>
              <div style={{ fontWeight: 'bold' }}>{p.label}</div>
              <div style={{ fontSize: '0.7rem', marginTop: '2px' }}>{p.weight}</div>
            </button>
          );
        })}
      </div>

      {/* Sleep style banner — or CTA to go pick one */}
      {!sleepStyle ? (
        <div style={{ padding: '14px 16px', background: 'rgba(194,155,97,0.06)', borderRadius: '12px', border: '1px dashed ' + T.border, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: T.muted, letterSpacing: '2px', marginBottom: '4px' }}>NO SLEEP STYLE CHOSEN</div>
            <div style={{ fontSize: '0.8rem', color: T.text, lineHeight: 1.5 }}>Pick a sleep style in the Plan tab to get shelter-specific gear recommendations here.</div>
          </div>
          <button type="button" onClick={onGoToPlan}
            style={{ ...BUTTON_RESET, width: 'auto', flexShrink: 0, padding: '8px 14px', background: T.leather, border: '1px solid ' + T.gold, borderRadius: '8px', color: T.gold, fontSize: '0.75rem', fontFamily: 'Georgia, serif', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            → Go to Plan
          </button>
        </div>
      ) : (
        <div style={{ padding: '13px 16px', background: 'rgba(194,155,97,0.07)', borderRadius: '12px', border: '1px solid rgba(194,155,97,0.3)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{sleepMap.icon}</span>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '2px', fontWeight: 'bold' }}>SLEEP STYLE</span>
              <span style={{ fontSize: '0.65rem', color: T.muted, marginLeft: '8px' }}>{sleepStyle.name}</span>
            </div>
            <button type="button" onClick={onGoToPlan}
              style={{ ...BUTTON_RESET, width: 'auto', fontSize: '0.65rem', color: T.muted, cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '1px solid ' + T.border }}>
              change
            </button>
          </div>
          <div style={{ fontSize: '0.78rem', color: T.text, lineHeight: 1.65 }}>{sleepMap.note}</div>
          {(sleepMap.skip.length > 0 || sleepMap.sleepSkip.length > 0) && (
            <div style={{ marginTop: '8px', fontSize: '0.7rem', color: T.muted, fontStyle: 'italic' }}>
              Items marked <span style={{ color: T.bad }}>✕ skip</span> are not needed for your sleep style.
            </div>
          )}
        </div>
      )}

      {/* Seasonal conditions banner */}
      <div style={{ padding: '14px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid ' + sg.color + '55', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{sg.icon}</span>
          <div>
            <span style={{ fontSize: '0.65rem', color: sg.color, letterSpacing: '2px', fontWeight: 'bold' }}>{sg.label.toUpperCase()}</span>
            <span style={{ fontSize: '0.65rem', color: T.muted, marginLeft: '8px' }}>{sg.months}</span>
          </div>
          <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: T.muted, fontStyle: 'italic' }}>
            seasonal add-ons marked below ↓
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: T.text, lineHeight: 1.65 }}>{sg.tip}</div>
      </div>

      {/* Gear analysis summary card */}
      <div style={{ padding: '16px', background: T.leatherDark, borderRadius: '12px', border: '1px solid ' + T.border, marginBottom: '16px' }}>
        <div style={{ fontSize: '0.65rem', color: T.gold, letterSpacing: '3px', marginBottom: '12px' }}>GEAR ANALYSIS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: T.gold }}>{done}/{total}</div>
            <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1px', marginTop: '2px' }}>PACKED</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: estOz > 0 ? barColor : T.muted }}>
              {estOz > 0 ? estLbs + ' lbs' : '—'}
            </div>
            <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1px', marginTop: '2px' }}>EST. WEIGHT</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: flaggedItems.length > 0 ? T.warn : T.good }}>
              {flaggedItems.length}
            </div>
            <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1px', marginTop: '2px' }}>FLAGGED</div>
          </div>
        </div>

        {/* Visual weight bar */}
        <div style={{ marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: T.muted, marginBottom: '6px' }}>
            <span>Tracking checked items · <span style={{ color: barColor, fontWeight: 'bold' }}>{estOz > 0 ? estLbs + ' lbs so far' : 'check items to track'}</span></span>
            <span>Target: {plan.weight}</span>
          </div>
          <div style={{ position: 'relative', height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '5px' }}>
            {/* target zone shading */}
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: targetMinPct + '%', width: (targetMaxPct - targetMinPct) + '%',
              background: 'rgba(194,155,97,0.18)', borderRadius: '3px',
            }} />
            {/* actual bar */}
            {estOz > 0 && (
              <div style={{
                position: 'absolute', top: 0, bottom: 0, left: 0,
                width: barPct + '%', background: barColor,
                borderRadius: '5px', transition: 'width 0.4s ease',
                minWidth: '4px',
              }} />
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: T.muted, marginTop: '4px' }}>
            <span>0 lbs</span>
            <span style={{ color: 'rgba(194,155,97,0.6)' }}>▲ {targetMin}–{targetMax} lbs target</span>
            <span>{Math.round(barMax)} lbs</span>
          </div>
        </div>
      </div>

      {/* Flagged items rollup */}
      {flaggedItems.length > 0 && (
        <div style={{ padding: '12px 14px', background: 'rgba(200,100,50,0.07)', borderRadius: '10px', border: '1px solid rgba(200,100,50,0.22)', marginBottom: '16px' }}>
          <div style={{ fontSize: '0.65rem', color: T.warn, letterSpacing: '2px', marginBottom: '10px' }}>⚠ GEAR FLAGS — items worth reconsidering</div>
          {flaggedItems.map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: '8px',
              paddingBottom: i < flaggedItems.length - 1 ? '8px' : 0,
              marginBottom: i < flaggedItems.length - 1 ? '8px' : 0,
              borderBottom: i < flaggedItems.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              {item.warn === 'heavy' && (
                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(212,147,68,0.2)', color: T.warn, border: '1px solid rgba(212,147,68,0.35)', flexShrink: 0, lineHeight: '18px', whiteSpace: 'nowrap' }}>⚠ heavy</span>
              )}
              {item.warn === 'nobp' && (
                <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(180,60,60,0.2)', color: T.bad, border: '1px solid rgba(180,60,60,0.35)', flexShrink: 0, lineHeight: '18px', whiteSpace: 'nowrap' }}>✕ not for BP</span>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.8rem', color: T.text }}>
                  {item.t}
                  {item.oz ? <span style={{ color: T.muted, fontSize: '0.72rem' }}> · {item.oz}oz</span> : null}
                </div>
                {item.swap && (
                  <div style={{ fontSize: '0.72rem', color: T.good, marginTop: '3px' }}>↩ {item.swap}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category accordions */}
      {plan.cats.map((cat, ci) => {
        const isOpen = openCat === ci;
        const catTotal = cat.items.length;
        const catDone = cat.items.filter((_, ii) => checked[packType + '-' + ci + '-' + ii]).length;
        const catFlags = cat.items.filter(item => item.warn).length;
        const catOz = cat.items.reduce((s, item, ii) =>
          s + (checked[packType + '-' + ci + '-' + ii] && item.oz ? item.oz : 0), 0);
        const panelId = 'pack-cat-' + ci;
        const tip = COMMUNITY_TIPS[cat.name];
        const seasonalItems = (sg.adds && sg.adds[cat.name]) || [];
        // Sleep style skip/needed sets for this category
        const isShelterCat = cat.name === 'Shelter';
        const isSleepCat = cat.name === 'Sleep System';
        const getItemSleepStatus = (itemTitle) => {
          if (!sleepMap) return null;
          if (isShelterCat) {
            if (sleepMap.skip.includes(itemTitle)) return 'skip';
            if (sleepMap.needed.includes(itemTitle)) return 'needed';
          }
          if (isSleepCat && sleepMap.sleepSkip.includes(itemTitle)) return 'skip';
          return null;
        };

        return (
          <div key={ci} style={{ marginBottom: '6px' }}>
            <button
              type="button"
              onClick={() => setOpenCat(isOpen ? null : ci)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{
                ...BUTTON_RESET, padding: '13px 14px',
                background: isOpen ? T.leather : 'rgba(0,0,0,0.18)',
                borderRadius: isOpen ? '10px 10px 0 0' : '10px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                border: '1px solid ' + (isOpen ? T.gold : T.border),
                borderBottom: isOpen ? 'none' : undefined,
                transition: 'background 150ms, border-color 150ms',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{cat.name}</span>
                {catFlags > 0 && (
                  <span style={{ fontSize: '0.6rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(212,147,68,0.18)', color: T.warn, border: '1px solid rgba(212,147,68,0.28)' }}>
                    ⚠ {catFlags}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {catOz > 0 && (
                  <span style={{ fontSize: '0.68rem', color: T.muted }}>{(catOz / 16).toFixed(1)} lb</span>
                )}
                {catDone > 0 && (
                  <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(194,155,97,0.15)', color: T.gold }}>{catDone}/{catTotal}</span>
                )}
                <span aria-hidden style={{ color: T.gold, fontSize: '1.2rem', lineHeight: 1 }}>{isOpen ? '−' : '+'}</span>
              </div>
            </button>

            {isOpen && (
              <div id={panelId} style={{ background: T.leatherDark, borderRadius: '0 0 10px 10px', border: '1px solid ' + T.gold, borderTop: 'none', overflow: 'hidden' }}>
                {/* Reddit-style field tip */}
                {tip && (
                  <div style={{ margin: '12px 12px 4px', padding: '11px 13px', background: 'rgba(194,155,97,0.07)', borderRadius: '8px', border: '1px solid rgba(194,155,97,0.22)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(194,155,97,0.2)', color: T.gold, letterSpacing: '1px', fontWeight: 'bold' }}>{tip.src}</span>
                      <span style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '1.5px' }}>FIELD TIP</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: T.text, lineHeight: 1.65, fontStyle: 'italic' }}>"{tip.tip}"</div>
                  </div>
                )}

                {/* Item rows */}
                <div style={{ padding: '6px 4px 8px' }}>
                  {cat.items.map((item, ii) => {
                    const k = packType + '-' + ci + '-' + ii;
                    const isChecked = !!checked[k];
                    const inputId = 'pack-item-' + k;
                    const sleepStatus = getItemSleepStatus(item.t);
                    const isSkipped = sleepStatus === 'skip';
                    const isNeeded = sleepStatus === 'needed';
                    return (
                      <label key={ii} htmlFor={inputId}
                        style={{
                          display: 'flex', gap: '10px', padding: '8px 12px', cursor: 'pointer',
                          borderRadius: '6px', alignItems: 'flex-start',
                          background: isChecked ? 'rgba(194,155,97,0.08)' : isSkipped ? 'rgba(180,60,60,0.04)' : isNeeded ? 'rgba(100,180,100,0.06)' : 'transparent',
                          opacity: isSkipped ? 0.55 : 1,
                          borderLeft: isNeeded ? '2px solid ' + T.good : isSkipped ? '2px solid rgba(180,60,60,0.3)' : '2px solid transparent',
                        }}>
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => setChecked(prev => ({ ...prev, [k]: !prev[k] }))}
                          style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '3px', accentColor: T.gold, cursor: 'pointer' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', color: isChecked ? T.muted : isSkipped ? T.muted : T.text, textDecoration: isChecked || isSkipped ? 'line-through' : 'none' }}>
                              {item.t}
                            </span>
                            {isNeeded && (
                              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(100,180,100,0.18)', color: T.good, border: '1px solid rgba(100,180,100,0.35)', whiteSpace: 'nowrap' }}>✓ your style</span>
                            )}
                            {isSkipped && (
                              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(180,60,60,0.15)', color: T.bad, border: '1px solid rgba(180,60,60,0.3)', whiteSpace: 'nowrap' }}>✕ skip</span>
                            )}
                            {item.warn === 'heavy' && !isSkipped && (
                              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(212,147,68,0.18)', color: T.warn, border: '1px solid rgba(212,147,68,0.32)', whiteSpace: 'nowrap' }}>⚠ heavy</span>
                            )}
                            {item.warn === 'nobp' && !isSkipped && (
                              <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(180,60,60,0.18)', color: T.bad, border: '1px solid rgba(180,60,60,0.32)', whiteSpace: 'nowrap' }}>✕ not for BP</span>
                            )}
                            {item.oz != null && (
                              <span style={{ fontSize: '0.65rem', color: T.muted, marginLeft: 'auto', flexShrink: 0 }}>{item.oz}oz</span>
                            )}
                          </div>
                          {item.n && (
                            <div style={{ fontSize: '0.7rem', color: T.muted, fontStyle: 'italic', marginTop: '2px' }}>{item.n}</div>
                          )}
                          {item.swap && !isSkipped && (
                            <div style={{ fontSize: '0.72rem', color: T.good, marginTop: '4px', display: 'flex', gap: '4px' }}>
                              <span style={{ flexShrink: 0 }}>↩</span>
                              <span>{item.swap}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Seasonal add-ons for this category */}
                {seasonalItems.length > 0 && (
                  <div style={{ margin: '0 8px 10px', padding: '10px', background: sg.color + '0d', borderRadius: '8px', border: '1px dashed ' + sg.color + '55' }}>
                    <div style={{ fontSize: '0.6rem', color: sg.color, letterSpacing: '2px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{sg.icon}</span>
                      <span>{sg.label.toUpperCase()} ADD-ONS</span>
                    </div>
                    {seasonalItems.map((item, si) => {
                      const k = 'seasonal-' + packType + '-' + ci + '-' + si;
                      const isChecked = !!checked[k];
                      const inputId = 'pack-seasonal-' + k;
                      return (
                        <label key={si} htmlFor={inputId}
                          style={{
                            display: 'flex', gap: '10px', padding: '7px 10px', cursor: 'pointer',
                            borderRadius: '6px', alignItems: 'flex-start',
                            background: isChecked ? sg.color + '18' : 'transparent',
                          }}>
                          <input
                            id={inputId}
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => setChecked(prev => ({ ...prev, [k]: !prev[k] }))}
                            style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '3px', accentColor: sg.color, cursor: 'pointer' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', color: isChecked ? T.muted : '#fff', textDecoration: isChecked ? 'line-through' : 'none' }}>
                              {item.t}
                            </div>
                            {item.n && (
                              <div style={{ fontSize: '0.7rem', color: T.muted, fontStyle: 'italic', marginTop: '2px' }}>{item.n}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// APP SHELL — consolidated styles + focus-visible ring everywhere
// =============================================================================
const APP_STYLES = `
  /* SLICE 2 — consolidated stylesheet (was split across two blocks) */
  .planner-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px; align-items: start; }
  .terrain-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .sleep-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .pack-type-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }

  /* SLICE 1 — sticky featured panel on desktop only */
  .featured-panel {
    border: 1px solid ${T.border}; padding: 20px; border-radius: 4px;
    background: rgba(0,0,0,0.27); position: sticky; top: 20px;
  }

  /* SLICE 3 — focus-visible rings on every interactive surface */
  button:focus-visible, [role="radio"]:focus-visible, [role="tab"]:focus-visible,
  input[type="checkbox"]:focus-visible {
    outline: 2px solid ${T.gold}; outline-offset: 2px; border-radius: 4px;
  }

  /* SLICE 1 — mobile: stack vertically, panel BELOW picker (no order: -1) */
  @media (max-width: 900px) {
    .planner-grid { grid-template-columns: 1fr !important; }
    .featured-panel { position: static !important; }
  }
  @media (max-width: 600px) {
    .terrain-grid { grid-template-columns: 1fr !important; }
    .sleep-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .pack-type-grid { grid-template-columns: 1fr 1fr !important; }
    .header-bar { flex-direction: column !important; gap: 4px !important; padding: 16px !important; }
    .header-bar .brand { font-size: 1.4rem !important; }
    .header-bar .tagline { font-size: 0.7rem !important; }
  }
`;

// =============================================================================
// INFO SIDEBAR — left-edge tab + sliding drawer
// Sections: About, FAQ, Safety, Leave No Trace, Legal
// =============================================================================
const SIDEBAR_SECTIONS = [
  {
    id: 'about',
    label: 'About',
    icon: '⛺',
    content: () => (
      <div>
        <p style={{ fontSize: '0.85rem', color: T.text, lineHeight: 1.75, marginBottom: '14px' }}>
          <strong style={{ color: T.gold }}>Dirtmap</strong> is a California camping and trails field guide — built for the people who want to get off the beaten path without getting lost on it.
        </p>
        <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.75, marginBottom: '14px' }}>
          Think of it as a campfire field guide in app form. Not a sterile list of pins, but real context: what terrain actually feels like, when to go, what to pack, what the trail community is saying.
        </p>
        <p style={{ fontSize: '0.85rem', color: T.muted, lineHeight: 1.75, marginBottom: '20px' }}>
          Built for California specifically — the Sierras, the Coast, the Mojave, the Redwoods. Each region gets its own treatment.
        </p>
        <div style={{ padding: '12px 14px', background: T.leatherDark, borderRadius: '8px', border: '1px solid ' + T.border }}>
          <div style={{ fontSize: '0.6rem', color: T.gold, letterSpacing: '2px', marginBottom: '6px' }}>VERSION</div>
          <div style={{ fontSize: '0.78rem', color: T.muted }}>Early access — spots, trails, and gear data are actively updated. Found something wrong? Use the feedback option below.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'faq',
    label: 'FAQ',
    icon: '?',
    content: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {[
          { q: 'Are the trail distances accurate?', a: 'Distances are sourced from community trail databases and NPS data. Always cross-reference with an offline map like Gaia GPS or CalTopo before heading out — conditions and routes change.' },
          { q: 'How current is the campsite info?', a: 'Campsite data reflects general known conditions. Fees, permit requirements, and seasonal closures change frequently. Always verify directly with the land manager (USFS, NPS, BLM, California State Parks) before your trip.' },
          { q: 'Are the pack weights accurate?', a: 'Weights are community averages based on typical gear in each category — not tied to a specific brand or product. Your actual pack weight will vary significantly based on what you own. Use the weight bar as a rough guide, not a spec sheet.' },
          { q: 'Is the elevation data reliable?', a: 'Elevation profiles are fetched live from SRTM90m satellite data via OpenTopoData. Accuracy is typically within 30–90 meters. Treat it as a general shape, not a precise survey.' },
          { q: 'Do you handle permits?', a: 'No — Dirtmap only shows whether a permit is required and where to get one. Reservations go through Recreation.gov, ReserveCA, or the relevant agency directly.' },
          { q: 'Why California only?', a: 'Depth over breadth. California alone has 8 distinct ecosystems, 280+ wilderness areas, and more public land than most countries. Getting one state right matters more than having 50 states done halfway.' },
          { q: 'Can I suggest a spot or trail?', a: 'Yes — feedback is always open. The goal is to surface hidden gems that don\'t show up on the mainstream apps.' },
        ].map(({ q, a }, i) => (
          <div key={i} style={{ paddingBottom: '14px', borderBottom: '1px solid ' + T.border }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: T.gold, marginBottom: '6px', lineHeight: 1.4 }}>{q}</div>
            <div style={{ fontSize: '0.8rem', color: T.muted, lineHeight: 1.7 }}>{a}</div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'safety',
    label: 'Safety',
    icon: '🆘',
    content: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '10px 12px', background: 'rgba(180,60,60,0.12)', borderRadius: '8px', border: '1px solid rgba(180,60,60,0.3)' }}>
          <div style={{ fontSize: '0.7rem', color: T.bad, letterSpacing: '2px', marginBottom: '4px', fontWeight: 'bold' }}>EMERGENCY</div>
          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 'bold' }}>Call 911 · CHP Dispatch: 800-CALL-CHP</div>
          <div style={{ fontSize: '0.75rem', color: T.muted, marginTop: '4px' }}>No cell signal? Activate a PLB, Garmin inReach, or SPOT device. Pre-file a trip plan with someone who knows when to call for help.</div>
        </div>
        {[
          { title: 'Bear Encounter', color: T.warn, steps: ['Stay calm — do not run. Running triggers chase instinct.', 'Make yourself look large, speak in a firm low voice.', 'Back away slowly, never turn your back.', 'If a black bear charges: fight back aggressively — eyes and nose.', 'If a grizzly (rare in CA) bluff charges: stand ground. If contact: play dead.', 'Store food in a bear canister or hang it 10ft up / 4ft from trunk.'] },
          { title: 'Lightning', color: '#7bbfdc', steps: ['Get off exposed ridges, peaks, and meadows by noon in Sierra.', 'Descend below treeline — lightning storms build fast 1–4pm.', 'If caught: crouch on balls of feet, feet together, ears covered. Do not lie flat.', 'Avoid lone trees, water, and metal objects.', 'Wait 30 min after the last thunder before moving.'] },
          { title: 'Altitude Sickness', color: '#78b87a', steps: ['Symptoms: headache, nausea, fatigue, dizziness above ~8,000ft.', 'Do not ascend if symptoms appear — descend 1,000–2,000ft.', 'Acclimatize: spend a night at mid-elevation before going high.', 'Hydrate aggressively. Avoid alcohol first 24 hours at altitude.', 'Severe symptoms (confusion, can\'t walk straight): emergency descent immediately.'] },
          { title: 'Snake Bite', color: T.warn, steps: ['Stay calm, immobilize the bitten limb below heart level.', 'Remove rings/watches near the bite — swelling will occur.', 'Do not cut, suck, apply tourniquet, or use ice.', 'Get to an ER as fast as possible — antivenom is the only treatment.', 'Note the snake\'s appearance if safe to do so (helps ID species).'] },
          { title: 'Dehydration / Heat Exhaustion', color: '#c0813a', steps: ['Drink before you\'re thirsty — thirst means you\'re already behind.', 'Signs: dark urine, headache, dizziness, muscle cramps.', 'Heat exhaustion: move to shade, wet clothing, fan vigorously, drink electrolytes.', 'Heat stroke (no sweating, confusion): 911 immediately — this is life-threatening.', 'Desert rule: carry 1L per hour of active hiking, minimum.'] },
        ].map(({ title, color, steps }) => (
          <div key={title} style={{ padding: '12px 14px', background: T.leatherDark, borderRadius: '8px', border: '1px solid ' + T.border }}>
            <div style={{ fontSize: '0.72rem', color, letterSpacing: '2px', fontWeight: 'bold', marginBottom: '8px' }}>{title.toUpperCase()}</div>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '5px', fontSize: '0.78rem', color: T.text, lineHeight: 1.55 }}>
                <span style={{ color, flexShrink: 0, fontWeight: 'bold' }}>{i + 1}.</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'lnt',
    label: 'Leave No Trace',
    icon: '🌿',
    content: () => (
      <div>
        <p style={{ fontSize: '0.8rem', color: T.muted, lineHeight: 1.7, marginBottom: '16px' }}>
          California's wilderness is under unprecedented pressure. These aren't suggestions — they're what keeps access open for the next person.
        </p>
        {[
          { num: 1, title: 'Plan Ahead & Prepare', color: T.gold, items: ['Check fire restrictions before every trip — CA fire rules change fast.', 'Know the permit requirements for your area. Some require advance lottery.', 'Download offline maps before you leave cell range. Never rely on signal.', 'Tell someone your route and expected return time.'] },
          { num: 2, title: 'Travel & Camp on Durable Surfaces', color: '#78b87a', items: ['Stay on established trails — shortcutting kills vegetation and widens erosion.', 'Camp 200ft from lakes, streams, and trails. Use existing sites.', 'In the backcountry, camp on rock, gravel, or dry grass — not fragile meadow.'] },
          { num: 3, title: 'Dispose of Waste Properly', color: T.warn, items: ['Pack out ALL trash, including biodegradable food scraps.', 'Cat holes: 6–8 inches deep, 200ft from water, trails, and campsites.', 'Pack out TP — even "biodegradable" TP takes years at altitude.', 'WAG bags required on Mt. Whitney and many other high-use peaks.', 'Gray water: scatter 200ft from water sources. No soap in streams.'] },
          { num: 4, title: 'Leave What You Find', color: '#7bbfdc', items: ['Leave rocks, plants, animals, and cultural artifacts where they are.', 'Don\'t build cairns — they confuse navigation and damage terrain.', 'No wildflower picking. Many CA species are protected.'] },
          { num: 5, title: 'Minimize Campfire Impact', color: '#c0813a', items: ['Check burn restrictions at CAFireSafe.com before every trip.', 'Use existing fire rings only. Never build new rings.', 'Burn wood to ash, drown completely, scatter the ash cold.', 'Pack a stove — most CA wilderness fires are prohibited in summer.'] },
          { num: 6, title: 'Respect Wildlife', color: T.good, items: ['Never feed wildlife — it gets them killed. Fed bears are destroyed.', '100-yard distance from bears and wolves. 25 yards from other wildlife.', 'Store food per regulations — bear canisters required in most Sierra wilderness.', 'Keep pets under control. Dogs disturb wildlife and nesting birds.'] },
          { num: 7, title: 'Be Considerate of Others', color: T.muted, items: ['Yield to uphill hikers and horses. Step off trail on the downhill side for horses.', 'Keep noise down — sound carries far in canyon and alpine terrain.', 'Camp out of sight and sound of other groups where possible.', 'Right of way: horses > hikers > bikers.'] },
        ].map(({ num, title, color, items }) => (
          <div key={num} style={{ marginBottom: '14px', padding: '12px 14px', background: T.leatherDark, borderRadius: '8px', border: '1px solid ' + T.border }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: color + '30', border: '1px solid ' + color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.65rem', color, fontWeight: 'bold' }}>{num}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color, fontWeight: 'bold', letterSpacing: '0.5px' }}>{title}</div>
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '4px', fontSize: '0.77rem', color: T.text, lineHeight: 1.55 }}>
                <span style={{ color, flexShrink: 0 }}>—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'legal',
    label: 'Legal',
    icon: '⚖',
    content: () => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ padding: '12px 14px', background: 'rgba(180,60,60,0.1)', borderRadius: '8px', border: '1px solid rgba(180,60,60,0.25)' }}>
          <div style={{ fontSize: '0.72rem', color: T.bad, letterSpacing: '2px', fontWeight: 'bold', marginBottom: '6px' }}>READ THIS BEFORE USING DIRTMAP</div>
          <div style={{ fontSize: '0.8rem', color: T.text, lineHeight: 1.7 }}>
            Dirtmap provides general information for recreational planning purposes only. It is not a substitute for proper outdoor training, professional guiding, or judgment in the field.
          </div>
        </div>
        {[
          {
            title: 'Assumption of Risk',
            body: 'Outdoor and wilderness activities — including hiking, backpacking, camping, and trail running — involve inherent risks, hazards, and dangers that may result in serious injury or death. These include but are not limited to: falls, drowning, dehydration, hyperthermia, hypothermia, altitude sickness, lightning strikes, wildlife encounters, and rapidly changing weather conditions. By using Dirtmap and venturing into the outdoors, you voluntarily assume full responsibility for all risks associated with your activities.',
          },
          {
            title: 'No Warranty on Information Accuracy',
            body: 'Trail distances, elevation data, campsite details, permit requirements, fees, seasonal conditions, water source availability, and road access information may be inaccurate, outdated, or incomplete. Conditions in wilderness areas change rapidly due to weather, fire, flood, drought, and agency management decisions. Dirtmap makes no representation or warranty — express or implied — as to the accuracy, completeness, or fitness for a particular purpose of any information on this site. Always verify current conditions directly with the relevant land management agency (USFS, NPS, BLM, California State Parks) before your trip.',
          },
          {
            title: 'Pack Weight Estimates',
            body: 'Gear weights shown in the Pack section are approximate averages based on commonly available products in each category. They are not based on any specific brand, model, or your actual equipment. Your real pack weight will differ. These estimates are provided as rough planning guidance only and should not be relied upon for safety-critical decisions.',
          },
          {
            title: 'Community Tips & Third-Party Content',
            body: 'Tips attributed to online communities (Reddit, forums, etc.) represent general community knowledge and opinions. They do not constitute professional advice. Dirtmap does not verify, endorse, or guarantee the accuracy of any community-sourced content. Use your own judgment and consult qualified professionals where appropriate.',
          },
          {
            title: 'Emergency Services Disclaimer',
            body: 'Dirtmap is not an emergency response service. In an emergency, call 911 or activate a personal locator beacon (PLB) or satellite communicator. Do not rely on Dirtmap for rescue, navigation, or emergency guidance.',
          },
          {
            title: 'California Recreational Use Statute',
            body: 'Under California Civil Code § 846, landowners who permit recreational use of their land owe no duty of care to keep the premises safe or to warn of hazards. This statute reflects the California Legislature\'s recognition that outdoor recreation involves inherent risk. Dirtmap operates in the same spirit: we provide information to enhance your experience, not to guarantee your safety.',
          },
          {
            title: 'Limitation of Liability',
            body: 'To the fullest extent permitted by applicable law, Dirtmap and its creators shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from your use of this app or from outdoor activities undertaken in reliance on information provided here — including but not limited to personal injury, death, property damage, or loss of any kind.',
          },
          {
            title: 'No Endorsement of Third Parties',
            body: 'References to land management agencies, reservation systems, gear categories, or external services are for informational purposes only and do not constitute an endorsement. Dirtmap has no commercial relationship with any gear brand, outfitter, or campsite operator.',
          },
        ].map(({ title, body }) => (
          <div key={title} style={{ padding: '12px 14px', background: T.leatherDark, borderRadius: '8px', border: '1px solid ' + T.border }}>
            <div style={{ fontSize: '0.7rem', color: T.gold, letterSpacing: '2px', fontWeight: 'bold', marginBottom: '6px' }}>{title.toUpperCase()}</div>
            <div style={{ fontSize: '0.77rem', color: T.muted, lineHeight: 1.75 }}>{body}</div>
          </div>
        ))}
        <div style={{ fontSize: '0.68rem', color: T.border, lineHeight: 1.6, textAlign: 'center', paddingTop: '8px' }}>
          Last updated May 2026 · California · For questions contact the Dirtmap team
        </div>
      </div>
    ),
  },
];

const InfoSidebar = ({ open, onClose }) => {
  const [activeSection, setActiveSection] = useState('about');
  const section = SIDEBAR_SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000 }}
        />
      )}

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: '420px', maxWidth: '92vw',
        background: T.leather,
        borderRight: '1px solid ' + T.border,
        boxShadow: '8px 0 40px rgba(0,0,0,0.5)',
        zIndex: 2001,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 18px 0', borderBottom: '1px solid ' + T.border, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ color: T.gold, fontSize: '1.1rem', fontWeight: 'bold', letterSpacing: '2px', fontFamily: 'Georgia, serif' }}>dirtmap</div>
            <button type="button" onClick={onClose}
              style={{ ...BUTTON_RESET, width: 'auto', color: T.muted, fontSize: '1.6rem', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
          {/* Section tabs */}
          <div style={{ display: 'flex', gap: '2px', overflowX: 'auto', paddingBottom: '0' }}>
            {SIDEBAR_SECTIONS.map(s => {
              const active = activeSection === s.id;
              return (
                <button key={s.id} type="button"
                  onClick={() => setActiveSection(s.id)}
                  style={{
                    ...BUTTON_RESET, width: 'auto', whiteSpace: 'nowrap',
                    padding: '8px 12px', fontSize: '0.72rem', letterSpacing: '1px',
                    color: active ? T.gold : T.muted,
                    borderBottom: '2px solid ' + (active ? T.gold : 'transparent'),
                    fontFamily: 'Georgia, serif', cursor: 'pointer',
                    transition: 'color 150ms, border-color 150ms',
                  }}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 18px 40px' }}>
          <div style={{ fontSize: '0.6rem', color: T.muted, letterSpacing: '3px', marginBottom: '16px' }}>
            {section.icon} {section.label.toUpperCase()}
          </div>
          {section.content()}
        </div>
      </div>
    </>
  );
};

export default function App() {
  const [tab, setTab] = useState('planner');
  const [region, setRegion] = useState('Southern California');
  const [terrainId, setTerrainId] = useState('desert');
  const [sleepId, setSleepId] = useState(null);
  const [packType, setPackType] = useState('overnight');
  const [checked, setChecked] = useState({});
  const [savedTrails, setSavedTrails] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dm_saved_trails') || '{}'); } catch { return {}; }
  });
  const [jumpToSpot, setJumpToSpot] = useState(null);
  const goToMap = (sp) => { setJumpToSpot(sp); setTab('map'); };
  const [showSaved, setShowSaved] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const toggleSavedTrail = (key) => {
    setSavedTrails(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('dm_saved_trails', JSON.stringify(next));
      return next;
    });
  };
  const savedCount = Object.values(savedTrails).filter(Boolean).length;

  return (
    <div style={{ backgroundColor: T.nightCamp, minHeight: '100vh', color: T.text, fontFamily: 'Georgia, serif' }}>
      <style>{APP_STYLES}</style>

      {/* Left sidebar toggle tab */}
      <button
        type="button"
        onClick={() => setShowSidebar(true)}
        aria-label="Open info sidebar"
        style={{
          ...BUTTON_RESET,
          position: 'fixed', left: 0, top: '50%', transform: 'translateY(-50%)',
          zIndex: 1500,
          width: '22px',
          paddingTop: '32px', paddingBottom: '32px',
          background: T.leather,
          border: '1px solid ' + T.border,
          borderLeft: 'none',
          borderRadius: '0 8px 8px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '3px 0 12px rgba(0,0,0,0.4)',
          transition: 'background 150ms, border-color 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.leatherDark; e.currentTarget.style.borderColor = T.gold; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.leather; e.currentTarget.style.borderColor = T.border; }}
      >
        <span style={{
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          transform: 'rotate(180deg)',
          fontSize: '0.55rem', letterSpacing: '2.5px', color: T.muted,
          fontFamily: 'Georgia, serif', fontWeight: 'bold', userSelect: 'none',
        }}>INFO</span>
      </button>

      <div className="header-bar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 30px', borderBottom: '1px solid ' + T.border, background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
          <div className="brand" style={{ color: T.gold, fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px' }}>dirtmap</div>
          <div className="tagline" style={{ color: T.muted, fontSize: '0.8rem', fontStyle: 'italic' }}>California camping & trails</div>
        </div>
        <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }} aria-label="Main">
          {savedCount > 0 && (
            <button type="button" onClick={() => setShowSaved(true)}
              style={{ ...BUTTON_RESET, width: 'auto', color: T.star, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', paddingBottom: '2px', transition: 'opacity 150ms' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <span>♥</span>
              <span style={{ fontWeight: 'bold' }}>{savedCount}</span>
              <span style={{ color: T.muted }}>saved</span>
            </button>
          )}
          {[['planner','PLAN'],['map','MAP'],['pack','PACK'],['community','COMMUNITY']].map(([k,l]) => {
            const active = tab === k;
            return (
              <button key={k} type="button" onClick={() => setTab(k)}
                aria-current={active ? 'page' : undefined}
                style={{
                  ...BUTTON_RESET, paddingBottom: '6px',
                  color: active ? T.gold : T.muted,
                  fontWeight: 'bold', letterSpacing: '3px', fontSize: '0.8rem',
                  borderBottom: active ? '2px solid ' + T.gold : '2px solid transparent',
                  fontFamily: 'Georgia, serif', width: 'auto',
                }}>
                {l}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === 'map' ? (
        <MapTab spots={ALL_SPOTS_GLOBAL} savedTrails={savedTrails} onSaveTrail={toggleSavedTrail} jumpToSpot={jumpToSpot} />
      ) : (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 100px' }}>
          {tab === 'planner' && (
            <PlannerTab
              region={region} setRegion={setRegion}
              terrainId={terrainId} setTerrainId={setTerrainId}
              sleepId={sleepId} setSleepId={setSleepId}
              savedTrails={savedTrails} onSaveTrail={toggleSavedTrail}
              onGoToMap={goToMap}
            />
          )}
          {tab === 'pack' && (
            <PackTab
              checked={checked} setChecked={setChecked}
              packType={packType} setPackType={setPackType}
              sleepId={sleepId}
              onGoToPlan={() => setTab('planner')}
            />
          )}
          {tab === 'community' && <CommunityTab />}
        </div>
      )}

      <PackTracker checked={checked} packType={packType} onClick={() => setTab('pack')} />

      <InfoSidebar open={showSidebar} onClose={() => setShowSidebar(false)} />

      {showSaved && (
        <SavedDrawer
          savedTrails={savedTrails}
          onUnsave={toggleSavedTrail}
          onGoToMap={goToMap}
          onClose={() => setShowSaved(false)}
        />
      )}
    </div>
  );
}
