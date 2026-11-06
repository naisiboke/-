<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { repository, type CareRecord, type Status } from '../../storage/records'
const record = ref<CareRecord | null>(null),
  details = ref(false),
  error = ref(''),
  actionDraft = ref('')
const feedbackStatuses = ['tried', 'helped', 'unsuitable'] as const
const labels: Record<Status, string> = {
  ready: '准备试试',
  tried: '试过了',
  helped: '有帮助',
  unsuitable: '暂不适用',
}
onLoad(async (options) => {
  try {
    record.value = (await repository.listRecords()).find((r) => r.id === options?.id) || null
    actionDraft.value = record.value?.result.action || ''
  } catch {
    error.value = '暂时无法读取记录'
  }
})
function home() {
  uni.reLaunch({ url: '/pages/home/index' })
}
function ai() {
  if (record.value) uni.navigateTo({ url: '/pages/ai/index?id=' + record.value.id })
}
async function status(s: Status) {
  if (!record.value) return
  try {
    record.value = await repository.updateRecord(record.value.id, { status: s })
  } catch {
    error.value = '状态未能保存，请重试'
  }
}
async function note(e: any) {
  if (!record.value) return
  try {
    record.value = await repository.updateRecord(record.value.id, { note: e.detail.value })
  } catch {
    error.value = '反馈未能保存'
  }
}
function remove() {
  uni.showModal({
    title: '删除这条记录？',
    content: '删除后无法恢复。',
    confirmText: '删除',
    confirmColor: '#b24d4d',
    success: async (r) => {
      if (r.confirm && record.value) {
        await repository.deleteRecord(record.value.id)
        uni.reLaunch({ url: '/pages/history/index' })
      }
    },
  })
}
async function saveAction() {
  if (!record.value || !actionDraft.value.trim()) {
    error.value = '先写下一条具体调整'
    return
  }
  try {
    record.value = await repository.updateRecord(record.value.id, {
      result: { ...record.value.result, action: actionDraft.value.trim() },
      status: 'ready',
    })
    error.value = ''
    uni.showToast({ title: '调整已保存', icon: 'none' })
  } catch {
    error.value = '调整未能保存'
  }
}
function navigate(url: string) {
  uni.navigateTo({ url })
}
</script>
<template>
  <view class="screen flow result"
    ><view class="topbar"
      ><button role="button" class="icon-btn" aria-label="返回首页" @click="home">
        <image class="icon" src="/static/icons/back.svg" /></button
      ><text class="brand">一次小调整</text
      ><button role="button" class="icon-btn" aria-label="AI 深化" @click="ai">
        <image class="icon" src="/static/icons/sparkle.svg" /></button></view
    ><template v-if="record"
      ><view class="suggestion"
        ><view class="rings" aria-hidden="true"><view /><view /></view
        ><text class="eyebrow">下一次，可以试试</text
        ><text class="action">{{ record.result.action }}</text
        ><text class="small source">本地复盘 · 建议可按实际情况修改</text></view
      ><view class="result-actions"
        ><button role="button" class="primary" @click="status('ready')">
          {{ record.status === 'ready' ? '✓ 准备试试' : labels[record.status] }}</button
        ><view class="feedback"
          ><button
            role="button"
            v-for="s in feedbackStatuses"
            :key="s"
            :class="{ chosen: record.status === s }"
            @click="status(s)"
          >
            {{ labels[s] }}
          </button></view
        ><button role="button" class="secondary more" @click="details = !details">
          {{ details ? '收起这次复盘' : '查看这次复盘与反馈' }}
          <text>{{ details ? '−' : '+' }}</text>
        </button></view
      ><view v-if="details" class="detail"
        ><text class="eyebrow">把建议改成你能做到的事</text
        ><textarea
          v-model="actionDraft"
          class="note-input"
          aria-label="下一次调整内容"
          :maxlength="2000"
          auto-height
        /><button role="button" class="text-link" @click="saveAction">保存调整</button
        ><view style="height: 26px" /><text class="eyebrow">可能的协作缺口</text
        ><text class="body-copy block">{{ record.result.gap }}</text
        ><text class="eyebrow">发生的事</text
        ><text class="body-copy block">{{ record.input.facts }}</text
        ><template v-if="record.input.feelings"
          ><text class="eyebrow">我的感受</text
          ><text class="body-copy block">{{ record.input.feelings }}</text></template
        ><template v-if="record.input.needs"
          ><text class="eyebrow">我需要</text
          ><text class="body-copy block">{{ record.input.needs }}</text></template
        ><text class="eyebrow">试过之后，有什么变化？</text
        ><textarea
          class="note-input"
          :value="record.note"
          @blur="note"
          placeholder="留给下次回看的自己……"
          :maxlength="2000"
          auto-height
        /><button
          role="button"
          class="text-link"
          @click="navigate('/pages/export/index?id=' + record.id)"
        >
          导出文本</button
        ><view class="row"
          ><button
            role="button"
            class="text-link"
            @click="navigate('/pages/journal/index?edit=' + record.id)"
          >
            修改记录</button
          ><button role="button" class="delete" @click="remove">删除记录</button></view
        ></view
      ></template
    ><view v-else class="empty"
      ><text>暂时找不到这条记录</text
      ><text class="small block">开发模式下，刷新会清除临时记录。</text
      ><button role="button" class="text-link" @click="home">回到首页</button></view
    ><text v-if="error" class="error">{{ error }}</text></view
  >
</template>
<style scoped>
.suggestion {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 35px 10px 50px;
  text-align: center;
  min-height: 350px;
}
.rings {
  height: 70px;
  width: 90px;
  position: relative;
  margin-bottom: 36px;
}
.rings view {
  position: absolute;
  border: 1.7px solid #3878b5;
  width: 49px;
  height: 49px;
  border-radius: 50%;
  left: 5px;
  top: 20px;
}
.rings view + view {
  left: 35px;
  top: 0;
}
.action {
  font-size: 27px;
  font-weight: 600;
  line-height: 1.65;
  display: block;
  margin-top: 22px;
  letter-spacing: -0.4px;
}
.source {
  margin-top: 24px;
  font-size: 12px;
}
.feedback {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}
.feedback button {
  background: transparent;
  color: #9298a0;
  font-size: 14px;
  padding: 10px 14px;
  border-radius: 9px;
}
.feedback .chosen {
  color: #3878b5;
  background: #eef4fa;
}
.more {
  width: 100%;
  display: flex;
  justify-content: space-between;
  margin-top: 14px;
  padding: 20px 0;
  border-top: 1px solid #eceef1;
  font-size: 14px;
}
.detail {
  padding: 20px 0;
}
.block {
  display: block;
  margin: 12px 0 30px;
  white-space: pre-wrap;
}
.note-input {
  margin: 16px 0;
  width: 100%;
  min-height: 100px;
  font-size: 17px;
  line-height: 1.8;
}
.delete {
  background: transparent;
  color: #b24d4d;
  font-size: 15px;
  padding: 12px 0;
}
</style>
