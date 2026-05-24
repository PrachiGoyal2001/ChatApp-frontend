<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    class="disconnect-dialog-layer"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="disconnect-dialog">
      <q-card-section class="dialog-header">
        <div>
          <div class="dialog-title">Disconnect call?</div>
          <div class="dialog-copy">
            You will be disconnected if you leave this page.
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="dialog-actions">
        <q-btn
          flat
          label="Cancel"
          class="cancel-btn"
          @click="$emit('cancel')"
        />
        <q-btn
          unelevated
          label="Yes, disconnect"
          class="confirm-btn"
          @click="$emit('confirm')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["update:modelValue", "confirm", "cancel"]);
</script>

<style scoped>
.disconnect-dialog {
  width: min(92vw, 420px);
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 24px 72px rgba(0, 0, 0, 0.56);
}

.dialog-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 22px 22px 10px;
}

.dialog-title {
  color: #ffffff;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.2;
}

.dialog-copy {
  margin-top: 8px;
  color: #94a3b8;
  font-size: 14px;
  line-height: 1.45;
}

.dialog-actions {
  gap: 10px;
  padding: 14px 22px 22px;
}

.cancel-btn {
  color: #cbd5e1;
}

.confirm-btn {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #ffffff;
}

:global(.disconnect-dialog-layer) {
  z-index: 12000 !important;
}
</style>
