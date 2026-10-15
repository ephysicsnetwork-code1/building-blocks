<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All portal data access goes through server functions in src/lib/portal.functions.ts using the admin client; tables have RLS on with no public policies, so the browser never touches them directly.
- Admin auth is a signed HMAC token (ADMIN_SESSION_SECRET) checked in every admin server function; credentials and the Telegram bot token live only in secrets.
