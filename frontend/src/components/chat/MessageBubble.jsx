import { useState } from 'react';
import { Check, CheckCheck, Trash2, Clock, FileText } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import './MessageBubble.css';

export default function MessageBubble({ message, isOwn, prevMessage }) {
  const [imageError, setImageError] = useState(false);

  // Group messages from same sender
  const sameSenderAsPrev = prevMessage &&
    (prevMessage.senderId?._id || prevMessage.senderId) ===
    (message.senderId?._id || message.senderId);

  const isExpired = message.isDeleted || (message.expiresAt && new Date(message.expiresAt) < new Date());

  const renderContent = () => {
    if (isExpired && message.type !== 'text') {
      return (
        <div className="expired-media">
          <Clock size={16} />
          <span>🔥 Media expired</span>
        </div>
      );
    }

    switch (message.type) {
      case 'image':
        return imageError ? (
          <div className="expired-media"><Clock size={16} /><span>Image unavailable</span></div>
        ) : (
          <img
            src={message.mediaUrl}
            alt="Shared image"
            className="msg-image"
            onError={() => setImageError(true)}
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        );

      case 'video':
        return (
          <video
            src={message.mediaUrl}
            className="msg-video"
            controls
            preload="metadata"
          />
        );

      case 'document':
        return (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="msg-file"
          >
            <FileText size={20} />
            <span>Download file</span>
          </a>
        );

      default:
        return <p className="msg-text">{message.content}</p>;
    }
  };

  const timeStr = message.createdAt
    ? format(new Date(message.createdAt), 'HH:mm')
    : '';

  if (message.isDeleted && message.type === 'text') {
    return (
      <div className={`msg-wrapper ${isOwn ? 'msg-own' : 'msg-other'} ${sameSenderAsPrev ? 'msg-grouped' : ''}`}>
        <div className="msg-bubble msg-deleted">
          <span>🗑️ Message deleted</span>
        </div>
      </div>
    );
  }

  // Check if media expires in < 1 hour
  let expiryLabel = null;
  if (message.expiresAt && message.type !== 'text' && !isExpired) {
    const msLeft = new Date(message.expiresAt) - new Date();
    const hrsLeft = msLeft / (1000 * 60 * 60);
    if (hrsLeft < 2) {
      expiryLabel = `⏳ Expires in ${Math.round(msLeft / (1000 * 60))}m`;
    }
  }

  return (
    <div className={`msg-wrapper ${isOwn ? 'msg-own' : 'msg-other'} ${sameSenderAsPrev ? 'msg-grouped' : ''}`}>
      <div className={`msg-bubble ${isOwn ? 'msg-bubble-own' : 'msg-bubble-other'} ${message.type !== 'text' ? 'msg-bubble-media' : ''}`}>
        {renderContent()}

        {expiryLabel && (
          <div className="expiry-label">{expiryLabel}</div>
        )}

        <div className="msg-meta">
          <span className="msg-time">{timeStr}</span>
          {isOwn && (
            <span className="msg-status">
              {message.seen ? (
                <CheckCheck size={13} className="seen-icon" />
              ) : (
                <Check size={13} className="sent-icon" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
