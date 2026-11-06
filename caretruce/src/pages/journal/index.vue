<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { categories, templates, reflect, type ReflectionInput } from '../../domain/reflection'
import { repository } from '../../storage/records'
const step = ref(0),
  busy = ref(false),
  error = ref(''),
  saved = ref(false)
const input = reactive<ReflectionInput>({
  facts: '',
  feelings: '',
  needs: '',
  category: '',
  context: '',
})
const titles = ['发生了什么？', '此刻，什么感受？', '你真正需要什么？', '更接近哪种情况？']
const hints = [
  '只写发生的事，不急着判断。',
  '没有标准答案，也可以跳过。',
  '把期待说具体一点，也可以跳过。',
  '选一个最接近的就好。',
]
const contexts = computed(() => templates.filter((t) => t.category === input.category))
const fields = ['facts', 'feelings', 'needs'] as const
const feelings = ['疲惫', '委屈', '担心', '失落', '生气', '说不清']
const id = ref('')
const editId = ref('')
onLoad(async (options) => {
  id.value = String(Date.now()) + '-' + Math.random().toString(36).slice(2)
  if (options?.edit) {
    editId.value = options.edit
    const r = (await repository.listRecords()).find((r) => r.id === options.edit)
    if (r) Object.assign(input, r.input)
  } else {
    const draft = await repository.loadDraft()
    if (draft) Object.assign(input, draft)
  }
})
async function save(): Promise<boolean> {
  if (editId.value) return true
  try {
    await repository.saveDraft({ ...input })
    saved.value = true
    error.value = ''
    return true
  } catch {
    error.value = '暂时无法保存，请不要关闭页面'
    return false
  }
}
function change(e: any) {
  input[fields[step.value]] = e.detail.value
  saved.value = false
  void save()
}
function chooseFeeling(value: string) {
  input.feelings = value
  void save()
}
function chooseContext(value: string) {
  input.context = value
  void save()
}
function choose(category: string) {
  input.category = category
  input.context = ''
  void save()
}
async function next() {
  if (busy.value) return
  if (step.value === 0 && !input.facts.trim()) {
    error.value = '先写下一件发生的事'
    return
  }
  busy.value = true
  error.value = ''
  try {
    if (!(await save())) return
    if (step.value < 3) {
      step.value++
      return
    }
    if (!input.category || !input.context) {
      error.value = '选好类型后，再选一个接近的情境'
      return
    }
    let r
    if (editId.value) {
      r = await repository.updateRecord(editId.value, {
        input: { ...input },
        result: reflect(input),
        status: 'ready',
        note: '',
      })
    } else r = await repository.saveRecord(id.value, { ...input })
    uni.redirectTo({ url: '/pages/result/index?id=' + r.id })
  } catch {
    error.value = '保存失败，你填写的内容仍在这里'
  } finally {
    busy.value = false
  }
}
async function back() {
  if (busy.value) return
  busy.value = true
  try {
    if (!(await save())) return
    if (step.value > 0) step.value--
    else uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/home/index' }) })
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <view class="screen flow journal"
    ><view class="topbar"
      ><button role="button" class="icon-btn" aria-label="返回上一步" @click="back">
        <image class="icon" src="/static/icons/back.svg" /></button
      ><text class="eyebrow">{{ step + 1 }} / 4</text><view style="width: 44px" /></view
    ><text class="title">{{ titles[step] }}</text
    ><text class="subtitle">{{ hints[step] }}</text
    ><view v-if="step < 3" class="writing">
      <textarea
        :key="step"
        :value="input[fields[step]]"
        @input="change"
        :maxlength="3000"
        :placeholder="step === 0 ? '今天……' : step === 1 ? '我感到……' : '我希望……'"
        :aria-label="titles[step]"
        auto-height
        class="journal-input"
        :adjust-position="true"
      /><view v-if="step === 1" class="feeling-options"
        ><button
          role="button"
          v-for="f in feelings"
          :key="f"
          class="feeling"
          @click="chooseFeeling(f)"
        >
          {{ f }}
        </button></view
      ></view
    ><view v-else class="choices"
      ><view class="category-grid"
        ><button
          role="button"
          v-for="c in categories"
          :key="c.id"
          :class="['category', { active: input.category === c.id }]"
          @click="choose(c.id)"
        >
          {{ c.label }}
        </button></view
      ><view v-if="input.category" class="context-list"
        ><text class="eyebrow">哪一个更接近？</text
        ><button
          role="button"
          v-for="t in contexts"
          :key="t.id"
          class="context-row"
          @click="chooseContext(t.context)"
        >
          <text>{{ t.label }}</text
          ><text
            :class="['radio', { checked: input.context === t.context }]"
          /></button></view></view
    ><view class="bottom-actions"
      ><text v-if="error" class="error">{{ error }}</text
      ><view class="save-status"
        ><text>{{
          editId ? '修改将在完成后保存' : saved ? '✓ 已临时保存' : '仅在本次体验中保存'
        }}</text></view
      ><button role="button" class="primary" :disabled="busy" @click="next">
        {{ busy ? '保存中…' : step === 3 ? '看看这次复盘' : '继续' }}
      </button></view
    ></view
  >
</template>
<style scoped>
.journal .topbar {
  margin-bottom: 30px;
}
.writing {
  flex: 1;
  padding: 45px 0 20px;
  min-height: 200px;
}
.journal-input {
  width: 100%;
  font-size: 22px;
  line-height: 1.9;
  min-height: 160px;
  max-height: 36vh;
}
.feeling-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.feeling {
  padding: 9px 16px;
  border-radius: 20px;
  background: #f5f7f9;
  color: #677583;
  font-size: 15px;
}
.choices {
  padding-top: 30px;
}
.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.category {
  padding: 13px 8px;
  background: #f5f7f9;
  border-radius: 12px;
  font-size: 16px;
  color: #68727c;
}
.category.active {
  background: #eaf2fa;
  color: #286da9;
}
.context-list {
  margin-top: 30px;
}
.context-row {
  width: 100%;
  padding: 19px 0;
  text-align: left;
  border-bottom: 1px solid #eceef1;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 16px;
}
.radio {
  width: 20px;
  height: 20px;
  border: 1px solid #d6dce2;
  border-radius: 50%;
  flex-shrink: 0;
}
.checked {
  border: 6px solid #3878b5;
}
.save-status {
  text-align: center;
  font-size: 13px;
  color: #9298a0;
  margin-bottom: 20px;
  border-top: 1px solid #eceef1;
  padding-top: 18px;
}
</style>
