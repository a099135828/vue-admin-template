<template>
  <div class="app-container">
    <el-table
      v-loading="listLoading"
      :data="list"
      element-loading-text="加载中..."
      border
      fit
      highlight-current-row
    >
      <el-table-column align="center" label="课程号" width="120">
        <template slot-scope="scope">
          {{ scope.row.cno }}
        </template>
      </el-table-column>

      <el-table-column label="课程名称">
        <template slot-scope="scope">
          {{ scope.row.cname }}
        </template>
      </el-table-column>

      <el-table-column label="学分" width="100" align="center">
        <template slot-scope="scope">
          {{ scope.row.ccredit }}
        </template>
      </el-table-column>

      <el-table-column label="先修课程" width="120" align="center">
        <template slot-scope="scope">
          {{ scope.row.cpno || '无' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      list: null,
      listLoading: true,
      controller: new AbortController() // 用于取消请求
    }
  },
  created() {
    this.fetchData()
  },
  beforeDestroy() {
    this.controller.abort() // 组件销毁时取消请求
  },
  methods: {
    async fetchData() {
      try {
        this.listLoading = true
        const response = await fetch('http://localhost:8080/select', {
          signal: this.controller.signal
        })
        this.list = await response.json()
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('数据获取失败:', error)
        }
      } finally {
        this.listLoading = false
      }
    }
  }
}
</script>
