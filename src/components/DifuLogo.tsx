import React from 'react';

interface DifuLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function DifuLogo({ className = '', showText = true, size = 'md' }: DifuLogoProps) {
  // Determine dimensions based on size
  const dims = {
    sm: { box: 'h-8 w-8', textTitle: 'text-xs', textSub: 'text-[8px]' },
    md: { box: 'h-10 w-10', textTitle: 'text-sm', textSub: 'text-[10px]' },
    lg: { box: 'h-16 w-16', textTitle: 'text-2xl', textSub: 'text-xs' },
    xl: { box: 'h-24 w-24', textTitle: 'text-4xl', textSub: 'text-sm' },
  }[size];

  return (
    <div className={`flex items-center ${showText ? 'space-x-3' : ''} ${className}`}>
      {/* Icon Wrapper */}
      <div className={`relative ${dims.box} flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(6,182,212,0.15)]"
        >
          <defs>
            {/* Bright Cyan to Indigo Gradient for the main icon */}
            <linearGradient id="difuGrad" x1="10%" y1="10%" x2="90%" y2="90%">
              <stop offset="0%" stopColor="#22d3ee" /> {/* Cyan 400 */}
              <stop offset="30%" stopColor="#06b6d4" /> {/* Cyan 500 */}
              <stop offset="70%" stopColor="#3b82f6" /> {/* Blue 500 */}
              <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo 600 */}
            </linearGradient>

            {/* Glowing effect gradient */}
            <linearGradient id="difuGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
            </linearGradient>

            {/* Metallic overlay */}
            <linearGradient id="metalOver" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Glow background */}
          <circle cx="50" cy="50" r="45" fill="url(#difuGlowGrad)" />

          {/* Left vertical 'D' stem */}
          <path
            d="M 22 25 L 22 65"
            stroke="url(#difuGrad)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Outer Infinity-Pin path */}
          <path
            d="M 22 25 
               C 35 15, 60 25, 62 42
               C 64 55, 78 52, 78 62
               L 71 78
               L 58 68
               C 50 60, 42 68, 22 65"
            stroke="url(#difuGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Secondary beautiful continuous infinity loop overlap */}
          <path
            d="M 22 45 
               C 22 30, 48 30, 48 45 
               C 48 60, 78 60, 78 45
               C 78 30, 48 30, 48 45"
            stroke="url(#difuGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.85"
          />

          {/* Left circle concentric ring & sparkle star */}
          <g>
            <circle cx="35" cy="45" r="9" stroke="url(#difuGrad)" strokeWidth="2" strokeDasharray="3 2" />
            {/* Sparkle star (4-pointed diamond star) */}
            <path
              d="M 35 37 
                 Q 35 45, 27 45 
                 Q 35 45, 35 53 
                 Q 35 45, 43 45 
                 Q 35 45, 35 37 Z"
              fill="#ffffff"
              className="animate-pulse"
            />
          </g>

          {/* Right circle concentric ring, search lens & location pin combo */}
          <g>
            <circle cx="63" cy="45" r="9" stroke="url(#difuGrad)" strokeWidth="2" />
            
            {/* Magnifying glass icon inside right loop */}
            <circle cx="63" cy="45" r="4" stroke="#ffffff" strokeWidth="2.2" />
            <path d="M 66 48 L 71 53" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
            
            {/* Pin head indicator overlay */}
            <path
              d="M 78 45
                 C 78 52, 71 58, 71 66
                 C 71 58, 64 52, 64 45
                 C 64 38, 78 38, 78 45 Z"
              fill="url(#difuGrad)"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinejoin="round"
              opacity="0.9"
            />
            {/* White dot in pin head */}
            <circle cx="71" cy="45" r="1.5" fill="#ffffff" />
          </g>
        </svg>
      </div>

      {/* Brand Text labels */}
      {showText && (
        <div className="flex flex-col">
          <span className={`font-sans font-extrabold text-white tracking-wider leading-none ${dims.textTitle}`}>
            DIFU
          </span>
          <span className={`text-slate-400 font-sans font-medium tracking-widest uppercase -mt-0.5 ${dims.textSub}`}>
            Lost & Found
          </span>
        </div>
      )}
    </div>
  );
}
