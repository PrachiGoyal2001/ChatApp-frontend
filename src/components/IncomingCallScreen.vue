<template>
  <transition name="incoming-popup">
    <div v-if="modelValue" class="incoming-call-popup">

      <!-- Top -->
      <div class="popup-top">

        <!-- Call Type -->
        <div class="incoming-label">
          Incoming {{ isVideoCall ? 'Video' : 'Voice' }} Call
        </div>

        <!-- Close -->
        <q-btn
          round
          flat
          dense
          size="10px"
          icon="close"
          class="close-btn"
          @click="rejectCall"
        />
      </div>

      <!-- Center -->
      <div class="popup-center">

        <!-- Avatar -->
        <div class="avatar-wrapper">
          <q-avatar size="88px" class="incoming-avatar">
            {{ username?.charAt(0)?.toUpperCase() }}
          </q-avatar>

          <!-- Online Dot -->
          <div class="online-dot"></div>
        </div>

        <!-- Name -->
        <div class="caller-name">
          {{ username }}
        </div>

        <!-- Subtitle -->
        <div class="caller-subtitle">
          Calling you...
        </div>
      </div>

      <!-- Bottom -->
      <div class="popup-actions">

        <!-- Reject -->
        <q-btn
          round
          icon="call_end"
          class="popup-btn reject-btn"
          @click="rejectCall"
        />

        <!-- Accept -->
        <q-btn
          round
          :icon="isVideoCall ? 'videocam' : 'call'"
          class="popup-btn accept-btn"
          @click="acceptCall"
        />
      </div>

    </div>
  </transition>
</template>

<script setup>
defineProps({
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
})

const emit = defineEmits([
  'update:modelValue',
  'accept',
  'reject',
])

const rejectCall = () => {
  emit('reject')
  emit('update:modelValue', false)
}

const acceptCall = () => {
  emit('accept')
}
</script>

<style scoped>
.incoming-call-popup {
  position: fixed;

  right: 24px;
  bottom: 24px;

  width: 320px;

  z-index: 99999;

  padding: 18px;

  border-radius: 28px;

  background:
    linear-gradient(
      180deg,
      rgba(30,41,59,0.98),
      rgba(15,23,42,0.98)
    );

  backdrop-filter: blur(20px);

  border: 1px solid rgba(255,255,255,0.08);

  box-shadow:
    0 20px 60px rgba(0,0,0,0.45),
    0 0 0 1px rgba(255,255,255,0.03);

  overflow: hidden;
}

/* Glow */

.incoming-call-popup::before {
  content: '';

  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      circle at top right,
      rgba(34,197,94,0.12),
      transparent 40%
    );

  pointer-events: none;
}

/* Top */

.popup-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.incoming-label {
  color: #22c55e;

  font-size: 13px;
  font-weight: 700;

  letter-spacing: 0.4px;
}

.close-btn {
  color: #94a3b8;
}

/* Center */

.popup-center {
  display: flex;
  flex-direction: column;
  align-items: center;

  padding: 26px 0 30px;
}

/* Avatar */

.avatar-wrapper {
  position: relative;
}

.incoming-avatar {
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  color: white;

  font-size: 34px;
  font-weight: 700;

  box-shadow:
    0 16px 40px rgba(34,197,94,0.28);
}

/* Online */

.online-dot {
  position: absolute;

  right: 4px;
  bottom: 4px;

  width: 18px;
  height: 18px;

  border-radius: 50%;

  background: #22c55e;

  border: 3px solid #0f172a;
}

/* Name */

.caller-name {
  margin-top: 22px;

  color: white;

  font-size: 22px;
  font-weight: 700;

  text-align: center;
}

/* Subtitle */

.caller-subtitle {
  margin-top: 8px;

  color: #94a3b8;

  font-size: 14px;
}

/* Actions */

.popup-actions {
  display: flex;
  justify-content: center;
  gap: 18px;
}

/* Buttons */

.popup-btn {
  width: 56px;
  height: 56px;

  color: white;

  transition: all 0.25s ease;
}

.popup-btn:hover {
  transform: translateY(-2px) scale(1.05);
}

/* Accept */

.accept-btn {
  background: linear-gradient(
    135deg,
    #22c55e,
    #16a34a
  );

  box-shadow:
    0 12px 30px rgba(34,197,94,0.28);
}

/* Reject */

.reject-btn {
  background: linear-gradient(
    135deg,
    #ef4444,
    #dc2626
  );

  box-shadow:
    0 12px 30px rgba(239,68,68,0.25);
}

/* Animation */

.incoming-popup-enter-active,
.incoming-popup-leave-active {
  transition: all 0.28s ease;
}

.incoming-popup-enter-from,
.incoming-popup-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.94);
}

/* Mobile */

@media (max-width: 600px) {

  .incoming-call-popup {
    top: 12px;
    left: 12px;
    right: 12px;
    bottom: auto;

    width: auto;

    padding: 14px 16px;

    border-radius: 20px;

    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;

    gap: 12px;

    animation: mobileNotificationSlide 0.28s ease;
  }

  /* Top row compact */

  .popup-top {
    display: none;
  }

  /* Center */

  .popup-center {
    flex-direction: row;

    align-items: center;

    gap: 12px;

    padding: 0;

    flex: 1;

    min-width: 0;
  }

  /* Avatar */

  .incoming-avatar {
    width: 54px !important;
    height: 54px !important;

    font-size: 22px;

    flex-shrink: 0;
  }

  .online-dot {
    width: 14px;
    height: 14px;

    border-width: 2px;
  }

  /* Text */

  .caller-name {
    margin-top: 0;

    font-size: 15px;

    text-align: left;

    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .caller-subtitle {
    margin-top: 4px;

    font-size: 12px;
  }

  /* Buttons */

  .popup-actions {
    gap: 10px;

    flex-shrink: 0;
  }

  .popup-btn {
    width: 44px;
    height: 44px;
  }

  /* Slide animation */

  @keyframes mobileNotificationSlide {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>