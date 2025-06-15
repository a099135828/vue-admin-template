<template>
  <div class="course-management">
    <!-- 操作区域 -->
    <div class="actions">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增课程</el-button>
    </div>

    <!-- 课程数据表格：新增了选课人数、平均分，并优化了先修课显示 -->
    <el-table
      :data="courses"
      v-loading="loading"
      style="width: 100%;"
      border
      stripe
    >
      <el-table-column prop="cno" label="课程号" width="100" fixed="left" />
      <el-table-column prop="cname" label="课程名" width="180" />
      <el-table-column prop="ccredit" label="学分" width="80" />

      <!-- 新增：选课人数 -->
      <el-table-column prop="studentCount" label="选课人数" width="100">
        <template slot-scope="scope">
          <el-tag>{{ scope.row.studentCount }}</el-tag>
        </template>
      </el-table-column>

      <!-- 新增：平均分 -->
      <el-table-column prop="averageGrade" label="平均分" width="100">
        <template slot-scope="scope">
          <span v-if="scope.row.averageGrade !== null">
            {{ scope.row.averageGrade.toFixed(2) }}
          </span>
          <span v-else>N/A</span>
        </template>
      </el-table-column>

      <!-- 修改：显示先修课名称，而不是ID -->
      <el-table-column prop="prerequisiteCourseName" label="先修课" width="180">
        <template slot-scope="scope">
          {{ scope.row.prerequisiteCourseName || '无' }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" icon="el-icon-edit" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button size="mini" type="danger" icon="el-icon-delete" @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页组件 (保持不变) -->
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

    <!-- 对话框 (保持不变) -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="40%" @close="closeDialog">
      <!-- 表单内容保持不变，因为它只处理 Course 实体的核心字段 -->
      <el-form :model="form" :rules="rules" ref="courseForm" label-width="80px">
        <el-form-item label="课程号" prop="cno">
          <el-input v-model="form.cno" placeholder="请输入课程号" :disabled="isEditMode"></el-input>
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
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/courses';

export default {
  name: 'EditDeleteCourse',
  data() {
    return {
      courses: [],
      loading: true,
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
      form: {
        cno: '',
        cname: '',
        ccredit: 0,
        cpno: null,
      },
      rules: {
        cno: [{ required: true, message: '课程号不能为空', trigger: 'blur' }],
        cname: [{ required: true, message: '课程名不能为空', trigger: 'blur' }],
      },
    };
  },
  methods: {
    // 1. 获取课程数据（分页）
    async fetchCourses() {
      this.loading = true;
      try {
        const response = await axios.get(API_BASE_URL, {
          params: {
            page: this.pagination.currentPage,
            size: this.pagination.pageSize,
          },
        });
        this.courses = response.data.records;
        this.pagination.total = response.data.total;
      } catch (error) {
        this.$message.error('课程数据加载失败！');
        console.error('Fetch courses error:', error);
      } finally {
        this.loading = false;
      }
    },

    // 2. 处理新增
    handleAdd() {
      this.isEditMode = false;
      this.dialogTitle = '新增课程';
      this.form = { cno: '', cname: '', ccredit: 0, cpno: null };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.courseForm?.clearValidate());
    },

    // 3. 处理编辑
    handleEdit(row) {
      this.isEditMode = true;
      this.dialogTitle = '编辑课程';
      this.form = { ...row };
      this.dialogVisible = true;
      this.$nextTick(() => this.$refs.courseForm?.clearValidate());
    },

    // 4. 处理删除
    handleDelete(row) {
      this.$confirm(`确定要删除课程 "${row.cname}" (课程号: ${row.cno})?`, '提示', {
        type: 'warning',
      }).then(async () => {
        try {
          await axios.delete(`${API_BASE_URL}/${row.cno}`);
          this.$message.success('删除成功!');
          if (this.courses.length === 1 && this.pagination.currentPage > 1) {
            this.pagination.currentPage--;
          }
          await this.fetchCourses();
        } catch (error) {
          this.$message.error('删除失败！');
          console.error('Delete course error:', error);
        }
      }).catch(() => this.$message.info('已取消删除'));
    },

    // 5. 关闭对话框
    closeDialog() {
      this.dialogVisible = false;
    },

    // 6. 提交表单
    submitForm() {
      this.$refs.courseForm.validate(async (valid) => {
        if (!valid) return false;

        this.submitLoading = true;
        try {
          if (this.isEditMode) {
            await axios.put(`${API_BASE_URL}/${this.form.cno}`, this.form);
            this.$message.success('更新成功！');
          } else {
            await axios.post(API_BASE_URL, this.form);
            this.$message.success('新增成功！');
          }
          this.closeDialog();
          await this.fetchCourses();
        } catch (error) {
          this.$message.error('操作失败！');
          console.error('Submit form error:', error);
        } finally {
          this.submitLoading = false;
        }
      });
    },

    // 7. 处理分页大小变化
    handleSizeChange(newSize) {
      this.pagination.pageSize = newSize;
      this.pagination.currentPage = 1;
      this.fetchCourses();
    },

    // 8. 处理页码变化
    handleCurrentChange(newPage) {
      this.pagination.currentPage = newPage;
      this.fetchCourses();
    },
  },
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
.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
