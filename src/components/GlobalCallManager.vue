<template>
  <div>
    <CallScreen
      v-model="callStore.showCallScreen"
      :username="callStore.activeCallName"
      :isVideoCall="callStore.isVideoCall"
      :isSwitchingToVideo="callStore.isSwitchingToVideo"
      :isMicMuted="callStore.isMicMuted"
      :isCameraOff="callStore.isCameraOff"
      :canSwitchToVideo="callStore.isCallConnected"
      :callStatus="callStore.callStatus"
      @end-call="callStore.handleEndCall"
      @switch-to-video="callStore.switchToVideoCall"
      @toggle-mic="callStore.toggleMic"
      @toggle-video="callStore.toggleVideo"
    >
      <template #media>
        <video
          v-show="callStore.isVideoCall"
          :ref="callStore.setRemoteVideo"
          autoplay
          playsinline
          class="remote-video"
        ></video>
        <video
          v-show="callStore.isVideoCall"
          :ref="callStore.setLocalVideo"
          autoplay
          muted
          playsinline
          class="local-video"
        ></video>
      </template>
    </CallScreen>
    <IncomingCallScreen
      v-model="callStore.showIncomingCall"
      :username="callStore.incomingCallerName"
      :isVideoCall="callStore.isVideoCall"
      @accept="callStore.handleAcceptCall"
      @reject="callStore.handleRejectCall"
    />
    <audio :ref="callStore.remoteAudio" autoplay playsinline></audio>
    <audio
      :ref="callStore.setRingToneAudio"
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
import { ref, watch } from "vue";
// import { storeToRefs } from "pinia";
import { onBeforeRouteLeave } from "vue-router";
import { useCallStore } from "src/stores/callStore";
import { useSocket } from "../composables/useSocket";
import IncomingCallScreen from "src/components/IncomingCallScreen.vue";
import CallScreen from "src/components/CallScreen.vue";
import ringtoneUrl from "../assets/audio/ms_teams_ringtone.mp3";
import DisconnectCallDialog from "src/components/DisconnectCallDialog.vue";

let pendingRouteLeaveResolver = null;

const {
  onIceCandidate,
} = useSocket();

const callStore = useCallStore();
const showDisconnectDialog = ref(false);

onIceCandidate(callStore.handleIceCandidate);

onBeforeRouteLeave(() => {
    console.log("onBeforeRouteLeave", callStore.isCallActive);
  if (!callStore.isCallActive) return true;

  showDisconnectDialog.value = true;

  return new Promise((resolve) => {
    pendingRouteLeaveResolver = resolve;
  });
});

const confirmRouteLeave = () => {
  showDisconnectDialog.value = false;
  callStore.handleEndCall();
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
</script>

<style scoped>

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
