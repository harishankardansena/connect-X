import { Phone, PhoneOff, Video } from 'lucide-react';
import useCallStore from '../../store/callStore';
import { useWebRTC } from '../../hooks/useWebRTC';
import UserAvatar from '../common/UserAvatar';
import './IncomingCall.css';

export default function IncomingCall() {
  const { incomingCall, clearIncomingCall } = useCallStore();
  const { answerCall, rejectCall } = useWebRTC();

  if (!incomingCall) return null;

  const handleAnswer = () => {
    answerCall(incomingCall);
    clearIncomingCall();
  };

  const handleReject = () => {
    rejectCall(incomingCall);
    clearIncomingCall();
  };

  const callerUser = {
    _id: incomingCall.callerId,
    username: incomingCall.callerName,
    avatar: incomingCall.callerAvatar,
  };

  return (
    <div className="incoming-overlay">
      <div className="incoming-card animate-fade-up">
        <div className="incoming-ripple">
          <div className="ripple-ring r1" />
          <div className="ripple-ring r2" />
          <div className="ripple-ring r3" />
          <UserAvatar user={callerUser} size="xl" />
        </div>

        <div className="incoming-info">
          <p className="incoming-name">{incomingCall.callerName}</p>
          <p className="incoming-type">
            {incomingCall.callType === 'video' ? '📹 Incoming video call' : '📞 Incoming audio call'}
          </p>
        </div>

        <div className="incoming-actions">
          <div className="call-action-btn reject-btn" onClick={handleReject}>
            <PhoneOff size={24} />
          </div>
          <div className="call-action-btn accept-btn" onClick={handleAnswer}>
            {incomingCall.callType === 'video' ? <Video size={24} /> : <Phone size={24} />}
          </div>
        </div>
      </div>
    </div>
  );
}
