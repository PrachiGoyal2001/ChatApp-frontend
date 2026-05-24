<template>
  <transition name="call-screen">
    <div
      v-if="modelValue"
      class="call-screen"
      :class="{ 'video-call-screen': isVideoCall }"
    >
      <slot name="media"></slot>

      <!-- Top -->
      <div class="call-top">
        <div class="call-status">
          {{ isVideoCall ? 'Video Call' : 'Voice Call' }}
        </div>

        <div class="call-time">
          {{callStatus}}
        </div>
      </div>

      <!-- Center -->
      <div class="call-center">

        <!-- Avatar -->
        <div class="caller-avatar-wrapper">
          <q-avatar size="120px" class="caller-avatar">
            {{ username?.charAt(0)?.toUpperCase() }}
          </q-avatar>

          <!-- Pulse -->
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay"></div>
        </div>

        <!-- Name -->
        <div class="caller-name" v-if="showUserName">
          {{ username }}
        </div>

        <div class="caller-subtitle">
          {{ callStatus }}
        </div>
      </div>

      <!-- Controls -->
      <div class="call-controls">

        <!-- Mic -->
        <q-btn
          round
          size="18px"
          :icon="isMicMuted ? 'mic_off' : 'mic'"
          class="call-control-btn secondary"
          :class="{ active: isMicMuted }"
          @click="$emit('toggle-mic')"
        />

        <!-- Video -->
        <q-btn
          v-if="isVideoCall"
          round
          size="18px"
          :icon="isCameraOff ? 'videocam_off' : 'videocam'"
          class="call-control-btn secondary"
          :class="{ active: isCameraOff }"
          @click="$emit('toggle-video')"
        />

        <!-- Switch to Video -->
        <q-btn
          v-if="!isVideoCall"
          round
          size="18px"
          icon="videocam"
          class="call-control-btn secondary"
          :loading="isSwitchingToVideo"
          :disable="!canSwitchToVideo"
          @click="$emit('switch-to-video')"
        />

        <!-- End -->
        <q-btn
          round
          size="20px"
          icon="call_end"
          class="call-control-btn end-call-btn"
          @click="endCall"
        />
      </div>

    </div>
  </transition>
</template>

<script setup>
import {computed} from "vue";
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },

  username: {
    type: String,
    default: '',
  },

  isVideoCall: {
    type: Boolean,
    default: false,
  },

  isSwitchingToVideo: {
    type: Boolean,
    default: false,
  },

  isMicMuted: {
    type: Boolean,
    default: false,
  },

  isCameraOff: {
    type: Boolean,
    default: false,
  },

  canSwitchToVideo: {
    type: Boolean,
    default: false,
  },

  callStatus: {
    type: String,
    default: 'Connecting securely...',
  },
})

const emit = defineEmits(['update:modelValue', 'end-call', 'switch-to-video', 'toggle-mic', 'toggle-video']);

const showUserName = computed(()=>!props.isVideoCall || (props.isVideoCall && props.callStatus!='Connected'))

const endCall = () => {
  emit('end-call')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.call-screen {
  position: absolute;
  inset: 0;

  z-index: 9999;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  background:
    radial-gradient(circle at top, rgba(34,197,94,0.18), transparent 30%),
    linear-gradient(
      180deg,
      #020617 0%,
      #0f172a 45%,
      #111827 100%
    );

  backdrop-filter: blur(20px);

  overflow: hidden;
}

.video-call-screen {
  background: #020617;
}

.video-call-screen .call-top,
.video-call-screen .call-center,
.video-call-screen .call-controls {
  position: relative;
  z-index: 2;
}

.video-call-screen .call-center {
  justify-content: flex-end;
  min-height: 0;
  padding-bottom: 18px;
}

.video-call-screen .caller-avatar-wrapper,
.video-call-screen .caller-subtitle {
  display: none;
}

.video-call-screen .caller-name {
  margin-top: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(2, 6, 23, 0.56);
  backdrop-filter: blur(12px);
  font-size: 18px;
}

/* Top */

.call-top {
  padding: 32px 24px 0;
  text-align: center;
}

.call-status {
  color: #22c55e;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.call-time {
  margin-top: 6px;

  color: #94a3b8;
  font-size: 13px;
}

/* Center */

.call-center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.caller-avatar-wrapper {
  position: relative;
}

.caller-avatar {
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  color: white;

  font-size: 48px;
  font-weight: 700;

  z-index: 2;
  position: relative;

  box-shadow:
    0 0 0 12px rgba(34,197,94,0.08),
    0 20px 50px rgba(34,197,94,0.28);
}

/* Pulse */

.pulse-ring {
  position: absolute;
  inset: -18px;

  border-radius: 50%;

  border: 2px solid rgba(34,197,94,0.3);

  animation: pulse-ring 2.4s linear infinite;
}

.pulse-ring.delay {
  animation-delay: 1.2s;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }

  100% {
    transform: scale(1.35);
    opacity: 0;
  }
}

/* Name */

.caller-name {
  margin-top: 40px;

  color: white;

  font-size: 28px;
  font-weight: 700;
}

.caller-subtitle {
  margin-top: 8px;

  color: #94a3b8;

  font-size: 15px;
}

/* Controls */

.call-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;

  padding: 0 24px 42px;
}

.call-control-btn {
  width: 58px;
  height: 58px;

  color: white;

  backdrop-filter: blur(10px);

  transition: all 0.25s ease;
}

.call-control-btn.secondary {
  background: rgba(255,255,255,0.08);
}

.call-control-btn.secondary:hover {
  background: rgba(255,255,255,0.14);

  transform: translateY(-2px);
}

.call-control-btn.secondary.active {
  background: rgba(239,68,68,0.24);
  color: #fecaca;
}

.end-call-btn {
  background: linear-gradient(
    135deg,
    #ef4444,
    #dc2626
  );
}

.end-call-btn:hover {
  transform: scale(1.06);
}

/* Animation */

.call-screen-enter-active,
.call-screen-leave-active {
  transition: all 0.35s ease;
}

.call-screen-enter-from,
.call-screen-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

/* Mobile */

@media (max-width: 600px) {
  .caller-avatar {
    width: 100px !important;
    height: 100px !important;

    font-size: 40px;
  }

  .caller-name {
    font-size: 24px;
  }

  .call-controls {
    gap: 14px;
  }

  .call-control-btn {
    width: 54px;
    height: 54px;
  }
}
</style>
