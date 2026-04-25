import { useEffect, useRef, useState } from 'react';
import { Phone, Video, Info, Trash2, ArrowLeft } from 'lucide-react';
import { messageAPI } from '../../services/api';
import toast from 'react-hot-toast';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import useCallStore from '../../store/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import UserAvatar from '../common/UserAvatar';
import './ChatWindow.css';

export default function ChatWindow() {
  const { activeConversation, loadMessages, typingUsers, onlineUsers } = useChatStore();
  const { user } = useAuthStore();
  const { startCall } = useWebRTC();
  const messagesEndRef = useRef(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const chatUser = activeConversation?.user;
  const messages = activeConversation?.messages || [];

  const onlineStatus = chatUser ? onlineUsers[chatUser._id] : null;
  const isOnline = onlineStatus?.isOnline ?? chatUser?.isOnline;
  const isTyping = chatUser ? typingUsers[chatUser._id] : false;

  const isConnected = user?.connections?.some(id => String(id) === String(chatUser?._id));
  const isSentRequest = user?.sentRequests?.some(id => String(id) === String(chatUser?._id));
  const isPendingRequest = user?.pendingRequests?.some(id => String(id) === String(chatUser?._id));

  // Debug logs to find why the button is missing
  useEffect(() => {
    if (chatUser) {
      console.log('--- Connection Debug ---');
      console.log('Chat User:', chatUser.username, chatUser._id);
      console.log('My Pending Requests:', user?.pendingRequests);
      console.log('isPendingRequest:', isPendingRequest);
    }
  }, [chatUser, user, isPendingRequest]);

  const handleDeleteChat = async () => {
    setIsDeleting(true);
    try {
      await messageAPI.deleteChat(chatUser._id);
      // Clear messages locally from chatStore
      const { setActiveConversation } = useChatStore.getState();
      setActiveConversation({ ...activeConversation, messages: [] });
      setShowDeleteConfirm(false);
      toast.success('Chat deleted');
    } catch (e) {
      toast.error('Failed to delete chat');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (chatUser?._id) {
      loadMessages(chatUser._id);
    }
  }, [chatUser?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!activeConversation) {
    return (
      <div className="chat-window chat-window-empty">
        <div className="empty-chat-state animate-fade-in">
          <div className="empty-chat-icon">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="40" fill="rgba(124,58,237,0.08)" />
              <path d="M25 30C25 27.2386 27.2386 25 30 25H50C52.7614 25 55 27.2386 55 30V44C55 46.7614 52.7614 49 50 49H43L37 55V49H30C27.2386 49 25 46.7614 25 44V30Z"
                fill="rgba(124,58,237,0.3)" stroke="rgba(168,85,247,0.6)" strokeWidth="1.5" />
              <circle cx="33" cy="37" r="2" fill="rgba(192,132,252,0.8)" />
              <circle cx="40" cy="37" r="2" fill="rgba(192,132,252,0.8)" />
              <circle cx="47" cy="37" r="2" fill="rgba(192,132,252,0.8)" />
            </svg>
          </div>
          <h2 className="empty-chat-title">Start a Conversation</h2>
          <p className="empty-chat-desc">
            Search for a user by username and send them a message.<br />
            No phone number required — just a username.
          </p>
          <div className="empty-chat-features">
            <div className="feature-chip">💬 Real-time Chat</div>
            <div className="feature-chip">📞 Audio Calls</div>
            <div className="feature-chip">🎥 Video Calls</div>
            <div className="feature-chip">🔥 Auto-delete Media</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          <button 
            className="btn btn-ghost btn-icon mobile-back-btn" 
            onClick={() => useChatStore.getState().setActiveConversation(null)}
            style={{ marginRight: '8px', display: 'none' }}
          >
            <ArrowLeft size={20} />
          </button>
          <UserAvatar user={chatUser} size="md" showOnline isOnline={isOnline} />
          <div className="chat-header-info">
            <span className="chat-header-name">{chatUser.username}</span>
            <span className="chat-header-status">
              {isTyping ? (
                <span className="typing-status">
                  <span className="typing-dots">
                    <span /><span /><span />
                  </span>
                  typing...
                </span>
              ) : isOnline ? (
                <span className="status-online">● Online</span>
              ) : (
                <span className="status-offline">
                  Last seen {chatUser.lastSeen ? new Date(chatUser.lastSeen).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : 'recently'}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button
            className="btn btn-ghost btn-icon-round"
            onClick={() => isConnected && startCall(chatUser, 'audio')}
            title="Audio Call"
            disabled={!isConnected}
            style={{ opacity: isConnected ? 1 : 0.5 }}
          >
            <Phone size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon-round"
            onClick={() => isConnected && startCall(chatUser, 'video')}
            title="Video Call"
            disabled={!isConnected}
            style={{ opacity: isConnected ? 1 : 0.5 }}
          >
            <Video size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon-round"
            onClick={() => setShowInfo(!showInfo)}
            title="Info"
          >
            <Info size={18} />
          </button>
          <button
            className="btn btn-ghost btn-icon-round text-error"
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete Chat"
            style={{ color: 'var(--status-offline)' }}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="messages-empty">
            <UserAvatar user={chatUser} size="xl" />
            <p className="empty-conv-name">{chatUser.username}</p>
            <p className="empty-conv-id">{chatUser.uniqueId}</p>
            <p className="empty-conv-hint">
              {isConnected ? 'Say hello! 👋' : 'Send a connection request to chat!'}
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg._id || idx}
                message={msg}
                isOwn={msg.senderId?._id === user?._id || msg.senderId === user?._id}
                prevMessage={idx > 0 ? messages[idx - 1] : null}
              />
            ))}

            {isTyping && (
              <div className="typing-indicator-bubble animate-fade-in">
                <UserAvatar user={chatUser} size="sm" />
                <div className="typing-bubble">
                  <span /><span /><span />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input or Connection Request UI */}
      {isConnected ? (
        <MessageInput receiverId={chatUser._id} />
      ) : (
        <div className="connection-prompt-wrapper" style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)' }}>
          {isSentRequest ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Connection request sent. Waiting for approval.</p>
              <button className="btn btn-secondary" disabled>Pending...</button>
            </div>
          ) : isPendingRequest ? (
            <div>
              <p style={{ color: 'var(--text-primary)', marginBottom: '10px' }}><strong>{chatUser.username}</strong> wants to connect with you.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      await useAuthStore.getState().acceptConnectionRequest(chatUser._id);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Accept
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={async () => {
                    try {
                      await useAuthStore.getState().rejectConnectionRequest(chatUser._id);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>You must connect with <strong>{chatUser.username}</strong> to send messages.</p>
              <button 
                className="btn btn-primary"
                onClick={async () => {
                  try {
                    await useAuthStore.getState().sendConnectionRequest(chatUser._id);
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                Send Connect Request
              </button>
            </div>
          )}
        </div>
      )}
      {/* Confirmation Modals */}
      {showDeleteConfirm && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ backgroundColor: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ color: 'var(--status-offline)', marginBottom: '16px' }}>
              <Trash2 size={48} style={{ margin: '0 auto' }} />
            </div>
            <h3 style={{ marginBottom: '12px', fontSize: '20px' }}>Delete Chat?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Are you sure you want to delete all messages with <strong>{chatUser.username}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-ghost" 
                style={{ flex: 1 }}
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, backgroundColor: 'var(--status-offline)' }}
                onClick={handleDeleteChat}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
