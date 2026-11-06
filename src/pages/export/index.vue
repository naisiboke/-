<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { repository } from '../../storage/records'
const preview = ref(''),
  error = ref(''),
  found = ref(false)
onLoad(async (options) => {
  const r = (await repository.listRecords()).find((r) => r.id === options?.id)
  if (r) {
    found.value = true
    preview.value = `这次照护复盘\n\n发生的事：${r.input.facts}\n\n我的感受：${r.input.feelings || '未填写'}\n\n我需要：${r.input.needs || '未填写'}\n\n下一次的尝试：${r.result.action}`
  }
})
function copy() {
  uni.showModal({
    title: '复制到系统剪贴板？',
    content: '其他应用可能读取剪贴板。请先删除不想分享的姓名、健康信息和家庭细节。',
    confirmText: '确认复制',
    success: (r) => {
      if (r.confirm)
        uni.setClipboardData({
          data: preview.value,
          success: () => uni.showToast({ title: '已复制', icon: 'none' }),
          fail: () => {
            error.value = '复制失败，请重试'
          },
        })
    },
  })
}
function back() {
  preview.value = ''
  uni.navigateBack()
}
</script>
<template>
  <view class="screen flow"
    ><view class="topbar"
      ><button role="button" class="icon-btn" aria-label="返回复盘" @click="back">
        <image class="icon" src="/static/icons/back.svg" /></button
      ><text class="eyebrow">文本导出</text><view style="width: 44px" /></view
    ><text class="title">导出前，再看一眼。</text
    ><text class="subtitle">只留下你愿意分享的部分。导出不会自动发送给任何人。</text
    ><textarea
      v-if="found"
      v-model="preview"
      class="export-preview"
      :maxlength="12000"
      aria-label="导出内容"
    /><view v-else class="empty">找不到这条记录</view
    ><text v-if="error" class="error">{{ error }}</text
    ><view class="bottom-actions"
      ><button role="button" class="primary" :disabled="!preview.trim()" @click="copy">
        复制文本</button
      ><button role="button" class="secondary cancel" @click="back">取消</button></view
    ></view
  >
</template>
<style scoped>
.export-preview {
  margin-top: 32px;
  min-height: 300px;
  flex: 1;
  width: 100%;
  font-size: 17px;
  line-height: 1.85;
}
.cancel {
  width: 100%;
}
</style>
