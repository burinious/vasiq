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
const seedEmailPrefix = 'vuser';

function getNumberFlag(name, fallbackValue) {
  const flag = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (!flag) return fallbackValue;

  const value = Number(flag.split('=')[1]);
  return Number.isFinite(value) ? value : fallbackValue;
}

const options = {
  accountsOnly: process.argv.includes('--accounts-only'),
  delayMs: Math.max(0, getNumberFlag('delay', 450)),
  from: Math.max(1, getNumberFlag('from', 1)),
  to: getNumberFlag('to', 50),
};

function pause(timeoutMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeoutMs);
  });
}

function logStep(message) {
  console.log(`[launch-seed] ${message}`);
}

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
  'Kehinde',
  'Taiwo',
  'Oreoluwa',
  'Damilare',
  'Anuoluwapo',
  'Ridwan',
  'Halimah',
  'Somto',
  'Nifemi',
  'Goodness',
  'Ebuka',
  'Zainab',
  'Mayowa',
  'Kamsi',
  'Teniola',
  'Seyi',
  'Ruth',
  'Ibrahim',
  'Adaora',
  'Moyosore',
  'Chiamaka',
  'Korede',
  'Hassan',
  'Bukola',
  'Uche',
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
  'Okafor',
  'Abubakar',
  'Eze',
  'Salami',
  'Nwachukwu',
  'Bello',
  'Adeyemi',
  'Okonkwo',
  'Ibrahim',
  'Oladipo',
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
  'Political Science',
  'English Studies',
  'Nursing Science',
  'Statistics',
  'Entrepreneurship',
];

const levels = ['100L', '200L', '300L', '400L', '500L'];
const residences = [
  'VASIQ Main Hostel',
  'Idera Lodge',
  'Eko Hall',
  'Babcock Road Annex',
  'Mowe Student Villa',
  'Off-campus at Ibafo',
  'Harmony Lodge',
  'Unity Hostel',
  'Heritage Villa',
  'Peace Estate',
];

const statuses = [
  'Looking for today\'s lecture update before I waste transport fare.',
  'Sharing notes and past questions for anyone on low data.',
  'Building a small campus project with friends this week.',
  'Need a serious study partner for night reading.',
  'Open to internship leads, gigs, and product design work.',
  'Tracking hostel water and light updates for my block.',
  'Looking for cheap food plugs around campus. Sapa is real.',
  'Preparing for test week and collecting useful materials.',
  'Available for media coverage, flyers, and event content.',
  'Trying to keep my department group organized and useful.',
];

const interests = [
  'frontend',
  'backend',
  'UI design',
  'cybersecurity',
  'campus media',
  'public speaking',
  'business strategy',
  'AI tools',
  'mobile apps',
  'finance',
  'photography',
  'study groups',
  'volunteering',
  'content creation',
  'career growth',
];

const demoUsers = Array.from({ length: 50 }, (_, index) => {
  const name = `${firstNames[index]} ${lastNames[index % lastNames.length]}`;
  const department = departments[index % departments.length];
  const level = levels[index % levels.length];
  const email = `${seedEmailPrefix}${String(index + 1).padStart(2, '0')}@vasiq.app`;
  const focus = [
    interests[index % interests.length],
    interests[(index + 5) % interests.length],
    interests[(index + 9) % interests.length],
  ];

  return {
  email,
  name,
  department,
  level,
  uid: '',
  avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=0f766e,0284c7,f59e0b`,
    residence: residences[index % residences.length],
    statusText: statuses[index % statuses.length],
    interests: focus,
    matricNo: `VASIQ/${String(2022 + (index % 4)).slice(2)}/${String(index + 1).padStart(4, '0')}`,
    about: `${name.split(' ')[0]} is a ${level} ${department} student using VASIQ for ${focus.join(', ')}, class signal, and campus collaboration.`,
    isDemoAccount: true,
  };
});

const selectedUsers = demoUsers.filter((_, index) => {
  const userNumber = index + 1;
  return userNumber >= options.from && userNumber <= options.to;
});

const groups = [
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

const postTemplates = [
  {
    content: 'Who is joining the VASIQ Tech build session tonight? I can bring UI references and a starter repo.',
    category: 'event',
    signalLevel: 'important',
  },
  {
    content: 'CSC revision circle is forming by 7pm. Drop your strongest topic and weakest topic.',
    category: 'academic',
    signalLevel: 'important',
  },
  {
    content: 'I found a clean project defense slide outline. I can share the PDF for anyone on low data.',
    category: 'materials',
    signalLevel: 'important',
  },
  {
    content: 'Campus media people, who is free to cover the next student founder showcase?',
    category: 'opportunity',
    signalLevel: 'important',
  },
  {
    content: 'Sapa check: food plug near the gate is doing cheaper rice packs this evening. Go early.',
    category: 'sapa',
    signalLevel: 'important',
  },
  {
    content: 'Hostel Gist update: please confirm water timing for your block so we can pin the right info.',
    category: 'hostel',
    signalLevel: 'urgent',
  },
  {
    content: 'Looking for teammates for a small attendance app. Frontend, backend, and product design welcome.',
    category: 'opportunity',
    signalLevel: 'general',
  },
  {
    content: 'Mass Comm students, I need two voices for a quick campus podcast pilot.',
    category: 'opportunity',
    signalLevel: 'general',
  },
  {
    content: 'Cybersecurity folks, let us do a beginner-friendly CTF practice this weekend.',
    category: 'event',
    signalLevel: 'important',
  },
  {
    content: 'Accounting and Economics students, who has the GST entrepreneurship assignment material?',
    category: 'materials',
    signalLevel: 'important',
  },
  {
    content: 'The feed is active tonight. Drop one useful update your department needs.',
    category: 'social',
    signalLevel: 'general',
  },
  {
    content: 'Study Circle idea: one hour focused reading, ten minutes recap, then share notes here.',
    category: 'academic',
    signalLevel: 'general',
  },
];

const campusActivityPrompts = [
  {
    category: 'academic',
    signalLevel: 'important',
    makeContent: (user) =>
      `${user.department} ${user.level}, lecturer just moved the class. Please confirm the new venue before people start trekking.`,
  },
  {
    category: 'materials',
    signalLevel: 'important',
    makeContent: (user) =>
      `${user.department} people, I have the latest PDF and two past questions. Reply if you need the low-data version.`,
  },
  {
    category: 'sapa',
    signalLevel: 'urgent',
    makeContent: (user) =>
      `${user.residence} sapa update: cheaper food plug is active till evening. No delivery fee if we order together.`,
  },
  {
    category: 'hostel',
    signalLevel: 'urgent',
    makeContent: (user) =>
      `${user.residence} people, please drop light and water updates here so nobody wastes movement.`,
  },
  {
    category: 'opportunity',
    signalLevel: 'important',
    makeContent: (user) =>
      `${user.department} students, I saw a remote gig/internship lead. Best for anyone with ${user.interests[0]} interest.`,
  },
  {
    category: 'event',
    signalLevel: 'general',
    makeContent: (user) =>
      `Small hangout after lectures for ${user.interests[1]} people. Come with one useful idea, no long talk.`,
  },
  {
    category: 'social',
    signalLevel: 'general',
    makeContent: (user) =>
      `${user.name.split(' ')[0]} reporting live from ${user.residence}: campus gist is moving faster than WiFi today.`,
  },
];

const generatedPostTemplates = Array.from({ length: 75 }, (_, index) => {
  const user = demoUsers[index % demoUsers.length];
  const prompt = campusActivityPrompts[index % campusActivityPrompts.length];

  return {
    content: prompt.makeContent(user),
    category: prompt.category,
    signalLevel: prompt.signalLevel,
  };
});

postTemplates.push(...generatedPostTemplates);

async function ensureUser(user) {
  await signOut(auth).catch(() => {});
  logStep(`Ensuring ${user.email}`);

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
    interests: user.interests,
    matricNo: user.matricNo,
    about: user.about,
    isDemoAccount: true,
    profileCompletedAt: new Date().toISOString(),
  };

  if (profileSnapshot.exists()) {
    await updateDoc(profileRef, profileData);
    await signOut(auth).catch(() => {});
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
  await signInDemo(0);
  const groupRef = doc(db, 'groups', group.id);

  await setDoc(
    groupRef,
    {
      name: group.name,
      description: group.description,
      type: group.type,
      audience: group.audience,
      members: [],
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
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

async function seedGroupMembers() {
  await signInDemo(0);

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const members = Array.from(
      { length: 18 },
      (_, memberOffset) => demoUsers[(groupIndex * 4 + memberOffset) % demoUsers.length].uid,
    ).filter(Boolean);

    if (!members.length) continue;

    await updateDoc(doc(db, 'groups', groups[groupIndex].id), {
      members: arrayUnion(...members),
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
      authorLevel: user.level,
      authorAvatar: user.avatarUrl,
      authorResidence: user.residence,
      content: postTemplates[index].content,
      imageUrl: '',
      mediaType: '',
      category: postTemplates[index].category,
      signalLevel: postTemplates[index].signalLevel,
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
    const likerUids = Array.from(
      { length: 4 + (index % 7) },
      (_, offset) => demoUsers[(index + offset + 3) % demoUsers.length].uid,
    ).filter(Boolean);

    await updateDoc(postRef, { likes: arrayUnion(...likerUids) });

    const postSnapshot = await getDoc(postRef);
    const comments = postSnapshot.data()?.comments || [];
    const seededComments = [];

    for (let commentOffset = 0; commentOffset < 2 + (index % 3); commentOffset += 1) {
      const commentId = `launch-comment-${index + 1}-${commentOffset + 1}`;
      const hasSeedComment = comments.some((comment) => comment.id === commentId);
      if (hasSeedComment) continue;

      const commenterIndex = (index + commentOffset + 5) % demoUsers.length;
      const commenter = await signInDemo(commenterIndex);
      const replier = demoUsers[(index + commentOffset + 9) % demoUsers.length];
      seededComments.push({
        id: commentId,
        userId: commenter.uid,
        userName: commenter.name,
        text: [
          'This is useful. I am following this thread.',
          'Drop exact time and venue abeg.',
          'Can someone pin this before it disappears?',
          'I have related material. I can share the small PDF version.',
          'Sapa-friendly update. This one helps.',
          'I am in. Add me if there is a group for it.',
        ][(index + commentOffset) % 6],
        likes: likerUids.slice(0, 2),
        replies: [
          {
            id: `launch-reply-${index + 1}-${commentOffset + 1}`,
            userId: replier.uid,
            userName: replier.name,
            text: [
              'Seen. I will confirm and update here.',
              'I can send it after class.',
              'Let us keep this thread active.',
            ][commentOffset % 3],
            likes: likerUids.slice(2, 4),
            createdAt: new Date(Date.now() - (index + commentOffset) * 120000).toISOString(),
          },
        ],
        createdAt: new Date(Date.now() - (index + commentOffset) * 180000).toISOString(),
      });
    }

    if (seededComments.length) {
      await updateDoc(postRef, {
        comments: [...comments, ...seededComments],
        shareCount: 1 + (index % 8),
      });
    }
  }
}

async function seedGroupMessages() {
  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const groupId = groups[groupIndex].id;
    for (let messageIndex = 0; messageIndex < 8; messageIndex += 1) {
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
          'Who has the small-size PDF? My data is almost gone.',
          'Class rep should confirm this before people start moving.',
          'Drop opportunities here early, not after deadline.',
          'Sapa check: who knows the cheaper food spot today?',
          'I can summarize the long material into bullet points tonight.',
        ][messageIndex % 8],
        clientMessageId: `launch-${groupId}-${messageIndex + 1}`,
        createdAt: serverTimestamp(),
      });
    }
  }
}

async function seedDirectMessages() {
  const pairs = Array.from({ length: 25 }, (_, index) => [index, (index + 17) % demoUsers.length]);

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

    for (let messageIndex = 0; messageIndex < 3; messageIndex += 1) {
      const sender = messageIndex % 2 === 0 ? first : second;
      const existing = await getDocs(
        query(
          collection(db, 'messages', chatId, 'messages'),
          where(
            'clientMessageId',
            '==',
            `launch-dm-${firstIndex}-${secondIndex}-${messageIndex + 1}`,
          ),
        ),
      );

      if (!existing.empty) continue;

      await addDoc(collection(db, 'messages', chatId, 'messages'), {
        senderId: sender.uid,
        senderName: sender.name,
        text: [
          'I saw your post on VASIQ. Let us connect on it.',
          'No wahala. Send the material here when you can.',
          'Done. I will update the group if the venue changes.',
        ][messageIndex],
        clientMessageId: `launch-dm-${firstIndex}-${secondIndex}-${messageIndex + 1}`,
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
  logStep(
    `Starting ${options.accountsOnly ? 'account-only' : 'full'} seed for demo${String(options.from).padStart(2, '0')} to demo${String(options.to).padStart(2, '0')}.`,
  );

  for (const user of selectedUsers) {
    await ensureUser(user);
    if (options.delayMs) {
      await pause(options.delayMs);
    }
  }

  if (options.accountsOnly) {
    logStep('Selected demo accounts ensured.');
    console.table(selectedUsers.map((user) => ({ email: user.email, password, name: user.name })));
    await signOut(auth).catch(() => {});
    await deleteApp(app).catch(() => {});
    process.exit(0);
  }

  for (const group of groups) {
    await ensureGroup(group);
  }

  await seedGroupMembers();

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
