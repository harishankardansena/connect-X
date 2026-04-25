import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useCallStore from '../store/callStore';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { user, token, isAuthenticated } = useAuthStore();
  const { addMessage, updateMessageSeen, setTyping, updateOnlineStatus, loadConversations } = useChatStore();
  const { setIncomingCall, setCallConnected, endCall } = useCallStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(import.meta.env.VITE_API_URL || '/', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔴 Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // ── Chat Events ──────────────────────────────────────────────────────────

    socket.on('message:receive', (message) => {
      addMessage(message);
      loadConversations();

      // Show toast notification if window is not focused
      if (!document.hasFocus()) {
        toast(message.senderId?.username + ': ' + (message.content || '📎 Media'), {
          icon: '💬',
          duration: 4000,
        });
      }
    });

    socket.on('message:sent', (message) => {
      addMessage(message);
    });

    socket.on('message:seen', ({ messageId }) => {
      updateMessageSeen(messageId);
    });

    socket.on('typing:start', ({ userId }) => {
      setTyping(userId, true);
    });

    socket.on('typing:stop', ({ userId }) => {
      setTyping(userId, false);
    });

    socket.on('user:status', ({ userId, isOnline, lastSeen }) => {
      updateOnlineStatus(userId, { isOnline, lastSeen });
    });

    // ── Connection Events ────────────────────────────────────────────────────

    socket.on('connection:request', ({ username }) => {
      toast(`New connection request from ${username}!`, { icon: '👋' });
      useAuthStore.getState().checkAuth();
    });

    socket.on('connection:accepted', ({ username }) => {
      toast(`${username} accepted your connection request!`, { icon: '🤝' });
      useAuthStore.getState().checkAuth();
    });

    // ── Call Events ──────────────────────────────────────────────────────────

    socket.on('call:incoming', (callData) => {
      setIncomingCall(callData);
    });

    socket.on('call:ringing', () => {
      // Handled by call hook
    });

    socket.on('call:ended', () => {
      endCall();
      toast('Call ended', { icon: '📵' });
    });

    socket.on('call:rejected', () => {
      endCall();
      toast('Call rejected', { icon: '📵' });
    });

    socket.on('call:unavailable', () => {
      endCall();
      toast('User is not available', { icon: '📵' });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  const getSocket = () => socketRef.current;

  return (
    <SocketContext.Provider value={{ getSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
