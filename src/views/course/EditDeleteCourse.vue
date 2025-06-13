<template>
  <div>
    <el-table :data="courses" border>
      <el-table-column prop="cno" label="课程编号" />
      <el-table-column prop="cname" label="课程名称" />
      <el-table-column prop="ccredit" label="学分" />
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button @click="editCourse(row)">编辑</el-button>
          <el-button @click="deleteCourse(row.cno)" type="danger">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      courses: []
    }
  },
  mounted() {
    this.fetchCourses()
  },
  methods: {
    async fetchCourses() {
      const res = await this.$axios.get('http://localhost:8080/api/courses')
      this.courses = res.data
    },
    async deleteCourse(cno) {
      const res = await this.$axios.delete(`http://localhost:8080/api/courses/${cno}`)
      if (res.status === 200) {
        this.$message.success('删除成功')
        this.fetchCourses()
      }
    },
    editCourse(row) {
      this.$router.push({ path: '/example/edit-course', query: { id: row.cno }})
    }
  }
}
</script>
