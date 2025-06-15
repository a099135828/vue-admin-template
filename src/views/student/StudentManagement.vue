<template>
  <div class="student-management">
    <!-- 操作区域：新增按钮 -->
    <div class="actions">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增学生</el-button>
    </div>

    <!-- 学生数据表格 -->
    <el-table
      :data="students"
      v-loading="loading"
      style="width: 100%; margin-top: 20px;"
      border
    >
      <el-table-column prop="sno" label="学号" width="120" />
      <el-table-column prop="sname" label="姓名" width="120" />
      <el-table-column prop="ssex" label="性别" width="80" />
      <el-table-column prop="sbirthdate" label="出生日期" width="150" />
      <el-table-column prop="smajor" label="专业" width="180" />
      <!-- 新增列：显示多表查询结果 -->
      <el-table-column prop="courseCount" label="已选课程数" width="120" />
      <el-table-column label="操作" min-width="180">
        <template slot-scope="scope">
          <el-button size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑 对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="50%" @close="closeDialog">
      <el-form :model="form" :rules="rules" ref="studentForm" label-width="100px">
        <el-form-item label="学号" prop="sno">
          <el-input v-model="form.sno" placeholder="请输入学号" :disabled="isEditMode"></el-input>
        </el-form-item>
        <el-form-item label="姓名" prop="sname">
          <el-input v-model="form.sname" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="性别" prop="ssex">
          <el-radio-group v-model="form.ssex">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="出生日期" prop="sbirthdate">
          <el-date-picker
            v-model="form.sbirthdate"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            style="width: 100%;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="专业" prop="smajor">
          <el-input v-model="form.smajor" placeholder="请输入专业"></el-input>
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

const API_BASE_URL = 'http://localhost:8080/api/students';

export default {
  name: 'StudentManagement',
  data() {
    return {
      students: [],
      loading: true,
      dialogVisible: false,
      dialogTitle: '',
      isEditMode: false,
      form: {
        sno: '',
        sname: '',
        ssex: '男',
        sbirthdate: '',
        smajor: '',
      },
      rules: {
        sno: [{ required: true, message: '学号不能为空', trigger: 'blur' }],
        sname: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
        ssex: [{ required: true, message: '请选择性别', trigger: 'change' }],
        sbirthdate: [{ required: true, message: '请选择出生日期', trigger: 'change' }],
        smajor: [{ required: true, message: '专业不能为空', trigger: 'blur' }],
      },
    };
  },
  methods: {
    async fetchStudents() {
      this.loading = true;
      try {
        const response = await axios.get(API_BASE_URL);
        this.students = response.data;
      } catch (error) {
        this.$message.error('学生数据加载失败！');
        console.error('Fetch students error:', error);
      } finally {
        this.loading = false;
      }
    },

    resetForm() {
      this.form = {
        sno: '',
        sname: '',
        ssex: '男',
        sbirthdate: '',
        smajor: '',
      };
    },

    handleAdd() {
      this.resetForm();
      this.dialogTitle = '新增学生';
      this.isEditMode = false;
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.studentForm.clearValidate());
    },

    handleEdit(row) {
      this.dialogTitle = '编辑学生';
      this.isEditMode = true;
      // 注意：直接复制，因为后端传来的 Date 可能是时间戳或完整格式
      this.form = { ...row };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.studentForm.clearValidate());
    },

    handleDelete(row) {
      this.$confirm(`确定要删除学生 "${row.sname}" (学号: ${row.sno}) 吗?`, '危险操作', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        try {
          await axios.delete(`${API_BASE_URL}/${row.sno}`);
          this.$message.success('删除成功!');
          await this.fetchStudents();
        } catch (error) {
          this.$message.error('删除失败！');
          console.error('Delete student error:', error);
        }
      }).catch(() => this.$message.info('已取消删除'));
    },

    closeDialog() {
      this.dialogVisible = false;
      this.resetForm();
      this.$refs.studentForm.resetFields();
    },

    submitForm() {
      this.$refs.studentForm.validate(async (valid) => {
        if (!valid) return false;

        try {
          if (this.isEditMode) {
            await axios.put(`${API_BASE_URL}/${this.form.sno}`, this.form);
            this.$message.success('更新成功！');
          } else {
            await axios.post(API_BASE_URL, this.form);
            this.$message.success('新增成功！');
          }
          this.closeDialog();
          await this.fetchStudents();
        } catch (error) {
          // 处理后端可能返回的错误信息
          const errorMsg = error.response?.data?.message || '操作失败！';
          this.$message.error(errorMsg);
          console.error('Submit form error:', error);
        }
      });
    },
  },
  created() {
    this.fetchStudents();
  },
};
</script>

<style scoped>
.student-management {
  padding: 20px;
}
.actions {
  margin-bottom: 20px;
}
</style>
