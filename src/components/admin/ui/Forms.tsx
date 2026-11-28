"use client";

import React from "react";
import { Search, X } from "lucide-react";

const baseControlCls =
  "w-full bg-a-subtle hover:border-a-border-strong border rounded-[6px] text-[13px] leading-5 text-a-text-1 placeholder:text-a-text-3 transition-[border-color,box-shadow,background-color] duration-150 focus:outline-none focus:bg-a-surface focus:border-a-accent focus:shadow-[var(--a-ring)] disabled:opacity-60 disabled:cursor-not-allowed";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  numeral?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, numeral, className = "", ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      className={`h-9 px-3 ${
        error ? "border-a-danger" : "border-a-border"
      } ${numeral ? "font-num" : ""} ${baseControlCls} ${className}`}
      {...rest}
    />
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, className = "", rows = 3, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={`p-3 ${
        error ? "border-a-danger" : "border-a-border"
      } ${baseControlCls} ${className}`}
      {...rest}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { error, className = "", children, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      className={`h-9 px-3 cursor-pointer ${
        error ? "border-a-danger" : "border-a-border"
      } ${baseControlCls} ${className}`}
      {...rest}
    >
      {children}
    </select>
  );
});

export function Field({
  label,
  required,
  hint,
  error,
  action,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <label className="block text-[12px] leading-4 font-medium text-a-text-2">
          {label}
          {required && <span className="text-a-danger ml-0.5">*</span>}
        </label>
        {action}
      </div>
      {children}
      {error ? (
        <p className="text-[12px] leading-4 text-a-danger font-medium">{error}</p>
      ) : hint ? (
        <p className="text-[12px] leading-4 text-a-text-3">{hint}</p>
      ) : null}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  inputRef,
  kbd = "/",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  kbd?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-3.5 h-3.5 text-a-text-3 absolute left-3 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-9 pl-8 pr-8 ${baseControlCls} border-a-border`}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 p-1 rounded text-a-text-3 hover:text-a-text-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : kbd ? (
        <span className="hidden sm:inline-flex pointer-events-none absolute right-2.5 px-1.5 py-0.5 rounded bg-a-surface border border-a-border text-[12px] leading-none text-a-text-3">
          {kbd}
        </span>
      ) : null}
    </div>
  );
}

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-[10px] bg-a-subtle border border-a-border ${className}`}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`admin-press inline-flex items-center gap-1.5 min-h-[36px] lg:min-h-[28px] px-3 py-1 rounded-[7px] text-[13px] font-medium cursor-pointer ${
              active
                ? "bg-a-surface text-a-text-1 shadow-[var(--a-shadow-card)] ring-1 ring-a-border"
                : "text-a-text-2 hover:text-a-text-1"
            }`}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={`font-num px-1.5 py-0.5 rounded-full text-[12px] leading-none ${
                  active ? "bg-a-subtle text-a-text-1" : "bg-a-surface/70 text-a-text-3"
                }`}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
