import { useEffect, useMemo, useState } from 'react';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import { useAuth } from '../context/AuthContext';
import {
  acknowledgeDirectChatDelivery,
  acknowledgeDirectChatRead,
  ensureDirectChat,
  getDirectChatId,
  listenToDirectChats,
  listenToDirectMessages,
  listenToUsers,
  sendDirectMessage,
} from '../firebase/firestore';
import { getUserDisplayName } from '../utils/userIdentity';

function toMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  return new Date(value).getTime();
}

function ChatPage() {
  const { currentUser, profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [resolvedClientMessageIds, setResolvedClientMessageIds] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [chatStatus, setChatStatus] = useState('');

  useEffect(() => {
    const unsubscribeUsers = listenToUsers(setUsers);
    const unsubscribeChats = listenToDirectChats(currentUser.uid, setChats);

    return () => {
      unsubscribeUsers();
      unsubscribeChats();
    };
  }, [currentUser.uid]);

  const chatSummaries = useMemo(
    () =>
      chats
        .map((chat) => {
          const otherUserId = chat.participants?.find(
            (participant) => participant !== currentUser.uid,
          );
          const user = users.find((item) => item.id === otherUserId);
          return { ...chat, user };
        })
        .filter((chat) => chat.user),
    [chats, currentUser.uid, users],
  );

  const selectedChatId = selectedUser
    ? getDirectChatId(currentUser.uid, selectedUser.id)
    : null;
  const selectedChat = chats.find((chat) => chat.id === selectedChatId) || null;

  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      setPendingMessages([]);
      setResolvedClientMessageIds([]);
      return undefined;
    }

    const unsubscribe = listenToDirectMessages(selectedChatId, setMessages);
    return unsubscribe;
  }, [selectedChatId]);

  useEffect(() => {
    const pendingAcknowledgements = chats
      .filter((chat) => chat.lastMessageSenderId && chat.lastMessageSenderId !== currentUser.uid)
      .filter((chat) => toMillis(chat.updatedAt) > toMillis(chat.deliveredAt?.[currentUser.uid]))
      .map((chat) =>
        acknowledgeDirectChatDelivery(chat.id, currentUser.uid).catch((error) => {
          console.error('Unable to acknowledge direct chat delivery.', error);
        }),
      );

    if (!pendingAcknowledgements.length) {
      return;
    }

    void Promise.allSettled(pendingAcknowledgements);
  }, [chats, currentUser.uid]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    const latestIncomingMessage = [...messages]
      .reverse()
      .find((message) => message.senderId !== currentUser.uid);

    if (!latestIncomingMessage) {
      return;
    }

    const latestIncomingTime = toMillis(latestIncomingMessage.createdAt);
    if (!latestIncomingTime) {
      return;
    }

    if (toMillis(selectedChat?.readAt?.[currentUser.uid]) >= latestIncomingTime) {
      return;
    }

    acknowledgeDirectChatRead(selectedChatId, currentUser.uid).catch((error) => {
      console.error('Unable to acknowledge direct chat read.', error);
    });
  }, [currentUser.uid, messages, selectedChat?.readAt, selectedChatId]);

  const handleSelectChat = async (user) => {
    setChatStatus('');
    setPendingMessages([]);
    setResolvedClientMessageIds([]);
    await ensureDirectChat(currentUser.uid, user.id);
    setSelectedUser(user);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setChatStatus('');

    if (!selectedUser || !messageText.trim()) return;

    const chatId = await ensureDirectChat(currentUser.uid, selectedUser.id);
    const trimmedText = messageText.trim();
    const clientMessageId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const senderName = getUserDisplayName({ ...profile, email: currentUser.email });
    const optimisticMessage = {
      id: clientMessageId,
      clientMessageId,
      senderId: currentUser.uid,
      senderName,
      text: trimmedText,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'sending',
      isLocalOnly: true,
    };

    setPendingMessages((current) => [...current, optimisticMessage]);
    setMessageText('');

    try {
      await sendDirectMessage(chatId, [currentUser.uid, selectedUser.id], {
        senderId: currentUser.uid,
        senderName: optimisticMessage.senderName,
        text: trimmedText,
        clientMessageId,
      });
      setResolvedClientMessageIds((current) =>
        current.includes(clientMessageId) ? current : [...current, clientMessageId],
      );
      setPendingMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, deliveryStatus: 'sent' }
            : message,
        ),
      );
    } catch (error) {
      setPendingMessages((current) =>
        current.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, deliveryStatus: 'failed' }
            : message,
        ),
      );
      setChatStatus(error.message || 'Unable to send message right now.');
    }
  };

  const mergedMessages = useMemo(() => {
    const otherUserId = selectedUser?.id;
    const deliveredAt = otherUserId ? selectedChat?.deliveredAt?.[otherUserId] : null;
    const readAt = otherUserId ? selectedChat?.readAt?.[otherUserId] : null;
    const deliveredAtMs = toMillis(deliveredAt);
    const readAtMs = toMillis(readAt);
    const resolvedMessageIds = new Set(resolvedClientMessageIds);

    const confirmedMessages = messages.map((message) => {
      if (message.senderId !== currentUser.uid) {
        return message;
      }

      const shouldTreatAsConfirmed =
        !message.hasPendingWrites || resolvedMessageIds.has(message.clientMessageId);
      if (!shouldTreatAsConfirmed) {
        return message;
      }

      const createdAtMs = toMillis(message.createdAt);
      let deliveryStatus = 'sent';

      if (readAtMs && createdAtMs && readAtMs >= createdAtMs) {
        deliveryStatus = 'read';
      } else if (deliveredAtMs && createdAtMs && deliveredAtMs >= createdAtMs) {
        deliveryStatus = 'delivered';
      }

      return {
        ...message,
        deliveryStatus,
      };
    });

    const visibleMessageIds = new Set(
      confirmedMessages
        .filter((message) => message.clientMessageId)
        .map((message) => message.clientMessageId),
    );
    const visiblePending = pendingMessages.filter(
      (message) => !visibleMessageIds.has(message.clientMessageId),
    );

    return [...confirmedMessages, ...visiblePending].sort(
      (first, second) => toMillis(first.createdAt) - toMillis(second.createdAt),
    );
  }, [
    currentUser.uid,
    messages,
    pendingMessages,
    resolvedClientMessageIds,
    selectedChat,
    selectedUser?.id,
  ]);

  return (
    <div className="page-grid chat-grid">
      <ChatSidebar
        chats={chatSummaries}
        users={users}
        selectedChatId={selectedChatId}
        currentUserId={currentUser.uid}
        onSelectChat={handleSelectChat}
      />

      <ChatWindow
        title={selectedUser ? getUserDisplayName(selectedUser) : 'Choose a student'}
        subtitle={
          selectedUser
            ? `${selectedUser.department} / ${selectedUser.level}`
            : 'Pick a classmate from the list to start chatting.'
        }
        messages={mergedMessages}
        messageText={messageText}
        onMessageTextChange={setMessageText}
        onSendMessage={handleSendMessage}
        currentUserId={currentUser.uid}
        disabled={!selectedUser}
        status={chatStatus}
      />
    </div>
  );
}

export default ChatPage;
