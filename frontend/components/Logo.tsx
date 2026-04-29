"use client"

import Image from 'next/image';

interface LogoProps {
  /** Tailwind size classes for the icon, e.g. "h-7 w-7" */
  iconSize?: string;
  /** Show or hide the "DiagNote" wordmark */
  showText?: boolean;
  /** Override default wordmark styles */
  textClassName?: string;
  /** Applied to the outer wrapper div */
  className?: string;
}

export default function Logo({
  iconSize = 'h-8 w-8',
  showText = true,
  textClassName,
  className = '',
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative flex-shrink-0 ${iconSize}`}>
        <Image
          src="/logo.svg"
          alt="DiagNote"
          fill
          className="object-contain"
        />
      </div>

      {showText && (
        <span className={textClassName ?? 'font-extrabold tracking-tight text-white'}>
          DiagNote
        </span>
      )}
    </div>
  );
}
