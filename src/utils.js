import { nextTick } from "vue";

export const scrollToBottom = async () => {
  const el = document.getElementById("messages");

  if (!el) return;
  // wait for vue render
  await nextTick();
  
  //wait for browser paint
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: "smooth",
      });
    });
  });
};