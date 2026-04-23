const backgrounds = [
  ['#fff1db', '#ffd6a5'],
  ['#e0f2fe', '#bae6fd'],
  ['#ecfccb', '#d9f99d'],
  ['#fce7f3', '#f9a8d4'],
  ['#ede9fe', '#c4b5fd'],
  ['#ffe4e6', '#fecdd3'],
];

const skinTones = ['#f2c7a2', '#e7b98f', '#d89e73', '#b97850', '#8b5a3c'];
const hairColors = ['#1f1b16', '#31241d', '#4b2e23', '#5b4636', '#231815'];
const shirtColors = ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#be123c', '#0f172a'];

function dataUri(svg) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function pick(list, index, offset = 0) {
  return list[(index + offset) % list.length];
}

function hairShape(index, color) {
  const variant = index % 6;

  const shapes = [
    `<path d="M70 72c4-28 28-46 58-46s52 17 60 46v16H70z" fill="${color}"/>`,
    `<path d="M67 78c6-32 31-50 61-50 27 0 50 13 60 40l4 20H67z" fill="${color}"/>`,
    `<path d="M69 78c2-29 25-49 58-49 34 0 56 18 62 49-9-5-19-8-28-8H97c-10 0-20 3-28 8z" fill="${color}"/>`,
    `<path d="M72 76c3-30 29-48 58-48 31 0 55 20 58 48-8-8-17-12-29-12h-58c-11 0-21 4-29 12z" fill="${color}"/>`,
    `<path d="M68 82c8-34 33-53 63-53 31 0 53 15 59 43l3 18H68z" fill="${color}"/>`,
    `<path d="M66 82c6-28 22-45 43-50 9-2 18-3 27-1 24 4 43 20 51 51l-16-10H85z" fill="${color}"/>`,
  ];

  return shapes[variant];
}

function accessory(index) {
  if (index % 4 !== 0) return '';

  return `
    <rect x="92" y="102" width="18" height="12" rx="5" fill="none" stroke="#2b2b2b" stroke-width="3"/>
    <rect x="126" y="102" width="18" height="12" rx="5" fill="none" stroke="#2b2b2b" stroke-width="3"/>
    <path d="M110 108h16" stroke="#2b2b2b" stroke-width="3" stroke-linecap="round"/>
  `;
}

export function generateSeededPortrait(index) {
  const [bgTop, bgBottom] = pick(backgrounds, index);
  const skin = pick(skinTones, index);
  const hair = pick(hairColors, index, 2);
  const shirt = pick(shirtColors, index, 1);
  const neck = pick(skinTones, index, 1);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256" fill="none">
      <defs>
        <linearGradient id="bg" x1="30" y1="20" x2="220" y2="230" gradientUnits="userSpaceOnUse">
          <stop stop-color="${bgTop}"/>
          <stop offset="1" stop-color="${bgBottom}"/>
        </linearGradient>
        <linearGradient id="shirt" x1="82" y1="150" x2="180" y2="228" gradientUnits="userSpaceOnUse">
          <stop stop-color="${shirt}"/>
          <stop offset="1" stop-color="#ffffff22"/>
        </linearGradient>
      </defs>

      <rect width="256" height="256" rx="44" fill="url(#bg)"/>
      <circle cx="205" cy="53" r="26" fill="#ffffff66"/>
      <path d="M32 205c14-33 45-53 94-59 53 7 84 24 98 59v26H32z" fill="url(#shirt)"/>
      <rect x="116" y="142" width="24" height="30" rx="12" fill="${neck}"/>
      <ellipse cx="128" cy="109" rx="46" ry="54" fill="${skin}"/>
      ${hairShape(index, hair)}
      <path d="M88 158c11-13 26-20 40-20 17 0 31 8 40 20" fill="none" stroke="#ffffff33" stroke-width="8" stroke-linecap="round"/>
      <circle cx="110" cy="109" r="4.8" fill="#1f2937"/>
      <circle cx="146" cy="109" r="4.8" fill="#1f2937"/>
      <path d="M120 122c2 4 2 8 0 12" stroke="#8b5a3c" stroke-width="3" stroke-linecap="round"/>
      <path d="M110 131c5 5 21 5 28 0" stroke="#7c3a2a" stroke-width="3.2" stroke-linecap="round"/>
      ${accessory(index)}
    </svg>
  `;

  return dataUri(svg);
}
