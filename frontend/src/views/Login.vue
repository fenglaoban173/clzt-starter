<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-brand">
        <div class="brand-logo">央</div>
        <div>
          <h1>央广智投</h1>
          <p>批量广告计划搭建平台</p>
        </div>
      </div>

      <el-form :model="form" @submit.prevent="onSubmit" label-position="top">
        <el-form-item label="账号" required>
          <el-input v-model="form.username" placeholder="请输入账号" :maxlength="64" clearable />
        </el-form-item>
        <el-form-item label="密码" required>
          <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :maxlength="64" />
        </el-form-item>
        <el-button type="primary" size="large" class="login-btn" native-type="submit" :loading="loading">
          登 录
        </el-button>
      </el-form>

      <p class="login-tip">登录成功后将按角色进入对应工作台</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const loading = ref(false);
const form = reactive({ username: '', password: '' });

// 原型模式：本地账号校验，不连接后端
const MOCK_USERS = {
  admin: { access_token: 'mock-admin-token', refresh_token: 'mock-admin-rt', user: { id: 1, username: 'admin', real_name: '系统管理员', role: 'admin', last_login_at: '-' } },
  op_test: { access_token: 'mock-op-token', refresh_token: 'mock-op-rt', user: { id: 2, username: 'op_test', real_name: '优化师-测试', role: 'operator', last_login_at: '-' } },
  viewer: { access_token: 'mock-view-token', refresh_token: 'mock-view-rt', user: { id: 3, username: 'viewer', real_name: '只读账号', role: 'viewer', last_login_at: '-' } },
};

async function onSubmit() {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入账号和密码');
    return;
  }
  loading.value = true;
  try {
    const matched = MOCK_USERS[form.username];
    if (!matched || form.password.length < 6) {
      ElMessage.error('账号或密码不正确（原型账号：admin / op_test / viewer，密码任意 ≥6 位）');
      return;
    }
    auth.setSession(matched.access_token, matched.refresh_token, matched.user);
    ElMessage.success('登录成功（原型模式）');
    const redirect = route.query.redirect || '/';
    router.push(String(redirect));
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb 0%, #0fc6c2 100%);
}
.login-card {
  width: 400px;
  padding: 40px 36px 28px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
.login-brand {
  margin-bottom: 28px;
  display: flex;
  gap: 14px;
  align-items: center;
}
.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #2563eb;
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-brand h1 {
  margin: 0;
  font-size: 20px;
  color: #1d2129;
}
.login-brand p {
  margin: 2px 0 0;
  color: #86909c;
  font-size: 13px;
}
.login-btn { width: 100%; }
.login-tip {
  margin-top: 16px;
  color: #86909c;
  font-size: 12px;
  text-align: center;
}
</style>
