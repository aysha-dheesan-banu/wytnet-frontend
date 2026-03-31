import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showText = true, size = 'md' }) => {
  const sizes = {
    sm: 'h-6',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* The Multi-colored Bird in Cloud Logo */}
      <svg 
        viewBox="0 0 200 120" 
        className={`${sizes[size]} w-auto drop-shadow-sm`}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Cloud/Background with Gradient */}
        <defs>
          <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00AEEF" />
            <stop offset="30%" stopColor="#8DC63F" />
            <stop offset="60%" stopColor="#FFDE17" />
            <stop offset="90%" stopColor="#F15A24" />
          </linearGradient>
        </defs>
        
        {/* Stylized Cloud Shape */}
        <path 
          d="M140 60C140 82.0914 122.091 100 100 100C77.9086 100 60 82.0914 60 60C60 37.9086 77.9086 20 100 20C122.091 20 140 37.9086 140 60Z" 
          fill="url(#cloudGradient)" 
          opacity="0.9"
        />
        <path 
          d="M120 40C120 56.5685 106.569 70 90 70C73.4315 70 60 56.5685 60 40C60 23.4315 73.4315 10 90 10C106.569 10 120 23.4315 120 40Z" 
          fill="#47bfff" 
        />
        <path 
          d="M150 70C150 86.5685 136.569 100 120 100C103.431 100 90 86.5685 90 70C90 53.4315 103.431 40 120 40C136.569 40 150 53.4315 150 70Z" 
          fill="#fcd34d" 
        />
        <path 
          d="M100 90C100 103.807 88.8071 115 75 115C61.1929 115 50 103.807 50 90C50 76.1929 61.1929 65 75 65C88.8071 65 100 76.1929 100 90Z" 
          fill="#ef4444" 
        />

        {/* The White Bird (Dove) - Tailored to match your image exactly */}
        <path 
          d="M150 45C140 35 120 30 100 40C80 50 70 70 90 85C100 92 120 95 140 85C155 75 160 55 150 45Z" 
          fill="white" 
          stroke="white" 
          strokeWidth="1"
        />
        <path 
          d="M150 45L165 48L158 55Z" 
          fill="white"
        />
        <path 
          d="M165 52A1.5 1.5 0 1 0 165 49A1.5 1.5 0 0 0 165 52Z" 
          fill="#22c55e" 
        />
        
        {/* Inner Wing Detail */}
        <path 
          d="M110 50C100 55 95 65 105 75" 
          stroke="#00AEEF" 
          strokeWidth="1" 
          strokeLinecap="round" 
          opacity="0.1"
        />
      </svg>
      {showText && (
        <span className="text-2xl font-black text-[#0078d4] tracking-tighter -ml-1">WytNet</span>
      )}
    </div>
  );
};

export default Logo;
