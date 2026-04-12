import { ref } from "vue";

const socket = ref(null);
const listeners = [];

export const useSocket = () => {
  const connect = (userId) => {
    if (socket.value) return;
    
    socket.value = new WebSocket("wss://chatapp-backend-v4hm.onrender.com");

    socket.value.onopen = () => {
      socket.value.send(JSON.stringify({ type: "register", userId }));
    };

    socket.value.onmessage = (event) => {
      const data = JSON.parse(event.data);
      listeners.forEach((cb) => cb(data));
    };
  };

  const sendMessage = (payload) => {
    socket.value?.send(JSON.stringify(payload));
  };

  const onMessage = (callback) => {
    listeners.push(callback);
  };

  return {
    connect,
    sendMessage,
    onMessage,
  };
};
