'use client';

import React from 'react';

export interface CartoonAvatarProps {
  avatarId?: string;
  nickname: string;
  isHost?: boolean;
  isMe?: boolean;
  status?: 'ALIVE' | 'ELIMINATED';
  size?: number; // default: 110
  showArchedName?: boolean;
  showCheckmark?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CARTOON_AVATAR_LIST = [
  { id: 'char_burger', name: 'Papa Burger', label: 'Papa Flower' },
  { id: 'char_unicorn', name: 'Rainbow Pony', label: 'DIPIGAMING' },
  { id: 'char_dino', name: 'Gamer Dino', label: 'Dino Boy' },
  { id: 'char_cat', name: 'Ninja Cat', label: 'Cool Cat' },
  { id: 'char_robot', name: 'Robo Bot', label: 'Cyber 3000' },
  { id: 'char_fox', name: 'Speed Fox', label: 'Foxy' },
  { id: 'char_panda', name: 'Astro Panda', label: 'Pan Pan' },
  { id: 'char_owl', name: 'Wizard Owl', label: 'Professor' },
  { id: 'char_alien', name: 'Space Alien', label: 'Zorgon' },
  { id: 'char_bear', name: 'King Bear', label: 'Ursus' },
];

export default function CartoonAvatar({
  avatarId = 'char_burger',
  nickname,
  isHost = false,
  isMe = false,
  status = 'ALIVE',
  size = 110,
  showArchedName = true,
  showCheckmark = true,
  className = '',
  onClick,
}: CartoonAvatarProps) {
  // Generate a safe unique ID for SVG textPath
  const safeId = React.useId().replace(/:/g, '_');
  const pathId = `arc_${safeId}`;

  // Render cartoon character graphic
  const renderCharacterGraphic = () => {
    switch (avatarId) {
      // 1. Papa Flower Burger
      case 'char_burger':
        return (
          <g>
            {/* Top Bun */}
            <path
              d="M 28 64 C 28 36, 72 36, 72 64 Z"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="2.5"
            />
            {/* Sesame Seeds */}
            <ellipse cx="42" cy="46" rx="2" ry="1.2" fill="#FEF3C7" />
            <ellipse cx="58" cy="46" rx="2" ry="1.2" fill="#FEF3C7" />
            <ellipse cx="50" cy="40" rx="2" ry="1.2" fill="#FEF3C7" />

            {/* Bulging Crazy Eyes */}
            <circle cx="40" cy="52" r="9" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
            <circle cx="60" cy="52" r="9" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2" />
            {/* Pupils looking slightly crazy */}
            <circle cx="39" cy="51" r="4.2" fill="#0F172A" />
            <circle cx="41" cy="49" r="1.5" fill="#FFFFFF" />
            <circle cx="61" cy="53" r="4.2" fill="#0F172A" />
            <circle cx="63" cy="51" r="1.5" fill="#FFFFFF" />

            {/* Lettuce & Cheese Layers */}
            <path
              d="M 24 64 Q 30 69 36 64 Q 42 69 48 64 Q 54 69 60 64 Q 66 69 72 64 Q 76 69 76 64"
              fill="none"
              stroke="#22C55E"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Cheese triangle */}
            <polygon points="46,65 54,65 50,71" fill="#FBBF24" />

            {/* Patty */}
            <rect x="25" y="66" width="50" height="7" rx="3.5" fill="#78350F" />

            {/* Silly Tongue sticking out */}
            <path d="M 46 68 Q 50 78 54 68 Z" fill="#F43F5E" />

            {/* Bottom Bun */}
            <rect
              x="26"
              y="73"
              width="48"
              height="8"
              rx="4"
              fill="#F59E0B"
              stroke="#B45309"
              strokeWidth="1.8"
            />
          </g>
        );

      // 2. DIPIGAMING Rainbow Unicorn
      case 'char_unicorn':
        return (
          <g>
            {/* Rainbow Mane Behind */}
            <path d="M 32 40 C 18 50, 18 75, 36 82" fill="none" stroke="#F43F5E" strokeWidth="6" strokeLinecap="round" />
            <path d="M 36 38 C 22 50, 22 75, 40 82" fill="none" stroke="#A855F7" strokeWidth="6" strokeLinecap="round" />
            <path d="M 40 36 C 26 50, 26 75, 44 82" fill="none" stroke="#06B6D4" strokeWidth="6" strokeLinecap="round" />

            {/* Unicorn Head / Face */}
            <path
              d="M 42 78 C 36 76 34 62 40 50 C 44 42 56 42 66 48 C 76 54 78 68 70 78 C 62 84 50 82 42 78 Z"
              fill="#F8FAFC"
              stroke="#0284C7"
              strokeWidth="2.5"
            />

            {/* Unicorn Ear */}
            <polygon points="42,46 48,34 52,44" fill="#F8FAFC" stroke="#0284C7" strokeWidth="2" />
            <polygon points="45,44 48,38 50,44" fill="#F472B6" />

            {/* Golden Spiral Horn */}
            <polygon points="56,44 68,22 62,44" fill="#FBBF24" stroke="#D97706" strokeWidth="1.8" />
            <line x1="59" y1="36" x2="64" y2="34" stroke="#F59E0B" strokeWidth="1.5" />
            <line x1="61" y1="28" x2="66" y2="26" stroke="#F59E0B" strokeWidth="1.5" />

            {/* Cute Kawaii Eye */}
            <ellipse cx="60" cy="58" rx="4" ry="5.5" fill="#0F172A" />
            <circle cx="62" cy="56" r="1.8" fill="#FFFFFF" />
            <circle cx="59" cy="61" r="0.8" fill="#FFFFFF" />

            {/* Cheek Blush */}
            <circle cx="52" cy="67" r="4.5" fill="#FDA4AF" opacity="0.8" />

            {/* Star Sparkle near horn */}
            <path d="M 72 26 L 73 30 L 77 31 L 73 32 L 72 36 L 71 32 L 67 31 L 71 30 Z" fill="#FDE047" />
          </g>
        );

      // 3. Gamer Dino
      case 'char_dino':
        return (
          <g>
            {/* Dino Back Spikes */}
            <polygon points="34,44 26,42 32,52" fill="#EAB308" />
            <polygon points="30,56 22,56 28,64" fill="#EAB308" />
            <polygon points="28,68 20,70 28,76" fill="#EAB308" />

            {/* Dino Head */}
            <path
              d="M 35 76 C 30 55 45 38 65 42 C 78 45 80 62 72 74 C 64 82 42 84 35 76 Z"
              fill="#22C55E"
              stroke="#15803D"
              strokeWidth="2.5"
            />
            {/* Belly highlight */}
            <path d="M 40 70 Q 52 78 64 72" fill="none" stroke="#86EFAC" strokeWidth="3" strokeLinecap="round" />

            {/* Big smiling Dino eye */}
            <circle cx="56" cy="50" r="7" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
            <circle cx="57" cy="50" r="3.5" fill="#0F172A" />
            <circle cx="59" cy="48" r="1.2" fill="#FFFFFF" />

            {/* Cute Teeth */}
            <polygon points="68,64 72,66 69,68" fill="#FFFFFF" />
            <polygon points="63,65 66,67 64,69" fill="#FFFFFF" />

            {/* Pink Gaming Headset */}
            <path d="M 38 48 C 42 34 66 32 72 44" fill="none" stroke="#EC4899" strokeWidth="4" strokeLinecap="round" />
            <rect x="34" y="44" width="7" height="12" rx="3.5" fill="#DB2777" />
            <rect x="68" y="44" width="7" height="12" rx="3.5" fill="#DB2777" />
            <path d="M 72 54 Q 78 62 70 65" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <circle cx="70" cy="65" r="2.5" fill="#EC4899" />
          </g>
        );

      // 4. Cool Cat with Sunglasses
      case 'char_cat':
        return (
          <g>
            {/* Cat Ears */}
            <polygon points="32,48 38,28 50,42" fill="#818CF8" stroke="#4338CA" strokeWidth="2" />
            <polygon points="36,44 40,32 46,42" fill="#F472B6" />
            <polygon points="68,48 62,28 50,42" fill="#818CF8" stroke="#4338CA" strokeWidth="2" />
            <polygon points="64,44 60,32 54,42" fill="#F472B6" />

            {/* Cat Face */}
            <circle cx="50" cy="58" r="22" fill="#C7D2FE" stroke="#4338CA" strokeWidth="2.5" />

            {/* Cool Pixel/Dark Sunglasses */}
            <rect x="32" y="50" width="16" height="10" rx="3" fill="#0F172A" stroke="#EF4444" strokeWidth="1.5" />
            <rect x="52" y="50" width="16" height="10" rx="3" fill="#0F172A" stroke="#EF4444" strokeWidth="1.5" />
            <line x1="48" y1="54" x2="52" y2="54" stroke="#EF4444" strokeWidth="2" />
            {/* Lens Glare */}
            <line x1="34" y1="52" x2="38" y2="52" stroke="#FFFFFF" strokeWidth="1.5" />
            <line x1="54" y1="52" x2="58" y2="52" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* Nose & Whiskers */}
            <polygon points="48,65 52,65 50,68" fill="#F43F5E" />
            <line x1="26" y1="64" x2="40" y2="66" stroke="#312E81" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="26" y1="69" x2="40" y2="69" stroke="#312E81" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="74" y1="64" x2="60" y2="66" stroke="#312E81" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="74" y1="69" x2="60" y2="69" stroke="#312E81" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        );

      // 5. Robo Bot
      case 'char_robot':
        return (
          <g>
            {/* Antenna */}
            <line x1="50" y1="36" x2="50" y2="26" stroke="#0284C7" strokeWidth="3" />
            <circle cx="50" cy="24" r="4" fill="#38BDF8" stroke="#0369A1" strokeWidth="1.5" />

            {/* Robot Head Box */}
            <rect x="28" y="36" width="44" height="40" rx="10" fill="#0EA5E9" stroke="#0369A1" strokeWidth="2.5" />

            {/* Ear Bolts */}
            <rect x="22" y="48" width="6" height="12" rx="2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />
            <rect x="72" y="48" width="6" height="12" rx="2" fill="#BAE6FD" stroke="#0369A1" strokeWidth="1.5" />

            {/* Visor Screen */}
            <rect x="34" y="44" width="32" height="14" rx="4" fill="#0F172A" />
            {/* Glowing Eyes */}
            <circle cx="42" cy="51" r="3.5" fill="#22D3EE" />
            <circle cx="58" cy="51" r="3.5" fill="#22D3EE" />

            {/* Speaker Mouth */}
            <line x1="40" y1="66" x2="60" y2="66" stroke="#082F49" strokeWidth="2" strokeDasharray="3 2" />
          </g>
        );

      // 6. Speed Fox
      case 'char_fox':
        return (
          <g>
            {/* Fox Ears */}
            <polygon points="32,46 36,24 50,42" fill="#EA580C" stroke="#9A3412" strokeWidth="2" />
            <polygon points="36,42 40,30 46,42" fill="#475569" />
            <polygon points="68,46 64,24 50,42" fill="#EA580C" stroke="#9A3412" strokeWidth="2" />
            <polygon points="64,42 60,30 54,42" fill="#475569" />

            {/* Fox Face */}
            <polygon points="50,78 28,52 72,52" fill="#F97316" stroke="#9A3412" strokeWidth="2" />
            <polygon points="50,78 36,58 64,58" fill="#FFF7ED" />

            {/* Red Ninja Headband */}
            <rect x="28" y="44" width="44" height="8" rx="2" fill="#DC2626" />
            <circle cx="50" cy="48" r="2.5" fill="#FEF08A" />

            {/* Cute Fox Eyes (Wink on left) */}
            <path d="M 37 57 Q 41 53 45 57" fill="none" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <circle cx="57" cy="57" r="3.2" fill="#0F172A" />
            <circle cx="58" cy="56" r="1" fill="#FFFFFF" />

            {/* Black Nose */}
            <circle cx="50" cy="74" r="2.5" fill="#0F172A" />
          </g>
        );

      // 7. Astro Panda
      case 'char_panda':
        return (
          <g>
            {/* Panda Ears */}
            <circle cx="34" cy="38" r="8" fill="#1E293B" />
            <circle cx="66" cy="38" r="8" fill="#1E293B" />

            {/* Panda Head */}
            <circle cx="50" cy="58" r="23" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2.5" />

            {/* Eye Patches */}
            <ellipse cx="40" cy="54" rx="6" ry="7.5" fill="#1E293B" transform="rotate(-15 40 54)" />
            <ellipse cx="60" cy="54" rx="6" ry="7.5" fill="#1E293B" transform="rotate(15 60 54)" />
            <circle cx="41" cy="53" r="2.2" fill="#FFFFFF" />
            <circle cx="59" cy="53" r="2.2" fill="#FFFFFF" />

            {/* Nose & Mouth */}
            <ellipse cx="50" cy="65" rx="3" ry="2" fill="#1E293B" />
            <path d="M 47 68 Q 50 71 53 68" fill="none" stroke="#1E293B" strokeWidth="1.5" />

            {/* Bamboo leaf */}
            <path d="M 52 69 Q 66 65 70 72 Q 62 76 52 69" fill="#16A34A" />

            {/* Blush */}
            <circle cx="33" cy="64" r="3.5" fill="#FDA4AF" opacity="0.8" />
            <circle cx="67" cy="64" r="3.5" fill="#FDA4AF" opacity="0.8" />
          </g>
        );

      // 8. Wizard Owl
      case 'char_owl':
        return (
          <g>
            {/* Owl Body / Head */}
            <ellipse cx="50" cy="60" rx="23" ry="21" fill="#7C3AED" stroke="#4C1D95" strokeWidth="2" />
            <ellipse cx="50" cy="64" rx="14" ry="13" fill="#EDE9FE" />

            {/* Wizard Mortarboard / Hat */}
            <polygon points="50,22 24,34 50,42 76,34" fill="#1E1B4B" stroke="#FBBF24" strokeWidth="1.5" />
            <rect x="42" y="38" width="16" height="8" rx="2" fill="#312E81" />
            {/* Golden Tassel */}
            <line x1="50" y1="32" x2="68" y2="40" stroke="#F59E0B" strokeWidth="1.8" />
            <circle cx="68" cy="42" r="2" fill="#F59E0B" />

            {/* Big Glasses & Eyes */}
            <circle cx="40" cy="58" r="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.5" />
            <circle cx="60" cy="58" r="8" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.5" />
            <line x1="48" y1="58" x2="52" y2="58" stroke="#F59E0B" strokeWidth="2.5" />
            <circle cx="40" cy="58" r="4" fill="#1E1B4B" />
            <circle cx="60" cy="58" r="4" fill="#1E1B4B" />
            <circle cx="42" cy="56" r="1.5" fill="#FFFFFF" />
            <circle cx="62" cy="56" r="1.5" fill="#FFFFFF" />

            {/* Beak */}
            <polygon points="47,65 53,65 50,71" fill="#F97316" />
          </g>
        );

      // 9. Space Alien
      case 'char_alien':
        return (
          <g>
            {/* Antennae */}
            <line x1="38" y1="38" x2="28" y2="24" stroke="#84CC16" strokeWidth="2.5" />
            <circle cx="26" cy="22" r="3.5" fill="#A855F7" />
            <line x1="62" y1="38" x2="72" y2="24" stroke="#84CC16" strokeWidth="2.5" />
            <circle cx="74" cy="22" r="3.5" fill="#A855F7" />

            {/* Alien Head */}
            <ellipse cx="50" cy="56" rx="24" ry="21" fill="#84CC16" stroke="#4D7C0F" strokeWidth="2.5" />

            {/* 3 Eyes */}
            <circle cx="36" cy="52" r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="36" cy="52" r="2.5" fill="#0F172A" />
            <circle cx="50" cy="46" r="6" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="50" cy="46" r="3" fill="#0F172A" />
            <circle cx="64" cy="52" r="5" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.5" />
            <circle cx="64" cy="52" r="2.5" fill="#0F172A" />

            {/* Wide Smile */}
            <path d="M 40 65 Q 50 72 60 65" fill="none" stroke="#365314" strokeWidth="2.2" strokeLinecap="round" />
          </g>
        );

      // 10. King Bear
      case 'char_bear':
      default:
        // If it's a direct emoji like 🦊, 🦁, etc.
        if (avatarId && !avatarId.startsWith('char_')) {
          return (
            <text
              x="50"
              y="66"
              fontSize="34"
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {avatarId}
            </text>
          );
        }

        return (
          <g>
            {/* Bear Ears */}
            <circle cx="32" cy="38" r="8" fill="#B45309" stroke="#78350F" strokeWidth="2" />
            <circle cx="32" cy="38" r="4.5" fill="#FDE68A" />
            <circle cx="68" cy="38" r="8" fill="#B45309" stroke="#78350F" strokeWidth="2" />
            <circle cx="68" cy="38" r="4.5" fill="#FDE68A" />

            {/* Bear Head */}
            <circle cx="50" cy="58" r="23" fill="#D97706" stroke="#78350F" strokeWidth="2.5" />

            {/* Golden Crown */}
            <polygon points="40,36 44,26 50,32 56,26 60,36" fill="#FBBF24" stroke="#B45309" strokeWidth="1.5" />
            <circle cx="50" cy="29" r="1.5" fill="#EF4444" />

            {/* Muzzle */}
            <ellipse cx="50" cy="65" rx="11" ry="8" fill="#FDE68A" />
            <ellipse cx="50" cy="61" rx="4" ry="2.5" fill="#78350F" />
            <path d="M 47 67 Q 50 70 53 67" fill="none" stroke="#78350F" strokeWidth="1.8" />

            {/* Eyes */}
            <circle cx="41" cy="53" r="2.5" fill="#451A03" />
            <circle cx="59" cy="53" r="2.5" fill="#451A03" />
          </g>
        );
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center justify-center select-none transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full overflow-visible drop-shadow-md"
      >
        <defs>
          {/* Arched path for player name curved over the head */}
          <path
            id={pathId}
            d="M 16,66 A 44,44 0 1,1 104,66"
            fill="none"
          />
          {/* Gradients */}
          <radialGradient id={`bg_${safeId}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="100%" stopColor="#FFF8E1" />
          </radialGradient>
        </defs>

        {/* Outer Circular Badge Frame with thick border */}
        <circle
          cx="60"
          cy="66"
          r="44"
          fill={`url(#bg_${safeId})`}
          stroke={isHost ? '#FFC107' : '#E5E0D5'}
          strokeWidth="3.5"
          className="transition-colors"
        />

        {/* Inner glow circle */}
        <circle
          cx="60"
          cy="66"
          r="41"
          fill="none"
          stroke={isHost ? 'rgba(255, 193, 7, 0.4)' : 'rgba(229, 224, 213, 0.6)'}
          strokeWidth="1.5"
        />

        {/* Cartoon Character inside */}
        <g transform="translate(10, 8)">
          {renderCharacterGraphic()}
        </g>

        {/* Arched Nickname curved over top of circle */}
        {showArchedName && (
          <text
            className="font-extrabold text-[11px] fill-[#333333] tracking-wide"
            style={{
              textShadow: '0 1px 2px rgba(255,255,255,0.9), 0 0 1px rgba(0,0,0,0.1)',
              fontFamily: 'inherit',
            }}
          >
            <textPath
              href={`#${pathId}`}
              startOffset="50%"
              textAnchor="middle"
            >
              {nickname.length > 15 ? nickname.slice(0, 14) + '…' : nickname}
            </textPath>
          </text>
        )}
      </svg>

      {/* Host Badge Pill (Bottom Center / Left) */}
      {isHost && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FFC107] text-[#333333] border-2 border-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
          <span>HOST</span>
          {showCheckmark && <span className="text-[10px]">✓</span>}
        </div>
      )}

      {/* Green Checkmark Badge (Bottom Right if not host, or standard) */}
      {!isHost && showCheckmark && (
        <div className="absolute bottom-0 right-1 z-10 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-black shadow-sm">
          ✓
        </div>
      )}

      {/* "Bạn" tag if this is the current player */}
      {isMe && !isHost && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10 px-2 py-0.2 rounded-full bg-[#FFF8E1] border border-[#FFE082] text-[#B45309] text-[9px] font-extrabold uppercase tracking-wider shadow-sm">
          BẠN
        </div>
      )}
    </div>
  );
}
