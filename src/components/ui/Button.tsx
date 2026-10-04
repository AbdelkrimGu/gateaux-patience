import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { LocaleLink as Link } from "@/i18n/LocaleLink";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

/*
  Pill button (B §7). One component, renders:
    - <LocaleLink> (next/link) for internal paths ("/galerie"), keeping the locale
    - <a> for external/tel/wa.me (wa.me opens in a new tab on desktop)
    - <button> when there is no href

  variant  primary  framboise + white (also on dark surfaces: it stays framboise)
           ghost    2px inset paillette outline, for light surfaces
           on-dark  2px inset sucre outline, for the écrin surface
  size     lg 56px (default) · md 52px (sticky bar) · sm 44px (header pill)
*/

export type ButtonVariant = "primary" | "ghost" | "on-dark";
export type ButtonSize = "lg" | "md" | "sm";

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon (e.g. "whatsapp"). 22px on lg/md, 18px on sm. */
  icon?: IconName;
  /** Trailing icon, e.g. "chevron" (mirrors in RTL). */
  iconEnd?: IconName;
  /** Full width. */
  block?: boolean;
  className?: string;
  children: ReactNode;
}

type LinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
    /** Only for internal links. */
    prefetch?: boolean;
  };
type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

export type ButtonProps = LinkProps | NativeButtonProps;

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-framboise text-white hover:bg-framboise-deep active:bg-framboise-deep",
  ghost: "bg-transparent text-paillette shadow-[inset_0_0_0_2px_var(--color-paillette)] hover:bg-paillette hover:text-sucre",
  "on-dark": "bg-transparent text-sucre shadow-[inset_0_0_0_2px_var(--color-sucre)] hover:bg-sucre hover:text-paillette",
};
const SIZES: Record<ButtonSize, string> = {
  lg: "min-h-14 px-6 text-base gap-2.5",
  md: "min-h-[52px] px-5 text-base gap-2.5",
  sm: "min-h-11 px-[18px] text-[15px] gap-2",
};

export function buttonClasses({
  variant = "primary",
  size = "lg",
  block,
  className,
}: Pick<CommonProps, "variant" | "size" | "block" | "className">) {
  return cn(
    "press inline-flex items-center justify-center rounded-pill font-semibold leading-none no-underline",
    "select-none text-center disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className
  );
}

const isInternal = (href: string) => href.startsWith("/") && !href.startsWith("//");

type AnchorRest = Omit<LinkProps, keyof CommonProps>;
type ButtonRest = Omit<NativeButtonProps, keyof CommonProps>;

export function Button(props: ButtonProps) {
  const { variant, size = "lg", icon, iconEnd, block, className, children, ...rest } = props;
  const iconSize = size === "sm" ? 18 : 22;
  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      <span>{children}</span>
      {iconEnd && <Icon name={iconEnd} size={iconSize - 4} />}
    </>
  );
  const classes = buttonClasses({ variant, size, block, className });

  if (rest.href !== undefined) {
    const { href, prefetch, ...anchor } = rest as AnchorRest;
    if (isInternal(href)) {
      return (
        <Link href={href} prefetch={prefetch} className={classes} {...anchor}>
          {content}
        </Link>
      );
    }
    const newTab = /^https?:\/\//.test(href);
    return (
      <a
        href={href}
        className={classes}
        {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...anchor}
      >
        {content}
      </a>
    );
  }

  const { type, ...button } = rest as ButtonRest;
  return (
    <button type={type ?? "button"} className={classes} {...button}>
      {content}
    </button>
  );
}
