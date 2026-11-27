import "server-only";
import { revalidatePath, updateTag } from "next/cache";

/** Revalidates every public route an issue's own page or listings could
 * appear on, plus the home page stats, so an edit goes live immediately
 * despite page caching. Call it from any admin action that changes what
 * the public sees of an issue. */
export function revalidatePublicRoutes(slug: string, areas: string[]) {
  for (const locale of ["en", "ml"]) {
    revalidatePath(`/${locale}/issues/${slug}`);
    revalidatePath(`/${locale}/issues`);
    revalidatePath(`/${locale}`);
    for (const area of areas) {
      revalidatePath(`/${locale}/issues/area/${area}`);
    }
  }
  updateTag("stats-summary");
}
