"use client";

import { Label } from "@/components/ui/label";
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
  allLabel?: string;
  disabled?: boolean;
  className?: string;
  onChange: (value: string | undefined) => void;
}

export function FilterSelect({
  id,
  label,
  value,
  groups,
  allLabel,
  disabled,
  className,
  onChange,
}: FilterSelectProps) {
  return (
    <div className={className ?? "flex w-full flex-col gap-1.5 sm:w-44"}>
      <Label htmlFor={id} className="text-muted-foreground text-xs">
        {label}
      </Label>
      <Select
        value={value ?? ALL_OPTION}
        disabled={disabled}
        onValueChange={(next) => onChange(next === ALL_OPTION ? undefined : next)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        {/* "popper" opens the menu below the trigger at its width, instead of over it. */}
        <SelectContent position="popper" sideOffset={4} className="max-h-80">
          {allLabel ? (
            <SelectItem value={ALL_OPTION} className="cursor-pointer">
              {allLabel}
            </SelectItem>
          ) : null}
          {groups.map((group, index) => (
            <SelectGroup key={group.label ?? index}>
              {(allLabel || index > 0) && groups.length > 1 ? <SelectSeparator /> : null}
              {group.label ? <SelectLabel>{group.label}</SelectLabel> : null}
              {group.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
