import React from 'react';

type IconName = 'cart' | 'user' | 'search' | 'star-filled' | 'star-empty' | 'plus' | 'minus' | 'trash' | 'chevron-down' | 'logo' | 'check' | 'wishlist' | 'wishlist-filled' | 'offer' | 'truck' | 'microphone' | 'home' | 'category' | 'chevron-left' | 'chevron-right' | 'camera' | 'wallet' | 'gem' | 'ar' | 'live' | 'gift' | 'game-controller' | 'secure-payment' | 'map-pin' | 'sparkles' | 'book-open' | 'flower' | 'plane' | 'filter' | 'return' | 'analytics' | 'print' | 'refresh' | 'upload' | 'chat-bubble';

interface IconProps {
  name: IconName;
  className?: string;
}

const ICONS: Record<IconName, React.ReactNode> = {
  logo: (
    <svg viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: '#D7C0A5'}} />
              <stop offset="50%" style={{stopColor: '#BFA181'}} />
              <stop offset="100%" style={{stopColor: '#A7825D'}} />
          </linearGradient>
      </defs>
      <text x="0" y="30" fontFamily="'Cormorant Garamond', serif" fontSize="35" fontWeight="bold" fill="white">
          whYY
          <tspan fill="url(#gold-gradient)">Outs</tspan>
      </text>
    </svg>
  ),
  cart: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  user: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  ),
  search: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  ),
  'star-filled': (
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  ),
  'star-empty': (
    <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.372 6.577l-5.051.734A1.534 1.534 0 0 0 1.482 9.42a1.518 1.518 0 0 0 .548 1.566l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L12 18.102l4.555 2.396a1.532 1.532 0 0 0 2.226-1.616l-.863-5.031 3.656-3.563a1.518 1.518 0 0 0 .548-1.566z" />
  ),
  plus: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  ),
  minus: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
  ),
  trash: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  ),
  'chevron-down': (
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  ),
  'check': (
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  ),
  'wishlist': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  'wishlist-filled': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  ),
  'offer': (
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2zm12 1a2 2 0 100 4 2 2 0 000-4z" />
  ),
  'truck': (
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 21h6m-6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 114 0 2 2 0 01-4 0zM3 12h18M3 6h10l4 6h4" />
  ),
  'microphone': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  ),
  'home': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  ),
  'category': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  ),
  'chevron-left': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  ),
  'chevron-right': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  ),
  'camera': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zM15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  ),
  'wallet': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  ),
  'gem': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  ),
  'ar': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M4.93 4.93l.707.707M18.36 18.36l.707.707M4.93 19.07l.707-.707M18.36 5.64l.707-.707M4 12H2m20 0h-2m-9-8v2m0 12v2" />
  ),
  'live': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0m-12.728 0a5 5 0 017.072 0" />
  ),
  'gift': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 13l-4-4h8l-4 4zm0-13h4.5a2.5 2.5 0 010 5H12V8zM12 8H7.5a2.5 2.5 0 000 5H12V8z" />
  ),
  'game-controller': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 8.016v.001M6 8.016v.001M12 18.016v.001M9 14h6M9.044 4.025a7.5 7.5 0 0110.456 3.128M3.45 7.153a7.5 7.5 0 001.385 8.95m14.4-1.11a7.5 7.5 0 00-8.95-1.385m-4.321 4.32a7.5 7.5 0 010-10.606" />
  ),
  'secure-payment':(
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 1v22m-6-11h12M4 7h16a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"></path>
  ),
  'map-pin': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  ),
  'sparkles': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.293 2.293a1 1 0 010 1.414L12 12l-2.293 2.293a1 1 0 01-1.414 0L6 12m6 0l2.293-2.293a1 1 0 011.414 0L18 12m-6-6l.007-.007" />
  ),
  'book-open': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  ),
  'flower': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  ),
  'plane': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  ),
  'filter': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2" />
  ),
  'return': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L8 9l11 4-5 2zm0 0l5 5M7.188 8.812a9.025 9.025 0 0112.728 0M2 2l20 20" />
  ),
  'analytics': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2M4 4h16v16H4V4z" />
  ),
  'print': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm7-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  ),
  'refresh': (
    <>
      <polyline points="23 4 23 10 17 10"></polyline>
      <polyline points="1 20 1 14 7 14"></polyline>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
    </>
  ),
  'upload': (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </>
  ),
  'chat-bubble': (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  )
};

const Icon: React.FC<IconProps> = ({ name, className = 'w-6 h-6' }) => {
  const icon = ICONS[name];

  if (name === 'logo') {
    return <div className={className}>{icon}</div>
  }
  
  if (name === 'wishlist-filled') {
     return (
        <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="currentColor" viewBox="0 0 24 24" stroke="currentColor">
            {icon}
        </svg>
     )
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      {icon}
    </svg>
  );
};

export default React.memo(Icon);