import { cn } from "@loadwhiz/ui/lib/utils";

export const LOGO_SRC = "/logo.png";
export const FAVICON_SRC = "/favicon.png";
export const APPLE_TOUCH_ICON_SRC = "/apple-touch-icon.png";

const sizeStyles = {
  sm: {
    img: "h-7 max-h-7 max-w-9 w-auto",
    wordmark: "text-base",
  },
  md: {
    img: "h-8 max-h-8 max-w-10 w-auto",
    wordmark: "text-lg",
  },
  lg: {
    img: "h-9 max-h-9 max-w-12 w-auto",
    wordmark: "text-xl",
  },
} as const;

type AppLogoProps = {
  className?: string;
  size?: keyof typeof sizeStyles;
  showWordmark?: boolean;
};

export function AppLogo({
  className,
  size = "md",
  showWordmark = true,
}: AppLogoProps) {
  const styles = sizeStyles[size];

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={LOGO_SRC}
        alt=""
        decoding="async"
        className={cn(styles.img, "block shrink-0")}
      />
      {showWordmark ? (
        <span className={cn("truncate font-bold tracking-tight", styles.wordmark)}>
          Load<span className="text-primary">Whiz</span>
        </span>
      ) : null}
    </span>
  );
}
