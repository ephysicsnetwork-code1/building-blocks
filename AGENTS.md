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
- The effective roster is the embedded list (src/lib/school-data.ts) plus roster_entries minus roster_removals, always read via loadRoster() so admin edits never touch the embedded data or wipe join records. The embedded roster is server-only; browser components import src/lib/school-constants.ts instead so names never ship to the client.
- Failed verifications are tracked per normalized typed name in verification_attempts; reaching the limit bans on the public side and writes admin_alerts, and only admins clear it.
- The Telegram bot webhook lives at /api/public/telegram/webhook, verified by a secret derived from TELEGRAM_BOT_TOKEN; it records chat IDs in telegram_users so the server can message people by handle after they press /start.
- Parent approval and webhook replies share notification payloads; parent invites are returned only after validating fresh Telegram mini-app initData, never from a typed handle or submission response, to prevent impersonation.
- Parent bot-start links use Telegram WebApp.openTelegramLink with ordinary same-window link fallback so embedded Telegram views do not depend on popups.
