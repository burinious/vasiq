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
import { db } from './db';

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
  const usersQuery = query(collection(db, 'users'), orderBy('name'), limit(120));
  return onSnapshot(usersQuery, (snapshot) => {
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((user) => user.accountDeleted !== true),
    );
  });
}

export function listenToStories(callback) {
  const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(30));

  return onSnapshot(storiesQuery, (snapshot) => {
    const now = Date.now();
    callback(
      snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((story) => {
          const expiresAt =
            typeof story.expiresAt?.toMillis === 'function'
              ? story.expiresAt.toMillis()
              : new Date(story.expiresAt || 0).getTime();

          return !expiresAt || expiresAt > now;
        }),
    );
  });
}

export async function createStory(story) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await addDoc(collection(db, 'stories'), {
    ...story,
    mediaUrl: story.mediaUrl || '',
    mediaType: story.mediaType || 'text',
    viewCount: 0,
    createdAt: serverTimestamp(),
    expiresAt,
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

export async function updateGroup(groupId, updates) {
  await updateDoc(doc(db, 'groups', groupId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGroup(groupId) {
  await deleteDoc(doc(db, 'groups', groupId));
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

export async function updateAnnouncement(announcementId, updates) {
  await updateDoc(doc(db, 'announcements', announcementId), {
    ...updates,
    updatedAt: serverTimestamp(),
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
  const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(60));
  return onSnapshot(postsQuery, (snapshot) => {
    callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export function listenToPostComments(postId, callback) {
  const commentsQuery = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc'),
    limit(80),
  );
  const commentsById = new Map();
  const replyUnsubscribers = new Map();

  const emit = () => {
    callback(
      Array.from(commentsById.values()).map((comment) => ({
        ...comment,
        replies: comment.replies || [],
      })),
    );
  };

  const unsubscribeComments = onSnapshot(commentsQuery, (snapshot) => {
    const activeCommentIds = new Set();

    snapshot.docs.forEach((item) => {
      activeCommentIds.add(item.id);
      const existingComment = commentsById.get(item.id) || {};
      commentsById.set(item.id, {
        ...existingComment,
        id: item.id,
        likes: [],
        replies: [],
        ...item.data(),
      });

      if (!replyUnsubscribers.has(item.id)) {
        const repliesQuery = query(
          collection(db, 'posts', postId, 'comments', item.id, 'replies'),
          orderBy('createdAt', 'asc'),
          limit(120),
        );
        const unsubscribeReplies = onSnapshot(repliesQuery, (replySnapshot) => {
          const currentComment = commentsById.get(item.id);
          if (!currentComment) return;

          commentsById.set(item.id, {
            ...currentComment,
            replies: replySnapshot.docs.map((replyItem) => ({
              id: replyItem.id,
              likes: [],
              ...replyItem.data(),
            })),
          });
          emit();
        });

        replyUnsubscribers.set(item.id, unsubscribeReplies);
      }
    });

    Array.from(commentsById.keys()).forEach((commentId) => {
      if (!activeCommentIds.has(commentId)) {
        commentsById.delete(commentId);
        replyUnsubscribers.get(commentId)?.();
        replyUnsubscribers.delete(commentId);
      }
    });

    emit();
  });

  return () => {
    unsubscribeComments();
    replyUnsubscribers.forEach((unsubscribe) => unsubscribe());
    replyUnsubscribers.clear();
  };
}

export async function createPost(post) {
  await addDoc(collection(db, 'posts'), {
    ...post,
    category: post.category || 'social',
    signalLevel: post.signalLevel || 'general',
    likes: [],
    comments: [],
    commentsCount: 0,
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
  const batch = writeBatch(db);
  const commentRef = doc(collection(db, 'posts', postId, 'comments'));

  batch.set(commentRef, {
    ...comment,
    likes: [],
    repliesCount: 0,
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, 'posts', postId), {
    commentsCount: increment(1),
  });

  await batch.commit();
}

export async function addLegacyPostComment(postId, comment) {
  await updateDoc(doc(db, 'posts', postId), {
    comments: arrayUnion({
      id: `legacy-comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

function findCommentIndexById(comments, commentId) {
  if (commentId?.startsWith('legacy-index-')) {
    const index = Number(commentId.replace('legacy-index-', ''));
    return Number.isInteger(index) ? index : -1;
  }

  if (commentId?.startsWith('legacy-id-')) {
    const legacyId = commentId.replace('legacy-id-', '');
    return comments.findIndex((comment) => comment.id === legacyId);
  }

  return comments.findIndex((comment) => comment.id === commentId);
}

function findReplyIndexById(replies, replyId) {
  if (replyId?.startsWith('legacy-index-')) {
    const index = Number(replyId.replace('legacy-index-', ''));
    return Number.isInteger(index) ? index : -1;
  }

  if (replyId?.startsWith('legacy-id-')) {
    const legacyId = replyId.replace('legacy-id-', '');
    return replies.findIndex((reply) => reply.id === legacyId);
  }

  return replies.findIndex((reply) => reply.id === replyId);
}

export async function togglePostCommentLike(postId, commentId, userId) {
  if (!commentId?.startsWith('legacy-')) {
    await runTransaction(db, async (transaction) => {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const snapshot = await transaction.get(commentRef);

      if (!snapshot.exists()) {
        throw new Error('Comment no longer exists.');
      }

      const likes = Array.isArray(snapshot.data().likes) ? snapshot.data().likes : [];
      transaction.update(commentRef, {
        likes: likes.includes(userId) ? arrayRemove(userId) : arrayUnion(userId),
      });
    });
    return;
  }

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const commentIndex = findCommentIndexById(comments, commentId);
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

export async function replyToPostComment(postId, commentId, reply) {
  const parentReplyId = reply.parentReplyId || '';

  if (!commentId?.startsWith('legacy-')) {
    const batch = writeBatch(db);
    const replyRef = doc(collection(db, 'posts', postId, 'comments', commentId, 'replies'));

    batch.set(replyRef, {
      ...reply,
      parentReplyId,
      parentReplyName: reply.parentReplyName || '',
      likes: [],
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, 'posts', postId, 'comments', commentId), {
      repliesCount: increment(1),
    });

    await batch.commit();
    return;
  }

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const commentIndex = findCommentIndexById(comments, commentId);
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

export async function togglePostReplyLike(postId, commentId, replyId, userId) {
  if (!commentId?.startsWith('legacy-')) {
    await runTransaction(db, async (transaction) => {
      const replyRef = doc(db, 'posts', postId, 'comments', commentId, 'replies', replyId);
      const snapshot = await transaction.get(replyRef);

      if (!snapshot.exists()) {
        throw new Error('Reply no longer exists.');
      }

      const likes = Array.isArray(snapshot.data().likes) ? snapshot.data().likes : [];
      transaction.update(replyRef, {
        likes: likes.includes(userId) ? arrayRemove(userId) : arrayUnion(userId),
      });
    });
    return;
  }

  await runTransaction(db, async (transaction) => {
    const postRef = doc(db, 'posts', postId);
    const snapshot = await transaction.get(postRef);

    if (!snapshot.exists()) {
      throw new Error('Post no longer exists.');
    }

    const comments = [...(snapshot.data().comments || [])];
    const commentIndex = findCommentIndexById(comments, commentId);
    const targetComment = comments[commentIndex];

    if (!targetComment) {
      throw new Error('Comment no longer exists.');
    }

    const replies = [...(targetComment.replies || [])];
    const replyIndex = findReplyIndexById(replies, replyId);
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


