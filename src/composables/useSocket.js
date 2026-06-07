import { io } from "socket.io-client";
import { ref } from "vue";
import { useUserStore } from "src/stores/user";

let socket = null;
let instance;

const baseURL = import.meta.env.VITE_PROD_BASE_URL ||  "http://localhost:3000"

export const useSocket = () => {
  if (instance) return instance;

  let typingTimeout;
  const isTyping = ref(false);
  const onlineUsers = ref(new Set());
  const incomingCall = ref(null);
  const activeCall = ref(false);
  const callAccepted = ref(null);
  const callRejected = ref(null);
  const callEnded = ref(null);
  const videoUpgradeOffer = ref(null);
  const videoUpgradeAnswer = ref(null);
  const iceCandidateCallbacks = new Set();

  const iceCandidateHandler = (data) => {
    iceCandidateCallbacks.forEach((callback) => callback(data));
  };

  const setIceCandidateListener = () => {
    if (!socket) return;

    socket.off("ice_candidate", iceCandidateHandler);
    socket.on("ice_candidate", iceCandidateHandler);
  };

  const connect = (userId) => {
    if (socket) return;

    socket = io(baseURL, {
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
      setCallListeners();
      setIceCandidateListener();
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

  const callUser = (payload) => {
    if (!socket) return;

    socket.emit("call_user", payload);
  };

  const answerCall = (payload) => {
    if (!socket) return;

    socket.emit("answer_call", payload);
  };

  const sendIceCandidate = (payload) => {
    if (!socket) return;

    socket.emit("ice_candidate", payload);
  };

  const sendVideoUpgradeOffer = (payload) => {
    if (!socket) return;

    socket.emit("video_upgrade_offer", payload);
  };

  const sendVideoUpgradeAnswer = (payload) => {
    if (!socket) return;

    socket.emit("video_upgrade_answer", payload);
  };

  const onIceCandidate = (callback) => {
    iceCandidateCallbacks.add(callback);

    if (socket) {
      setIceCandidateListener();
    }

    return () => {
      iceCandidateCallbacks.delete(callback);
    };
  };

  const rejectCall = (payload) => {
    if (!socket) return;

    socket.emit("reject_call", payload);
  };

  const endCall = (payload) => {
    if (!socket) return;

    socket.emit("end_call", payload);
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

  const setCallListeners = () => {
    if (!socket) return;

    socket.off("incoming_call");
    socket.off("call_answered");
    socket.off("call_rejected");
    socket.off("call_ended");
    socket.off("video_upgrade_offer");
    socket.off("video_upgrade_answer");

    /**
     * Incoming Call
     */
    socket.on("incoming_call", (data) => {
      incomingCall.value = data;

      callRejected.value = null;
      callEnded.value = null;
    });

    /**
     * Call Accepted
     */
    socket.on("call_answered", (data) => {
      callAccepted.value = data;
    });

    /**
     * Call Rejected
     */
    socket.on("call_rejected", (data) => {
      callRejected.value = { at: Date.now(), ...data };
      activeCall.value = false;
    });

    /**
     * Call Ended
     */
    socket.on("call_ended", () => {
      callEnded.value = { at: Date.now() };
      activeCall.value = false;
    });

    socket.on("video_upgrade_offer", (data) => {
      videoUpgradeOffer.value = data;
    });

    socket.on("video_upgrade_answer", (data) => {
      videoUpgradeAnswer.value = data;
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
    incomingCall,
    activeCall,
    callAccepted,
    callRejected,
    callEnded,
    videoUpgradeOffer,
    videoUpgradeAnswer,
    connect,
    disconnect,
    sendMessage,
    onMessage,
    handleTyping,
    joinConversation,
    callUser,
    answerCall,
    sendIceCandidate,
    sendVideoUpgradeOffer,
    sendVideoUpgradeAnswer,
    rejectCall,
    endCall,
    onIceCandidate,
  };

  return instance;
};
