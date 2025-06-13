<template>
  <el-form :model="course" label-width="120px" @submit.prevent="submitForm">
    <el-form-item label="课程编号">
      <el-input v-model="course.cno" />
    </el-form-item>
    <el-form-item label="课程名称">
      <el-input v-model="course.cname" />
    </el-form-item>
    <el-form-item label="学分">
      <el-input-number v-model="course.ccredit" />
    </el-form-item>
    <el-form-item label="先修课程编号">
      <el-input v-model="course.cpno" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" native-type="submit">提交</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      course: { cno: '', cname: '', ccredit: 0, cpno: '' }
    }
  },
  methods: {
    async submitForm() {
      const res = await this.$axios.post('http://localhost:8080/api/courses', this.course)
      if (res.status === 201) {
        this.$message.success('新增成功')
        this.$router.push('/example/table') // 跳转到课程列表页
      }
    }
  }
}
</script>
