import { cn } from "@/lib/utils";

/**
 * The site's mark: a small painted notice board - flat yellow, black
 * lettering, black frame - carrying the first syllable of "പാലാഴി". Used
 * in the public header and across the admin screens; pass size and text
 * size through `className`.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center border-2 border-black bg-board-500 font-black leading-none text-black",
        className,
      )}
    >
      പാ
    </span>
  );
}
