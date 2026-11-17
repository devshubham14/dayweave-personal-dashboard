import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { TONES, toneDot, type Tone } from "@/lib/tones";

export function TonePicker({ value, onChange }: { value: Tone; onChange: (t: Tone) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
      {TONES.map((t) => (
        <button
          key={t}
          type="button"
          role="radio"
          aria-checked={value === t}
          aria-label={t}
          onClick={() => onChange(t)}
          className={cn(
            "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full ring-offset-2 ring-offset-card transition",
            toneDot[t],
            value === t ? "ring-2 ring-border-strong" : "hover:scale-110",
          )}
        >
          {value === t ? <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} /> : null}
        </button>
      ))}
    </div>
  );
}
