import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

/**
 * Logo NutriPlanner. Utiliser partout au lieu d'une icône Leaf générique.
 */
export default function Logo({ size = 28, className, showText = false }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="NutriPlanner"
      >
        <rect width="64" height="64" rx="14" fill="url(#logo-bg)" />
        <circle cx="32" cy="38" r="14" stroke="#ffffff" strokeWidth="2.5" fill="none" opacity="0.5" />
        <path
          d="M32 16 C 24 22, 22 32, 28 38 C 28 38, 32 32, 32 22 C 32 32, 36 38, 36 38 C 42 32, 40 22, 32 16 Z"
          fill="#ffffff"
        />
        <line x1="32" y1="22" x2="32" y2="44" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#16a34a" />
            <stop offset="1" stopColor="#15803d" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="font-bold tracking-tight">
          Nutri<span className="text-primary">Planner</span>
        </span>
      )}
    </div>
  );
}
