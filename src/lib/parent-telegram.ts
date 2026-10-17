export const PARENT_BOT_URL = "https://t.me/BHSSS_Verification_bot?start=parent_auth";
export const PARENT_RETURN_HOURS = 18;
export const PARENT_APPROVAL_TEXT = "🎉 Your parent access request for Burka Harbu Special Secondary School has been APPROVED!\nPlease open the Bot Mini App / Portal to complete verification and view your access link.";
export const PARENT_PORTAL_BUTTON = {
  inline_keyboard: [[{ text: "📱 Open Portal", web_app: { url: "https://bhsss-verifications.vercel.app/" } }]],
};
export const PARENT_DELIVERY_FALLBACK = "Approval saved! Please remind the parent to open @BHSSS_Verification_bot and tap /start to receive their approval notification.";

/** Return false so ordinary browsers can follow the original link. */
export function openParentBot() {
  if (typeof window === "undefined") return false;
  const app = (window as Window & { Telegram?: { WebApp?: { openTelegramLink?: (url: string) => void } } }).Telegram?.WebApp;
  if (!app?.openTelegramLink) return false;
  try {
    app.openTelegramLink(PARENT_BOT_URL);
    return true;
  } catch {
    return false;
  }
}

export function getTelegramInitData() {
  if (typeof window === "undefined") return "";
  return (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? "";
}