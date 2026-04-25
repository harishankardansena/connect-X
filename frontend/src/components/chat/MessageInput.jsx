import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, X, Image, FileText, Film, Loader2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { mediaAPI } from '../../services/api';
import useChatStore from '../../store/chatStore';
import toast from 'react-hot-toast';
import './MessageInput.css';

const TYPING_TIMEOUT = 1500;

export default function MessageInput({ receiverId }) {
  const { getSocket } = useSocket();
  const { addMessage } = useChatStore();
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const typingTimer = useRef(null);
  const isTypingRef = useRef(false);

  const sendTyping = useCallback((typing) => {
    const socket = getSocket();
    if (!socket) return;
    if (typing && !isTypingRef.current) {
      socket.emit('typing:start', { receiverId });
      isTypingRef.current = true;
    }
    if (!typing && isTypingRef.current) {
      socket.emit('typing:stop', { receiverId });
      isTypingRef.current = false;
    }
  }, [getSocket, receiverId]);

  const handleTextChange = (e) => {
    setText(e.target.value);
    sendTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(false), TYPING_TIMEOUT);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSendText = () => {
    if (!text.trim()) return;
    const socket = getSocket();
    if (!socket) { toast.error('Not connected'); return; }

    sendTyping(false);
    clearTimeout(typingTimer.current);

    socket.emit('message:send', {
      receiverId,
      content: text.trim(),
      type: 'text',
    });

    setText('');
    // Reset textarea height
    const textarea = document.querySelector('.msg-textarea');
    if (textarea) textarea.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (selectedFile) handleUpload();
      else handleSendText();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview({ type: 'image', url: ev.target.result, name: file.name });
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setPreview({ type: 'video', name: file.name, size: file.size });
    } else {
      setPreview({ type: 'file', name: file.name, size: file.size });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('receiverId', receiverId);

      const { data } = await mediaAPI.upload(formData, setUploadProgress);

      // Deliver via socket
      const socket = getSocket();
      socket?.emit('message:send', {
        receiverId,
        content: '',
        type: data.message.type,
        mediaUrl: data.mediaUrl,
        cloudinaryPublicId: data.message.cloudinaryPublicId,
      });

      setPreview(null);
      setSelectedFile(null);
      setUploadProgress(0);
      fileInputRef.current.value = '';
      toast.success('File sent!');
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="message-input-area">
      {/* File Preview */}
      {preview && (
        <div className="file-preview animate-fade-up">
          {preview.type === 'image' && (
            <img src={preview.url} alt="Preview" className="file-preview-img" />
          )}
          {preview.type === 'video' && (
            <div className="file-preview-info">
              <Film size={20} className="file-icon" />
              <div>
                <p className="file-name">{preview.name}</p>
                <p className="file-size">{formatFileSize(preview.size)}</p>
              </div>
            </div>
          )}
          {preview.type === 'file' && (
            <div className="file-preview-info">
              <FileText size={20} className="file-icon" />
              <div>
                <p className="file-name">{preview.name}</p>
                <p className="file-size">{formatFileSize(preview.size)}</p>
              </div>
            </div>
          )}
          {uploading && (
            <div className="upload-progress">
              <div className="progress-bar" style={{ width: `${uploadProgress}%` }} />
              <span className="progress-label">{uploadProgress}%</span>
            </div>
          )}
          <button className="file-preview-close" onClick={clearFile} disabled={uploading}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Row */}
      <div className="input-row">
        {/* Attach */}
        <button
          className="btn btn-ghost btn-icon-round attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.zip"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        {/* Text input */}
        <div className="textarea-wrapper">
          <textarea
            className="msg-textarea"
            placeholder="Type a message..."
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={!!preview}
          />
        </div>

        {/* Send */}
        <button
          className={`send-btn ${(text.trim() || selectedFile) ? 'send-btn-active' : ''}`}
          onClick={selectedFile ? handleUpload : handleSendText}
          disabled={(!text.trim() && !selectedFile) || uploading}
          title="Send"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
