import * as React from "react";
import { cn } from "@nexus/utils";

export { cn } from "@nexus/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | string;
  size?: "default" | "sm" | "lg" | "icon" | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  children,
  className,
  variant = "default",
  size = "default",
  leftIcon,
  rightIcon,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 gap-2",
        variant === "default" && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        variant === "outline" && "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        variant === "link" && "text-primary underline-offset-4 hover:underline",
        size === "default" && "h-9 px-4 py-2",
        size === "sm" && "h-8 rounded-md px-3 text-xs",
        size === "lg" && "h-10 rounded-md px-8",
        size === "icon" && "h-9 w-9",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {leftIcon && <span className="[&_svg]:size-4">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="[&_svg]:size-4">{rightIcon}</span>}
    </button>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string | undefined;
  errorMessage?: string | undefined;
  helperText?: string | undefined;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      leftIcon,
      rightIcon,
      label,
      errorMessage,
      helperText,
      className,
      id,
      ...inputProps
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || (label ? generatedId : undefined);

    const inputElement = (
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3 flex items-center justify-center text-muted-foreground pointer-events-none [&_svg]:size-4">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            errorMessage && "border-destructive focus-visible:ring-destructive",
            className
          )}
          {...inputProps}
        />
        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-muted-foreground pointer-events-none [&_svg]:size-4">
            {rightIcon}
          </div>
        )}
      </div>
    );

    if (!label && !errorMessage && !helperText) {
      return inputElement;
    }

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        {inputElement}
        {errorMessage ? (
          <p className="text-xs text-destructive">{errorMessage}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "error" | string;
}

export function Alert({ children, className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-md border p-3 text-sm",
        (variant === "destructive" || variant === "error")
          ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-200"
          : "border-border bg-background text-foreground",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export function AlertDescription({ children, className, ...props }: AlertDescriptionProps) {
  return (
    <div {...props} className={cn("text-sm", className)}>
      {children}
    </div>
  );
}

export function Toaster() {
  return null;
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning" | "success" | string;
  size?: "default" | "sm" | string;
  dot?: boolean;
}

export function Badge({ children, className, variant, size, dot, ...props }: BadgeProps) {
  return (
    <span {...props} className={cn("inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  size?: string;
  variant?: string;
}

export function Progress({ value, className, size, variant, ...props }: ProgressProps) {
  return (
    <div {...props} className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-200", className)}>
      <div className="h-full bg-slate-900 transition-all" style={{ width: `${value ?? 0}%` }} />
    </div>
  );
}

export interface SimpleTooltipProps {
  children?: React.ReactNode;
  content?: React.ReactNode;
}

export function SimpleTooltip({ children }: SimpleTooltipProps) {
  return React.createElement(React.Fragment, null, children);
}
