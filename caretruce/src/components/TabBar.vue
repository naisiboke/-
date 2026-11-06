<script setup lang="ts">
defineProps<{ active: string }>()
const tabs = [
  { id: 'home', label: '此刻' },
  { id: 'history', label: '回看' },
  { id: 'settings', label: '我的', icon: 'user' },
]
function go(id: string) {
  uni.reLaunch({ url: `/pages/${id}/index` })
}
</script>
<template>
  <view class="tabbar"
    ><button
      role="button"
      v-for="t in tabs"
      :key="t.id"
      :class="['tab', { selected: active === t.id }]"
      @click="go(t.id)"
      :aria-label="t.label"
    >
      <image class="icon" :src="`/static/icons/${t.icon || t.id}.svg`" /><text>{{ t.label }}</text>
    </button></view
  >
</template>
<style scoped>
.tabbar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 520px;
  display: flex;
  justify-content: space-around;
  padding: 12px 10px calc(env(safe-area-inset-bottom) + 14px);
  border-top: 1px solid #eceef1;
  background: rgba(255, 255, 255, 0.97);
  z-index: 10;
}
.tab {
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  color: #9298a0;
  padding: 4px 28px;
  font-size: 12px;
}
.selected {
  color: #3878b5;
}
.selected .icon {
  filter: sepia(1) saturate(3) hue-rotate(165deg);
}
</style>
