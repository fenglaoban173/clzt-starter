import { defineStore } from 'pinia';

const AT = 'clzt_access_token';
const RT = 'clzt_refresh_token';
const USER = 'clzt_user';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem(AT) || '',
    refreshToken: localStorage.getItem(RT) || '',
    user: JSON.parse(localStorage.getItem(USER) || 'null'),
  }),
  getters: {
    isLoggedIn: (s) => !!s.accessToken,
    role: (s) => s.user?.role || '',
  },
  actions: {
    setSession(accessToken, refreshToken, user) {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken || this.refreshToken;
      if (user) this.user = user;
      localStorage.setItem(AT, this.accessToken);
      localStorage.setItem(RT, this.refreshToken);
      localStorage.setItem(USER, JSON.stringify(this.user));
    },
    setUser(user) {
      this.user = user;
      localStorage.setItem(USER, JSON.stringify(user));
    },
    async fetchMe() {
      // 原型模式：本地已持有用户信息，不再请求后端
      return this.user;
    },
    clear() {
      this.accessToken = '';
      this.refreshToken = '';
      this.user = null;
      localStorage.removeItem(AT);
      localStorage.removeItem(RT);
      localStorage.removeItem(USER);
    },
  },
});
