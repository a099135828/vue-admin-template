<template>
  <div class="query-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" label-width="80px">
      <el-form-item label="学号">
        <el-input v-model="queryParams.sno" placeholder="请输入学号"></el-input>
      </el-form-item>
      <el-form-item label="课程号">
        <el-input v-model="queryParams.cno" placeholder="请输入课程号"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button @click="fetchData" type="primary">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 学生信息表格 -->
    <el-table :data="students" border style="margin-top:20px">
      <el-table-column prop="sno" label="学号"></el-table-column>
      <el-table-column prop="sname" label="姓名"></el-table-column>
      <el-table-column prop="ssex" label="性别"></el-table-column>
      <el-table-column prop="sbirthdate" label="出生日期"></el-table-column>
      <el-table-column prop="smajor" label="专业"></el-table-column>
    </el-table>

    <!-- 选课记录表格 -->
    <el-table :data="scRecords" border style="margin-top:20px">
      <el-table-column prop="sno" label="学号"></el-table-column>
      <el-table-column prop="cno" label="课程号"></el-table-column>
      <el-table-column prop="cname" label="课程名"></el-table-column>
      <el-table-column prop="grade" label="成绩"></el-table-column>
      <el-table-column prop="semester" label="学期"></el-table-column>
      <el-table-column prop="teachingclass" label="教学班"></el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <el-pagination
      @current-change="handlePageChange"
      :current-page="currentPage"
      :page-size="pageSize"
      layout="total, prev, pager, next"
      :total="total">
    </el-pagination>
  </div>
</template>
<script>
export default {
  data() {
    return {
      queryParams: { sno: '', cno: '' },
      students: [],       // 存储学生信息
      scRecords: [],      // 存储选课记录
      currentPage: 1,
      pageSize: 10,
      total: 0
    };
  },
  methods: {
    async fetchData() {
      try {
        const response = await this.$axios.post('/api/query', {
          ...this.queryParams,
          page: this.currentPage,
          size: this.pageSize
        });

        this.students = response.data.students || [];
        this.scRecords = response.data.scRecords || [];
        this.total = response.data.total;
      } catch (error) {
        this.$message.error('查询失败');
      }
    },
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchData();
    }
  }
};
</script>
