import {
  addDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  collection,
  doc,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';

const demoGroups = [
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

const demoAnnouncements = [
  {
    id: 'demo-orientation',
    title: 'Orientation week updates',
    tag: 'Academic',
    message: 'Faculty coordinators will drop venue and timing updates here first.',
  },
  {
    id: 'demo-tech-night',
    title: 'VASIQ Tech build night',
    tag: 'Event',
    message: 'Product builders and frontend students are gathering tonight at the innovation hub.',
  },
  {
    id: 'demo-hostel',
    title: 'Hostel water schedule',
    tag: 'Hostel',
    message: 'Updated hostel maintenance timing is available in the Hostel Gist group.',
  },
  {
    id: 'demo-career',
    title: 'Internship CV clinic',
    tag: 'Career',
    message: 'Career Lab mentors are reviewing student CVs this Friday afternoon.',
  },
];

const demoPostOpeners = [
  'Anybody else heading to',
  'Just wrapped up',
  'Sharing a quick update from',
  'Who wants to join me for',
  'Lowkey proud of this',
  'Need help with',
  'Today on campus felt like',
  'Opening this thread for',
];

const demoPostClosers = [
  'Let me know if you are in.',
  'Drop tips if you have done this before.',
  'If you are around, let’s connect.',
  'This actually came out better than expected.',
  'I can share notes later tonight.',
  'Would love to hear what others think.',
];

const demoGroupMessages = [
  'Who is around for a quick revision session later?',
  'Dropping this here so everyone can stay updated.',
  'If you need the resource pack, I can resend it tonight.',
  'Let’s use this group to keep the planning tight.',
];

function getDemoDate(offsetHours) {
  return new Date(Date.now() - offsetHours * 60 * 60 * 1000);
}

export function getEmailDocId(email) {
  return email.trim().toLowerCase();
}

export async function assertEmailNotDeleted(email) {
  const deletedAccountSnapshot = await getDoc(doc(db, 'deletedAccounts', getEmailDocId(email)));

  if (deletedAccountSnapshot.exists()) {
    const error = new Error(
      'This login has been permanently deleted and cannot be used again on VASIQ.',
    );
    error.code = 'auth/account-permanently-deleted';
    throw error;
  }
}

export async function createUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export function listenToUserProfile(userId, callback, onError) {
  return onSnapshot(
    doc(db, 'users', userId),
    (snapshot) => {
      callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
    },
    onError,
  );
}

export async function updateUserProfile(userId, updates) {
  await setDoc(doc(db, 'users', userId), updates, { merge: true });
}

export async function markAccountDeleted(userId, email) {
  const normalizedEmail = getEmailDocId(email);
  const batch = writeBatch(db);

  batch.set(doc(db, 'deletedAccounts', normalizedEmail), {
    email: normalizedEmail,
    userId,
    deletedAt: serverTimestamp(),
  });
  batch.set(
    doc(db, 'users', userId),
    {
      accountDeleted: true,
      deletedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

export async function blockUser(userId, blockedUserId) {
  await updateDoc(doc(db, 'users', userId), {
    blockedUserIds: arrayUnion(blockedUserId),
  });
}

export async function unblockUser(userId, blockedUserId) {
  await updateDoc(doc(db, 'users', userId), {
    blockedUserIds: arrayRemove(blockedUserId),
  });
}

export function listenToUsers(callback) {
  const usersQuery = query(collection(db, 'users'), orderBy('name'));
  return onSnapshot(usersQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((user) => user.accountDeleted !== true),
    );
  });
}

export function listenToAnnouncements(callback) {
  const announcementsQuery = query(
    collection(db, 'announcements'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(announcementsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export function listenToGroups(callback) {
  const groupsQuery = query(collection(db, 'groups'), orderBy('name'));
  return onSnapshot(groupsQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((group) => group.status !== 'pending' && group.status !== 'declined'),
    );
  });
}

export async function createGroup(group) {
  await addDoc(collection(db, 'groups'), {
    ...group,
    members: [],
    status: 'approved',
    createdAt: serverTimestamp(),
  });
}

export async function requestGroupCreation(request) {
  await addDoc(collection(db, 'groupRequests'), {
    ...request,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export function listenToGroupRequests(callback) {
  const requestsQuery = query(collection(db, 'groupRequests'), orderBy('createdAt', 'desc'));
  return onSnapshot(requestsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function approveGroupRequest(requestId, request, reviewer) {
  const batch = writeBatch(db);
  const groupRef = doc(collection(db, 'groups'));
  const requestRef = doc(db, 'groupRequests', requestId);

  batch.set(groupRef, {
    name: request.name,
    description: request.description,
    members: request.requesterId ? [request.requesterId] : [],
    status: 'approved',
    sourceRequestId: requestId,
    createdBy: request.requesterId || '',
    createdAt: serverTimestamp(),
  });
  batch.update(requestRef, {
    status: 'approved',
    reviewedAt: serverTimestamp(),
    reviewerId: reviewer.uid,
    reviewerEmail: reviewer.email,
    approvedGroupId: groupRef.id,
  });

  await batch.commit();
}

export async function declineGroupRequest(requestId, reviewer) {
  await updateDoc(doc(db, 'groupRequests', requestId), {
    status: 'declined',
    reviewedAt: serverTimestamp(),
    reviewerId: reviewer.uid,
    reviewerEmail: reviewer.email,
  });
}

export async function toggleGroupMembership(groupId, userId, isMember) {
  await updateDoc(doc(db, 'groups', groupId), {
    members: isMember ? arrayRemove(userId) : arrayUnion(userId),
  });
}

export async function removeGroupMember(groupId, userId) {
  await updateDoc(doc(db, 'groups', groupId), {
    members: arrayRemove(userId),
  });
}

export async function createAnnouncement(announcement) {
  await addDoc(collection(db, 'announcements'), {
    ...announcement,
    isActive: true,
    createdAt: serverTimestamp(),
  });
}

export async function toggleAnnouncementStatus(announcementId, isActive) {
  await updateDoc(doc(db, 'announcements', announcementId), {
    isActive: !isActive,
  });
}

export async function deleteAnnouncement(announcementId) {
  await deleteDoc(doc(db, 'announcements', announcementId));
}

export async function createReport(report) {
  await addDoc(collection(db, 'reports'), {
    ...report,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export function listenToReports(callback) {
  const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'));
  return onSnapshot(reportsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function updateReportStatus(reportId, status, reviewer, moderatorNote = '') {
  await updateDoc(doc(db, 'reports', reportId), {
    status,
    reviewedAt: serverTimestamp(),
    reviewerId: reviewer.uid,
    reviewerEmail: reviewer.email,
    moderatorNote,
  });
}

export async function seedVasiqSampleUsers() {
  const { vasiqSampleUsers } = await import('../data/vasiqSampleUsers');
  const batch = writeBatch(db);

  vasiqSampleUsers.forEach((user) => {
    batch.set(
      doc(db, 'users', user.id),
      {
        ...user,
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  });

  await batch.commit();
}

export async function seedVasiqCampusDemo() {
  const { vasiqSampleUsers } = await import('../data/vasiqSampleUsers');
  const batch = writeBatch(db);
  const userIds = vasiqSampleUsers.map((user) => user.id);

  vasiqSampleUsers.forEach((user, index) => {
    batch.set(
      doc(db, 'users', user.id),
      {
        ...user,
        createdAt: getDemoDate(300 + index),
      },
      { merge: true },
    );
  });

  demoGroups.forEach((group, index) => {
    const start = (index * 5) % userIds.length;
    const members = Array.from({ length: 16 }, (_, memberIndex) => {
      return userIds[(start + memberIndex) % userIds.length];
    });

    batch.set(
      doc(db, 'groups', group.id),
      {
        ...group,
        members,
        createdAt: getDemoDate(180 + index),
      },
      { merge: true },
    );

    demoGroupMessages.forEach((text, messageIndex) => {
      const sender = vasiqSampleUsers[(start + messageIndex) % vasiqSampleUsers.length];
      batch.set(
        doc(db, 'groups', group.id, 'messages', `seed-${group.id}-${messageIndex + 1}`),
        {
          senderId: sender.id,
          senderName: sender.name,
          text,
          createdAt: getDemoDate(72 - index * 2 - messageIndex),
        },
        { merge: true },
      );
    });
  });

  Array.from({ length: 18 }, (_, index) => {
    const author = vasiqSampleUsers[index];
    const likedBy = [
      vasiqSampleUsers[(index + 3) % vasiqSampleUsers.length].id,
      vasiqSampleUsers[(index + 7) % vasiqSampleUsers.length].id,
    ];
    const comments = [
      {
        userId: vasiqSampleUsers[(index + 1) % vasiqSampleUsers.length].id,
        userName: vasiqSampleUsers[(index + 1) % vasiqSampleUsers.length].name,
        text: 'I am interested in this one. Keep us posted.',
        createdAt: getDemoDate(24 - index).toISOString(),
      },
      {
        userId: vasiqSampleUsers[(index + 2) % vasiqSampleUsers.length].id,
        userName: vasiqSampleUsers[(index + 2) % vasiqSampleUsers.length].name,
        text: 'This is exactly the kind of update I wanted to see here.',
        createdAt: getDemoDate(20 - index).toISOString(),
      },
    ];

    batch.set(
      doc(db, 'posts', `seed-post-${String(index + 1).padStart(2, '0')}`),
      {
        userId: author.id,
        authorName: author.name,
        authorDepartment: author.department,
        authorAvatar: author.avatarUrl,
        content: `${demoPostOpeners[index % demoPostOpeners.length]} ${author.department.toLowerCase()} today. ${demoPostClosers[index % demoPostClosers.length]}`,
        imageUrl: '',
        likes: likedBy,
        comments,
        createdAt: getDemoDate(30 - index),
      },
      { merge: true },
    );
  });

  demoAnnouncements.forEach((announcement, index) => {
    batch.set(
      doc(db, 'announcements', announcement.id),
      {
        ...announcement,
        isActive: true,
        createdAt: getDemoDate(12 - index),
      },
      { merge: true },
    );
  });

  await batch.commit();
}

export function listenToGroupMessages(groupId, callback) {
  const messagesQuery = query(
    collection(db, 'groups', groupId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  );

  return onSnapshot(messagesQuery, { includeMetadataChanges: true }, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        hasPendingWrites: item.metadata.hasPendingWrites,
        ...item.data(),
      })),
    );
  });
}

export async function sendGroupMessage(groupId, message) {
  await addDoc(collection(db, 'groups', groupId, 'messages'), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

export function getDirectChatId(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].sort().join('_');
}

export async function ensureDirectChat(firstUserId, secondUserId) {
  return getDirectChatId(firstUserId, secondUserId);
}

export function listenToDirectChats(userId, callback) {
  const chatsQuery = query(
    collection(db, 'messages'),
    where('participants', 'array-contains', userId),
  );

  return onSnapshot(chatsQuery, { includeMetadataChanges: true }, (snapshot) => {
    const chats = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .sort((first, second) => {
        const firstTime =
          typeof first.updatedAt?.toMillis === 'function'
            ? first.updatedAt.toMillis()
            : new Date(first.updatedAt || 0).getTime();
        const secondTime =
          typeof second.updatedAt?.toMillis === 'function'
            ? second.updatedAt.toMillis()
            : new Date(second.updatedAt || 0).getTime();

        return secondTime - firstTime;
      });

    callback(chats);
  });
}

export function listenToDirectMessages(chatId, callback) {
  const messagesQuery = query(
    collection(db, 'messages', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(200),
  );

  return onSnapshot(messagesQuery, { includeMetadataChanges: true }, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        hasPendingWrites: item.metadata.hasPendingWrites,
        ...item.data(),
      })),
    );
  });
}

export async function sendDirectMessage(chatId, participants, message) {
  await setDoc(
    doc(db, 'messages', chatId),
    {
      participants: [...participants].sort(),
      updatedAt: serverTimestamp(),
      lastMessage: message.text,
      lastMessageSenderId: message.senderId,
    },
    { merge: true },
  );

  await addDoc(collection(db, 'messages', chatId, 'messages'), {
    ...message,
    createdAt: serverTimestamp(),
  });
}

export async function acknowledgeDirectChatDelivery(chatId, userId) {
  await updateDoc(doc(db, 'messages', chatId), {
    [`deliveredAt.${userId}`]: serverTimestamp(),
  });
}

export async function acknowledgeDirectChatRead(chatId, userId) {
  await updateDoc(doc(db, 'messages', chatId), {
    [`deliveredAt.${userId}`]: serverTimestamp(),
    [`readAt.${userId}`]: serverTimestamp(),
  });
}

export function listenToPosts(callback) {
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(postsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function createPost(post) {
  await addDoc(collection(db, 'posts'), {
    ...post,
    likes: [],
    comments: [],
    shareCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId));
}

export async function togglePostLike(postId, userId, isLiked) {
  await updateDoc(doc(db, 'posts', postId), {
    likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
  });
}

export async function addPostComment(postId, comment) {
  await updateDoc(doc(db, 'posts', postId), {
    comments: arrayUnion({
      id: `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...comment,
      likes: [],
      replies: [],
      createdAt: new Date().toISOString(),
    }),
  });
}

export async function recordPostShare(postId) {
  await updateDoc(doc(db, 'posts', postId), {
    shareCount: increment(1),
  });
}

export async function togglePostCommentLike(postId, commentIndex, userId) {
  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const targetComment = comments[commentIndex];

    if (!targetComment) {
      throw new Error('Comment no longer exists.');
    }

    const likes = Array.isArray(targetComment.likes) ? targetComment.likes : [];
    const nextLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    comments[commentIndex] = {
      ...targetComment,
      likes: nextLikes,
      replies: targetComment.replies || [],
    };

    transaction.update(postRef, { comments });
  });
}

export async function replyToPostComment(postId, commentIndex, reply) {
  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const targetComment = comments[commentIndex];

    if (!targetComment) {
      throw new Error('Comment no longer exists.');
    }

    const replies = Array.isArray(targetComment.replies) ? targetComment.replies : [];

    comments[commentIndex] = {
      ...targetComment,
      likes: targetComment.likes || [],
      replies: [
        ...replies,
        {
          id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          ...reply,
          likes: [],
          createdAt: new Date().toISOString(),
        },
      ],
    };

    transaction.update(postRef, { comments });
  });
}

export async function togglePostReplyLike(postId, commentIndex, replyIndex, userId) {
  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const targetComment = comments[commentIndex];

    if (!targetComment) {
      throw new Error('Comment no longer exists.');
    }

    const replies = [...(targetComment.replies || [])];
    const targetReply = replies[replyIndex];

    if (!targetReply) {
      throw new Error('Reply no longer exists.');
    }

    const likes = Array.isArray(targetReply.likes) ? targetReply.likes : [];
    const nextLikes = likes.includes(userId)
      ? likes.filter((id) => id !== userId)
      : [...likes, userId];

    replies[replyIndex] = {
      ...targetReply,
      likes: nextLikes,
    };

    comments[commentIndex] = {
      ...targetComment,
      likes: targetComment.likes || [],
      replies,
    };

    transaction.update(postRef, { comments });
  });
}
