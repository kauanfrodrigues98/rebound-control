<template>
  <div class="control-date-picker">
    <UPopover
      v-model:open="open"
      :content="{ align: 'start', side: 'bottom', collisionPadding: 16 }"
      :ui="{ content: 'control-date-popover' }"
    >
      <button
        class="control-date-trigger"
        type="button"
        :aria-expanded="open"
        :disabled="disabled"
      >
        <span :class="{ placeholder: !modelValue }">
          {{ selectedLabel }}
        </span>
        <span class="date-trigger-icon" aria-hidden="true">
          <UIcon name="i-lucide-calendar-days" />
        </span>
      </button>
      <template #content>
        <div class="date-picker-header">
          <button type="button" aria-label="Mes anterior" @click="moveMonth(-1)">
            <UIcon name="i-lucide-chevron-left" />
          </button>
          <strong>{{ monthLabel }}</strong>
          <button type="button" aria-label="Proximo mes" @click="moveMonth(1)">
            <UIcon name="i-lucide-chevron-right" />
          </button>
        </div>

        <div class="date-picker-weekdays" aria-hidden="true">
          <span v-for="day in weekdays" :key="day">{{ day }}</span>
        </div>

        <div class="date-picker-grid">
          <button
            v-for="day in calendarDays"
            :key="day.key"
            type="button"
            :class="{
              muted: !day.currentMonth,
              today: day.value === todayValue,
              selected: day.value === modelValue,
            }"
            @click="selectDate(day.value)"
          >
            {{ day.date.getDate() }}
          </button>
        </div>

        <div class="date-picker-actions">
          <button type="button" @click="selectDate(todayValue)">Hoje</button>
          <button type="button" @click="clearDate">Limpar</button>
        </div>
      </template>
    </UPopover>
    <input
      :name="name"
      :required="required"
      :value="modelValue"
      :disabled="disabled"
      class="sr-only-date"
      tabindex="-1"
      aria-hidden="true"
      readonly
    />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  name?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
}>(), {
  name: undefined,
  required: false,
  disabled: false,
  placeholder: 'Selecione uma data',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const visibleMonth = ref(startOfMonth(parseDateInput(props.modelValue) ?? new Date()))

const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
})
const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

const todayValue = formatDateInput(new Date())

const selectedLabel = computed(() => {
  const parsed = parseDateInput(props.modelValue)
  return parsed ? dateFormatter.format(parsed) : props.placeholder
})

const monthLabel = computed(() => {
  const label = monthFormatter.format(visibleMonth.value)
  return label.charAt(0).toUpperCase() + label.slice(1)
})

const calendarDays = computed(() => {
  const firstDay = startOfMonth(visibleMonth.value)
  const gridStart = addDays(firstDay, -firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index)
    const value = formatDateInput(date)

    return {
      key: value,
      date,
      value,
      currentMonth: date.getMonth() === visibleMonth.value.getMonth(),
    }
  })
})

watch(
  () => props.modelValue,
  (value) => {
    const parsed = parseDateInput(value)
    if (parsed) {
      visibleMonth.value = startOfMonth(parsed)
    }
  },
)

function moveMonth(amount: number): void {
  visibleMonth.value = new Date(
    visibleMonth.value.getFullYear(),
    visibleMonth.value.getMonth() + amount,
    1,
  )
}

function selectDate(value: string): void {
  emit('update:modelValue', value)
  open.value = false
}

function clearDate(): void {
  emit('update:modelValue', '')
  open.value = false
}

function parseDateInput(value?: string): Date | null {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + amount)
  return copy
}
</script>
