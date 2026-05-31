<template>
  <div class="app-bg"   :class="{
    'app-bg-mobile-chat': $q.screen.lt.md && route.params.userId
  }"
 >
    <div class="main-card row">
      <!-- Left Sidebar: Users List -->

      <div
        v-if="!$q.screen.lt.md || !route.params.userId"
        class="sidebar col-12 col-md-3"
      >
        <!-- User List -->
        <div class="col">
          <UsersList />
        </div>
      </div>

      <!-- Chat Section -->
      <div
        v-if="!$q.screen.lt.md || route.params.userId"
        class="col-12 col-md column full-height chat-section"
      >
        <div class="col right-view" v-if="!route.params.userId">
          Select the user you want to chat with
        </div>
        <router-view v-slot="{ Component }">
          <component
            :is="Component"
            class="col full-height"
            @start-call="startCall"
          />
        </router-view>
      </div>
    </div>
    <CallScreen
      v-model="showCallScreen"
      :username="activeCallName"
      :isVideoCall="isVideoCall"
      :isSwitchingToVideo="isSwitchingToVideo"
      :isMicMuted="isMicMuted"
      :isCameraOff="isCameraOff"
      :canSwitchToVideo="isCallConnected"
      :callStatus="callStatus"
      @end-call="handleEndCall"
      @switch-to-video="switchToVideoCall"
      @toggle-mic="toggleMic"
      @toggle-video="toggleVideo"
    >
      <template #media>
        <video
          v-show="isVideoCall"
          ref="remoteVideo"
          autoplay
          playsinline
          class="remote-video"
        ></video>
        <video
          v-show="isVideoCall"
          ref="localVideo"
          autoplay
          muted
          playsinline
          class="local-video"
        ></video>
      </template>
    </CallScreen>
    <IncomingCallScreen
      v-model="showIncomingCall"
      :username="incomingCallerName"
      :isVideoCall="isVideoCall"
      @accept="handleAcceptCall"
      @reject="handleRejectCall"
    />
    <audio
      ref="remoteAudio"
      autoplay
      playsinline
    ></audio>
    <audio
      ref="ringtoneAudio"
      :src="ringtoneUrl"
      loop
      preload="auto"
    ></audio>
    <DisconnectCallDialog
      v-model="showDisconnectDialog"
      @confirm="confirmRouteLeave"
      @cancel="cancelRouteLeave"
    />
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { onBeforeRouteLeave, useRoute } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUserStore } from "../stores/user";
import UsersList from "../components/UsersList.vue";
import CallScreen from "src/components/CallScreen.vue";
import DisconnectCallDialog from "src/components/DisconnectCallDialog.vue";
import IncomingCallScreen from "src/components/IncomingCallScreen.vue";
import { useSocket } from "../composables/useSocket";
import { useWebRtc } from "../services/webrtc";
import ringtoneUrl from "../assets/audio/ms_teams_ringtone.mp3";

const UNANSWERED_CALL_TIMEOUT = 30000;

const {
  connect,
  onMessage,
  incomingCall,
  callUser,
  answerCall,
  rejectCall,
  onIceCandidate,
  sendIceCandidate,
  sendVideoUpgradeOffer,
  sendVideoUpgradeAnswer,
  callAccepted,
  callRejected,
  callEnded,
  videoUpgradeOffer,
  videoUpgradeAnswer,
  endCall,
} = useSocket();

const {
  localStream,
  createPeerConnection,
} = useWebRtc();

const route = useRoute();
const userStore = useUserStore();
const authStore = useAuthStore();
let unsubscribe;
let peerConnection = null;

const showCallScreen = ref(false);
const showIncomingCall = ref(false);
const showDisconnectDialog = ref(false);
const isVideoCall = ref(false);
const isSwitchingToVideo = ref(false);
const isMicMuted = ref(false);
const isCameraOff = ref(false);
const callStatus = ref("Connecting securely...");
const currentCallData = ref(null);
const activeCallUserId = ref(null);
const remoteAudio = ref(null);
const ringtoneAudio = ref(null);
const remoteVideo = ref(null);
const localVideo = ref(null);
const remoteStream = ref(null);
const pendingIceCandidates = [];
let unansweredCallTimer = null;
let pendingRouteLeaveResolver = null;

const selectedUserId = computed(() => userStore.selectedUserId);
const getSelectedUsername = computed(() => userStore.getSelectedUsername);
const incomingCallerName = computed(() => {
  if (!currentCallData.value?.from) return "Unknown";

  const caller = userStore.users.find((user) => {
    const userId = user.userId || user.otherUser?._id || user._id;
    return userId === currentCallData.value.from;
  });

  return caller?.username || caller?.otherUser?.username || currentCallData.value.calledUsername || "Unknown";
});
const activeCallName = computed(() => {
  return currentCallData.value ? incomingCallerName.value : getSelectedUsername.value || "Unknown";
});
const isCallConnected = computed(() => callStatus.value === "Connected");
const isCallActive = computed(() => showCallScreen.value);

onMounted(async () => {
  if (authStore.userId) {
    connect(authStore.userId);
    unsubscribe = onMessage((data) => {
      userStore.handleIncomingMessage(data);
    });
  }
});
onUnmounted(() => {
  unsubscribe && unsubscribe();
  cleanupCall();
});

onBeforeRouteLeave(() => {
  if (!isCallActive.value) return true;

  showDisconnectDialog.value = true;

  return new Promise((resolve) => {
    pendingRouteLeaveResolver = resolve;
  });
});

const confirmRouteLeave = () => {
  showDisconnectDialog.value = false;
  handleEndCall();
  resolvePendingRouteLeave(true);
};

const cancelRouteLeave = () => {
  showDisconnectDialog.value = false;
  resolvePendingRouteLeave(false);
};

const resolvePendingRouteLeave = (shouldLeave) => {
  pendingRouteLeaveResolver?.(shouldLeave);
  pendingRouteLeaveResolver = null;
};

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
    activeCallUserId.value = selectedUserId.value;
    localStream.value = media.stream;
    showCallScreen.value = true;
    startRingtone();
    startUnansweredCallTimer(() => {
      if (activeCallUserId.value) {
        endCall({ to: activeCallUserId.value });
      }

      cleanupCall();
    });

    await nextTick();
    attachLocalStream();

    peerConnection = await createPeerConnection((candidate) => {
      sendIceCandidate({
        to: activeCallUserId.value,
        candidate,
      });
    }, (stream) => {
      attachRemoteStream(stream);
    });

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

    peerConnection = await createPeerConnection((candidate) => {
      sendIceCandidate({
        to: activeCallUserId.value,
        candidate,
      });
    }, (stream) => {
      attachRemoteStream(stream);
    });

    await peerConnection.setRemoteDescription(new RTCSessionDescription(currentCallData.value.offer));
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
  const to = activeCallUserId.value || currentCallData.value?.from || selectedUserId.value;

  if (to) {
    endCall({ to });
  }

  cleanupCall();
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

watch(incomingCall, (data) => {
  if (!data) return;

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

    cleanupCall();
  });
});

watch(callAccepted, async (data) => {
  if (!data || !peerConnection) return;

  stopRingtone();
  clearUnansweredCallTimer();
  callStatus.value = "Connecting securely...";
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  await flushPendingIceCandidates();
});

watch(videoUpgradeOffer, async (data) => {
  if (!data || !peerConnection) return;

  try {
    isVideoCall.value = true;
    await nextTick();

    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
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
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    await flushPendingIceCandidates();
  } catch (err) {
    console.error("Video upgrade answer failed:", err);
  }
});

onIceCandidate(async (data) => {
  try {
    if (!data.candidate) return;

    if (peerConnection?.remoteDescription) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } else {
      pendingIceCandidates.push(data.candidate);
    }
  } catch (err) {
    console.error("ICE candidate error:", err);
  }
});

watch(callRejected, (rejected) => {
  if (rejected) {
    cleanupCall();
  }
});

watch(callEnded, (ended) => {
  if (ended) {
    cleanupCall();
  }
});

const flushPendingIceCandidates = async () => {
  if (!peerConnection?.remoteDescription) return;

  while (pendingIceCandidates.length) {
    const candidate = pendingIceCandidates.shift();
    await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
};

const attachLocalStream = () => {
  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value;
    localVideo.value.play?.().catch(() => {});
  }
};

const openLocalMedia = async ({ video = false, allowAudioFallback = false } = {}) => {
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

    console.warn("Camera is not available. Starting audio call instead.", err);

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
    return openStreamFromAvailableCamera({ audio: false, originalError: err });
  }
};

const getCameraConstraints = () => ({
  width: { ideal: 640 },
  height: { ideal: 480 },
  frameRate: { ideal: 24, max: 30 },
});

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

const applyMicState = () => {
  localStream.value?.getAudioTracks().forEach((track) => {
    track.enabled = !isMicMuted.value;
  });
};

const applyCameraState = () => {
  localStream.value?.getVideoTracks().forEach((track) => {
    track.enabled = !isCameraOff.value;
  });
};

const startRingtone = () => {
  if (!ringtoneAudio.value) return;

  ringtoneAudio.value.currentTime = 0;
  ringtoneAudio.value.play?.().catch((err) => {
    console.warn("Ringtone playback was blocked by the browser:", err);
  });
};

const stopRingtone = () => {
  if (!ringtoneAudio.value) return;

  ringtoneAudio.value.pause();
  ringtoneAudio.value.currentTime = 0;
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

const cleanupCall = () => {
  stopRingtone();
  clearUnansweredCallTimer();
  peerConnection?.close();
  peerConnection = null;
  pendingIceCandidates.length = 0;

  localStream.value?.getTracks().forEach(track => track.stop());
  localStream.value = null;
  remoteStream.value = null;

  if (remoteAudio.value) remoteAudio.value.srcObject = null;
  if (remoteVideo.value) remoteVideo.value.srcObject = null;
  if (localVideo.value) localVideo.value.srcObject = null;

  showCallScreen.value = false;
  showIncomingCall.value = false;
  isSwitchingToVideo.value = false;
  isMicMuted.value = false;
  isCameraOff.value = false;
  callStatus.value = "Connecting securely...";
  currentCallData.value = null;
  activeCallUserId.value = null;
};
</script>

<style scoped>
.app-bg {
  height: calc(100dvh - 51px);
  position: relative;
  background: radial-gradient(circle at 20% 20%, #020617, #020617 80%);
}

.main-card {
  display: flex;
  height: 100%;

  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.08);

  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  background: rgba(255, 255, 255, 0.04);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  color: #e2e8f0;
}

.header {
  color: #94a3b8;
}

/* Chat Section */
.chat-section {
  background: transparent;
}
.right-view {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}
/* Mobile chat opened */
.app-bg-mobile-chat {
  height: 100dvh;
}

.remote-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  background: #020617;
  object-fit: contain;
}

.local-video {
  position: absolute;
  right: 18px;
  bottom: 118px;
  z-index: 3;
  width: min(28vw, 180px);
  aspect-ratio: 3 / 4;
  border: 2px solid rgba(255, 255, 255, 0.24);
  border-radius: 12px;
  background: #0f172a;
  object-fit: cover;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
}

@media (max-width: 600px) {
  .local-video {
    right: 12px;
    bottom: 104px;
    width: 34vw;
    max-width: 136px;
  }
  .remote-video{
    object-fit: cover;
  }
}
</style>
