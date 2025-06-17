<template>
  <div class="ai-agent-container">
    <div class="chat-panel">
      <!-- 1. 标题栏 -->
      <div class="chat-title">AI 助手</div>

      <!-- 2. 消息展示面板 -->
      <div class="message-panel" ref="messagePanel">
        <div class="message-list">
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-item"
            :class="msg.type === 'user' ? 'user-message' : 'ai-message'"
          >
            <!-- AI 消息 -->
            <template v-if="msg.type === 'ai'">
              <div class="user-icon">AI</div>
              <div class="message-content ai-content">
                <div v-html="msg.content"></div>
                <div v-if="msg.isLoading" class="loading-indicator"></div>
              </div>
            </template>
            <!-- 用户消息 -->
            <template v-else>
              <div class="message-content user-content">
                <div class="content-inner">{{ msg.content }}</div>
              </div>
              <div class="user-icon">我</div>
            </template>
          </div>
        </div>
      </div>

      <!-- 3. 输入面板 -->
      <div class="send-panel">
        <div class="send-form">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入你想问的问题 (Ctrl+Enter 发送)"
            v-model="userInput"
            :disabled="isLoading"
            @keydown.ctrl.enter.native.prevent="sendMessage"
            resize="none"
          ></el-input>
          <el-button
            type="primary"
            @click="sendMessage"
            :disabled="isLoading"
            style="margin-left: 10px; height: 60px;"
          >发送</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { marked } from 'marked';

// 后端 API 地址
const API_BASE_URL = 'http://localhost:8080';

export default {
  name: 'AIAgent',
  data() {
    return {
      messages: [],
      userInput: '',
      isLoading: false,
      contextString: '',
      abortController: null,
    };
  },
  methods: {
    async fetchInitialContext() {
      // ... (此方法保持不变)
      this.$message.info('正在准备上下文数据...');
      try {
        const [studentsRes, coursesRes,scsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/students/all`),
          axios.get(`${API_BASE_URL}/api/courses/all`),
          axios.get(`${API_BASE_URL}/api/SC/all`)
        ]);
        const studentsString = JSON.stringify(studentsRes.data, null, 2);
        const coursesString = JSON.stringify(coursesRes.data, null, 2);
        const scsString = JSON.stringify(scsRes.data, null, 2);
        this.contextString = `\n--- 学生数据 ---\n${studentsString}\n--- 课程数据 ---\n${coursesString}\n--- 联系数据 ---\n${scsString}\n`;
        this.$message.success('上下文数据准备就绪！');
      } catch (error) {
        this.$message.error('获取上下文数据失败，请检查后端服务！');
      }
    },

    async sendMessage() {
      const message = this.userInput.trim();
      if (!message || this.isLoading) return;

      this.isLoading = true;
      if (this.abortController) {
        this.abortController.abort();
      }
      this.abortController = new AbortController();

      this.messages.push({ id: Date.now(), type: 'user', content: message });
      this.userInput = '';
      this.scrollToBottom();

      const aiMessageId = Date.now() + 1;
      this.messages.push({ id: aiMessageId, type: 'ai', content: '', isLoading: true });
      this.scrollToBottom();

      const finalMessage = `${this.contextString}\n\n--- 用户问题 ---\n${message}`;

      try {
        const response = await fetch(`${API_BASE_URL}/openai/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: finalMessage }),
          signal: this.abortController.signal,
        });

        if (!response.ok) throw new Error(`服务器响应错误: ${response.status} ${response.statusText}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullAiResponse = '';

        // --- START OF OPTIMIZATION: 状态机过滤 <think> 标签 ---
        let inThinkBlock = false; // 状态标志位

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '' || !line.startsWith('data:')) continue;

            let data = line.substring(5).trim();
            if (data === '[DONE]') {
              this.closeConnection();
              return;
            }

            let processedData = '';
            let currentIndex = 0;

            // 在单个数据块中循环处理，因为可能包含多个标签
            while (currentIndex < data.length) {
              if (inThinkBlock) {
                // 如果在思考块内，寻找结束标签
                const endTagIndex = data.indexOf('</think>', currentIndex);
                if (endTagIndex !== -1) {
                  inThinkBlock = false;
                  currentIndex = endTagIndex + '</think>'.length;
                } else {
                  // 未找到结束标签，此数据块剩余部分全部丢弃
                  break;
                }
              } else {
                // 如果不在思考块内，寻找开始标签
                const startTagIndex = data.indexOf('<think>', currentIndex);
                if (startTagIndex !== -1) {
                  // 将开始标签前的内容加入结果
                  processedData += data.substring(currentIndex, startTagIndex);
                  inThinkBlock = true;
                  currentIndex = startTagIndex + '<think>'.length;
                } else {
                  // 未找到开始标签，此数据块剩余部分全部加入结果
                  processedData += data.substring(currentIndex);
                  break;
                }
              }
            }

            if (processedData) {
              fullAiResponse += processedData;
              const aiMessage = this.messages.find(m => m.id === aiMessageId);
              if (aiMessage) {
                aiMessage.content = marked.parse(fullAiResponse);
                this.scrollToBottom();
              }
            }
          }
        }
        // --- END OF OPTIMIZATION ---

      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error("请求或处理流失败:", error);
          const aiMessage = this.messages.find(m => m.id === aiMessageId);
          if (aiMessage) aiMessage.content = `<span style="color: red;">请求失败: ${error.message}</span>`;
        }
      } finally {
        this.closeConnection();
      }
    },

    closeConnection() {
      // ... (此方法保持不变)
      this.abortController = null;
      const lastAiMessage = this.messages.find(m => m.type === 'ai' && m.isLoading);
      if (lastAiMessage) lastAiMessage.isLoading = false;
      this.isLoading = false;
      this.$nextTick(() => { this.$el.querySelector('textarea')?.focus(); });
    },

    scrollToBottom() {
      // ... (此方法保持不变)
      this.$nextTick(() => {
        const panel = this.$refs.messagePanel;
        if (panel) panel.scrollTop = panel.scrollHeight;
      });
    },
  },
  created() {
    this.fetchInitialContext();
  },
  beforeDestroy() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
};
</script>

<style scoped>
/* 样式部分保持不变 */
.ai-agent-container {
  height: 100%; width: 100%; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
}
.chat-panel {
  background: #eff0f6; height: 100%; display: flex; flex-direction: column;
}
.chat-title {
  text-align: center; font-size: 20px; font-weight: bold; padding: 15px 0;
  border-bottom: 1px solid #ddd; background-color: #fff; flex-shrink: 0;
}
.message-panel {
  flex: 1; overflow-y: auto; padding: 10px;
}
.message-list {
  margin: 0 auto; max-width: 800px; width: 100%;
}
.message-item {
  margin: 15px 0; display: flex; align-items: flex-start;
}
.user-icon {
  width: 40px; height: 40px; line-height: 40px; border-radius: 50%;
  color: #fff; text-align: center; flex-shrink: 0; font-weight: bold;
}
.message-item.user-message {
  justify-content: flex-end;
}
.message-item.user-message .user-icon {
  background: #2d65f7; margin-left: 10px; order: 2;
}
.message-item.user-message .message-content {
  order: 1;
}
.message-content.user-content .content-inner {
  background: #2d65f7; color: #fff; padding: 10px 15px; border-radius: 10px;
  word-wrap: break-word; white-space: pre-wrap; max-width: 100%;
}
.message-item.ai-message .user-icon {
  background: #64018f; margin-right: 10px;
}
.message-content.ai-content {
  background: #fff; border-radius: 10px; padding: 10px 15px; line-height: 1.6;
  width: calc(100% - 50px); position: relative; min-height: 40px;
}
.message-content.ai-content ::v-deep p { margin: 0 0 10px 0; }
.message-content.ai-content ::v-deep p:last-child { margin-bottom: 0; }
.message-content.ai-content ::v-deep pre { background-color: #f5f5f5; padding: 10px; border-radius: 5px; white-space: pre-wrap; word-wrap: break-word; }
.message-content.ai-content ::v-deep code { font-family: "Courier New", Courier, monospace; }
.message-content.ai-content ::v-deep ol, .message-content.ai-content ::v-deep ul { padding-left: 20px; }
.loading-indicator {
  position: absolute; bottom: 5px; right: 10px; width: 20px; height: 20px;
  border: 3px solid rgba(0, 0, 0, 0.1); border-top-color: #333;
  border-radius: 50%; animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.send-panel {
  padding: 10px; background: #fff; border-top: 1px solid #ddd; flex-shrink: 0;
}
.send-form {
  max-width: 800px; margin: 0 auto; display: flex; align-items: center;
}
</style>
