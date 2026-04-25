import { create } from 'zustand';

const useCallStore = create((set, get) => ({
  // Call state
  incomingCall: null, // { callId, callerId, callerName, callerAvatar, callType, offer }
  activeCall: null,   // { callId, user, callType, startedAt }
  callStatus: 'idle', // idle | ringing | calling | connected | ended

  localStream: null,
  remoteStream: null,
  peerConnection: null,

  isAudioMuted: false,
  isVideoOff: false,

  setIncomingCall: (call) => set({ incomingCall: call, callStatus: 'ringing' }),
  clearIncomingCall: () => set({ incomingCall: null }),

  setActiveCall: (call) => set({ activeCall: call, callStatus: 'calling' }),
  setCallConnected: () => set({ callStatus: 'connected' }),

  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  toggleAudio: () => {
    const { localStream, isAudioMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = isAudioMuted));
      set({ isAudioMuted: !isAudioMuted });
    }
  },

  toggleVideo: () => {
    const { localStream, isVideoOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = isVideoOff));
      set({ isVideoOff: !isVideoOff });
    }
  },

  endCall: () => {
    const { localStream, peerConnection } = get();
    if (localStream) localStream.getTracks().forEach((t) => t.stop());
    if (peerConnection) peerConnection.close();
    set({
      incomingCall: null,
      activeCall: null,
      callStatus: 'idle',
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isAudioMuted: false,
      isVideoOff: false,
    });
  },
}));

export default useCallStore;
