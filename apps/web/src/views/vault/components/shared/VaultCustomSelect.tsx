'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from './cn'
import { TokenImg } from './TokenImg'

export type VaultCustomSelectOption = {
  value: string
  label: string
  rightMeta?: string
  logoUrl?: string | null
}

export function VaultCustomSelect({
  options,
  value,
  onChange,
  disabled,
  placeholder = '请选择',
  loading,
  'aria-labelledby': ariaLabelledBy,
  className,
}: {
  options: VaultCustomSelectOption[]
  value: string
  onChange: (next: string) => void
  disabled?: boolean
  placeholder?: string
  loading?: boolean
  'aria-labelledby'?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 点击外部自动收起，使用 pointerdown 确保移动端触屏和桌面端鼠标均能精准捕获
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // ESC 键收起
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const selected = options.find((o) => o.value === value)
  const busy = Boolean(disabled || loading)

  const handleSelect = (nextValue: string) => {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {/* 触发器卡片：纯正 WF / 划转设计规范 */}
      <button
        type="button"
        disabled={busy}
        onClick={() => !busy && setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={ariaLabelledBy}
        className={cn(
          'w-full min-h-[50px] px-3.5 py-2.5 rounded-[16px] border text-left transition-all duration-150 flex items-center justify-between gap-2 select-none cursor-pointer',
          busy
            ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800'
            : open
              ? 'bg-white dark:bg-[#1C1F26] border-[#0066FF] ring-2 ring-[#0066FF]/15 shadow-sm'
              : 'bg-[#FAFBFD] dark:bg-[#1A1E26] border-[#E5E8F0] dark:border-gray-800/90 hover:border-blue-300 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-[#1C1F26]'
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {selected?.logoUrl ? (
            <TokenImg
              src={selected.logoUrl}
              className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 object-contain ring-1 ring-gray-200/80 dark:ring-gray-700 shrink-0"
            />
          ) : null}
          <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5 overflow-hidden">
            <span
              className={cn(
                'truncate text-[14px] font-bold shrink-0',
                selected
                  ? 'text-[#1C1F23] dark:text-white'
                  : 'text-gray-400 dark:text-gray-500 font-normal'
              )}
            >
              {loading ? '加载中...' : selected ? selected.label : placeholder}
            </span>
            {selected?.rightMeta && (
              <span className="text-[11px] font-mono text-gray-400 dark:text-gray-500 truncate shrink-0">
                {selected.rightMeta}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={16}
          className={cn(
            'text-gray-400 shrink-0 transition-transform duration-200',
            open ? 'rotate-180 text-[#0066FF]' : ''
          )}
        />
      </button>

      {/* 内嵌下拉菜单：绝不使用 Portal，直接挂在容器正下方，100% 免疫 Vaul 遮罩拦截与触屏失焦问题 */}
      {open && (
        <div
          role="listbox"
          className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[200px] z-50 bg-white dark:bg-[#1A1E26] border border-[#E5E8F0] dark:border-gray-800 rounded-[18px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-0.5">
            {options.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">暂无选项</div>
            ) : (
              options.map((option) => {
                const isSelected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    // 使用 onPointerDown 触发，在触屏上杜绝延迟或 click 被父级截断
                    onPointerDown={(e) => {
                      e.stopPropagation()
                      handleSelect(option.value)
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] text-left transition-colors cursor-pointer select-none',
                      isSelected
                        ? 'bg-[#EEF4FF] dark:bg-[#0066FF]/15 text-[#0066FF] dark:text-[#3B82F6]'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-[#1C1F23] dark:text-gray-200'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {option.logoUrl ? (
                        <TokenImg
                          src={option.logoUrl}
                          className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 object-contain ring-1 ring-gray-200/80 dark:ring-gray-700 shrink-0"
                        />
                      ) : null}
                      <span className="text-[13px] font-bold truncate">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {option.rightMeta && (
                        <span className="text-[11px] text-gray-400 font-mono">
                          {option.rightMeta}
                        </span>
                      )}
                      {isSelected ? (
                        <Check
                          size={16}
                          className="text-[#0066FF] dark:text-[#3B82F6]"
                          strokeWidth={2.5}
                        />
                      ) : (
                        <span className="w-4" />
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
