<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Keep the sample campus workspace separate from the authenticated workspace so real account data is never written into demo state.
- Enforce staff-only operations in database policies and audited RPCs; navigation visibility is not authorization.
- Keep student planning and draft records in the owner-scoped planner store, with demo mail and mock connections restricted to demo state so sample data never enters real accounts.
- Derive event timing and necessity from shared planner rules so profile, calendar, and event discovery reflect the same readiness values.
- Scope new university engagement reports to operator-assigned staff universities and record access so changing an editable profile cannot change administrative scope.
- Keep visual campus navigation, carousel, and animation state separate from planner and access rules so presentation changes cannot affect saved data or eligibility.
- Keep the shared atmosphere, scroll choreography, and visual primitives in the UniVerse presentation modules so motion can adapt to device and accessibility settings independently of workspace state.
- Limit direct campus-media reads to uploaders and issue short-lived links only after checking the viewer's access to an uploader-owned attachment, so a post cannot expose another person's file.
