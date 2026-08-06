<script setup lang="ts">
/**
 * AI 导入设置面板组件（新增组件，不修改任何现有代码）
 *
 * 功能：
 * - 输入和保存硅基流动 API Key（存 localStorage）
 * - 选择 AI 模型
 * - 测试 API 连接
 * - 查看使用说明
 */
import { ref, onMounted } from 'vue'
import { X, Key, Cpu, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-vue-next'
import {
  getApiKey,
  setApiKey,
  clearApiKey,
  getAiModel,
  setAiModel,
  hasApiKey,
  testApiKey,
  AI_MODELS,
} from '@/utils/aiImport'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// 状态
const apiKeyInput = ref('')
const selectedModel = ref(getAiModel())
const showKey = ref(false)
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const saved = ref(false)

onMounted(() => {
  apiKeyInput.value = getApiKey()
})

const handleSave = () => {
  const key = apiKeyInput.value.trim()
  if (key) {
    setApiKey(key)
    setAiModel(selectedModel.value)
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  } else {
    clearApiKey()
    saved.value = true
    setTimeout(() => saved.value = false, 2000)
  }
}

const handleTest = async () => {
  // 先保存再测试
  handleSave()
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testApiKey()
  } catch (err) {
    testResult.value = {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    }
  } finally {
    testing.value = false
  }
}

const handleClear = () => {
  apiKeyInput.value = ''
  clearApiKey()
  testResult.value = null
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="props.show" class="ai-settings-overlay" @click.self="handleClose">
        <div class="ai-settings-modal">
          <!-- 头部 -->
          <div class="modal-header">
            <h2 class="modal-title">
              <Cpu class="w-5 h-5" />
              AI 智能导入设置
            </h2>
            <button class="close-btn" @click="handleClose">
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- 内容 -->
          <div class="modal-body">
            <!-- 说明 -->
            <div class="info-banner">
              <p>
                <strong>AI 智能导入</strong>使用大模型解析简历，无论 PDF 格式如何排版，都能准确识别所有字段。
              </p>
              <p class="info-tip">
                API Key 只保存在你的浏览器本地（localStorage），不会写入文件、不会进 Git、不会上传到任何服务器。
              </p>
            </div>

            <!-- API Key 输入 -->
            <div class="form-group">
              <label class="form-label">
                <Key class="w-4 h-4" />
                硅基流动 API Key
              </label>
              <div class="input-wrapper">
                <input
                  :type="showKey ? 'text' : 'password'"
                  v-model="apiKeyInput"
                  placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  class="api-key-input"
                  autocomplete="off"
                  spellcheck="false"
                />
                <button class="toggle-btn" @click="showKey = !showKey" type="button">
                  <Eye v-if="showKey" class="w-4 h-4" />
                  <EyeOff v-else class="w-4 h-4" />
                </button>
              </div>
              <p class="form-hint">
                在 <a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener" class="link">cloud.siliconflow.cn</a> → API 密钥 → 新建密钥 获取
              </p>
            </div>

            <!-- 模型选择 -->
            <div class="form-group">
              <label class="form-label">
                <Cpu class="w-4 h-4" />
                选择模型
              </label>
              <div class="model-list">
                <label
                  v-for="model in AI_MODELS"
                  :key="model.id"
                  class="model-option"
                  :class="{ active: selectedModel === model.id }"
                >
                  <input
                    type="radio"
                    :value="model.id"
                    v-model="selectedModel"
                    class="model-radio"
                  />
                  <div class="model-info">
                    <div class="model-name">
                      {{ model.name }}
                      <span v-if="model.cheap" class="badge-cheap">省钱</span>
                    </div>
                    <div class="model-desc">{{ model.desc }}</div>
                  </div>
                </label>
              </div>
            </div>

            <!-- 测试结果 -->
            <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
              <CheckCircle v-if="testResult.success" class="w-4 h-4 flex-shrink-0" />
              <AlertCircle v-else class="w-4 h-4 flex-shrink-0" />
              <span>{{ testResult.message }}</span>
            </div>

            <!-- 已保存提示 -->
            <Transition name="fade">
              <div v-if="saved" class="saved-toast">
                <CheckCircle class="w-4 h-4" />
                设置已保存
              </div>
            </Transition>
          </div>

          <!-- 底部按钮 -->
          <div class="modal-footer">
            <button v-if="apiKeyInput" class="btn-clear" @click="handleClear">
              清除 Key
            </button>
            <button class="btn-test" @click="handleTest" :disabled="testing || !apiKeyInput">
              <Loader2 v-if="testing" class="w-4 h-4 animate-spin" />
              <Cpu v-else class="w-4 h-4" />
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
            <button class="btn-save" @click="handleSave">
              <CheckCircle class="w-4 h-4" />
              保存设置
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.ai-settings-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.ai-settings-modal {
  background: var(--bg-primary, #1a1b2e);
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary, #fff);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #aaa);
  cursor: pointer;
  transition: all 0.2s;
}
.close-btn:hover {
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.info-banner {
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.info-banner p {
  margin: 0;
  font-size: 13.5px;
  color: var(--text-secondary, #ccc);
  line-height: 1.6;
}
.info-banner strong {
  color: var(--text-primary, #fff);
}
.info-tip {
  margin-top: 6px !important;
  font-size: 12px !important;
  color: rgba(34, 197, 94, 0.8) !important;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.api-key-input {
  width: 100%;
  padding: 12px 44px 12px 14px;
  border-radius: 10px;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
  font-size: 14px;
  font-family: 'Courier New', monospace;
  outline: none;
  transition: border-color 0.2s;
}
.api-key-input:focus {
  border-color: rgba(99, 102, 241, 0.6);
}
.api-key-input::placeholder {
  color: var(--text-tertiary, #666);
}

.toggle-btn {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #888);
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-btn:hover {
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.form-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-tertiary, #888);
}
.link {
  color: rgba(99, 102, 241, 1);
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}

.model-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.model-option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.05));
  border: 1.5px solid var(--border-color, rgba(255, 255, 255, 0.1));
  cursor: pointer;
  transition: all 0.2s;
}
.model-option:hover {
  border-color: rgba(99, 102, 241, 0.4);
}
.model-option.active {
  border-color: rgba(99, 102, 241, 0.8);
  background: rgba(99, 102, 241, 0.1);
}

.model-radio {
  margin-top: 3px;
  accent-color: rgb(99, 102, 241);
  cursor: pointer;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #fff);
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge-cheap {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(34, 197, 94, 0.2);
  color: rgb(74, 222, 128);
  font-weight: 500;
}

.model-desc {
  font-size: 12px;
  color: var(--text-tertiary, #888);
  margin-top: 2px;
}

.test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  margin-bottom: 16px;
}
.test-result.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(74, 222, 128);
}
.test-result.error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(248, 113, 113);
}

.saved-toast {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: rgb(74, 222, 128);
  font-size: 13px;
}

.modal-footer {
  display: flex;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color, rgba(255, 255, 255, 0.1));
}

.btn-clear {
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: rgb(248, 113, 113);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear:hover {
  background: rgba(239, 68, 68, 0.25);
}

.btn-test {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 10px;
  background: var(--bg-secondary, rgba(255, 255, 255, 0.08));
  border: 1px solid var(--border-color, rgba(255, 255, 255, 0.15));
  color: var(--text-primary, #fff);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-test:hover:not(:disabled) {
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.12));
}
.btn-test:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.8), rgba(139, 92, 246, 0.8));
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: auto;
}
.btn-save:hover {
  filter: brightness(1.15);
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .ai-settings-modal,
.modal-leave-active .ai-settings-modal {
  transition: transform 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .ai-settings-modal,
.modal-leave-to .ai-settings-modal {
  transform: scale(0.95) translateY(10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
