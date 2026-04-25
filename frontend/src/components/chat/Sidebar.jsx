import { useState, useEffect } from 'react';
import { Search, Plus, Settings, LogOut, Shield, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { userAPI } from '../../services/api';
import ConversationItem from './ConversationItem';
import UserAvatar from '../common/UserAvatar';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import './Sidebar.css';

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { conversations, loadConversations, setActiveConversation, loadMessages } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await userAPI.search(searchQuery);
        setSearchResults(data.users);
      } catch {
        toast.error('Search failed');
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectUser = (selectedUser) => {
    setActiveConversation(selectedUser);
    loadMessages(selectedUser._id);
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-icon">
            <MessageSquare size={18} />
          </div>
          <span className="brand-name">ConnectX</span>
        </div>
        <div className="sidebar-actions">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => setSearchMode(!searchMode)}
            title="New chat"
          >
            <Plus size={18} />
          </button>
          {user?.isAdmin && (
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => navigate('/admin')}
              title="Admin Panel"
            >
              <Shield size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="sidebar-search">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search users globally..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMode(true);
            }}
            onFocus={() => setSearchMode(true)}
          />
          {searchQuery && (
            <button
              className="search-clear"
              onClick={() => { setSearchQuery(''); setSearchMode(false); setSearchResults([]); }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {searchMode && searchQuery.length >= 2 ? (
          <div className="search-results">
            <p className="section-label">
              {isSearching ? 'Searching...' : `Results (${searchResults.length})`}
            </p>
            {isSearching ? (
              <div className="flex items-center justify-center" style={{ padding: '20px' }}>
                <div className="spinner" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Search size={24} />
                </div>
                <p>No users found for "{searchQuery}"</p>
              </div>
            ) : (
              searchResults.map((u) => (
                <button
                  key={u._id}
                  className="search-result-item"
                  onClick={() => handleSelectUser(u)}
                >
                  <UserAvatar user={u} size="md" showOnline />
                  <div className="result-info">
                    <span className="result-username">{u.username}</span>
                    <span className="result-id">{u.uniqueId}</span>
                  </div>
                  {u.isOnline && <span className="online-badge">Online</span>}
                </button>
              ))
            )}
          </div>
        ) : (
          <div className="conversations-list">
            {user?.pendingRequests?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p className="section-label">Pending Requests ({user.pendingRequests.length})</p>
                {user.pendingRequests.map(reqId => (
                  <PendingRequestItem 
                    key={reqId} 
                    userId={reqId} 
                    onSelect={handleSelectUser} 
                  />
                ))}
              </div>
            )}

            <p className="section-label">Messages</p>
            {conversations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <MessageSquare size={24} />
                </div>
                <p>No conversations yet</p>
                <p style={{ fontSize: '12px' }}>Search for a user to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conversation={conv}
                  onClick={() => handleSelectUser(conv.user)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* User Profile Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-mini" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <UserAvatar user={user} size="sm" showOnline />
          <div className="user-info-mini">
            <span className="user-name-mini">{user?.username}</span>
            <span className="user-id-mini">{user?.uniqueId}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-icon" onClick={handleLogout} title="Logout">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

function PendingRequestItem({ userId, onSelect }) {
  const [userData, setUserData] = useState(null);
  const { acceptConnectionRequest, rejectConnectionRequest } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { userAPI } = await import('../../services/api');
        const res = await userAPI.getById(userId);
        setUserData(res.data.user);
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userData) return null;

  return (
    <div className="search-result-item" style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)', cursor: 'default' }}>
      <UserAvatar user={userData} size="sm" />
      <div className="result-info" onClick={() => onSelect(userData)} style={{ cursor: 'pointer' }}>
        <span className="result-username">{userData.username}</span>
        <span className="result-id">wants to connect</span>
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '4px 8px', fontSize: '11px' }}
          onClick={(e) => { e.stopPropagation(); acceptConnectionRequest(userData._id); }}
        >
          Accept
        </button>
        <button 
          className="btn btn-ghost" 
          style={{ padding: '4px 8px', fontSize: '11px' }}
          onClick={(e) => { e.stopPropagation(); rejectConnectionRequest(userData._id); }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
