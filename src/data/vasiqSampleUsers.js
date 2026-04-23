import { generateSeededPortrait } from '../utils/seededPortraits';

const firstNames = [
  'Adebayo',
  'Mariam',
  'Ifeoluwa',
  'Chidera',
  'Daniel',
  'Precious',
  'Tolulope',
  'Favour',
  'Emmanuel',
  'Deborah',
  'Ayomide',
  'Esther',
  'Olamide',
  'Victory',
  'Samuel',
  'Peace',
  'David',
  'Mercy',
  'Tobiloba',
  'Blessing',
  'Opeyemi',
  'Joy',
  'Daniela',
  'Kingsley',
  'Temitope',
];

const lastNames = [
  'Akinyemi',
  'Ogunleye',
  'Adewale',
  'Balogun',
  'Ojo',
  'Afolabi',
  'Olatunji',
  'Adewoyin',
  'Akinola',
  'Owolabi',
];

const departments = [
  'Computer Science',
  'Software Engineering',
  'Cyber Security',
  'Mass Communication',
  'Economics',
  'Accounting',
  'Business Administration',
  'Microbiology',
  'Public Administration',
  'Biochemistry',
];

const levels = ['100L', '200L', '300L', '400L'];
const residences = [
  'VASIQ Main Hostel',
  'Idera Lodge',
  'Babcock Road Annex',
  'Mowe Student Villa',
  'Eko Hall',
  'Off-campus at Ibafo',
];

const statusTexts = [
  'Heading to CSC 214 practical in 20 minutes.',
  'Looking for two teammates for the entrepreneurship challenge.',
  'Sharing GST 111 notes tonight.',
  'Preparing for project defense week.',
  'At the innovation hub building a mini attendance app.',
  'Need a serious study partner for Data Structures.',
  'Photography club walk this evening.',
  'Just dropped a clean UI prototype for the faculty portal.',
  'Hosting a revision circle after chapel.',
  'Open to internship leads and product design gigs.',
];

const interests = [
  'frontend',
  'backend',
  'product design',
  'cybersecurity',
  'public speaking',
  'campus media',
  'community building',
  'AI tools',
  'mobile apps',
  'business strategy',
];

function buildName(index) {
  return `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`;
}

export const vasiqSampleUsers = Array.from({ length: 50 }, (_, index) => {
  const name = buildName(index);
  const department = departments[index % departments.length];
  const level = levels[index % levels.length];
  const residence = residences[index % residences.length];
  const statusText = statusTexts[index % statusTexts.length];
  const email = `${name.toLowerCase().replace(/\s+/g, '.')}${index + 1}@students.vasiq.app`;
  const focus = interests.slice(index % interests.length, (index % interests.length) + 3);

  return {
    id: `vasiq-sample-${String(index + 1).padStart(3, '0')}`,
    name,
    email,
    department,
    level,
    avatarUrl: generateSeededPortrait(index),
    role: 'student',
    residence,
    interests: focus.length ? focus : interests.slice(0, 3),
    statusText,
    about: `${name.split(' ')[0]} is a ${level} ${department} student on VASIQ focused on ${focus[0] || 'community work'} and campus collaboration.`,
    isSeededProfile: true,
  };
});
