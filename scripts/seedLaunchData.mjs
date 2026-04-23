import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function loadEnv() {
  const envPath = path.join(projectRoot, '.env');
  const content = fs.readFileSync(envPath, 'utf8');

  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex);
    const value = trimmed.slice(separatorIndex + 1);
    process.env[key] = value;
  });
}

loadEnv();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig, `launch-seed-${Date.now()}`);
const auth = getAuth(app);
const db = getFirestore(app);
const password = 'VasiqDemo#2026';

const demoUsers = [
  ['demo01@vasiq.app', 'Adebayo Akinyemi', 'Computer Science', '300L'],
  ['demo02@vasiq.app', 'Mariam Ogunleye', 'Software Engineering', '200L'],
  ['demo03@vasiq.app', 'Ifeoluwa Adewale', 'Cyber Security', '400L'],
  ['demo04@vasiq.app', 'Chidera Balogun', 'Mass Communication', '100L'],
  ['demo05@vasiq.app', 'Daniel Ojo', 'Economics', '300L'],
  ['demo06@vasiq.app', 'Precious Afolabi', 'Accounting', '200L'],
  ['demo07@vasiq.app', 'Tolulope Olatunji', 'Business Administration', '400L'],
  ['demo08@vasiq.app', 'Favour Adewoyin', 'Microbiology', '100L'],
  ['demo09@vasiq.app', 'Emmanuel Akinola', 'Public Administration', '300L'],
  ['demo10@vasiq.app', 'Deborah Owolabi', 'Biochemistry', '200L'],
  ['demo11@vasiq.app', 'Ayomide Akinyemi', 'Computer Science', '100L'],
  ['demo12@vasiq.app', 'Esther Ogunleye', 'Software Engineering', '400L'],
  ['demo13@vasiq.app', 'Olamide Adewale', 'Cyber Security', '200L'],
  ['demo14@vasiq.app', 'Victory Balogun', 'Mass Communication', '300L'],
  ['demo15@vasiq.app', 'Samuel Ojo', 'Economics', '100L'],
  ['demo16@vasiq.app', 'Peace Afolabi', 'Accounting', '400L'],
  ['demo17@vasiq.app', 'David Olatunji', 'Business Administration', '200L'],
  ['demo18@vasiq.app', 'Mercy Adewoyin', 'Microbiology', '300L'],
  ['demo19@vasiq.app', 'Tobiloba Akinola', 'Public Administration', '100L'],
  ['demo20@vasiq.app', 'Blessing Owolabi', 'Biochemistry', '400L'],
].map(([email, name, department, level], index) => ({
  email,
  name,
  department,
  level,
  uid: '',
  avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f766e,0284c7,f59e0b`,
  residence: ['VASIQ Main Hostel', 'Idera Lodge', 'Eko Hall', 'Off-campus'][index % 4],
  statusText: [
    'Looking for a serious study partner this week.',
    'Sharing class notes and useful links today.',
    'Building a small campus project with friends.',
    'Open to group work, events, and project ideas.',
  ][index % 4],
}));

const groups = [
  ['csc-100l', 'CSC 100L', 'Freshers in Computer Science sharing updates, classes, and resources.'],
  ['csc-200l', 'CSC 200L', 'Second-year computer science students sharing class updates and resources.'],
  ['vasiq-tech', 'VASIQ Tech', 'A practical tech community for builders, designers, and campus innovators.'],
  ['final-year', 'Final Year', 'For project talks, deadlines, internship leads, and survival tips.'],
  ['campus-media', 'Campus Media', 'For photographers, media teams, social coverage, and visual storytelling.'],
  ['hostel-gist', 'Hostel Gist', 'Room updates, hostel notices, and everyday student gist.'],
  ['career-lab', 'Career Lab', 'Internships, CV reviews, portfolio feedback, and career growth conversations.'],
  ['study-circle', 'Study Circle', 'Revision groups, note sharing, and last-minute academic rescue.'],
  ['faith-and-life', 'Faith and Life', 'Fellowship updates, encouragement, and student life reflections.'],
];

const postTemplates = [
  'Who is joining the VASIQ Tech build session tonight? I can bring UI references and a starter repo.',
  'CSC revision circle is forming by 7pm. Drop your strongest topic and weakest topic.',
  'I found a clean way to organize project defense slides. I can share the outline if anyone needs it.',
  'Campus media people, who is free to cover the next student founder showcase?',
  'Career Lab check-in: CV reviews are better when we pair by department. Who wants in?',
  'Hostel Gist update: please confirm water timing for your block so we can pin the right info.',
  'Looking for teammates for a small attendance app. Frontend, backend, and product design welcome.',
  'Mass Comm students, I need two voices for a quick campus podcast pilot.',
  'Cybersecurity folks, let us do a beginner-friendly CTF practice this weekend.',
  'Accounting and Economics students, who can explain the GST entrepreneurship assignment clearly?',
  'The feed is active tonight. Drop one useful update your department needs.',
  'Study Circle idea: one hour focused reading, ten minutes recap, then share notes here.',
];

async function ensureUser(user) {
  await signOut(auth).catch(() => {});

  try {
    const credential = await createUserWithEmailAndPassword(auth, user.email, password);
    user.uid = credential.user.uid;
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') {
      throw error;
    }

    const credential = await signInWithEmailAndPassword(auth, user.email, password);
    user.uid = credential.user.uid;
  }

  const profileRef = doc(db, 'users', user.uid);
  const profileSnapshot = await getDoc(profileRef);
  const profileData = {
    name: user.name,
    displayName: user.name,
    fullName: user.name,
    email: user.email,
    department: user.department,
    level: user.level,
    avatarUrl: user.avatarUrl,
    role: 'member',
    showDepartment: true,
    showLevel: true,
    residence: user.residence,
    statusText: user.statusText,
    about: `${user.name.split(' ')[0]} is a ${user.level} ${user.department} student using VASIQ for useful campus collaboration.`,
    isDemoAccount: true,
  };

  if (profileSnapshot.exists()) {
    await updateDoc(profileRef, profileData);
    return;
  }

  await setDoc(profileRef, {
    ...profileData,
    createdAt: serverTimestamp(),
  });

  await signOut(auth).catch(() => {});
}

async function signInDemo(index) {
  await signOut(auth).catch(() => {});
  await signInWithEmailAndPassword(auth, demoUsers[index].email, password);
  return demoUsers[index];
}

async function ensureGroup(group) {
  const [id, name, description] = group;
  await signInDemo(0);
  const groupRef = doc(db, 'groups', id);
  const groupSnapshot = await getDoc(groupRef);

  if (!groupSnapshot.exists()) {
    await setDoc(groupRef, {
      name,
      description,
      members: [],
      createdAt: serverTimestamp(),
    });
  }
}

async function joinGroup(groupId, userIndex) {
  const user = await signInDemo(userIndex);
  const groupRef = doc(db, 'groups', groupId);
  const groupSnapshot = await getDoc(groupRef);
  const members = groupSnapshot.data()?.members || [];

  if (!members.includes(user.uid)) {
    await updateDoc(groupRef, {
      members: arrayUnion(user.uid),
    });
  }
}

async function seedPosts() {
  const postRefs = [];

  for (let index = 0; index < postTemplates.length; index += 1) {
    const user = await signInDemo(index % demoUsers.length);
    const existing = await getDocs(
      query(collection(db, 'posts'), where('clientPostId', '==', `launch-post-${index + 1}`)),
    );

    if (!existing.empty) {
      postRefs.push(existing.docs[0].ref);
      continue;
    }

    const postRef = await addDoc(collection(db, 'posts'), {
      userId: user.uid,
      authorName: user.name,
      authorDepartment: user.department,
      authorAvatar: user.avatarUrl,
      content: postTemplates[index],
      imageUrl: '',
      mediaType: '',
      clientPostId: `launch-post-${index + 1}`,
      likes: [],
      comments: [],
      shareCount: 0,
      createdAt: serverTimestamp(),
    });
    postRefs.push(postRef);
  }

  for (let index = 0; index < postRefs.length; index += 1) {
    const postRef = postRefs[index];
    const liker = await signInDemo((index + 3) % demoUsers.length);
    await updateDoc(postRef, { likes: arrayUnion(liker.uid) });

    const commenter = await signInDemo((index + 5) % demoUsers.length);
    const postSnapshot = await getDoc(postRef);
    const comments = postSnapshot.data()?.comments || [];
    const hasSeedComment = comments.some((comment) => comment.id === `launch-comment-${index + 1}`);

    if (!hasSeedComment) {
      await updateDoc(postRef, {
        comments: [
          ...comments,
          {
            id: `launch-comment-${index + 1}`,
            userId: commenter.uid,
            userName: commenter.name,
            text: [
              'This is useful. I am following this thread.',
              'Drop the time and venue, I can join.',
              'This is the kind of update students need here.',
              'I can help with this if you need one more person.',
            ][index % 4],
            likes: [],
            replies: [],
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
  }
}

async function seedGroupMessages() {
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const groupId = groups[groupIndex][0];
    for (let messageIndex = 0; messageIndex < 3; messageIndex += 1) {
      const user = await signInDemo((groupIndex + messageIndex) % demoUsers.length);
      const existing = await getDocs(
        query(
          collection(db, 'groups', groupId, 'messages'),
          where('clientMessageId', '==', `launch-${groupId}-${messageIndex + 1}`),
        ),
      );

      if (!existing.empty) continue;

      await addDoc(collection(db, 'groups', groupId, 'messages'), {
        senderId: user.uid,
        senderName: user.name,
        text: [
          'Let us keep this group useful and update-driven.',
          'I am around if anyone needs notes or quick support.',
          'Please pin the important update once admin confirms it.',
        ][messageIndex],
        clientMessageId: `launch-${groupId}-${messageIndex + 1}`,
        createdAt: serverTimestamp(),
      });
    }
  }
}

async function seedDirectMessages() {
  const pairs = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [8, 9],
  ];

  for (const [firstIndex, secondIndex] of pairs) {
    const first = await signInDemo(firstIndex);
    const second = demoUsers[secondIndex];
    const chatId = [first.uid, second.uid].sort().join('_');

    await setDoc(
      doc(db, 'messages', chatId),
      {
        participants: [first.uid, second.uid].sort(),
        updatedAt: serverTimestamp(),
        lastMessage: 'I saw your post on VASIQ. Let us connect on it.',
        lastMessageSenderId: first.uid,
      },
      { merge: true },
    );

    const existing = await getDocs(
      query(
        collection(db, 'messages', chatId, 'messages'),
        where('clientMessageId', '==', `launch-dm-${firstIndex}-${secondIndex}`),
      ),
    );

    if (existing.empty) {
      await addDoc(collection(db, 'messages', chatId, 'messages'), {
        senderId: first.uid,
        senderName: first.name,
        text: 'I saw your post on VASIQ. Let us connect on it.',
        clientMessageId: `launch-dm-${firstIndex}-${secondIndex}`,
        status: 'sent',
        createdAt: serverTimestamp(),
      });
    }
  }
}

async function seedGroupRequests() {
  const requests = [
    ['Product Builders', 'A focused group for students shipping products and MVPs.'],
    ['Night Readers', 'A quiet accountability space for late-night study sessions.'],
  ];

  for (let index = 0; index < requests.length; index += 1) {
    const requester = await signInDemo(14 + index);
    const [name, description] = requests[index];
    const existing = await getDocs(
      query(collection(db, 'groupRequests'), where('name', '==', name)),
    );

    if (!existing.empty) continue;

    await addDoc(collection(db, 'groupRequests'), {
      name,
      description,
      requesterId: requester.uid,
      requesterName: requester.name,
      requesterEmail: requester.email,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  }
}

async function main() {
  for (const user of demoUsers) {
    await ensureUser(user);
  }

  for (const group of groups) {
    await ensureGroup(group);
  }

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    for (let memberOffset = 0; memberOffset < 9; memberOffset += 1) {
      await joinGroup(groups[groupIndex][0], (groupIndex + memberOffset) % demoUsers.length);
    }
  }

  await seedPosts();
  await seedGroupMessages();
  await seedDirectMessages();
  await seedGroupRequests();

  console.log('VASIQ launch demo data seeded.');
  console.table(demoUsers.map((user) => ({ email: user.email, password, name: user.name })));
  await signOut(auth).catch(() => {});
  await deleteApp(app).catch(() => {});
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
