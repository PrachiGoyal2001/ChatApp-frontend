import { nextTick } from "vue";
// ✅ Scroll helper
export const scrollToBottom = async () => {
  await nextTick();
  const el = document.getElementById("messages");
  if (el) el.scrollTop = el.scrollHeight;
};