import { useState } from "react";
import { clsx } from "clsx";

interface AvatarProps {
  src?: string;
  alt: string;
  fallback: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

export default function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showFallback = !src || imageError;

  return (
    <div
      className={clsx(
        "relative rounded-full overflow-hidden flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {showFallback ? (
        <div className="w-full h-full bg-primary flex items-center justify-center">
          <span className="font-bold text-black">{fallback}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}
