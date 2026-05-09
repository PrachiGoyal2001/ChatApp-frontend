import { io } from "socket.io-client";
import { ref } from "vue";
import { useUserStore } from "src/stores/user";

let socket = null;
let instance;

export const useSocket = () => {
  if (instance) return instance;

  const isTyping = ref(false);
  const onlineUsers = ref(new Set());
  let typingTimeout;

  const connect = (userId) => {
    if (socket) return;

    socket = io("https://chatapp-backend-v4hm.onrender.com", {
    // socket = io("http://localhost:3000", {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on("connect", () => {
      const userStore = useUserStore();
      console.log("✅ Socket connected:", socket.id);

      socket.emit("register", userId);

      if (userStore.conversationId) {
        socket.emit("join_conversation", userStore.conversationId);
      }
      setTypingListeners();
      setUserStatusListeners();
    });
  };

  const onMessage = (callback) => {
    if (!socket) return () => {};
    socket.on("new_message", callback);
    return () => socket?.off("new_message", callback);
  };

  const sendMessage = (payload) => {
    if (!socket) return;
    socket.emit("private_message", payload);
  };

  const typingHandler = ({ conversationId }) => {
    const userStore = useUserStore();
    if (conversationId !== userStore.conversationId) return;

    isTyping.value = true;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      isTyping.value = false;
    }, 2000);
  };

  const stopTypingHandler = ({ conversationId }) => {
    const userStore = useUserStore();
    if (conversationId !== userStore.conversationId) return;

    isTyping.value = false;
  };

  const setTypingListeners = () => {
    if (!socket) return;

    socket.off("typing", typingHandler);
    socket.off("stop_typing", stopTypingHandler);

    socket.on("typing", typingHandler);
    socket.on("stop_typing", stopTypingHandler);
  };

  const setUserStatusListeners = () => {
    if (!socket) return;

    socket.off("online_users");
    socket.off("user_online");
    socket.off("user_offline");
    socket.on("online_users", (users) => {
      onlineUsers.value = new Set(users);
    });

    socket.on("user_online", (userId) => {
      onlineUsers.value.add(userId);
    });

    socket.on("user_offline", (userId) => {
      onlineUsers.value.delete(userId);
    });
  };

  const handleTyping = (conversationId, userId) => {
    if (!socket) return;

    socket.emit("typing", {
      conversationId,
      userId,
    });

    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId,
        userId,
      });
    }, 1500);
  };

  const joinConversation = (conversationId) => {
    if (!socket) return;

    socket.emit("join_conversation", conversationId);
  };

  const disconnect = () => {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    clearTimeout(typingTimeout);
  };

  instance = {
    isTyping,
    onlineUsers,
    connect,
    sendMessage,
    onMessage,
    disconnect,
    handleTyping,
    joinConversation,
  };

  return instance;
};
