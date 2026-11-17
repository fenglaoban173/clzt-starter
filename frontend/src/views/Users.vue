<template>
  <el-card title="用户管理">
    <div class="toolbar">
      <el-button type="primary" :icon="'Plus'" @click="openCreate">新建用户</el-button>
    </div>

    <el-table :data="rows" v-loading="loading" border stripe>
      <el-table-column label="ID" prop="id" :width="70" />
      <el-table-column label="用户名" prop="username" />
      <el-table-column label="姓名" prop="real_name" />
      <el-table-column label="角色" prop="role" :width="100" />
      <el-table-column label="状态" prop="status" :width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
            {{ row.status === 'active' ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近登录" prop="last_login_at" :width="170" />
    </el-table>

    <el-pagination
      class="pager"
      layout="total, prev, pager, next"
      :total="pagination.total"
      :current-page="pagination.current"
      :page-size="pagination.pageSize"
      @current-change="load"
    />

    <el-dialog v-model="modalVisible" title="新建用户" width="480px" @closed="reset">
      <el-form :model="form" label-position="top">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="初始密码（≥8 位）" required>
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="角色" required>
          <el-select v-model="form.role" style="width: 100%">
            <el-option value="admin">admin · 管理员</el-option>
            <el-option value="operator">operator · 优化师</el-option>
            <el-option value="viewer">viewer · 只读</el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="modalVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onCreate">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { userApi } from '@/api/media';

const rows = ref([]);
const loading = ref(false);
const page = reactive({ page: 1, pageSize: 10 });
const pagination = reactive({ total: 0, current: 1, pageSize: 10 });

const modalVisible = ref(false);
const submitting = ref(false);
const form = reactive({ username: '', real_name: '', password: '', role: 'operator' });

async function load(current = 1) {
  loading.value = true;
  try {
    const res = await userApi.list({ page: current, page_size: page.pageSize });
    rows.value = res.data.list || [];
    pagination.total = res.data.total || 0;
    pagination.current = current;
  } catch (e) {
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  modalVisible.value = true;
}
function reset() {
  Object.assign(form, { username: '', real_name: '', password: '', role: 'operator' });
}

async function onCreate() {
  if (!form.username || !form.password || form.password.length < 8) {
    ElMessage.warning('请补全用户名和至少 8 位密码');
    return;
  }
  submitting.value = true;
  try {
    await userApi.create({
      username: form.username,
      real_name: form.real_name || null,
      password: form.password,
      role: form.role,
    });
    ElMessage.success('创建成功（原型模拟）');
    modalVisible.value = false;
    load(pagination.current);
  } catch (e) {
  } finally {
    submitting.value = false;
  }
}

onMounted(() => load(1));
</script>

<style scoped>
.toolbar { display: flex; justify-content: flex-end; margin-bottom: 12px; }
.pager { margin-top: 16px; justify-content: flex-end; }
</style>
