<template>
  <div class="student-management-container">
    <!-- 操作区域 -->
    <div class="actions-bar">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增学生</el-button>
    </div>

    <!-- 学生数据表格 -->
    <el-table
      :data="students"
      v-loading="loading"
      style="width: 100%;"
      border
      stripe
    >
      <el-table-column prop="sno" label="学号" width="120" fixed="left" />
      <el-table-column prop="sname" label="姓名" width="120" />
      <el-table-column prop="ssex" label="性别" width="80" />
      <el-table-column prop="sbirthdate" label="出生日期" width="150" />
      <el-table-column prop="smajor" label="专业" width="180" />
      <el-table-column prop="courseCount" label="已选课程数" width="120">
        <template slot-scope="scope">
          <el-tag type="success">{{ scope.row.courseCount }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 -->
    <div class="pagination-container">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.currentPage"
        :page-sizes="[10, 20, 50, 100]"
        :page-size="pagination.pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total">
      </el-pagination>
    </div>

    <!-- 新增/编辑 对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="50%"
      @close="closeDialog"
      :close-on-click-modal="false"
    >
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
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

// 您的后端 API 地址
const API_BASE_URL = 'http://localhost:8080/api/students';

export default {
  name: 'StudentManagement',
  data() {
    return {
      // 表格数据
      students: [],
      // 表格加载状态
      loading: true,
      // 提交按钮加载状态
      submitLoading: false,
      // 分页数据
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0,
      },
      // 对话框相关
      dialogVisible: false,
      dialogTitle: '',
      isEditMode: false,
      // 对话框表单数据
      form: {
        sno: '',
        sname: '',
        ssex: '男',
        sbirthdate: '',
        smajor: '',
      },
      // 表单验证规则
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
    /**
     * 获取学生列表（分页）
     */
    async fetchStudents() {
      this.loading = true;
      try {
        const response = await axios.get(API_BASE_URL, {
          params: {
            page: this.pagination.currentPage,
            size: this.pagination.pageSize,
          },
        });
        // 后端返回 PageResult 对象 { records: [], total: 0 }
        this.students = response.data.records;
        this.pagination.total = response.data.total;
      } catch (error) {
        this.$message.error('学生数据加载失败！');
        console.error('Fetch students error:', error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 重置表单
     */
    resetForm() {
      this.form = {
        sno: '',
        sname: '',
        ssex: '男',
        sbirthdate: '',
        smajor: '',
      };
    },

    /**
     * 处理新增按钮点击
     */
    handleAdd() {
      this.resetForm();
      this.dialogTitle = '新增学生';
      this.isEditMode = false;
      this.dialogVisible = true;
      // 确保 DOM 更新后再清空校验状态
      this.$nextTick(() => {
        if (this.$refs.studentForm) {
          this.$refs.studentForm.clearValidate();
        }
      });
    },

    /**
     * 处理编辑按钮点击
     */
    handleEdit(row) {
      this.dialogTitle = '编辑学生';
      this.isEditMode = true;
      // 创建一个副本进行编辑，避免直接修改列表数据
      this.form = { ...row };
      this.dialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.studentForm) {
          this.$refs.studentForm.clearValidate();
        }
      });
    },

    /**
     * 处理删除按钮点击
     */
    handleDelete(row) {
      this.$confirm(`确定要删除学生 "${row.sname}" (学号: ${row.sno}) 吗?`, '危险操作', {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(async () => {
        try {
          await axios.delete(`${API_BASE_URL}/${row.sno}`);
          this.$message.success('删除成功!');
          // 如果当前页是最后一页且只有一条数据，删除后应请求前一页
          if (this.students.length === 1 && this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
          }
          await this.fetchStudents(); // 重新加载数据
        } catch (error) {
          this.$message.error('删除失败！');
          console.error('Delete student error:', error);
        }
      }).catch(() => {
        this.$message.info('已取消删除');
      });
    },

    /**
     * 关闭对话框
     */
    closeDialog() {
      this.dialogVisible = false;
      this.resetForm();
    },

    /**
     * 提交表单（新增或编辑）
     */
    submitForm() {
      this.$refs.studentForm.validate(async (valid) => {
        if (!valid) {
          this.$message.warning('请检查表单输入是否正确！');
          return false;
        }

        this.submitLoading = true;
        try {
          if (this.isEditMode) {
            // 编辑模式，发送 PUT 请求
            await axios.put(`${API_BASE_URL}/${this.form.sno}`, this.form);
            this.$message.success('更新成功！');
          } else {
            // 新增模式，发送 POST 请求
            await axios.post(API_BASE_URL, this.form);
            this.$message.success('新增成功！');
          }
          this.closeDialog();
          await this.fetchStudents(); // 刷新表格
        } catch (error) {
          const errorMsg = error.response?.data?.message || '操作失败，请检查学号是否已存在或联系管理员！';
          this.$message.error(errorMsg);
          console.error('Submit form error:', error);
        } finally {
          this.submitLoading = false;
        }
      });
    },

    /**
     * 处理每页显示数量变化
     */
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize;
      this.pagination.currentPage = 1; // 切换每页大小时，回到第一页
      this.fetchStudents();
    },

    /**
     * 处理页码变化
     */
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage;
      this.fetchStudents();
    },
  },
  /**
   * 组件创建时，自动加载数据
   */
  created() {
    this.fetchStudents();
  },
};
</script>

<style scoped>
.student-management-container {
  padding: 20px;
  background-color: #f5f7fa;
}
.actions-bar {
  margin-bottom: 20px;
}
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
