import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20'
  };

  return (
    <div className={`${className}`}>
      <img
        src="/Assets/icon-128.png"
        alt="WytNet Logo"
        className={`${sizes[size]} w-auto object-contain drop-shadow-sm`}
      />
    </div>
  );
};

export default Logo;
