<template>
  <div class="course-management">
    <!-- 操作区域：新增按钮 -->
    <div class="actions">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增课程</el-button>
    </div>

    <!-- 课程数据表格 -->
    <el-table
      :data="courses"
      v-loading="loading"
      style="width: 100%; margin-top: 20px;"
      border
    >
      <el-table-column prop="cno" label="课程号" width="120" />
      <el-table-column prop="cname" label="课程名" width="180" />
      <el-table-column prop="ccredit" label="学分" width="100" />
      <el-table-column prop="cpno" label="先修课号" width="120" />
      <el-table-column label="操作" width="180">
        <template slot-scope="scope">
          <el-button
            size="mini"
            icon="el-icon-edit"
            @click="handleEdit(scope.row)"
          >编辑</el-button>
          <el-button
            size="mini"
            type="danger"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑 对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="40%"
      @close="closeDialog"
    >
      <el-form :model="form" :rules="rules" ref="courseForm" label-width="80px">
        <el-form-item label="课程号" prop="cno">
          <el-input
            v-model="form.cno"
            placeholder="请输入课程号"
            :disabled="dialogTitle === '编辑课程'"
          ></el-input>
        </el-form-item>
        <el-form-item label="课程名" prop="cname">
          <el-input v-model="form.cname" placeholder="请输入课程名"></el-input>
        </el-form-item>
        <el-form-item label="学分" prop="ccredit">
          <el-input-number v-model="form.ccredit" :min="0" :max="10" label="学分"></el-input-number>
        </el-form-item>
        <el-form-item label="先修课" prop="cpno">
          <el-input v-model="form.cpno" placeholder="请输入先修课号 (可为空)"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button type="primary" @click="submitForm">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

// 配置您的后端 API 地址
const API_BASE_URL = 'http://localhost:8080/api/courses';

export default {
  name: 'EditDeleteCourse',
  data() {
    return {
      courses: [], // 表格数据
      loading: true, // 表格加载状态
      dialogVisible: false, // 对话框可见性
      dialogTitle: '', // 对话框标题
      form: { // 对话框表单数据
        cno: '',
        cname: '',
        ccredit: null,
        cpno: null,
      },
      rules: { // 表单验证规则
        cno: [
          { required: true, message: '课程号不能为空', trigger: 'blur' },
        ],
        cname: [
          { required: true, message: '课程名不能为空', trigger: 'blur' },
        ],
      },
    };
  },
  methods: {
    // 1. 获取所有课程数据
    async fetchCourses() {
      this.loading = true;
      try {
        const response = await axios.get(API_BASE_URL);
        this.courses = response.data;
      } catch (error) {
        this.$message.error('数据加载失败！');
        console.error('Fetch courses error:', error);
      } finally {
        this.loading = false;
      }
    },

    // 2. 处理新增按钮点击
    handleAdd() {
      this.dialogTitle = '新增课程';
      this.dialogVisible = true;
      // 使用 $nextTick 确保 DOM 更新后再清空校验
      this.$nextTick(() => {
        this.$refs.courseForm.clearValidate();
      });
    },

    // 3. 处理编辑按钮点击
    handleEdit(row) {
      this.dialogTitle = '编辑课程';
      // 使用 Object.assign 创建一个副本，避免直接修改表格中的数据
      this.form = Object.assign({}, row);
      this.dialogVisible = true;
      this.$nextTick(() => {
        this.$refs.courseForm.clearValidate();
      });
    },

    // 4. 处理删除按钮点击
    handleDelete(row) {
      this.$confirm(`此操作将永久删除课程 "${row.cname}" (课程号: ${row.cno}), 是否继续?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        // 用户点击了确定
        try {
          // **这里的 URL 对应您后端的 @DeleteMapping("/{cno}")**
          await axios.delete(`${API_BASE_URL}/${row.cno}`);
          this.$message.success('删除成功!');
          await this.fetchCourses(); // 重新加载数据
        } catch (error) {
          this.$message.error('删除失败！');
          console.error('Delete course error:', error);
        }
      }).catch(() => {
        // 用户点击了取消
        this.$message.info('已取消删除');
      });
    },

    // 5. 关闭对话框并重置表单
    closeDialog() {
      this.dialogVisible = false;
      // 重置表单内容和验证状态
      this.$refs.courseForm.resetFields();
      this.form = { cno: '', cname: '', ccredit: null, cpno: null };
    },

    // 6. 提交表单（新增或更新）
    submitForm() {
      this.$refs.courseForm.validate(async (valid) => {
        if (valid) {
          try {
            if (this.dialogTitle === '新增课程') {
              // **对应您后端的 @PostMapping**
              await axios.post(API_BASE_URL, this.form);
              this.$message.success('新增成功！');
            } else {
              // **对应您后端的 @PutMapping("/{cno}")**
              await axios.put(`${API_BASE_URL}/${this.form.cno}`, this.form);
              this.$message.success('更新成功！');
            }
            this.closeDialog();
            await this.fetchCourses(); // 刷新表格数据
          } catch (error) {
            this.$message.error('操作失败！');
            console.error('Submit form error:', error);
          }
        } else {
          console.log('表单验证失败');
          return false;
        }
      });
    },
  },
  // 组件创建时，自动加载数据
  created() {
    this.fetchCourses();
  },
};
</script>

<style scoped>
.course-management {
  padding: 20px;
}
.actions {
  margin-bottom: 20px;
}
</style>
