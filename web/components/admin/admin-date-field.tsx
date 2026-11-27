"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { DayPicker } from "react-day-picker";
import { CalendarDays } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { todayIsoInIST } from "@/lib/dates";

function toDate(value: string) {
  return parseISO(`${value}T12:00:00`);
}

function toIso(value: Date) {
  return format(value, "yyyy-MM-dd");
}

type Props = {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  error?: string;
  className?: string;
  form?: string;
};

/** A calendar control that keeps the server contract as a plain ISO date. */
export function AdminDateField({ id, name, label, defaultValue = "", required, error, className, form }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const selected = value ? toDate(value) : undefined;

  function select(date: Date | undefined) {
    if (!date) return;
    setValue(toIso(date));
    setOpen(false);
  }

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id}>{label}</Label>
      <input type="hidden" id={id} name={name} value={value} required={required} form={form} />
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={
            <Button id={`${id}-trigger`} type="button" variant="outline" className="h-9 w-full justify-between font-normal">
              <span className={value ? "text-foreground" : "text-muted-foreground"}>
                {selected ? format(selected, "d MMM yyyy") : "Choose a date"}
              </span>
              <CalendarDays className="size-4 text-muted-foreground" />
            </Button>
          }
        />
        <Popover.Portal>
          <Popover.Positioner side="bottom" sideOffset={6} className="z-50">
            <Popover.Popup className="rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={select}
                captionLayout="dropdown"
                defaultMonth={selected ?? toDate(todayIsoInIST())}
                classNames={{
                  root: "text-sm",
                  months: "flex",
                  month: "space-y-3",
                  month_caption: "flex h-8 items-center justify-center",
                  dropdowns: "flex gap-1",
                  dropdown: "h-8 rounded-md border bg-background px-1 text-xs",
                  nav: "flex items-center justify-between",
                  button_previous: "absolute mt-[-2.35rem] inline-flex size-7 items-center justify-center rounded-md hover:bg-muted",
                  button_next: "absolute mt-[-2.35rem] ml-[15.5rem] inline-flex size-7 items-center justify-center rounded-md hover:bg-muted",
                  month_grid: "w-full border-collapse",
                  weekdays: "flex",
                  weekday: "w-9 text-center text-xs font-normal text-muted-foreground",
                  week: "mt-1 flex w-full",
                  day: "size-9 p-0 text-center",
                  day_button: "size-9 rounded-md text-sm hover:bg-muted aria-selected:bg-primary aria-selected:text-primary-foreground",
                  selected: "",
                  today: "font-bold text-primary",
                  outside: "text-muted-foreground opacity-50",
                }}
              />
              <div className="mt-3 flex justify-between border-t pt-3">
                <Button type="button" size="sm" variant="ghost" onClick={() => setValue("")}>Clear</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => select(toDate(todayIsoInIST()))}>Today</Button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
