<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>新增课程</span>
      </div>
      <!-- :model 和 :rules 绑定的是修改后的 form 对象 -->
      <el-form ref="courseForm" :model="form" :rules="rules" label-width="120px">

        <!-- 课程号 -->
        <!-- prop 和 v-model 都需要修改为小写驼峰 cno -->
        <el-form-item label="课程号" prop="cno">
          <el-input v-model="form.cno" placeholder="请输入课程号，例如: C001" />
        </el-form-item>

        <!-- 课程名 -->
        <!-- prop 和 v-model 都需要修改为小写驼峰 cname -->
        <el-form-item label="课程名" prop="cname">
          <el-input v-model="form.cname" placeholder="请输入课程名称" />
        </el-form-item>

        <!-- 学分 -->
        <!-- prop 和 v-model 都需要修改为小写驼峰 ccredit -->
        <el-form-item label="学分" prop="ccredit">
          <el-input-number v-model="form.ccredit" :min="0" :max="10" label="学分" />
        </el-form-item>

        <!-- 先行课程号 -->
        <!-- prop 和 v-model 都需要修改为小写驼峰 cpno -->
        <el-form-item label="先行课程号" prop="cpno">
          <el-input v-model="form.cpno" placeholder="如果没有先行课程，可留空" />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="submitForm">立即创建</el-button>
          <el-button @click="resetForm">重置表单</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import request from '@/utils/request'

export default {
  name: 'NewCourse',
  data() {
    return {
      loading: false,
      // 【核心修改点 1】: 将 form 对象的所有 key 修改为 camelCase，与后端实体类保持一致
      form: {
        cno: '',
        cname: '',
        ccredit: 1,
        cpno: ''
      },
      // 【核心修改点 2】: rules 对象的 key 也要相应地修改
      rules: {
        cno: [
          { required: true, message: '课程号是必填项', trigger: 'blur' }
        ],
        cname: [
          { required: true, message: '课程名是必填项', trigger: 'blur' }
        ],
        ccredit: [
          { required: true, message: '学分是必填项', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    submitForm() {
      this.$refs.courseForm.validate(valid => {
        if (valid) {
          this.loading = true; // 开始提交时，将按钮设为加载状态

          // 深拷贝一份数据用于提交，这是一个好习惯
          const postData = JSON.parse(JSON.stringify(this.form))

          // 【核心修改点 3】: 修正逻辑。如果 cpno 是空字符串，则将其转为 null 再发给后端。
          // 这样后端数据库字段可以直接存为 NULL，而不是空字符串 ''。
          if (postData.cpno === '') {
            postData.cpno = null
          }

          request({
            url: 'http://localhost:8080/api/courses', // 建议将基础URL配置在环境变量中
            method: 'post',
            data: postData // 现在 postData 的 key 是 { cno, cname, ccredit, cpno }，可以被后端正确解析
          }).then(res => {
            // 通常创建成功的状态码是 201 (Created)，但200也可以。根据你的后端API来判断。
            // 这里放宽判断，只要是成功的响应就提示成功。
            this.$message.success('添加成功！')
            this.resetForm()
          }).catch(error => {
            console.error('添加课程失败:', error); // 在控制台打印详细错误，便于调试
            // 可以尝试解析后端返回的错误信息
            const message = error.response?.data?.message || error.message
            this.$message.error('添加失败: ' + message)
          }).finally(() => {
            this.loading = false; // 无论成功失败，最后都取消加载状态
          })
        } else {
          console.log('表单验证失败!');
          return false;
        }
      })
    },
    resetForm() {
      this.$refs.courseForm.resetFields()
      // 为确保一致性，手动重置数据模型
      this.form = {
        cno: '',
        cname: '',
        ccredit: 1,
        cpno: ''
      }
    }
  }
}
</script>

<style scoped>
.box-card {
  width: 600px;
}
.app-container {
  padding: 20px;
}
</style>
