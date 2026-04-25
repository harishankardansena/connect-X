import { useEffect } from 'react';
import Sidebar from '../../components/chat/Sidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import IncomingCall from '../../components/call/IncomingCall';
import CallScreen from '../../components/call/CallScreen';
import useChatStore from '../../store/chatStore';
import useCallStore from '../../store/callStore';
import './Chat.css';

export default function ChatPage() {
  const { loadConversations, activeConversation } = useChatStore();
  const { incomingCall, activeCall } = useCallStore();

  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className={`chat-page ${activeConversation ? 'chat-active-mobile' : ''}`}>
      <Sidebar />
      <ChatWindow />

      {/* Call overlays */}
      {incomingCall && !activeCall && <IncomingCall />}
      {activeCall && <CallScreen />}
    </div>
  );
}
