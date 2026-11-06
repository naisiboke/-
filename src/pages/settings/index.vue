<script setup lang="ts">
import TabBar from '../../components/TabBar.vue'
import { repository } from '../../storage/records'
function info(title: string, content: string) {
  uni.showModal({ title, content, showCancel: false, confirmText: '知道了' })
}
function clear() {
  uni.showModal({
    title: '清除所有临时记录？',
    content: '当前体验中的草稿与记录都会被删除，无法恢复。',
    confirmText: '清除',
    confirmColor: '#b24d4d',
    success: async (r) => {
      if (r.confirm) {
        await repository.clear()
        uni.showToast({ title: '已清除', icon: 'none' })
      }
    },
  })
}
</script>
<template>
  <view class="screen"
    ><text class="title block">我的</text
    ><view class="privacy"
      ><image class="icon" src="/static/icons/lock.svg" /><text class="privacy-title"
        >留给自己的空间</text
      ><text class="small">当前为开发体验版，请使用虚构内容。</text></view
    ><text class="eyebrow section">隐私与数据</text
    ><button
      role="button"
      class="setting-row"
      @click="
        info(
          '临时记录模式',
          '记录仅保存在当前运行内存中。刷新或关闭后会丢失，不会自动上传。原生加密与生物识别尚未接入，请勿填写真实个人或健康信息。',
        )
      "
    >
      <text>记录保存方式</text><text class="small">临时保存 ›</text></button
    ><button
      role="button"
      class="setting-row"
      @click="info('应用锁尚未接入', '需要完成 iOS 与安卓真机的生物识别和安全存储验证后才能开启。')"
    >
      <text>应用锁</text><text class="small">待接入 ›</text></button
    ><button
      role="button"
      class="setting-row"
      @click="
        info(
          '导出与备份尚未接入',
          '正式版将支持文本、PDF 和加密备份；当前不会生成未受保护的敏感备份文件。',
        )
      "
    >
      <text>导出与备份</text><text class="small">待接入 ›</text></button
    ><text class="eyebrow section">服务</text
    ><button
      role="button"
      class="setting-row"
      @click="
        info(
          'AI 服务尚未开通',
          '本地规则复盘可直接使用。AI 服务、发送预览与额度系统完成后才会开放网络调用，模型密钥不会放入 App。',
        )
      "
    >
      <text>AI 深化</text><text class="small">尚未开通 ›</text></button
    ><button
      role="button"
      class="setting-row"
      @click="
        info(
          '内购尚未开通',
          '当前不会收费。正式版需要完成商店内购、服务端交易校验和恢复购买的真机验证。',
        )
      "
    >
      <text>购买与恢复</text><text class="small">尚未开通 ›</text></button
    ><button
      role="button"
      class="setting-row"
      @click="
        info(
          '关于照护停火',
          'CareTruce 0.1.0 开发版。帮助照护者整理经历，尝试协作调整。建议仅供反思参考，不替代医疗、法律或专业支持。',
        )
      "
    >
      <text>关于照护停火</text
      ><image class="icon small-icon" src="/static/icons/chevron.svg" /></button
    ><button role="button" class="clear" @click="clear">清除所有临时记录</button
    ><TabBar active="settings"
  /></view>
</template>
<style scoped>
.block {
  display: block;
  margin-top: 8px;
}
.privacy {
  margin: 36px 0 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  text-align: center;
}
.privacy .icon {
  width: 30px;
  height: 30px;
}
.privacy-title {
  font-size: 20px;
}
.section {
  display: block;
  margin: 30px 0 10px;
}
.setting-row {
  background: transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 19px 0;
  border-bottom: 1px solid #eceef1;
  text-align: left;
  font-size: 17px;
}
.small-icon {
  width: 16px;
  height: 16px;
}
.clear {
  margin-top: 36px;
  padding: 12px 0;
  background: transparent;
  color: #b24d4d;
  font-size: 15px;
}
</style>
