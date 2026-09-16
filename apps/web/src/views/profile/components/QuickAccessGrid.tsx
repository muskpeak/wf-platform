'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { toast } from '@wf-platform/uikit'

export function QuickAccessGrid() {
  const { authenticated, login } = usePrivy()
  const router = useRouter()

  // 每个快捷入口的目标路由（未配置则仅弹 toast）
  const ROUTES: Record<string, string> = {
    records: '/records',
    auth: '/profile?tab=auth',
    security: '/profile?tab=security',
  }

  const handleItemClick = (id: string, title: string) => {
    if (!authenticated) {
      login()
      return
    }
    const target = ROUTES[id]
    if (target) {
      router.push(target)
    } else {
      toast.info(`进入 ${title}`)
    }
  }

  const items = [
    {
      id: 'records',
      title: '资金记录',
      icon: (
        // Bold Money Card Search 图标
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2 8.5H14.5M2 12.5V8.5C2 5 3.5 3.5 7 3.5H17C20.5 3.5 22 5 22 8.5V13M6 16.5H9.5"
            stroke="#1B254B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17.5 21.5C19.7091 21.5 21.5 19.7091 21.5 17.5C21.5 15.2909 19.7091 13.5 17.5 13.5C15.2909 13.5 13.5 15.2909 13.5 17.5C13.5 19.7091 15.2909 21.5 17.5 21.5Z"
            fill="#1B254B"
          />
          <path d="M22 22L20.5 20.5" stroke="#1B254B" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      id: 'auth',
      title: '授权管理',
      icon: (
        // Bold Pen New Square 图标
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M11 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22H15C20 22 22 20 22 15V13"
            stroke="#1B254B"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.04 3.02L8.16 10.9C7.86 11.2 7.56 11.79 7.5 12.22L7.07 15.23C6.91 16.32 7.68 17.08 8.77 16.93L11.78 16.5C12.2 16.44 12.79 16.14 13.1 15.84L20.98 7.96C22.34 6.6 22.98 5.01 20.98 3.01C18.99 1.02 17.4 1.66 16.04 3.02Z"
            fill="#1B254B"
          />
        </svg>
      ),
    },
    {
      id: 'security',
      title: '安全设置',
      icon: (
        // Bold Shield Check 图标
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 2Z"
            fill="#1B254B"
          />
          <path
            d="M9.5 11.8L11 13.3L14.5 9.8"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="w-full max-w-[398px] mx-auto py-2">
      {/* 标题 */}
      <h3
        style={{
          fontFamily: 'Noto Sans SC, sans-serif',
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#163300',
          lineHeight: '14px',
          margin: '0 0 16px 0',
        }}
      >
        快捷入口
      </h3>

      {/* 3个入口项 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item.id, item.title)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              width: '96px',
              cursor: 'pointer',
            }}
          >
            {/* 方形白底圆角图标框 (72x72) */}
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '18px',
                border: '1px solid #d7ddea',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
              className="hover:scale-105 active:scale-95 shadow-2xs hover:shadow-xs"
            >
              {item.icon}
            </div>

            {/* 文字标签 */}
            <span
              style={{
                fontSize: '14px',
                color: '#163300',
                lineHeight: '18px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
