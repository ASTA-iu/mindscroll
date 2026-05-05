import React from 'react';

/**
 * Default Avatar Placeholder Component
 * Shows user initials for users without profile images
 */
const DefaultAvatar = ({ user, size = 'md' }) => {
  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Color mapping based on initials
  const getAvatarColor = (initials) => {
    const colors = [
      '#6366f1', // Indigo
      '#8b5cf6', // Purple
      '#d946ef', // Magenta
      '#ec4899', // Pink
      '#f43f5e', // Rose
      '#f97316', // Orange
      '#eab308', // Yellow
      '#84cc16', // Lime
      '#22c55e', // Green
      '#10b981', // Emerald
      '#14b8a6', // Teal
      '#06b6d4', // Cyan
    ];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < initials.length; i++) {
      hash = initials.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials(user?.name);
  const backgroundColor = getAvatarColor(initials);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  return (
    <div
      className={`${sizeClasses[size] || sizeClasses.md} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{
        backgroundColor,
      }}
      title={user?.name || 'User'}
    >
      {initials}
    </div>
  );
};

export default DefaultAvatar;
