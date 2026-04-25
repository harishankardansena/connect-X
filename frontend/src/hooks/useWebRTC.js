import { useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import useCallStore from '../store/callStore';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.voiparound.com' },
    { urls: 'stun:stun.voipbuster.com' },
    { urls: 'stun:stun.voipstunt.com' },
  ],
};

export const useWebRTC = () => {
  const { getSocket } = useSocket();
  const pcRef = useRef(null);
  const {
    setLocalStream, setRemoteStream, setPeerConnection,
    setActiveCall, setCallConnected, endCall: storeEndCall,
    localStream, activeCall,
  } = useCallStore();

  const createPeerConnection = useCallback((onRemoteStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    setPeerConnection(pc);

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (onRemoteStream) onRemoteStream(event.streams[0]);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const socket = getSocket();
        const targetId = useCallStore.getState().activeCall?.user?._id ||
                         useCallStore.getState().incomingCall?.callerId;
        if (socket && targetId) {
          socket.emit('call:ice-candidate', {
            receiverId: targetId,
            candidate: event.candidate,
          });
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('❄️ ICE Connection State:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed') {
        toast.error('Connection failed. Please try again on Wi-Fi.');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('🤝 Peer Connection State:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setCallConnected();
        toast.success('Call connected!');
      }
    };

    return pc;
  }, [getSocket, setPeerConnection, setRemoteStream, setCallConnected]);

  // Initiate a call
  const startCall = useCallback(async (targetUser, callType = 'audio') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);
      setActiveCall({ user: targetUser, callType, startedAt: null });

      const pc = createPeerConnection();

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket?.emit('call:offer', {
        receiverId: targetUser._id,
        offer,
        callType,
      });

      // Listen for answer and ICE on this socket
      socket?.once('call:answered', async ({ answer, callId }) => {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        setActiveCall((prev) => ({ ...prev, callId }));
      });

      socket?.on('call:ice-candidate', async ({ candidate }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      });
    } catch (err) {
      toast.error('Could not access camera/microphone: ' + err.message);
      storeEndCall();
    }
  }, [createPeerConnection, getSocket, setActiveCall, setLocalStream, storeEndCall]);

  // Answer an incoming call
  const answerCall = useCallback(async (callData) => {
    try {
      const { callId, callerId, offer, callType } = callData;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });

      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      socket?.emit('call:answer', { callId, callerId, answer });

      socket?.on('call:ice-candidate', async ({ candidate }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {}
      });
    } catch (err) {
      toast.error('Could not answer call: ' + err.message);
      storeEndCall();
    }
  }, [createPeerConnection, getSocket, setLocalStream, storeEndCall]);

  // End active call
  const endCallHandler = useCallback(() => {
    const socket = getSocket();
    const callState = useCallStore.getState();

    if (socket) {
      socket.emit('call:end', {
        callId: callState.activeCall?.callId,
        receiverId: callState.activeCall?.user?._id || callState.incomingCall?.callerId,
      });
    }
    storeEndCall();
  }, [getSocket, storeEndCall]);

  // Reject incoming call
  const rejectCall = useCallback((callData) => {
    const socket = getSocket();
    socket?.emit('call:reject', { callId: callData.callId, callerId: callData.callerId });
    storeEndCall();
  }, [getSocket, storeEndCall]);

  return { startCall, answerCall, endCallHandler, rejectCall };
};
