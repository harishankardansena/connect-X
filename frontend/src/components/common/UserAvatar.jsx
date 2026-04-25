import './UserAvatar.css';

export default function UserAvatar({ user, size = 'md', showOnline = false, isOnline }) {
  const sizeClass = `avatar-${size}`;
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const online = isOnline !== undefined ? isOnline : user?.isOnline;

  // Generate consistent color from username
  const colors = [
    'linear-gradient(135deg, #7c3aed, #a855f7)',
    'linear-gradient(135deg, #2563eb, #7c3aed)',
    'linear-gradient(135deg, #db2777, #7c3aed)',
    'linear-gradient(135deg, #059669, #2563eb)',
    'linear-gradient(135deg, #d97706, #ef4444)',
    'linear-gradient(135deg, #0891b2, #2563eb)',
  ];

  const colorIndex = (user?.username?.charCodeAt(0) || 0) % colors.length;
  const gradient = colors[colorIndex];

  return (
    <div className="avatar-wrapper">
      <div
        className={`avatar ${sizeClass}`}
        style={{ background: gradient }}
        title={user?.username}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt={user.username} />
        ) : (
          <span>{initial}</span>
        )}
      </div>
      {showOnline && online && <span className="online-dot" />}
    </div>
  );
}
