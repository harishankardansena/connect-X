import { useState, useEffect } from 'react';
import { Shield, ShieldAlert, PhoneOff, Trash2, Search, Activity, Users, MessageSquare, PhoneCall } from 'lucide-react';
import { adminAPI } from '../../services/api';
import useAuthStore from '../../store/authStore';
import UserAvatar from '../../components/common/UserAvatar';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import './AdminPanel.css';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('users'); // users | stats | calls
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [callLogs, setCallLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadData();
  }, [activeTab, search, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        const { data } = await adminAPI.getStats();
        setStats(data.stats);
      } else if (activeTab === 'users') {
        const { data } = await adminAPI.getUsers({ search, limit: 50 });
        setUsers(data.users);
      } else if (activeTab === 'calls') {
        const { data } = await adminAPI.getCallLogs({ limit: 50 });
        setCallLogs(data.logs);
      }
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId, isSuspended) => {
    try {
      const reason = isSuspended ? '' : window.prompt('Reason for suspension:');
      if (!isSuspended && reason === null) return;
      
      await adminAPI.suspendUser(userId, reason || 'Policy violation');
      toast.success(isSuspended ? 'User unsuspended' : 'User suspended');
      loadData();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you ABSOLUTELY sure? This deletes the user and ALL their messages/media forever.')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User permanently deleted');
      loadData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="admin-page">
        <div className="empty-state">
          <ShieldAlert size={48} color="var(--error-color)" />
          <h2>Access Denied</h2>
          <p>You do not have administrative privileges.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <div className="admin-brand">
          <Shield size={24} className="accent-color" />
          <h2>Admin Control</h2>
        </div>
        
        <nav className="admin-nav">
          <button className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Users size={18} /> Manage Users
          </button>
          <button className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>
            <Activity size={18} /> System Stats
          </button>
          <button className={`admin-nav-item ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')}>
            <PhoneCall size={18} /> Call Logs
          </button>
        </nav>
      </div>

      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {activeTab === 'users' && 'User Management'}
            {activeTab === 'stats' && 'System Overview'}
            {activeTab === 'calls' && 'Call Logs'}
          </h1>
          
          {activeTab === 'users' && (
            <div className="admin-search">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="admin-body">
          {loading ? (
            <div className="admin-loading"><div className="spinner-lg" /></div>
          ) : (
            <>
              {/* STATS VIEW */}
              {activeTab === 'stats' && stats && (
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-info">
                      <p className="stat-value">{stats.totalUsers}</p>
                      <p className="stat-label">Total Users</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon online"><Activity size={24} /></div>
                    <div className="stat-info">
                      <p className="stat-value">{stats.activeUsers}</p>
                      <p className="stat-label">Users Online</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon warning"><ShieldAlert size={24} /></div>
                    <div className="stat-info">
                      <p className="stat-value">{stats.suspendedUsers}</p>
                      <p className="stat-label">Suspended Users</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon purple"><MessageSquare size={24} /></div>
                    <div className="stat-info">
                      <p className="stat-value">{stats.totalMessages}</p>
                      <p className="stat-label">Total Messages</p>
                    </div>
                  </div>
                </div>
              )}

              {/* USERS VIEW */}
              {activeTab === 'users' && (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u._id} className={u.isSuspended ? 'row-suspended' : ''}>
                          <td>
                            <div className="table-user">
                              <UserAvatar user={u} size="sm" showOnline />
                              <div>
                                <p className="table-username">{u.username} {u.isAdmin && <span className="badge badge-primary">Admin</span>}</p>
                                <p className="table-id">{u.uniqueId}</p>
                              </div>
                            </div>
                          </td>
                          <td>
                            {u.isSuspended ? (
                              <span className="badge badge-danger">Suspended</span>
                            ) : u.isOnline ? (
                              <span className="badge badge-success">Online</span>
                            ) : (
                              <span className="badge badge-warning">Offline</span>
                            )}
                          </td>
                          <td className="table-date">{format(new Date(u.createdAt), 'MMM d, yyyy')}</td>
                          <td>
                            <div className="table-actions">
                              {!u.isAdmin && (
                                <>
                                  <button 
                                    className={`btn btn-sm ${u.isSuspended ? 'btn-ghost' : 'btn-ghost'}`}
                                    onClick={() => handleSuspend(u._id, u.isSuspended)}
                                    style={{ color: u.isSuspended ? 'var(--online-color)' : 'var(--warning-color)' }}
                                  >
                                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => handleDelete(u._id)}
                                    style={{ color: 'var(--error-color)' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CALL LOGS VIEW */}
              {activeTab === 'calls' && (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Caller</th>
                        <th>Receiver</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {callLogs.map(log => (
                        <tr key={log._id}>
                          <td className="table-date">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</td>
                          <td>
                            <div className="table-user">
                              <UserAvatar user={log.caller} size="sm" />
                              <span className="table-username">{log.caller?.username || 'Deleted User'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="table-user">
                              <UserAvatar user={log.receiver} size="sm" />
                              <span className="table-username">{log.receiver?.username || 'Deleted User'}</span>
                            </div>
                          </td>
                          <td><span className="badge">{log.type}</span></td>
                          <td>
                            <span className={`badge ${log.status === 'answered' ? 'badge-success' : log.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="table-date">
                            {log.duration > 0 ? `${Math.floor(log.duration / 60)}m ${log.duration % 60}s` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
