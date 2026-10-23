export function NigeriaCoatOfArms({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="#008751" stroke="#ffffff" strokeWidth="2"/>
      <path d="M30 35 L50 25 L70 35 L70 65 L50 75 L30 65 Z" fill="#ffffff" opacity="0.15"/>
      <rect x="44" y="30" width="12" height="40" fill="#ffffff" rx="1"/>
      <rect x="28" y="44" width="44" height="12" fill="#ffffff" rx="1"/>
      <circle cx="50" cy="50" r="8" fill="#008751" stroke="#ffffff" strokeWidth="1.5"/>
      <text x="50" y="54" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="serif" fontWeight="bold">NG</text>
    </svg>
  );
}

export function NigeriaFlag({ className = "w-8 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="80" fill="#008751"/>
      <rect x="40" width="40" height="80" fill="#ffffff"/>
      <rect x="80" width="40" height="80" fill="#008751"/>
    </svg>
  );
}
