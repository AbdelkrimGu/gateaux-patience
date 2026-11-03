import { cn } from "@/lib/utils";

/** Tiny uppercase label above a title (Arabic: no uppercase, no tracking). */
export default function Eyebrow({
  children,
  className,
  as: Tag = "p",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "p" | "span" | "div" }) {
  return (
    <Tag
      className={cn(
        "text-step-small font-medium uppercase tracking-[0.16em] text-tone-muted",
        "rtl:normal-case rtl:tracking-normal",
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
