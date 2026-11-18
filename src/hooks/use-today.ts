import { useNow } from "@/hooks/use-now";
import { toISODate } from "@/lib/format";

/** Today's local date (yyyy-MM-dd); rolls over at midnight while the app is open. */
export function useToday(): string {
  return toISODate(useNow());
}
