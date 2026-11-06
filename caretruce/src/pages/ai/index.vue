<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { repository } from '../../storage/records'
import { redact } from '../../services/privacy'
const preview = ref(''),
  names = ref(''),
  original = ref(''),
  consent = ref(false),
  found = ref(false)
onLoad(async (options) => {
  const r = (await repository.listRecords()).find((r) => r.id === options?.id)
  if (r) {
    original.value = `发生的事：${r.input.facts}\n我的感受：${r.input.feelings || '未填写'}\n我的需要：${r.input.needs || '未填写'}`
    preview.value = redact(original.value)
    found.value = true
  }
})
function hideNames() {
  preview.value = redact(
    preview.value,
    names.value.split(/[，,、\n]/).map((n) => n.trim()),
  )
}
function back() {
  preview.value = ''
  original.value = ''
  uni.navigateBack()
}
</script>
<template>
  <view class="screen flow"
    ><view class="topbar"
      ><button role="button" class="icon-btn" aria-label="取消 AI 预览" @click="back">
        <image class="icon" src="/static/icons/back.svg" /></button
      ><text class="eyebrow">AI 深化</text><view style="width: 44px" /></view
    ><text class="title">先确认，再发送。</text
    ><text class="subtitle"
      >这段内容会经过我们的服务，发送给模型厂商。你可以删去任何不想透露的信息。</text
    ><template v-if="found"
      ><text class="small warning"
        >自动隐去仅为辅助，姓名、地址和医院名仍需你检查。当前尚未开通服务，不会发送。</text
      ><view class="hide-names"
        ><input
          v-model="names"
          placeholder="要隐去的姓名或地点，用逗号分隔"
          aria-label="要隐去的词语"
        /><button role="button" class="text-link" @click="hideNames">隐去</button></view
      ><textarea
        v-model="preview"
        class="preview"
        :maxlength="6000"
        aria-label="实际发送内容"
      /><button role="button" class="consent" @click="consent = !consent">
        <text>{{ consent ? '☑' : '□' }}</text
        ><text>我已检查内容，理解 AI 建议可能不准确。</text>
      </button></template
    ><view v-else class="empty"><text>记录已不存在，请返回重试。</text></view
    ><view class="bottom-actions"
      ><button role="button" class="primary" disabled>AI 服务尚未开通</button
      ><button role="button" class="secondary cancel" @click="back">取消并清除预览</button></view
    ></view
  >
</template>
<style scoped>
.warning {
  display: block;
  margin: 22px 0;
  color: #8c745a;
}
.hide-names {
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid #eceef1;
  margin: 10px 0 20px;
}
.hide-names input {
  flex: 1;
  font-size: 14px;
  min-height: 45px;
}
.preview {
  width: 100%;
  min-height: 210px;
  line-height: 1.9;
  font-size: 17px;
}
.consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  text-align: left;
  font-size: 14px;
  background: transparent;
  color: #7b8590;
  padding: 16px 0;
}
.cancel {
  width: 100%;
}
</style>
