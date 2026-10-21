import { ok, handleApiError } from "@/lib/api-response";
import { clearSession } from "@/lib/session";

export async function POST() {
  try {
    clearSession();
    return ok({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
