"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNITS = {
  crore: 1_00_00_000,
  lakh: 1_00_000,
  rupees: 1,
} as const;

type Unit = keyof typeof UNITS;

function startingValue(value: number | null | undefined): { amount: string; unit: Unit } {
  if (value == null) return { amount: "", unit: "crore" };
  if (value >= UNITS.crore && value % UNITS.crore === 0) return { amount: String(value / UNITS.crore), unit: "crore" };
  if (value >= UNITS.lakh && value % UNITS.lakh === 0) return { amount: String(value / UNITS.lakh), unit: "lakh" };
  return { amount: String(value), unit: "rupees" };
}

export function MoneyInput({ defaultValue }: { defaultValue?: number | null }) {
  const initial = startingValue(defaultValue);
  const [amount, setAmount] = useState(initial.amount);
  const [unit, setUnit] = useState<Unit>(initial.unit);
  const numericAmount = Number(amount);
  const cost = amount !== "" && Number.isFinite(numericAmount) && numericAmount >= 0 ? numericAmount * UNITS[unit] : "";
  const unitLabel = unit === "crore" ? "Crore" : unit === "lakh" ? "Lakh" : "Rupees";

  return (
    <div className="space-y-1">
      <Label htmlFor="cost_amount">Cost</Label>
      <input type="hidden" name="cost_inr" value={cost} />
      <div className="grid grid-cols-[1fr_8.5rem] gap-2">
        <Input
          id="cost_amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          placeholder="e.g. 35"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Select value={unit} onValueChange={(value) => value && setUnit(value as Unit)}>
          <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="crore">Crore</SelectItem>
            <SelectItem value="lakh">Lakh</SelectItem>
            <SelectItem value="rupees">Rupees</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {cost !== "" && (
        <p className="text-xs text-muted-foreground">
          ₹{amount} {unitLabel.toLowerCase()} = ₹{Number(cost).toLocaleString("en-IN")}
        </p>
      )}
    </div>
  );
}
