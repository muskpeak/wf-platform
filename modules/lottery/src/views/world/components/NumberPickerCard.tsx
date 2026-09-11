"use client";

import React, { useRef, useState } from "react";
import { useWorldLottoStore } from "../store/useWorldLottoStore";

const COUNTRY_SLOTS = [
  { country: "美国", flag: "🇺🇸", label: "第1位" },
  { country: "中国", flag: "🇨🇳", label: "第2位" },
  { country: "德国", flag: "🇩🇪", label: "第3位" },
  { country: "日本", flag: "🇯🇵", label: "第4位" },
  { country: "英国", flag: "🇬🇧", label: "第5位" },
  { country: "法国", flag: "🇫🇷", label: "第6位" },
  { country: "意大利", flag: "🇮🇹", label: "第7位" },
];

const PRESET_MULTIPLIERS = [2, 5, 10, 50, 100];
const KEYPAD_NUMS = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
];

export function NumberPickerCard() {
  const {
    selectedDigits,
    focusedIndex,
    setFocusedIndex,
    setDigit,
    clearDigits,
    currentMultiplier,
    setCurrentMultiplier,
    addCurrentBet,
    addRandomBets,
  } = useWorldLottoStore();

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [multiplierInput, setMultiplierInput] = useState<string>(currentMultiplier.toString());

  // Handle OTP KeyDown: instant overwrite, auto forward/backward, arrow navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // 1. Single digit key 0-9: directly overwrite current slot and advance
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const num = parseInt(e.key, 10);
      setDigit(index, num);
      if (index < 6) {
        const nextInput = inputRefs.current[index + 1];
        nextInput?.focus();
      }
      return;
    }

    // 2. Backspace
    if (e.key === "Backspace") {
      e.preventDefault();
      if (selectedDigits[index] !== null) {
        setDigit(index, null);
      } else if (index > 0) {
        setDigit(index - 1, null);
        const prevInput = inputRefs.current[index - 1];
        prevInput?.focus();
      }
      return;
    }

    // 3. Arrow navigation
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      const prevInput = inputRefs.current[index - 1];
      prevInput?.focus();
      return;
    }

    if (e.key === "ArrowRight" && index < 6) {
      e.preventDefault();
      const nextInput = inputRefs.current[index + 1];
      nextInput?.focus();
      return;
    }
  };

  // Handle paste for full 7-digit code (e.g. "8145879")
  const handlePaste = (startIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasteText) return;

    for (let i = 0; i < pasteText.length && startIndex + i < 7; i++) {
      setDigit(startIndex + i, parseInt(pasteText[i], 10));
    }
    const targetFocus = Math.min(6, startIndex + pasteText.length);
    inputRefs.current[targetFocus]?.focus();
  };

  // Synchronize multiplier input with store (clamp 1 - 10000)
  const handleMultiplierChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    setMultiplierInput(raw);
    if (raw) {
      const num = parseInt(raw, 10);
      setCurrentMultiplier(Math.min(10000, Math.max(1, num)));
    }
  };

  const handleMultiplierBlur = () => {
    let num = parseInt(multiplierInput, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 10000) num = 10000;
    setMultiplierInput(num.toString());
    setCurrentMultiplier(num);
  };

  const handleKeypadPress = (num: number) => {
    const targetIdx = focusedIndex >= 0 && focusedIndex < 7 ? focusedIndex : 0;
    setDigit(targetIdx, num);
    if (targetIdx < 6) {
      const nextInput = inputRefs.current[targetIdx + 1];
      nextInput?.focus();
    }
  };

  return (
    <div className="bg-[#e7ebf4] rounded-[22px] sm:rounded-[30px] p-4 sm:p-6 flex flex-col justify-between gap-5 border border-[#dfe2ed] shadow-xs h-full">
      {/* 1. Header (与 Figma 1862:27526 & 1910:33138 保持一致) */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[16px] sm:text-[20px] font-bold text-[#163300] leading-tight">
            选择 7 位号码
          </h3>
          <p className="text-[11px] sm:text-[13px] text-[#64715f] mt-0.5">
            点选数字，或随机生成一注
          </p>
        </div>

        {/* 右上角“清空”：清空当前选号输入，全端显示不隐藏 */}
        <button
          type="button"
          onClick={clearDigits}
          className="flex bg-[#163300] hover:bg-black text-white text-[12px] sm:text-[13px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full cursor-pointer transition-colors active:scale-95 shrink-0"
          title="清空选号输入"
        >
          清空
        </button>
      </div>

      {/* 2. 7 位数字国旗胶囊槽位：包含国旗标志、数字、第几位在边框外部下方 */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {COUNTRY_SLOTS.map((slot, index) => {
            const digit = selectedDigits[index];
            const isFocused = focusedIndex === index;
            const isFilled = digit !== null;

            return (
              <div
                key={slot.label}
                onClick={() => {
                  setFocusedIndex(index);
                  const inp = inputRefs.current[index];
                  inp?.focus();
                }}
                className="flex flex-col items-center cursor-pointer select-none"
              >
                {/* 胶囊槽：边框固定 1.5px，选中变为深色高亮，绝无空间挤压 */}
                <div
                  className={`w-full py-2 sm:py-3 rounded-[24px] sm:rounded-[36px] flex flex-col items-center justify-between transition-colors ${isFocused
                      ? "bg-white border-[1.5px] border-[#163300] shadow-sm"
                      : "bg-white border-[1.5px] border-[#dce7d7] hover:border-gray-400"
                    }`}
                >
                  {/* 顶部：国家圆形微国旗 */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#f8fafc] border border-gray-200/70 flex items-center justify-center text-[14px] sm:text-[18px] shadow-2xs">
                    {slot.flag}
                  </div>

                  {/* 间隔横杠 */}
                  <span className="text-[#81907c] text-[10px] sm:text-[12px] font-bold my-0.5 sm:my-1 leading-none">
                    -
                  </span>

                  {/* 数字值：居中无光标干扰，输入直接覆盖替换，无蓝色选中底色 */}
                  <div className="relative flex items-center justify-center w-full">
                    <input
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit !== null ? digit : ""}
                      onFocus={() => {
                        setFocusedIndex(index);
                      }}
                      onClick={() => {
                        setFocusedIndex(index);
                      }}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => handlePaste(index, e)}
                      onChange={() => { }} // Controlled by onKeyDown
                      className={`w-full text-center bg-transparent outline-none font-mono text-[20px] sm:text-[28px] font-bold caret-transparent selection:bg-transparent leading-none ${isFilled ? "text-[#163300]" : "text-[#b7c1cc]"
                        }`}
                      placeholder={isFocused ? "" : "0"}
                    />
                  </div>
                </div>

                {/* 第几位：在边框外部下方 */}
                <span
                  className={`text-[9px] sm:text-[11px] mt-1.5 text-center transition-colors font-medium ${isFocused ? "text-[#008cff] font-bold" : "text-[#9aa6b2]"
                    }`}
                >
                  {slot.label}
                </span>
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-[#64715f] mt-0.5">输入后自动跳到下一格</p>
      </div>

      {/* 3. PC 端专属 0-9 数字按键区 (仅在 PC/大屏展示，手机端隐藏避免挤占视口) */}
      <div className="hidden lg:flex flex-col gap-2 pt-1">
        {KEYPAD_NUMS.map((row, rIdx) => (
          <div key={rIdx} className="grid grid-cols-5 gap-2.5">
            {row.map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-[42px] rounded-[14px] bg-white border border-[#dce7d7] hover:border-[#008cff] shadow-xs text-[18px] font-bold font-mono text-[#163300] flex items-center justify-center cursor-pointer active:scale-95 active:bg-blue-50 transition-all"
              >
                {num}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 4. 快速添加快捷胶囊 (随机 1/5/10 注 + 清空) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => addRandomBets(1)}
          className="flex-1 h-[38px] rounded-[20px] border border-[#dce2ec] bg-white hover:bg-gray-50 text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          随机 1 注
        </button>
        <button
          type="button"
          onClick={() => addRandomBets(5)}
          className="flex-1 h-[38px] rounded-[20px] border border-[#dce2ec] bg-white hover:bg-gray-50 text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          随机 5 注
        </button>
        <button
          type="button"
          onClick={() => addRandomBets(10)}
          className="flex-1 h-[38px] rounded-[20px] border border-[#dce2ec] bg-white hover:bg-gray-50 text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          随机 10 注
        </button>
        {/* 重置倍数按钮 */}
        <button
          type="button"
          onClick={() => {
            setCurrentMultiplier(1);
            setMultiplierInput("1");
          }}
          className="w-[58px] h-[38px] rounded-[20px] bg-[#d5dbe9] hover:bg-[#c9d1df] text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          title="重置倍数"
        >
          重置
        </button>
      </div>

      {/* 5. 倍数快捷芯片 (x2 / x5 / x10 / x50 / x100) */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-[#dfe2ed]">
        {PRESET_MULTIPLIERS.map((m) => {
          const isSelected = currentMultiplier === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setCurrentMultiplier(m);
                setMultiplierInput(m.toString());
              }}
              className={`flex-1 h-[36px] rounded-[8px] border text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer flex items-center justify-center ${isSelected
                  ? "border-[#008cff] bg-blue-50 text-[#008cff] font-bold"
                  : "border-[#dce2ec] bg-white text-[#163300] hover:border-gray-400"
                }`}
            >
              x{m}
            </button>
          );
        })}
      </div>

      {/* 6. 倍数步进手输（适配 10000 宽文本不换行/不重叠）+ 添加到本次投注 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 步进与手输输入框：预留足够宽度，10000 绝不重叠 */}
        <div className="bg-white h-[46px] rounded-[16px] px-2.5 sm:px-3 flex items-center justify-between shadow-xs flex-1 max-w-[210px] shrink-0">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#64715f] shrink-0">
            倍数
          </span>

          <button
            type="button"
            onClick={() => {
              const next = Math.max(1, currentMultiplier - 1);
              setCurrentMultiplier(next);
              setMultiplierInput(next.toString());
            }}
            disabled={currentMultiplier <= 1}
            className="w-7 h-7 flex items-center justify-center text-[18px] font-bold text-[#64715f] hover:text-black disabled:opacity-25 cursor-pointer select-none shrink-0"
          >
            −
          </button>

          {/* 可手输的倍数值（最大 10000，居中且带专属呼吸边距） */}
          <div className="flex items-center justify-center font-mono font-bold text-[#050608] bg-gray-50/80 px-1.5 py-0.5 rounded-lg border border-gray-100">
            <input
              type="text"
              inputMode="numeric"
              value={multiplierInput}
              onChange={(e) => handleMultiplierChange(e.target.value)}
              onBlur={handleMultiplierBlur}
              className="w-[46px] sm:w-[50px] text-center bg-transparent outline-none font-bold text-[#050608] text-[15px] sm:text-[16px]"
            />
            <span className="text-[13px] text-[#64715f] font-bold">x</span>
          </div>

          <button
            type="button"
            onClick={() => {
              const next = Math.min(10000, currentMultiplier + 1);
              setCurrentMultiplier(next);
              setMultiplierInput(next.toString());
            }}
            disabled={currentMultiplier >= 10000}
            className="w-7 h-7 flex items-center justify-center text-[18px] font-bold text-[#008cff] hover:text-blue-700 disabled:opacity-25 cursor-pointer select-none shrink-0"
          >
            +
          </button>
        </div>

        {/* 添加到本次投注 按钮 */}
        <button
          type="button"
          onClick={addCurrentBet}
          className="flex-1 h-[46px] rounded-[14px] bg-[#d5dbe9] hover:bg-[#c6d0e2] active:bg-[#b8c4d8] text-[13px] sm:text-[15px] font-bold text-[#303030] flex items-center justify-center transition-colors cursor-pointer active:scale-98 shrink-0"
        >
          添加到本次投注
        </button>
      </div>
    </div>
  );
}
