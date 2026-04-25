import { create } from 'zustand';
import { messageAPI } from '../services/api';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null, // { user, messages }
  typingUsers: {},           // { userId: boolean }
  onlineUsers: {},           // { userId: { isOnline, lastSeen } }

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (user) => {
    set({ activeConversation: { user, messages: [] } });
  },

  loadConversations: async () => {
    try {
      const { data } = await messageAPI.getConversations();
      set({ conversations: data.conversations });
    } catch (err) {
      console.error('Failed to load conversations', err);
    }
  },

  loadMessages: async (userId) => {
    try {
      const { data } = await messageAPI.getConversation(userId);
      set((state) => ({
        activeConversation: state.activeConversation
          ? { ...state.activeConversation, messages: data.messages }
          : null,
      }));
    } catch (err) {
      console.error('Failed to load messages', err);
    }
  },

  addMessage: (message) => {
    set((state) => {
      const isActive =
        state.activeConversation?.user._id === message.senderId?._id ||
        state.activeConversation?.user._id === message.receiverId?._id;

      const active = isActive
        ? {
            ...state.activeConversation,
            messages: [...(state.activeConversation?.messages || []), message],
          }
        : state.activeConversation;

      // Update conversation list
      const existingIdx = state.conversations.findIndex(
        (c) => c._id === message.senderId?._id || c._id === message.receiverId?._id
      );

      return { activeConversation: active };
    });
  },

  updateMessageSeen: (messageId) => {
    set((state) => ({
      activeConversation: state.activeConversation
        ? {
            ...state.activeConversation,
            messages: state.activeConversation.messages.map((m) =>
              m._id === messageId ? { ...m, seen: true } : m
            ),
          }
        : null,
    }));
  },

  setTyping: (userId, isTyping) => {
    set((state) => ({ typingUsers: { ...state.typingUsers, [userId]: isTyping } }));
  },

  updateOnlineStatus: (userId, status) => {
    set((state) => ({ onlineUsers: { ...state.onlineUsers, [userId]: status } }));
  },

  clearActiveConversation: () => set({ activeConversation: null }),
}));

export default useChatStore;
