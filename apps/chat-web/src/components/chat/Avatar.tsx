export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

// Generate avatar color based on name
function getAvatarColor(str: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-indigo-500', 'bg-red-500',
    'bg-amber-500', 'bg-cyan-500'
  ];
  const index = str.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`
      ${sizeClasses[size]} ${getAvatarColor(name)}
      rounded-lg flex-shrink-0 flex items-center justify-center text-white font-semibold
    `}>
      {initial}
    </div>
  );
}
