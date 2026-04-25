import { useState } from 'react';
import { User, Camera, Mail, Save, ArrowLeft, Loader2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { mediaAPI } from '../../services/api';
import UserAvatar from '../../components/common/UserAvatar';
import toast from 'react-hot-toast';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      // Create local preview
      const reader = new FileReader();
      reader.onload = (ev) => setAvatarPreview(ev.target.result);
      reader.readAsDataURL(file);

      // Upload to Cloudinary
      const { data } = await mediaAPI.upload(formData);
      setAvatarPreview(data.mediaUrl);
      toast.success('Avatar uploaded!');
    } catch (err) {
      toast.error('Failed to upload avatar');
      setAvatarPreview(user?.avatar || '');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ bio, avatar: avatarPreview });
      toast.success('Profile updated successfully');
      navigate('/chat');
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page animate-fade-in">
      <div className="profile-header">
        <button className="btn btn-ghost btn-icon" onClick={() => navigate('/chat')}>
          <ArrowLeft size={20} />
        </button>
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        <div className="profile-card glass">
          <div className="avatar-section">
            <div className="avatar-edit-wrapper">
              <UserAvatar user={{ ...user, avatar: avatarPreview }} size="xl" />
              <label className="avatar-edit-btn">
                <Camera size={18} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} hidden disabled={uploading} />
              </label>
              {uploading && <div className="avatar-loader"><Loader2 size={24} className="animate-spin" /></div>}
            </div>
            <h2 className="profile-username">{user?.username}</h2>
            <p className="profile-id">{user?.uniqueId}</p>
          </div>

          <div className="profile-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-locked">
                <Mail size={16} />
                <span>{user?.email}</span>
                <span className="lock-badge">Private</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio (Tell others about yourself)</label>
              <textarea 
                className="input-field" 
                placeholder="Write something about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={150}
                rows={4}
              />
              <span className="char-count">{bio.length}/150</span>
            </div>

            <button 
              className="btn btn-primary w-full profile-save-btn" 
              onClick={handleSave}
              disabled={saving || uploading}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="profile-info-grid">
          <div className="info-card glass">
            <h3>Privacy Information</h3>
            <p>Your unique ID <strong>{user?.uniqueId}</strong> is how others can find you without needing a phone number.</p>
          </div>
          <div className="info-card glass">
            <h3>Account Status</h3>
            <div className="status-item">
              <span>Member since:</span>
              <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
            <div className="status-item">
              <span>Role:</span>
              <span className={user?.isAdmin ? 'text-accent' : ''}>{user?.isAdmin ? 'Administrator' : 'Standard User'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
