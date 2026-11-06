<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import TabBar from '../../components/TabBar.vue'
import { repository, type CareRecord } from '../../storage/records'
const records = ref<CareRecord[]>([]),
  tab = ref('records'),
  error = ref('')
onShow(async () => {
  try {
    records.value = await repository.listRecords()
  } catch {
    error.value = '记录暂时无法读取，原数据已保留'
  }
})
const list = computed(() =>
  tab.value === 'records'
    ? records.value
    : records.value.filter((r) => r.status === 'tried' || r.status === 'helped'),
)
function date(s: string) {
  const d = new Date(s)
  return d.toDateString() === new Date().toDateString()
    ? '今天'
    : `${d.getMonth() + 1}月${d.getDate()}日`
}
const labels = { ready: '准备试试', tried: '试过了', helped: '有帮助', unsuitable: '暂不适用' }
function navigate(url: string) {
  uni.navigateTo({ url })
}
</script>
<template>
  <view class="screen"
    ><view class="topbar history-header"
      ><text class="title">回看</text
      ><button
        role="button"
        class="icon-btn"
        aria-label="新建记录"
        @click="navigate('/pages/journal/index')"
      >
        <image class="icon" src="/static/icons/plus.svg" /></button></view
    ><view class="segmented"
      ><button role="button" :class="{ selected: tab === 'records' }" @click="tab = 'records'">
        记录</button
      ><button
        role="button"
        :class="{ selected: tab === 'adjustments' }"
        @click="tab = 'adjustments'"
      >
        调整
      </button></view
    ><view v-if="!list.length" class="empty"
      ><image class="icon" src="/static/icons/history.svg" /><text class="empty-title">{{
        tab === 'records' ? '从一次记录开始' : '改变，可以慢慢来'
      }}</text
      ><text class="small empty-copy">{{
        tab === 'records' ? '写下的事，会在这里等你回看。' : '标记为“试过了”的调整会出现在这里。'
      }}</text
      ><button
        role="button"
        v-if="tab === 'records'"
        class="text-link"
        @click="navigate('/pages/journal/index')"
      >
        写下这一次
      </button></view
    ><view v-else class="records"
      ><button
        role="button"
        v-for="r in list"
        :key="r.id"
        class="record-row"
        @click="navigate('/pages/result/index?id=' + r.id)"
      >
        <view class="record-text"
          ><text class="eyebrow">{{ date(r.createdAt) }}</text
          ><text class="record-title">{{
            tab === 'records' ? r.input.facts : r.result.action
          }}</text
          ><text v-if="tab === 'adjustments'" class="small">{{ labels[r.status] }}</text></view
        ><view class="record-end"
          ><view v-if="r.status === 'ready'" class="dot" /><image
            class="icon"
            src="/static/icons/chevron.svg"
        /></view></button></view
    ><text v-if="error" class="error">{{ error }}</text
    ><TabBar active="history"
  /></view>
</template>
<style scoped>
.history-header {
  margin-bottom: 10px;
}
.history-header .title {
  margin: 0;
}
.segmented {
  display: flex;
  padding: 3px;
  border-radius: 10px;
  background: #f0f1f3;
  margin: 22px 0 30px;
}
.segmented button {
  flex: 1;
  padding: 9px;
  background: transparent;
  color: #8b9097;
  font-size: 15px;
  border-radius: 8px;
}
.segmented .selected {
  color: #242c34;
  background: #fff;
  box-shadow: 0 1px 3px #00000012;
}
.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 12px;
  width: 100%;
  padding: 23px 0;
  background: transparent;
  border-bottom: 1px solid #eceef1;
}
.record-text {
  min-width: 0;
}
.record-title {
  font-size: 19px;
  display: block;
  margin-top: 7px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 340px;
}
.record-end {
  display: flex;
  gap: 10px;
  align-items: center;
}
.record-end .icon {
  width: 18px;
  height: 18px;
}
.dot {
  width: 7px;
  height: 7px;
  background: #3878b5;
  border-radius: 50%;
}
.empty-title,
.empty-copy {
  display: block;
}
.empty-title {
  font-size: 21px;
  margin-bottom: 12px;
}
.empty-copy {
  margin-bottom: 14px;
}
@media (max-width: 400px) {
  .record-title {
    max-width: 235px;
  }
}
</style>
