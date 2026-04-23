import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import GroupCard from '../components/groups/GroupCard';
import { useAuth } from '../context/AuthContext';
import {
  listenToGroupMessages,
  listenToGroups,
  listenToUsers,
  removeGroupMember,
  requestGroupCreation,
  sendGroupMessage,
  toggleGroupMembership,
} from '../firebase/firestore';
import { getUserDisplayName } from '../utils/userIdentity';

const initialGroupRequestState = {
  name: '',
  description: '',
};

function GroupsPage() {
  const { currentUser, profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupMessages, setGroupMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [resolvedClientMessageIds, setResolvedClientMessageIds] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [groupStatus, setGroupStatus] = useState('');
  const [groupRequestValues, setGroupRequestValues] = useState(initialGroupRequestState);
  const [groupRequestStatus, setGroupRequestStatus] = useState('');
  const [requestingGroup, setRequestingGroup] = useState(false);
  const [optimisticMemberGroupIds, setOptimisticMemberGroupIds] = useState(() => new Set());
  const pendingSentTimersRef = useRef(new Map());
  const chatGroupId = searchParams.get('chat') || '';

  const clearPendingSentTimer = (clientMessageId) => {
    const timerId = pendingSentTimersRef.current.get(clientMessageId);

    if (timerId) {
      window.clearTimeout(timerId);
      pendingSentTimersRef.current.delete(clientMessageId);
    }
  };

  const markMessageAsSent = (clientMessageId) => {
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
  };

  useEffect(() => {
    return () => {
      pendingSentTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingSentTimersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = listenToGroups((nextGroups) => {
      setGroups(nextGroups);

      if (chatGroupId && nextGroups.some((group) => group.id === chatGroupId)) {
        setSelectedGroupId(chatGroupId);
      } else if (!selectedGroupId && nextGroups.length) {
        setSelectedGroupId(nextGroups[0].id);
      }
    });

    return unsubscribe;
  }, [chatGroupId, selectedGroupId]);

  useEffect(() => {
    const unsubscribe = listenToUsers(setUsers);
    return unsubscribe;
  }, []);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) || null;
  const isGroupMember = (group) =>
    Boolean(
      group?.members?.includes(currentUser.uid) ||
        group?.createdBy === currentUser.uid ||
        optimisticMemberGroupIds.has(group?.id),
    );
  const selectedGroupIsMember = isGroupMember(selectedGroup);
  const selectedGroupIsCreator = selectedGroup?.createdBy === currentUser.uid;
  const selectedGroupMembers = users.filter((user) => selectedGroup?.members?.includes(user.id));

  useEffect(() => {
    if (!selectedGroup || !selectedGroupIsMember) {
      setGroupMessages([]);
      setPendingMessages([]);
      setResolvedClientMessageIds([]);
      pendingSentTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
      pendingSentTimersRef.current.clear();
      return undefined;
    }

    const unsubscribe = listenToGroupMessages(selectedGroup.id, setGroupMessages);
    return unsubscribe;
  }, [selectedGroup, selectedGroupIsMember]);

  useEffect(() => {
    if (!groupMessages.length) {
      return;
    }

    const resolvedMessageIds = new Set(resolvedClientMessageIds);
    const visibleMessageIds = new Set(
      groupMessages
        .filter(
          (message) =>
            message.clientMessageId &&
            (!message.hasPendingWrites || resolvedMessageIds.has(message.clientMessageId)),
        )
        .map((message) => message.clientMessageId),
    );

    setPendingMessages((current) =>
      current.filter((message) => !visibleMessageIds.has(message.clientMessageId)),
    );
  }, [groupMessages, resolvedClientMessageIds]);

  const handleToggleMembership = async (group) => {
    const isMember = isGroupMember(group);

    setOptimisticMemberGroupIds((current) => {
      const next = new Set(current);
      if (isMember) {
        next.delete(group.id);
      } else {
        next.add(group.id);
      }
      return next;
    });

    if (!isMember) {
      handleOpenChat(group);
    } else if (chatGroupId === group.id) {
      handleBackToGroups();
    }

    try {
      await toggleGroupMembership(group.id, currentUser.uid, isMember);
    } catch (error) {
      setOptimisticMemberGroupIds((current) => {
        const next = new Set(current);
        if (isMember) {
          next.add(group.id);
        } else {
          next.delete(group.id);
        }
        return next;
      });
      setGroupStatus(error.message || 'Unable to update group membership.');
    }
  };

  const handleOpenChat = (group) => {
    setSelectedGroupId(group.id);
    setSearchParams({ chat: group.id });
  };

  const handleBackToGroups = () => {
    setSearchParams({});
  };

  const handleRequestGroup = async (event) => {
    event.preventDefault();
    const name = groupRequestValues.name.trim();
    const description = groupRequestValues.description.trim();

    if (!name || !description) return;

    setRequestingGroup(true);
    setGroupRequestStatus('');

    try {
      await requestGroupCreation({
        name,
        description,
        requesterId: currentUser.uid,
        requesterName: getUserDisplayName({ ...profile, email: currentUser.email }),
        requesterEmail: currentUser.email,
      });
      setGroupRequestValues(initialGroupRequestState);
      setGroupRequestStatus('Group request sent for admin review.');
    } catch (error) {
      setGroupRequestStatus(error.message || 'Unable to request group right now.');
    } finally {
      setRequestingGroup(false);
    }
  };

  const handleRemoveMember = async (member) => {
    if (!selectedGroup || member.id === currentUser.uid) return;

    const shouldRemove = window.confirm(`Remove ${getUserDisplayName(member)} from ${selectedGroup.name}?`);
    if (!shouldRemove) return;

    try {
      await removeGroupMember(selectedGroup.id, member.id);
    } catch (error) {
      setGroupStatus(error.message || 'Unable to remove member.');
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setGroupStatus('');

    if (!selectedGroup || !messageText.trim()) return;

    const trimmedText = messageText.trim();
    const clientMessageId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

    const sentTimerId = window.setTimeout(() => {
      pendingSentTimersRef.current.delete(clientMessageId);
      markMessageAsSent(clientMessageId);
    }, 1200);
    pendingSentTimersRef.current.set(clientMessageId, sentTimerId);

    try {
      await sendGroupMessage(selectedGroup.id, {
        senderId: currentUser.uid,
        senderName: optimisticMessage.senderName,
        text: trimmedText,
        clientMessageId,
      });
      clearPendingSentTimer(clientMessageId);
      markMessageAsSent(clientMessageId);
    } catch (error) {
      clearPendingSentTimer(clientMessageId);
      setResolvedClientMessageIds((current) =>
        current.filter((messageId) => messageId !== clientMessageId),
      );
      setMessageText(trimmedText);
      setPendingMessages((current) => {
        const nextMessages = current.map((message) =>
          message.clientMessageId === clientMessageId
            ? { ...message, deliveryStatus: 'failed' }
            : message,
        );

        if (nextMessages.some((message) => message.clientMessageId === clientMessageId)) {
          return nextMessages;
        }

        return [...nextMessages, { ...optimisticMessage, deliveryStatus: 'failed' }];
      });
      setGroupStatus(error.message || 'Unable to send message right now.');
    }
  };

  const mergedMessages = useMemo(() => {
    const resolvedMessageIds = new Set(resolvedClientMessageIds);
    const pendingByClientMessageId = new Map(
      pendingMessages.map((message) => [message.clientMessageId, message]),
    );

    const visibleMessages = groupMessages.map((message) => {
      const localVersion = pendingByClientMessageId.get(message.clientMessageId);

      if (message.senderId !== currentUser.uid) {
        return message;
      }

      if (message.hasPendingWrites) {
        if (
          localVersion?.deliveryStatus === 'sent' ||
          resolvedMessageIds.has(message.clientMessageId)
        ) {
          return {
            ...message,
            hasPendingWrites: false,
            deliveryStatus: 'sent',
          };
        }

        return message;
      }

      return {
        ...message,
        deliveryStatus: 'sent',
      };
    });

    const visibleMessageIds = new Set(
      visibleMessages
        .filter((message) => message.clientMessageId)
        .map((message) => message.clientMessageId),
    );
    const visiblePending = pendingMessages.filter(
      (message) => !visibleMessageIds.has(message.clientMessageId),
    );

    return [...visibleMessages, ...visiblePending].sort((first, second) => {
      const firstTime =
        typeof first.createdAt?.toMillis === 'function'
          ? first.createdAt.toMillis()
          : new Date(first.createdAt || 0).getTime();
      const secondTime =
        typeof second.createdAt?.toMillis === 'function'
          ? second.createdAt.toMillis()
          : new Date(second.createdAt || 0).getTime();

      return firstTime - secondTime;
    });
  }, [currentUser.uid, groupMessages, pendingMessages, resolvedClientMessageIds]);

  return (
    <div className={`page-grid groups-grid ${chatGroupId ? 'groups-grid-chat-open' : ''}`}>
      <section className="group-list">
        <section className="panel group-request-card">
          <div>
            <p className="eyebrow">Create a group</p>
            <h3>Request a new campus space</h3>
            <p>Submit your idea. An admin or moderator will approve it before it goes live.</p>
          </div>
          <form className="group-request-form" onSubmit={handleRequestGroup}>
            <input
              className="input"
              placeholder="Group name"
              value={groupRequestValues.name}
              onChange={(event) =>
                setGroupRequestValues((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
            <textarea
              className="input textarea"
              placeholder="What should students use this group for?"
              value={groupRequestValues.description}
              onChange={(event) =>
                setGroupRequestValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              rows={3}
              required
            />
            <button type="submit" className="primary-button" disabled={requestingGroup}>
              {requestingGroup ? 'Submitting...' : 'Submit for review'}
            </button>
          </form>
          {groupRequestStatus ? <p className="status-text">{groupRequestStatus}</p> : null}
        </section>

        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            isMember={isGroupMember(group)}
            onToggleMembership={() => handleToggleMembership(group)}
            onOpenChat={() => handleOpenChat(group)}
          />
        ))}
      </section>

      <section className="group-chat-panel">
        {chatGroupId ? (
          <button type="button" className="ghost-button group-chat-back-button" onClick={handleBackToGroups}>
            Back to groups
          </button>
        ) : null}
        <ChatWindow
          title={selectedGroup?.name || 'Select a group'}
          subtitle={
            selectedGroupIsMember
              ? selectedGroup?.description
              : 'Join a group to participate in its community chat.'
          }
          messages={mergedMessages}
          messageText={messageText}
          onMessageTextChange={setMessageText}
          onSendMessage={handleSendMessage}
          currentUserId={currentUser.uid}
          disabled={!selectedGroupIsMember}
          status={groupStatus}
        />
        {selectedGroupIsCreator ? (
          <section className="panel group-owner-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Owner controls</p>
                <h2>Members</h2>
                <p>You created this group, so you can remove members when needed.</p>
              </div>
            </div>
            <div className="group-owner-list">
              {selectedGroupMembers.map((member) => (
                <article key={member.id} className="group-owner-member-row">
                  <div>
                    <strong>{getUserDisplayName(member)}</strong>
                    <p>{member.department || 'Campus community'} / {member.level || 'Student'}</p>
                  </div>
                  <button
                    type="button"
                    className="ghost-button admin-danger-button"
                    onClick={() => handleRemoveMember(member)}
                    disabled={member.id === currentUser.uid}
                  >
                    {member.id === currentUser.uid ? 'Owner' : 'Remove'}
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </div>
  );
}

export default GroupsPage;
