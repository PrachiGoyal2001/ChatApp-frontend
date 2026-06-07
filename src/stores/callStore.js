import { defineStore } from "pinia";
import { computed, nextTick, ref, watch } from "vue";
import { useUserStore } from "./user";
import { useAuthStore } from "./auth";
import { useSocket } from "../composables/useSocket.js";
import { useWebRtc } from "../services/webrtc";
import ringtoneUrl from "../assets/audio/ms_teams_ringtone.mp3";

export const useCallStore = defineStore("call", () => {
  const {
    callUser,
    answerCall,
    rejectCall,
    sendIceCandidate,
    sendVideoUpgradeOffer,
    endCall,
    incomingCall,
    callAccepted,
    videoUpgradeOffer,
    videoUpgradeAnswer,
    sendVideoUpgradeAnswer,
    callRejected,
    callEnded,
  } = useSocket();
  const { localStream, createPeerConnection } = useWebRtc();
  let peerConnection = null;
  const showCallScreen = ref(false);
  const showIncomingCall = ref(false);

  const isVideoCall = ref(false);
  const isMicMuted = ref(false);
  const isCameraOff = ref(false);

  const callStatus = ref("Connecting securely...");

  const currentCallData = ref(null);
  const activeCallUserId = ref(null);

  const remoteStream = ref(null);

  const isSwitchingToVideo = ref(false);

  const remoteAudio = ref(null);
  const ringtoneAudio = ref(null);
  const remoteVideo = ref(null);
  const localVideo = ref(null);
  const showDisconnectDialog = ref(false);

  const UNANSWERED_CALL_TIMEOUT = 30000;
  const pendingIceCandidates = [];

  let unansweredCallTimer = null;
  let pendingRouteLeaveResolver = null;

  const authStore = useAuthStore();
  const userStore = useUserStore();

  const getSelectedUsername = computed(() => userStore.getSelectedUsername);

  const incomingCallerName = computed(() => {
    if (!currentCallData.value?.from) return "Unknown";

    const caller = userStore.users.find((user) => {
      const userId = user.userId || user.otherUser?._id || user._id;
      return userId === currentCallData.value.from;
    });

    return (
      caller?.username ||
      caller?.otherUser?.username ||
      currentCallData.value.calledUsername ||
      "Unknown"
    );
  });
  const activeCallName = computed(() => {
    return currentCallData.value
      ? incomingCallerName.value
      : getSelectedUsername.value || "Unknown";
  });

  const isCallConnected = computed(() => callStatus.value === "Connected");
  const isCallActive = computed(() => showCallScreen.value);

  const isBusy = computed(() => {
    return showIncomingCall.value || showCallScreen.value;
  });

  const startCall = async (video = false) => {
    try {
      const media = await openLocalMedia({
        video,
        allowAudioFallback: true,
      });

      isVideoCall.value = media.videoEnabled;
      isMicMuted.value = false;
      isCameraOff.value = false;
      callStatus.value = "Ringing...";
      activeCallUserId.value = userStore.selectedUserId;
      localStream.value = media.stream;
      showCallScreen.value = true;
      startRingtone();
      startUnansweredCallTimer(() => {
        if (activeCallUserId.value) {
          endCall({ to: activeCallUserId.value });
        }
        console.log("in start Call, cleanupcall");
        cleanupCall();
      });

      await nextTick();
      attachLocalStream();

      peerConnection = await createPeerConnection(
        (candidate) => {
          sendIceCandidate({
            to: activeCallUserId.value,
            candidate,
          });
        },
        (stream) => {
          attachRemoteStream(stream);
        },
      );
      console.log("NEW PEER CONNECTION CREATED", peerConnection);
      const offer = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(offer);

      callUser({
        to: activeCallUserId.value,
        from: authStore.userId,
        offer,
        isVideoCall: media.videoEnabled,
        calledUsername: getSelectedUsername.value,
      });
    } catch (err) {
      console.error("Call start failed:", err);
      cleanupCall();
    }
  };

  const handleAcceptCall = async () => {
    try {
      const media = await openLocalMedia({
        video: isVideoCall.value,
        allowAudioFallback: true,
      });

      localStream.value = media.stream;
      isMicMuted.value = false;
      isCameraOff.value = false;
      callStatus.value = "Connecting securely...";
      activeCallUserId.value = currentCallData.value.from;
      showIncomingCall.value = false;
      showCallScreen.value = true;
      stopRingtone();
      clearUnansweredCallTimer();

      await nextTick();
      attachLocalStream();

      peerConnection = await createPeerConnection(
        (candidate) => {
          sendIceCandidate({
            to: activeCallUserId.value,
            candidate,
          });
        },
        (stream) => {
          attachRemoteStream(stream);
        },
      );

      console.log("NEW PEER CONNECTION CREATED2", peerConnection);

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(currentCallData.value.offer),
      );
      await flushPendingIceCandidates();

      const answer = await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(answer);

      answerCall({
        to: currentCallData.value.from,
        answer,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectCall = () => {
    const to = currentCallData.value?.from;

    if (to) {
      rejectCall({ to });
    }

    stopRingtone();
    clearUnansweredCallTimer();
    showIncomingCall.value = false;
    currentCallData.value = null;
    activeCallUserId.value = null;
  };

  const handleEndCall = () => {
    const to =
      activeCallUserId.value ||
      currentCallData.value?.from ||
      userStore.selectedUserId;

    if (to) {
      endCall({ to });
    }
    console.log("in end call cleanupcall");
    cleanupCall();
  };

  const confirmRouteLeave = () => {
    showDisconnectDialog.value = false;
    handleEndCall();
    resolvePendingRouteLeave(false);
  };

  const cancelRouteLeave = () => {
    showDisconnectDialog.value = false;
    resolvePendingRouteLeave(false);
  };

  const confirmActiveCallRouteLeave = () => {
    if (!isCallActive.value) return true;

    showDisconnectDialog.value = true;

    return new Promise((resolve) => {
      pendingRouteLeaveResolver = resolve;
    });
  };

  const resolvePendingRouteLeave = (shouldLeave) => {
    pendingRouteLeaveResolver?.(shouldLeave);
    pendingRouteLeaveResolver = null;
  };

  const toggleMic = () => {
    isMicMuted.value = !isMicMuted.value;
    applyMicState();
  };

  const toggleVideo = async () => {
    if (!isVideoCall.value) return;

    if (!isCameraOff.value) {
      isCameraOff.value = true;
      applyCameraState();
      return;
    }

    const videoTrack = await ensureLocalVideoTrack();

    if (!videoTrack) return;

    isCameraOff.value = false;
    applyCameraState();
  };

  const switchToVideoCall = async () => {
    if (!peerConnection || !isCallConnected.value) return;

    isSwitchingToVideo.value = true;

    try {
      isVideoCall.value = true;
      await nextTick();

      const videoTrack = await ensureLocalVideoTrack();

      if (!videoTrack) {
        isVideoCall.value = false;
        return;
      }

      isCameraOff.value = false;
      applyCameraState();

      const offer = await peerConnection.createOffer();

      await peerConnection.setLocalDescription(offer);

      sendVideoUpgradeOffer({
        to: activeCallUserId.value,
        from: authStore.userId,
        offer,
      });
    } catch (err) {
      console.error("Switch to video failed:", err);
    } finally {
      isSwitchingToVideo.value = false;
    }
  };

  const cleanupCall = () => {
    console.log("cleanupCall");
    stopRingtone();
    clearUnansweredCallTimer();
    peerConnection?.close();
    peerConnection = null;
    pendingIceCandidates.length = 0;

    localStream.value?.getTracks().forEach((track) => track.stop());
    localStream.value = null;
    remoteStream.value = null;

    if (remoteAudio.value) remoteAudio.value.srcObject = null;
    if (remoteVideo.value) remoteVideo.value.srcObject = null;
    if (localVideo.value) localVideo.value.srcObject = null;

    showCallScreen.value = false;
    showIncomingCall.value = false;
    showDisconnectDialog.value = false;
    isSwitchingToVideo.value = false;
    isMicMuted.value = false;
    isCameraOff.value = false;
    callStatus.value = "Connecting securely...";
    currentCallData.value = null;
    activeCallUserId.value = null;
  };

  const stopRingtone = () => {
    if (!ringtoneAudio.value) return;

    ringtoneAudio.value.pause();
    ringtoneAudio.value.currentTime = 0;
    ringtoneAudio.value.removeAttribute("src");
    ringtoneAudio.value.load();

    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
    }
  };

  const startRingtone = () => {
    if (!ringtoneAudio.value) return;

    ringtoneAudio.value.src = ringtoneUrl;
    ringtoneAudio.value.currentTime = 0;
    ringtoneAudio.value.play?.().catch((err) => {
      console.warn("Ringtone playback was blocked by the browser:", err);
    });
  };

  const startUnansweredCallTimer = (callback) => {
    clearUnansweredCallTimer();
    unansweredCallTimer = setTimeout(callback, UNANSWERED_CALL_TIMEOUT);
  };

  const clearUnansweredCallTimer = () => {
    if (!unansweredCallTimer) return;

    clearTimeout(unansweredCallTimer);
    unansweredCallTimer = null;
  };

  const applyCameraState = () => {
    localStream.value?.getVideoTracks().forEach((track) => {
      track.enabled = !isCameraOff.value;
    });
  };

  const applyMicState = () => {
    localStream.value?.getAudioTracks().forEach((track) => {
      track.enabled = !isMicMuted.value;
    });
  };

  const attachRemoteStream = (stream) => {
    remoteStream.value = stream;
    callStatus.value = "Connected";
    stopRingtone();
    clearUnansweredCallTimer();

    if (remoteAudio.value) {
      remoteAudio.value.srcObject = stream;
      remoteAudio.value.play?.().catch(() => {});
    }

    if (remoteVideo.value) {
      remoteVideo.value.srcObject = stream;
      remoteVideo.value.play?.().catch(() => {});
    }
  };

  const openStreamFromAvailableCamera = async ({ audio, originalError }) => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");

    for (const camera of cameras) {
      try {
        return await navigator.mediaDevices.getUserMedia({
          audio,
          video: {
            ...getCameraConstraints(),
            deviceId: { exact: camera.deviceId },
          },
        });
      } catch {
        // Try the next camera if this one is busy or unavailable.
      }
    }

    throw originalError;
  };

  const ensureLocalVideoTrack = async () => {
    const existingVideoTrack = localStream.value
      ?.getVideoTracks()
      .find((track) => track.readyState === "live");

    if (existingVideoTrack) {
      return existingVideoTrack;
    }

    try {
      const videoStream = await openVideoOnlyStream();
      const [videoTrack] = videoStream.getVideoTracks();

      if (!videoTrack) return null;

      if (!localStream.value) {
        localStream.value = new MediaStream();
      }

      localStream.value.addTrack(videoTrack);
      peerConnection?.addTrack(videoTrack, localStream.value);

      await nextTick();
      attachLocalStream();

      return videoTrack;
    } catch (err) {
      console.error("Could not start video source:", err);
      return null;
    }
  };

  const openAudioVideoStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: getCameraConstraints(),
      });
    } catch (err) {
      return openStreamFromAvailableCamera({ audio: true, originalError: err });
    }
  };

  const openVideoOnlyStream = async () => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: getCameraConstraints(),
      });
    } catch (err) {
      return openStreamFromAvailableCamera({
        audio: false,
        originalError: err,
      });
    }
  };

  const getCameraConstraints = () => ({
    width: { ideal: 640 },
    height: { ideal: 480 },
    frameRate: { ideal: 24, max: 30 },
  });

  const openLocalMedia = async ({
    video = false,
    allowAudioFallback = false,
  } = {}) => {
    try {
      const stream = video
        ? await openAudioVideoStream()
        : await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false,
          });

      return {
        stream,
        videoEnabled: video && stream.getVideoTracks().length > 0,
      };
    } catch (err) {
      if (!video || !allowAudioFallback) {
        throw err;
      }

      console.warn(
        "Camera is not available. Starting audio call instead.",
        err,
      );

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      return {
        stream,
        videoEnabled: false,
      };
    }
  };

  const attachLocalStream = () => {
    if (localVideo.value && localStream.value) {
      localVideo.value.srcObject = localStream.value;
      localVideo.value.play?.().catch(() => {});
    }
  };

  const flushPendingIceCandidates = async () => {
    if (!peerConnection?.remoteDescription) return;

    while (pendingIceCandidates.length) {
      const candidate = pendingIceCandidates.shift();
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  };
  const setRingToneAudio = (el) => {
    ringtoneAudio.value = el;
  };
  const setRemoteAudio = (el) => {
    remoteAudio.value = el;
  };
  const setRemoteVideo = (el) => {
    remoteVideo.value = el;
  };
  const setLocalVideo = (el) => {
    localVideo.value = el;
  };
  const setCallStatus = (status) => {
    callStatus.value = status;
  };
  const handleIceCandidate = async (data) => {
    try {
      console.log(
        "Adding candidate. Remote description exists?",
        !!peerConnection?.remoteDescription,
      );
      console.log("CURRENT PEER CONNECTION", peerConnection);

      console.log(
        "PeerConnection state:",
        peerConnection?.connectionState,
        peerConnection?.iceConnectionState,
        peerConnection?.signalingState,
      );
      if (!data?.candidate) return;

      if (peerConnection?.remoteDescription) {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(data.candidate),
        );
        console.log("ICE candidate added successfully");
      } else {
        console.log("Queueing ICE candidate");
        pendingIceCandidates.push(data.candidate);
      }
    } catch (err) {
      console.error("ICE candidate error:", err);
    }
  };

  watch(incomingCall, (data) => {
    if (!data) return;
    if (isBusy.value) {
      rejectCall({
        to: data.from,
        reason: "busy",
      });
      return;
    }
    console.log("in incomung call", "cleanupCall");
    cleanupCall();
    currentCallData.value = data;
    activeCallUserId.value = data.from;
    isVideoCall.value = data.isVideoCall;
    showIncomingCall.value = true;
    startRingtone();
    startUnansweredCallTimer(() => {
      if (currentCallData.value?.from) {
        rejectCall({ to: currentCallData.value.from });
      }
      console.log("in incomung call startUnansweredCallTimer", "cleanupCall");
      cleanupCall();
    });
  });

  watch(callAccepted, async (data) => {
    if (!data || !peerConnection) return;
    stopRingtone();
    clearUnansweredCallTimer();
    setCallStatus("Connecting securely...");
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer),
    );
    await flushPendingIceCandidates();
  });

  watch(videoUpgradeOffer, async (data) => {
    if (!data || !peerConnection) return;

    try {
      isVideoCall.value = true;
      await nextTick();

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer),
      );
      await ensureLocalVideoTrack();
      await flushPendingIceCandidates();

      const answer = await peerConnection.createAnswer();

      await peerConnection.setLocalDescription(answer);

      sendVideoUpgradeAnswer({
        to: data.from,
        answer,
      });
    } catch (err) {
      console.error("Video upgrade offer failed:", err);
    }
  });

  watch(videoUpgradeAnswer, async (data) => {
    if (!data || !peerConnection) return;

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.answer),
      );
      await flushPendingIceCandidates();
    } catch (err) {
      console.error("Video upgrade answer failed:", err);
    }
  });

  watch(callRejected, (rejected) => {
    if (rejected?.reason === "busy") {
      callStatus.value = "User is busy";
    }
    setTimeout(() => {
      if (rejected) {
        console.log("in rejected, cleanup call");
        cleanupCall();
      }
    }, 1000);
  });

  watch(callEnded, (ended) => {
    if (ended) {
      console.log("in rejected, ended call");
      cleanupCall();
    }
  });
  return {
    showCallScreen,
    showIncomingCall,
    isVideoCall,
    isMicMuted,
    isCameraOff,
    callStatus,
    showDisconnectDialog,
    currentCallData,
    activeCallUserId,
    activeCallName,
    isCallConnected,
    peerConnection,
    isCallActive,
    pendingIceCandidates,
    ringtoneAudio,
    incomingCallerName,
    isBusy,
    startCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    confirmRouteLeave,
    cancelRouteLeave,
    confirmActiveCallRouteLeave,
    toggleMic,
    toggleVideo,
    switchToVideoCall,
    startRingtone,
    startUnansweredCallTimer,
    stopRingtone,
    ensureLocalVideoTrack,
    openVideoOnlyStream,
    flushPendingIceCandidates,
    cleanupCall,
    setRingToneAudio,
    setRemoteAudio,
    setRemoteVideo,
    setLocalVideo,
    setCallStatus,
    handleIceCandidate,
  };
});
