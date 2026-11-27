"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ALL_OPTION = "all";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptionGroup {
  label?: string;
  options: FilterOption[];
}

interface FilterSelectProps {
  id: string;
  label: string;
  value: string | undefined;
  /** One group renders a flat list; several render with headings and separators. */
  groups: FilterOptionGroup[];
  allLabel: string;
  onChange: (value: string | undefined) => void;
}

/** A filter chip: "Platform · Instagram". Inked when a value is set, quiet when it isn't. */
export function FilterSelect({ id, label, value, groups, allLabel, onChange }: FilterSelectProps) {
  const isActive = value !== undefined;
  return (
    <Select
      value={value ?? ALL_OPTION}
      onValueChange={(next) => onChange(next === ALL_OPTION ? undefined : next)}
    >
      <SelectTrigger
        id={id}
        aria-label={label}
        className={cn(
          "h-9 w-auto gap-2 rounded-md px-3 text-sm transition-colors duration-150",
          isActive
            ? "border-ink bg-paper-2 text-ink"
            : "border-input text-ink-2 hover:text-ink hover:bg-paper-2 bg-transparent",
        )}
      >
        <span className="text-ink-2">{label}</span>
        <span aria-hidden className="text-rule-strong">
          ·
        </span>
        <SelectValue />
      </SelectTrigger>
      {/* "popper" opens below the chip instead of covering it. */}
      <SelectContent
        position="popper"
        sideOffset={6}
        align="start"
        className="border-rule max-h-80 min-w-56 rounded-md border shadow-none ring-0"
      >
        <SelectItem value={ALL_OPTION} className="cursor-pointer">
          {allLabel}
        </SelectItem>
        {groups.map((group, index) => (
          <SelectGroup key={group.label ?? index}>
            <SelectSeparator className="bg-rule" />
            {group.label ? <SelectLabel className="eyebrow">{group.label}</SelectLabel> : null}
            {group.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
