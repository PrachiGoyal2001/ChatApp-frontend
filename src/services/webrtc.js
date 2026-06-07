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

    console.log("peer Connection", peerConnection);

    if (!localStream.value) {
      throw new Error("Local media stream is not available.");
    }

    localStream.value.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream.value);
    });

    // Send ICE Canditate
    peerConnection.onicecandidate = (event) => {
      console.log('[ICE GENERATED]', event.candidate);
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };

    peerConnection.onicegatheringstatechange = () => {
      console.log("[ICE GATHERING]", peerConnection.iceGatheringState);
    };

    peerConnection.onsignalingstatechange = () => {
      console.log("[SIGNALING]", peerConnection.signalingState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log( "[ICE STATE]", peerConnection.iceConnectionState);
    };

    peerConnection.onconnectionstatechange = () => {
      console.log( "[CONNECTION STATE]", peerConnection.connectionState);
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
