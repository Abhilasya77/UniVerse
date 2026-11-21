import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const campusMediaPath =
  /^([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})\/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.(?:jpeg|png|webp)$/;

export async function signCampusPhoto(
  supabase: SupabaseClient<Database>,
  userId: string,
  path: string,
) {
  const owner = campusMediaPath.exec(path)?.[1];
  if (!owner) return null;

  const expiresIn = 120;
  if (userId === owner) {
    const { data } = await supabase.storage.from("campus-media").createSignedUrl(path, expiresIn);
    return data?.signedUrl ?? null;
  }

  // Storage only accepts uploads under the uploader's account prefix. An attachment
  // must also belong to that uploader, not just reference the same filename.
  const [events, items, complaints] = await Promise.all([
    supabase.from("events").select("id").eq("poster", path).eq("owner", owner).limit(1),
    supabase.from("items").select("id").eq("photo", path).eq("owner", owner).limit(1),
    // The queue checks staff roles and department assignments. Complaint writes
    // enforce the uploader prefix, so a ticket cannot point at another user's file.
    supabase.rpc("campus_service_queue").eq("photo", path).limit(1),
  ]);
  if (![events, items, complaints].some(({ data, error }) => !error && data?.length)) return null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.storage.from("campus-media").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}