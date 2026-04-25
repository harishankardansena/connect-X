import { formatDistanceToNow } from 'date-fns';
import UserAvatar from '../common/UserAvatar';
import useChatStore from '../../store/chatStore';
import './ConversationItem.css';

export default function ConversationItem({ conversation, onClick }) {
  const { activeConversation, onlineUsers } = useChatStore();
  const user = conversation.user;
  const lastMsg = conversation.lastMessage;
  const unread = conversation.unreadCount;

  const isActive = activeConversation?.user?._id === user?._id;
  const onlineStatus = onlineUsers[user?._id];
  const isOnline = onlineStatus?.isOnline ?? user?.isOnline;

  const getPreview = () => {
    if (!lastMsg) return 'Start a conversation';
    if (lastMsg.isDeleted) return '🔥 Media expired';
    if (lastMsg.type === 'image') return '📷 Photo';
    if (lastMsg.type === 'video') return '🎥 Video';
    if (lastMsg.type === 'document') return '📄 Document';
    return lastMsg.content || '';
  };

  return (
    <button
      className={`conv-item ${isActive ? 'conv-item-active' : ''}`}
      onClick={onClick}
    >
      <UserAvatar user={user} size="md" showOnline isOnline={isOnline} />

      <div className="conv-info">
        <div className="conv-top">
          <span className="conv-name">{user?.username}</span>
          {lastMsg && (
            <span className="conv-time">
              {formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: false })
                .replace('about ', '')
                .replace(' ago', '')}
            </span>
          )}
        </div>
        <div className="conv-bottom">
          <span className={`conv-preview ${unread > 0 ? 'conv-preview-unread' : ''}`}>
            {getPreview()}
          </span>
          {unread > 0 && (
            <span className="unread-badge">{unread > 99 ? '99+' : unread}</span>
          )}
        </div>
      </div>
    </button>
  );
}
