export const PARENT_BOT_URL = "https://t.me/BHSSS_Verification_bot?start=parent_auth";
export const PARENT_APPROVAL_TEXT = "🎉 Your parent access request for Burka Harbu Special Secondary School has been APPROVED!\nPlease open the Bot Mini App / Portal to complete verification and view your access link.";
export const PARENT_PORTAL_BUTTON = {
  inline_keyboard: [[{ text: "📱 Open Portal", web_app: { url: "https://bhsss-verifications.vercel.app/" } }]],
};
export const PARENT_DELIVERY_FALLBACK = "Approval saved! Please remind the parent to open @BHSSS_Verification_bot and tap /start to receive their approval notification.";

export function getTelegramInitData() {
  if (typeof window === "undefined") return "";
  return (window as Window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp?.initData ?? "";
}