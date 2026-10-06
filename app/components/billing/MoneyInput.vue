<template>
  <span class="money-input">
    <span class="money-symbol" aria-hidden="true">{{ symbol }}</span>
    <input
      v-bind="$attrs"
      :value="display"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      placeholder="0,00"
      @input="update"
    />
  </span>
</template>
<script setup lang="ts">
import { maskedMoneyDigits, minorAmount } from "~/utils/billing";
defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{ modelValue: string; currency?: string }>(),
  { currency: "BRL" },
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const symbol = computed(
  () =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: props.currency,
    })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? props.currency,
);
const display = computed(() => {
  if (!props.modelValue) return "";
  try {
    return maskedMoneyDigits(
      String(minorAmount(props.modelValue, props.currency, true)),
      props.currency,
    );
  } catch {
    return props.modelValue;
  }
});
function update(event: Event) {
  const input = event.target as HTMLInputElement;
  // Keep negative input invalid rather than silently changing its sign.
  const value = input.value.includes("-")
    ? input.value
    : maskedMoneyDigits(input.value, props.currency);
  input.value = value;
  emit("update:modelValue", value);
}
</script>
<style scoped>
.money-input {
  display: block;
  position: relative;
  min-width: 0;
  width: 100%;
}
.money-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 500;
  color: var(--muted);
  pointer-events: none;
}
.money-input input {
  width: 100%;
  box-sizing: border-box;
  padding-left: 52px;
  font-variant-numeric: tabular-nums;
}
</style>
