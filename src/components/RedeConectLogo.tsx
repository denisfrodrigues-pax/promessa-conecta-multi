interface RedeConectLogoProps {
  size?: number;
  className?: string;
}

export function RedeConectLogo({ size = 36, className }: RedeConectLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="rcGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00E5FF" />
          <stop offset="100%" stopColor="#0077B6" />
        </linearGradient>
        <linearGradient id="rcGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#48CAE4" />
          <stop offset="100%" stopColor="#023E8A" />
        </linearGradient>
      </defs>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="22" stroke="url(#rcGrad1)" strokeWidth="2.5" fill="none" opacity="0.6" />
      {/* Middle ring */}
      <circle cx="24" cy="24" r="15" stroke="url(#rcGrad1)" strokeWidth="2" fill="none" opacity="0.8" />
      {/* Center node */}
      <circle cx="24" cy="24" r="4" fill="url(#rcGrad1)" />
      {/* Connection nodes */}
      <circle cx="24" cy="6" r="3" fill="url(#rcGrad2)" />
      <circle cx="24" cy="42" r="3" fill="url(#rcGrad2)" />
      <circle cx="6" cy="24" r="3" fill="url(#rcGrad2)" />
      <circle cx="42" cy="24" r="3" fill="url(#rcGrad2)" />
      <circle cx="10.5" cy="10.5" r="2.5" fill="#48CAE4" opacity="0.9" />
      <circle cx="37.5" cy="37.5" r="2.5" fill="#48CAE4" opacity="0.9" />
      <circle cx="37.5" cy="10.5" r="2.5" fill="#48CAE4" opacity="0.9" />
      <circle cx="10.5" cy="37.5" r="2.5" fill="#48CAE4" opacity="0.9" />
      {/* Connection lines */}
      <line x1="24" y1="20" x2="24" y2="9" stroke="url(#rcGrad1)" strokeWidth="1.5" opacity="0.7" />
      <line x1="24" y1="28" x2="24" y2="39" stroke="url(#rcGrad1)" strokeWidth="1.5" opacity="0.7" />
      <line x1="20" y1="24" x2="9" y2="24" stroke="url(#rcGrad1)" strokeWidth="1.5" opacity="0.7" />
      <line x1="28" y1="24" x2="39" y2="24" stroke="url(#rcGrad1)" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}
