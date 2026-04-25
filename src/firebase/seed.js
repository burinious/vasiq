import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './db';

const predefinedGroups = [
  {
    id: 'csc-100l',
    name: 'CSC 100L',
    description: 'Freshers in Computer Science sharing updates, classes, and resources.',
    type: 'academic',
    audience: 'Freshers and class reps',
  },
  {
    id: 'csc-200l',
    name: 'CSC 200L',
    description: 'Second-year computer science students sharing class updates and resources.',
    type: 'academic',
    audience: '200L Computer Science',
  },
  {
    id: 'vasiq-tech',
    name: 'VASIQ Tech',
    description: 'A practical tech community for builders, designers, and campus innovators.',
    type: 'builders',
    audience: 'Builders, designers, and founders',
  },
  {
    id: 'final-year',
    name: 'Final Year',
    description: 'For project talks, deadlines, internship leads, and survival tips.',
    type: 'academic',
    audience: 'Final-year students',
  },
  {
    id: 'campus-media',
    name: 'Campus Media',
    description: 'For photographers, media teams, social coverage, and visual storytelling.',
    type: 'community',
    audience: 'Media teams and creators',
  },
  {
    id: 'hostel-gist',
    name: 'Hostel Gist',
    description: 'Room updates, hostel notices, and everyday student gist.',
    type: 'hostel',
    audience: 'Hostel residents and off-campus students',
  },
  {
    id: 'career-lab',
    name: 'Career Lab',
    description: 'Internships, CV reviews, portfolio feedback, and career growth conversations.',
    type: 'career',
    audience: 'Internships, CV reviews, and growth',
  },
  {
    id: 'study-circle',
    name: 'Study Circle',
    description: 'Revision groups, note sharing, and last-minute academic rescue.',
    type: 'academic',
    audience: 'Revision squads and note sharing',
  },
  {
    id: 'faith-and-life',
    name: 'Faith and Life',
    description: 'Fellowship updates, encouragement, and student life reflections.',
    type: 'community',
    audience: 'Fellowship and community life',
  },
];

const defaultAnnouncements = [
  {
    id: 'welcome-week',
    title: 'Campus pulse is live',
    message: 'Use VASIQ for the updates students actually need: class shifts, hostel notices, events, and opportunities.',
    tag: 'Announcement',
  },
  {
    id: 'project-defense',
    title: 'Final Year Alert',
    message: 'Project defense rehearsals start next week. Use the Final Year group to coordinate mock sessions, slides review, and deadline gist.',
    tag: 'Academic',
  },
  {
    id: 'tech-week',
    title: 'VASIQ Tech Week',
    message: 'Hack sessions, design critiques, founder chats, and build-night updates will be pinned here first.',
    tag: 'Event',
  },
];

const groupsSeedCacheKey = 'varsiq:bootstrap-groups-seeded:v1';
const announcementsSeedCacheKey = 'varsiq:bootstrap-announcements-seeded:v1';

export async function ensurePredefinedGroups({ includeAnnouncements = false } = {}) {
  const hasWindow = typeof window !== 'undefined';
  const groupsSeeded =
    hasWindow && window.localStorage.getItem(groupsSeedCacheKey) === 'done';
  const announcementsSeeded =
    hasWindow && window.localStorage.getItem(announcementsSeedCacheKey) === 'done';

  const batch = writeBatch(db);
  let wroteGroups = false;
  let wroteAnnouncements = false;

  if (!groupsSeeded) {
    predefinedGroups.forEach((group) => {
      batch.set(
        doc(db, 'groups', group.id),
        {
          ...group,
          members: [],
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
    wroteGroups = true;
  }

  if (includeAnnouncements && !announcementsSeeded) {
    defaultAnnouncements.forEach((announcement) => {
      batch.set(
        doc(db, 'announcements', announcement.id),
        {
          ...announcement,
          isActive: true,
          createdAt: serverTimestamp(),
        },
        { merge: true },
      );
    });
    wroteAnnouncements = true;
  }

  if (!wroteGroups && !wroteAnnouncements) {
    return;
  }

  await batch.commit();

  if (hasWindow) {
    if (wroteGroups) {
      window.localStorage.setItem(groupsSeedCacheKey, 'done');
    }

    if (wroteAnnouncements) {
      window.localStorage.setItem(announcementsSeedCacheKey, 'done');
    }
  }
}
