import { ref } from "vue";

const localStream = ref(null);

const configuration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
    {
      urls: "turn:free.expressturn.com:3478",
      username: "000000002096194080",
      credential: "OZL9hIbrABhytR4LXzjLivoF5d0=",
    },
  ],
};

export const useWebRtc = () => {
  const createPeerConnection = async (onIceCandidate, onTrack) => {
    const remoteStream = new MediaStream();

    const peerConnection = new RTCPeerConnection(configuration);

    if (!localStream.value) {
      throw new Error("Local media stream is not available.");
    }

    localStream.value.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream.value);
    });

    // Send ICE Canditate
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log("Peer connection state:", peerConnection.connectionState);
    };

    peerConnection.ontrack = (event) => {
      if (event.streams?.[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (
            !remoteStream
              .getTracks()
              .some((remoteTrack) => remoteTrack.id === track.id)
          ) {
            remoteStream.addTrack(track);
          }
        });
      } else if (event.track) {
        remoteStream.addTrack(event.track);
      }

      onTrack(remoteStream);
    };

    return peerConnection;
  };
  return {
    createPeerConnection,
    localStream,
  };
};
