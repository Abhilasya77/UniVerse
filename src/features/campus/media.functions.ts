import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const campusPhotoLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ path: z.string().max(100) }))
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "private, no-store");
    const { signCampusPhoto } = await import("./media.server");
    const link = await signCampusPhoto(context.supabase, context.userId, data.path);
    if (!link) return null;

    // Return only the signed storage suffix. The browser uses its configured
    // Cloud URL, which can differ from the isolated server's runtime URL.
    const signed = new URL(link);
    const prefix = "/storage/v1";
    const index = signed.pathname.indexOf(`${prefix}/object/sign/campus-media/`);
    if (index < 0) return null;
    return signed.pathname.slice(index) + signed.search;
  });