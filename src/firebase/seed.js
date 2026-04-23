import { doc, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './config';

const predefinedGroups = [
  {
    id: 'csc-100l',
    name: 'CSC 100L',
    description: 'Freshers in Computer Science sharing updates, classes, and resources.',
  },
  {
    id: 'csc-200l',
    name: 'CSC 200L',
    description: 'Second-year computer science students sharing class updates and resources.',
  },
  {
    id: 'vasiq-tech',
    name: 'VASIQ Tech',
    description: 'A practical tech community for builders, designers, and campus innovators.',
  },
  {
    id: 'final-year',
    name: 'Final Year',
    description: 'For project talks, deadlines, internship leads, and survival tips.',
  },
  {
    id: 'campus-media',
    name: 'Campus Media',
    description: 'For photographers, media teams, social coverage, and visual storytelling.',
  },
  {
    id: 'hostel-gist',
    name: 'Hostel Gist',
    description: 'Room updates, hostel notices, and everyday student gist.',
  },
  {
    id: 'career-lab',
    name: 'Career Lab',
    description: 'Internships, CV reviews, portfolio feedback, and career growth conversations.',
  },
  {
    id: 'study-circle',
    name: 'Study Circle',
    description: 'Revision groups, note sharing, and last-minute academic rescue.',
  },
  {
    id: 'faith-and-life',
    name: 'Faith and Life',
    description: 'Fellowship updates, encouragement, and student life reflections.',
  },
];

const defaultAnnouncements = [
  {
    id: 'welcome-week',
    title: 'Welcome to varsiq',
    message: 'Freshers and returning students can now join VASIQ communities, share updates, and message classmates in one space.',
    tag: 'Announcement',
  },
  {
    id: 'project-defense',
    title: 'Final Year Alert',
    message: 'Project defense rehearsals start next week. Use the Final Year group to coordinate mock sessions and slides review.',
    tag: 'Academic',
  },
  {
    id: 'tech-week',
    title: 'VASIQ Tech Week',
    message: 'Hack sessions, design critiques, and founder chats will be pinned here by campus admins.',
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
