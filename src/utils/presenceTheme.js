import { getUserDisplayName } from './userIdentity';

const gradients = [
  ['#0f766e', '#0891b2'],
  ['#f59e0b', '#ea580c'],
  ['#2563eb', '#7c3aed'],
  ['#ec4899', '#f97316'],
  ['#16a34a', '#0ea5e9'],
  ['#7c2d12', '#dc2626'],
];

const interestEmojiMap = {
  frontend: '✨',
  backend: '🧠',
  'product design': '🎨',
  cybersecurity: '🛡️',
  'public speaking': '🎤',
  'campus media': '📸',
  'community building': '🤝',
  'AI tools': '⚙️',
  'mobile apps': '📱',
  'business strategy': '📈',
};

function getSeedIndex(seed) {
  return [...(seed || 'varsiq')]
    .reduce((total, char) => total + char.charCodeAt(0), 0) % gradients.length;
}

export function getPresenceTheme(user) {
  const seedIndex = getSeedIndex(getUserDisplayName(user, user?.email || user?.id));
  const [start, end] = gradients[seedIndex];
  const primaryInterest = user?.interests?.[0];

  return {
    emoji: interestEmojiMap[primaryInterest] || '🌿',
    avatarStyle: {
      background: `linear-gradient(135deg, ${start}, ${end})`,
    },
    cardStyle: {
      background: `linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.82)), linear-gradient(135deg, ${start}22, ${end}18)`,
      borderColor: `${start}33`,
    },
    accentStyle: {
      background: `linear-gradient(135deg, ${start}, ${end})`,
    },
  };
}
