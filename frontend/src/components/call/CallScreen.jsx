import { useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';
import useCallStore from '../../store/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import UserAvatar from '../common/UserAvatar';
import './CallScreen.css';

export default function CallScreen() {
  const { activeCall, callStatus, localStream, remoteStream, isAudioMuted, isVideoOff, toggleAudio, toggleVideo } = useCallStore();
  const { endCallHandler } = useWebRTC();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isVideoCall = activeCall?.callType === 'video';
  const callUser = activeCall?.user;

  return (
    <div className="call-screen">
      {/* Remote video / Audio background */}
      {isVideoCall ? (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="remote-video"
        />
      ) : (
        <div className="audio-call-bg">
          <div className="audio-call-pulse">
            <UserAvatar user={callUser} size="xl" />
          </div>
        </div>
      )}

      {/* Call Info */}
      <div className="call-overlay-top">
        <div className="call-user-info">
          {!isVideoCall && <UserAvatar user={callUser} size="lg" />}
          <div>
            <p className="call-user-name">{callUser?.username}</p>
            <p className="call-status-label">
              {callStatus === 'calling'  ? '⏳ Calling...' :
               callStatus === 'connected' ? '🟢 Connected' :
               callStatus === 'ended'    ? '📵 Call ended' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Local video (PiP) */}
      {isVideoCall && (
        <div className="local-video-pip">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="local-video"
          />
        </div>
      )}

      {/* Controls */}
      <div className="call-controls">
        <button
          className={`control-btn ${isAudioMuted ? 'control-active-danger' : ''}`}
          onClick={toggleAudio}
          title={isAudioMuted ? 'Unmute' : 'Mute'}
        >
          {isAudioMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {isVideoCall && (
          <button
            className={`control-btn ${isVideoOff ? 'control-active-danger' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        <button
          className="control-btn control-end"
          onClick={endCallHandler}
          title="End call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}
