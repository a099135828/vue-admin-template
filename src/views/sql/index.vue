<template>
  <div class="sql-executor-container">
    <h2>SQL 执行器</h2>
    <p class="warning-text">
      <strong>警告:</strong> 此功能具有极高风险，请谨慎使用。确保您知道正在执行的 SQL 语句的含义和影响。
    </p>

    <div class="input-section">
      <textarea
        v-model="sqlQuery"
        placeholder="在此输入 SQL 语句 (例如: SELECT * FROM users)"
        rows="5"
      ></textarea>
      <button @click="executeSql" :disabled="isLoading">
        {{ isLoading ? '执行中...' : '执行 SQL' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      <p><strong>错误:</strong></p>
      <pre>{{ error }}</pre>
    </div>

    <div v-if="responseMessage && !isLoading" class="response-message">
      <p>{{ responseMessage }}</p>
      <p v-if="affectedRows !== null">受影响行数: {{ affectedRows }}</p>
    </div>

    <div v-if="results.length > 0 && columns.length > 0 && !isLoading" class="results-table">
      <h3>查询结果:</h3>
      <table>
        <thead>
        <tr>
          <th v-for="column in columns" :key="column">{{ column }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(row, rowIndex) in results" :key="rowIndex">
          <td v-for="column in columns" :key="column + rowIndex">
            {{ formatCell(row[column]) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="!error && !responseMessage && !isLoading && hasExecuted && results.length === 0" class="no-results">
      <p>查询成功执行，但没有返回数据。</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // 确保你已经安装并正确配置了 axios

export default {
  name: 'SqlExecutor',
  data() {
    return {
      sqlQuery: '',
      isLoading: false,
      error: null,
      results: [],
      columns: [],
      responseMessage: null,
      affectedRows: null,
      hasExecuted: false, // To track if a query has been run
    };
  },
  methods: {
    async executeSql() {
      if (!this.sqlQuery.trim()) {
        this.error = 'SQL 查询不能为空。';
        this.results = [];
        this.columns = [];
        this.responseMessage = null;
        this.affectedRows = null;
        this.hasExecuted = false;
        return;
      }

      this.isLoading = true;
      this.error = null;
      this.results = [];
      this.columns = [];
      this.responseMessage = null;
      this.affectedRows = null;
      this.hasExecuted = true;

      try {
        // 后端 API 地址，请根据你的实际情况修改
        const response = await axios.post('http://localhost:8080/api/sql/execute', { sql: this.sqlQuery });

        if (response.data.success) {
          this.responseMessage = response.data.message;
          if (response.data.data && response.data.data.length > 0) {
            this.results = response.data.data;
            // 从后端获取列名，或者从第一行数据中提取
            this.columns = response.data.columns || Object.keys(response.data.data[0]);
          } else if (response.data.data) { // Query returned empty set
            this.results = [];
            this.columns = response.data.columns || [];
          }

          if (response.data.affectedRows !== undefined) {
            this.affectedRows = response.data.affectedRows;
          }

        } else {
          this.error = response.data.message || '执行 SQL 时发生未知错误。';
        }
      } catch (err) {
        console.error('API call failed:', err);
        if (err.response && err.response.data && err.response.data.message) {
          this.error = `请求失败: ${err.response.data.message}`;
        } else if (err.message) {
          this.error = `请求失败: ${err.message}`;
        } else {
          this.error = '无法连接到服务器或发生未知网络错误。';
        }
      } finally {
        this.isLoading = false;
      }
    },
    formatCell(value) {
      if (value === null) return 'NULL';
      if (typeof value === 'object') return JSON.stringify(value); // Handle nested objects/arrays if any
      return value;
    }
  },
};
</script>

<style scoped>
.sql-executor-container {
  padding: 20px;
  font-family: Arial, sans-serif;
  max-width: 900px;
  margin: auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 10px;
}

.warning-text {
  background-color: #fff3cd;
  color: #856404;
  padding: 10px;
  border: 1px solid #ffeeba;
  border-radius: 4px;
  margin-bottom: 20px;
  text-align: center;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 1rem;
  min-height: 100px;
}

button {
  padding: 10px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  background-color: #0056b3;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}
.error-message pre {
  white-space: pre-wrap; /* Allow long error messages to wrap */
  word-break: break-all;
}

.response-message {
  background-color: #d4edda;
  color: #155724;
  padding: 10px;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  margin-bottom: 20px;
}

.results-table {
  margin-top: 20px;
  overflow-x: auto; /* For tables with many columns */
}

table {
  width: 100%;
  border-collapse: collapse;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
  font-size: 0.9rem;
}

th {
  background-color: #e9ecef;
  color: #495057;
  font-weight: bold;
}

tbody tr:nth-child(even) {
  background-color: #f8f9fa;
}

tbody tr:hover {
  background-color: #e2e6ea;
}

.no-results {
  padding: 10px;
  background-color: #e2e6ea;
  color: #383d41;
  border: 1px solid #dae0e5;
  border-radius: 4px;
  text-align: center;
}
</style>
