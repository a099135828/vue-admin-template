<template>
  <div class="sql-executor">
    <h2>SQL在线查询工具</h2>
    <div class="warning">
      <strong>安全警告:</strong> 此功能仅供授权用户查询数据使用。请勿尝试执行任何恶意或破坏性SQL。
    </div>

    <textarea
      v-model="sqlQuery"
      placeholder="在此输入SELECT语句, 例如: SELECT * FROM Student LIMIT 10"
      rows="8"
    ></textarea>

    <button @click="executeQuery" :disabled="isLoading">
      {{ isLoading ? '查询中...' : '执行查询' }}
    </button>

    <div v-if="error" class="error-message">
      <strong>查询失败:</strong> {{ error }}
    </div>

    <div v-if="results.length > 0" class="results-container">
      <h3>查询结果 ({{ results.length }} 条)</h3>
      <table>
        <thead>
        <tr>
          <th v-for="header in headers" :key="header">{{ header }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, index) in results" :key="index">
          <td v-for="header in headers" :key="header + index">
            {{ row[header] }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="searched && !isLoading" class="no-results">
      查询完成，没有返回数据。
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'SqlQueryExecutor',
  data() {
    return {
      sqlQuery: 'SELECT Sno, Sname, Ssex, Smajor FROM Student LIMIT 10;', // 默认示例SQL
      isLoading: false,
      results: [],
      headers: [],
      error: null,
      searched: false, // 标记是否已经执行过查询
    };
  },
  methods: {
    async executeQuery() {
      // 在发送前，先清理一下前端可能输入的分号
      const cleanSql = this.sqlQuery.trim().replace(/;$/, "");
      if (!cleanSql) {
        this.error = "SQL语句不能为空";
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.results = [];
      this.headers = [];
      this.searched = true;

      try {
        const response = await axios.post('http://localhost:8080/api/query/execute', {
          sql: cleanSql,
        });

        if (response.data && response.data.length > 0) {
          this.results = response.data;
          this.headers = Object.keys(response.data[0]);
        }
      } catch (err) {
        if (err.response && err.response.data && err.response.data.error) {
          // 获取后端返回的明确错误信息
          this.error = err.response.data.error;
        } else {
          // 通用网络错误
          this.error = '请求失败，请检查网络连接或后端服务是否正常。';
        }
      } finally {
        this.isLoading = false;
      }
    },
  },
};
</script>

<style scoped>
.sql-executor {
  max-width: 900px;
  margin: 20px auto;
  font-family: sans-serif;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}

textarea {
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1em;
  margin-bottom: 10px;
}

button {
  padding: 10px 20px;
  font-size: 1em;
  cursor: pointer;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.warning, .error-message, .no-results {
  margin: 15px 0;
  padding: 10px;
  border-radius: 4px;
}

.warning {
  background-color: #fffbe6;
  border: 1px solid #ffe58f;
}

.error-message {
  background-color: #fff1f0;
  border: 1px solid #ffa39e;
  color: #cf1322;
}

.no-results {
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
}

.results-container {
  margin-top: 20px;
  overflow-x: auto; /* 让表格可以横向滚动 */
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
}
</style>
