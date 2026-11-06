<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '../../components/TabBar.vue'
import Pebble from '../../components/Pebble.vue'
import { repository } from '../../storage/records'
const hasDraft = ref(false)
onShow(async () => {
  hasDraft.value = !!(await repository.loadDraft())
})
function start() {
  navigate('/pages/journal/index')
}
function navigate(url: string) {
  uni.navigateTo({ url })
}
</script>
<template>
  <view class="screen home"
    ><view class="topbar"
      ><text class="brand">照护停火</text
      ><button
        role="button"
        class="icon-btn"
        aria-label="隐私与安全"
        @click="navigate('/pages/settings/index')"
      >
        <image class="icon" src="/static/icons/lock.svg" /></button></view
    ><text class="title greeting">慢慢说。</text
    ><view class="center"><Pebble /><text class="subtitle">留一点时间给自己。</text></view
    ><view class="home-actions"
      ><button role="button" class="primary" @click="start">
        {{ hasDraft ? '继续记录' : '开始记录' }}</button
      ><text class="demo-hint">开发体验 · 记录仅临时保存</text></view
    ><TabBar active="home"
  /></view>
</template>
<style scoped>
.home {
  display: flex;
  flex-direction: column;
}
.greeting {
  font-size: 40px;
}
.center {
  flex: 1;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0 28px;
}
.home-actions {
  padding-bottom: 10px;
}
.demo-hint {
  display: block;
  text-align: center;
  font-size: 12px;
  color: #9298a0;
  margin-top: 14px;
}
@media (max-height: 720px) {
  .center {
    gap: 0;
    min-height: 220px;
  }
  .greeting {
    font-size: 36px;
  }
}
</style>
