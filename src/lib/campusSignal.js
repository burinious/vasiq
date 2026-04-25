export const POST_CATEGORIES = [
  {
    value: 'academic',
    label: 'Classes',
    shortLabel: 'Classes',
    description: 'Lectures, tests, deadlines, and department updates.',
  },
  {
    value: 'materials',
    label: 'Materials',
    shortLabel: 'Materials',
    description: 'PDFs, notes, past questions, slides, and study links.',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    shortLabel: 'Urgent',
    description: 'Time-sensitive notices students should not miss.',
  },
  {
    value: 'event',
    label: 'Event',
    shortLabel: 'Event',
    description: 'Events, meetups, fellowships, and campus hangouts.',
  },
  {
    value: 'opportunity',
    label: 'Opportunity',
    shortLabel: 'Jobs',
    description: 'Internships, gigs, grants, auditions, and openings.',
  },
  {
    value: 'sapa',
    label: 'Sapa help',
    shortLabel: 'Sapa',
    description: 'Discounts, urgent needs, cheap food, transport, and survival tips.',
  },
  {
    value: 'hostel',
    label: 'Hostel',
    shortLabel: 'Hostel',
    description: 'Hostel gist, water, power, transport, and daily logistics.',
  },
  {
    value: 'social',
    label: 'Gist',
    shortLabel: 'Gist',
    description: 'Campus moments, memes, wins, and social energy.',
  },
];

export const SIGNAL_LEVELS = [
  {
    value: 'general',
    label: 'General',
  },
  {
    value: 'important',
    label: 'Important',
  },
  {
    value: 'urgent',
    label: 'Urgent',
  },
];

export const GROUP_TYPES = [
  {
    value: 'academic',
    label: 'Academic',
    description: 'Departments, classes, notes, revision, and coursework.',
  },
  {
    value: 'hostel',
    label: 'Hostel',
    description: 'Daily hostel life, logistics, and notices.',
  },
  {
    value: 'career',
    label: 'Career',
    description: 'Internships, portfolio reviews, and opportunities.',
  },
  {
    value: 'builders',
    label: 'Builders',
    description: 'Tech, design, products, and creative collaboration.',
  },
  {
    value: 'community',
    label: 'Community',
    description: 'Shared identity, fellowship, media, and student life.',
  },
];

export function getPostCategoryMeta(category) {
  return POST_CATEGORIES.find((item) => item.value === category) || POST_CATEGORIES[0];
}

export function getSignalLevelMeta(level) {
  return SIGNAL_LEVELS.find((item) => item.value === level) || SIGNAL_LEVELS[0];
}

export function getGroupTypeMeta(type) {
  return GROUP_TYPES.find((item) => item.value === type) || GROUP_TYPES[4];
}
