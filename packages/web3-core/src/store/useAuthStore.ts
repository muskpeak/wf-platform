"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ----------------------------------------------------------------------
// 1. 类型定义
// ----------------------------------------------------------------------

// 对应后端的 UserProfileResp
export interface UserProfile {
  address?: string;
  did?: string;
  email?: string;
  userId?: number;
  status?: string;
  source?: string;
  // ... 按需添加更多后端字段
}

interface AuthState {
  // Web2 状态
  token: string | null;         // 后端的 dat_token
  profile: UserProfile | null;  // 后端的业务数据

  // 动作
  login: (token: string, profile: UserProfile) => void;
  logout: () => void;
}

// ----------------------------------------------------------------------
// 2. Zustand Store (带有版本控制和数据迁移能力)
// ----------------------------------------------------------------------

// 这是缓存的版本号。未来如果你修改了 UserProfile 的结构，
// 只需要把 CURRENT_VERSION 加 1，并在 migrate 函数里写升级逻辑即可，老用户就不会白屏报错了！
const CURRENT_VERSION = 1;

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,

      login: (token, profile) => {
        set({ token, profile });
      },

      logout: () => {
        set({ token: null, profile: null });
        // 可以在这里派发全局登出事件，通知其他业务 store 也清空自己的数据
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('api:logged_out'));
        }
      },
    }),
    {
      name: 'wf-auth-storage', // 存在 LocalStorage 里的 key
      storage: createJSONStorage(() => localStorage),
      version: CURRENT_VERSION,
      
      // 完美的大厂缓存迁移机制 (Migrations)
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // 如果用户是从非常老的版本 0 升级过来的（假设以后有的话）
          // 这里可以执行数据清洗
          // persistedState.newField = 'default';
        }
        
        // 强制保障类型安全，如果有数据结构严重不兼容，可以直接抛弃老数据
        // if (version < CURRENT_VERSION) return { token: null, profile: null };

        return persistedState as AuthState;
      },
    }
  )
);
