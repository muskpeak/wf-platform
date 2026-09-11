"use client";

import React, { useRef, useState } from "react";

export interface PickerSlotConfig {
  label: string;
  icon?: string; // emoji flag or short text
}

/** Default slots for 7-digit World Lotto */
export const WORLD_7_SLOTS: PickerSlotConfig[] = [
  { label: "第1位", icon: "🇺🇸" },
  { label: "第2位", icon: "🇨🇳" },
  { label: "第3位", icon: "🇩🇪" },
  { label: "第4位", icon: "🇯🇵" },
  { label: "第5位", icon: "🇬🇧" },
  { label: "第6位", icon: "🇫🇷" },
  { label: "第7位", icon: "🇮🇹" },
];

/** Default slots for 3-digit 3D Lotto */
export const LOTTO_3D_SLOTS: PickerSlotConfig[] = [
  { label: "百位" },
  { label: "十位" },
  { label: "个位" },
];

const PRESET_MULTIPLIERS = [2, 5, 10, 50, 100];
const KEYPAD_ROWS = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
];

export interface NumberPickerCardProps {
  // Layout config
  digitsCount?: number;              // 3 or 7, default 7
  slots?: PickerSlotConfig[];        // custom slot labels/icons
  titleLabel?: string;               // override header title

  // Store state (injected by parent)
  selectedDigits: (number | null)[];
  focusedIndex: number;
  currentMultiplier: number;

  // Store actions (injected by parent)
  setFocusedIndex: (index: number) => void;
  setDigit: (index: number, digit: number | null) => void;
  clearDigits: () => void;
  setCurrentMultiplier: (multiplier: number) => void;
  addCurrentBet: () => void;
  addRandomBets: (count: number) => void;
}

export function NumberPickerCard({
  digitsCount = 7,
  slots,
  titleLabel,
  selectedDigits,
  focusedIndex,
  currentMultiplier,
  setFocusedIndex,
  setDigit,
  clearDigits,
  setCurrentMultiplier,
  addCurrentBet,
  addRandomBets,
}: NumberPickerCardProps) {
  const maxIndex = digitsCount - 1;
  const resolvedSlots = slots ?? (digitsCount === 3 ? LOTTO_3D_SLOTS : WORLD_7_SLOTS);
  const resolvedTitle = titleLabel ?? `选择 ${digitsCount} 位号码`;

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [multiplierInput, setMultiplierInput] = useState<string>(currentMultiplier.toString());

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      setDigit(index, parseInt(e.key, 10));
      if (index < maxIndex) inputRefs.current[index + 1]?.focus();
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      if (selectedDigits[index] !== null) {
        setDigit(index, null);
      } else if (index > 0) {
        setDigit(index - 1, null);
        inputRefs.current[index - 1]?.focus();
      }
      return;
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      return;
    }
    if (e.key === "ArrowRight" && index < maxIndex) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      return;
    }
  };

  const handlePaste = (startIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!text) return;
    for (let i = 0; i < text.length && startIndex + i < digitsCount; i++) {
      setDigit(startIndex + i, parseInt(text[i], 10));
    }
    inputRefs.current[Math.min(maxIndex, startIndex + text.length)]?.focus();
  };

  const handleMultiplierChange = (val: string) => {
    const raw = val.replace(/\D/g, "");
    setMultiplierInput(raw);
    if (raw) setCurrentMultiplier(Math.min(10000, Math.max(1, parseInt(raw, 10))));
  };

  const handleMultiplierBlur = () => {
    let num = parseInt(multiplierInput, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > 10000) num = 10000;
    setMultiplierInput(num.toString());
    setCurrentMultiplier(num);
  };

  const handleKeypadPress = (num: number) => {
    const targetIdx = focusedIndex >= 0 && focusedIndex < digitsCount ? focusedIndex : 0;
    setDigit(targetIdx, num);
    if (targetIdx < maxIndex) inputRefs.current[targetIdx + 1]?.focus();
  };

  const gridCols = digitsCount === 3 ? "grid-cols-3" : "grid-cols-7";

  return (
    <div className="bg-[#e7ebf4] rounded-[22px] sm:rounded-[30px] p-4 sm:p-6 flex flex-col justify-between gap-5 border border-[#dfe2ed] shadow-xs h-full">
      {/* 1. Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[16px] sm:text-[20px] font-bold text-[#163300] leading-tight">
            {resolvedTitle}
          </h3>
          <p className="text-[11px] sm:text-[13px] text-[#64715f] mt-0.5">
            点选数字，或随机生成一注
          </p>
        </div>
        <button
          type="button"
          onClick={clearDigits}
          className="flex bg-[#163300] hover:bg-black text-white text-[12px] sm:text-[13px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full cursor-pointer transition-colors active:scale-95 shrink-0"
          title="清空选号输入"
        >
          清空
        </button>
      </div>

      {/* 2. Digit slots */}
      <div className="flex flex-col gap-2">
        <div className={`grid ${gridCols} gap-1 sm:gap-2`}>
          {resolvedSlots.map((slot, index) => {
            const digit = selectedDigits[index];
            const isFocused = focusedIndex === index;
            const isFilled = digit !== null;

            return (
              <div
                key={slot.label}
                onClick={() => {
                  setFocusedIndex(index);
                  inputRefs.current[index]?.focus();
                }}
                className="flex flex-col items-center cursor-pointer select-none"
              >
                <div
                  className={`w-full py-2 sm:py-3 rounded-[24px] sm:rounded-[36px] flex flex-col items-center justify-between transition-colors ${
                    isFocused
                      ? "bg-white border-[1.5px] border-[#163300] shadow-sm"
                      : "bg-white border-[1.5px] border-[#dce7d7] hover:border-gray-400"
                  }`}
                >
                  {/* Icon: emoji flag or position number */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#f8fafc] border border-gray-200/70 flex items-center justify-center text-[14px] sm:text-[18px] shadow-2xs select-none">
                    {slot.icon ?? (
                      <span className="font-bold text-[#163300] text-[12px] sm:text-[14px]">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <span className="text-[#81907c] text-[10px] sm:text-[12px] font-bold my-0.5 sm:my-1 leading-none">
                    -
                  </span>

                  {/* Hidden input (cursor/selection completely suppressed) */}
                  <div className="relative flex items-center justify-center w-full">
                    <input
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit !== null ? digit : ""}
                      onFocus={() => setFocusedIndex(index)}
                      onClick={() => setFocusedIndex(index)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={(e) => handlePaste(index, e)}
                      onChange={() => {}}
                      className={`w-full text-center bg-transparent outline-none font-mono text-[20px] sm:text-[28px] font-bold caret-transparent selection:bg-transparent leading-none ${
                        isFilled ? "text-[#163300]" : "text-[#b7c1cc]"
                      }`}
                      placeholder={isFocused ? "" : "0"}
                    />
                  </div>
                </div>

                <span
                  className={`text-[9px] sm:text-[11px] mt-1.5 text-center transition-colors font-medium ${
                    isFocused ? "text-[#008cff] font-bold" : "text-[#9aa6b2]"
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

      {/* 3. PC keypad (hidden on mobile) */}
      <div className="hidden lg:flex flex-col gap-2 pt-1">
        {KEYPAD_ROWS.map((row, rIdx) => (
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

      {/* 4. Quick add */}
      <div className="flex items-center gap-2">
        {[1, 5, 10].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => addRandomBets(n)}
            className="flex-1 h-[38px] rounded-[20px] border border-[#dce2ec] bg-white hover:bg-gray-50 text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            随机 {n} 注
          </button>
        ))}
        <button
          type="button"
          onClick={() => { setCurrentMultiplier(1); setMultiplierInput("1"); }}
          className="w-[58px] h-[38px] rounded-[20px] bg-[#d5dbe9] hover:bg-[#c9d1df] text-[11px] sm:text-[13px] font-medium text-[#163300] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          title="重置倍数"
        >
          重置
        </button>
      </div>

      {/* 5. Multiplier chips */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-1 border-t border-[#dfe2ed]">
        {PRESET_MULTIPLIERS.map((m) => {
          const isSelected = currentMultiplier === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => { setCurrentMultiplier(m); setMultiplierInput(m.toString()); }}
              className={`flex-1 h-[36px] rounded-[8px] border text-[13px] sm:text-[14px] font-medium transition-all cursor-pointer flex items-center justify-center ${
                isSelected
                  ? "border-[#008cff] bg-blue-50 text-[#008cff] font-bold"
                  : "border-[#dce2ec] bg-white text-[#163300] hover:border-gray-400"
              }`}
            >
              x{m}
            </button>
          );
        })}
      </div>

      {/* 6. Multiplier stepper + add bet */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="bg-white h-[46px] rounded-[16px] px-2.5 sm:px-3 flex items-center justify-between shadow-xs flex-1 max-w-[210px] shrink-0">
          <span className="text-[12px] sm:text-[13px] font-medium text-[#64715f] shrink-0">倍数</span>
          <button
            type="button"
            onClick={() => { const next = Math.max(1, currentMultiplier - 1); setCurrentMultiplier(next); setMultiplierInput(next.toString()); }}
            disabled={currentMultiplier <= 1}
            className="w-7 h-7 flex items-center justify-center text-[18px] font-bold text-[#64715f] hover:text-black disabled:opacity-25 cursor-pointer select-none shrink-0"
          >
            −
          </button>
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
            onClick={() => { const next = Math.min(10000, currentMultiplier + 1); setCurrentMultiplier(next); setMultiplierInput(next.toString()); }}
            disabled={currentMultiplier >= 10000}
            className="w-7 h-7 flex items-center justify-center text-[18px] font-bold text-[#008cff] hover:text-blue-700 disabled:opacity-25 cursor-pointer select-none shrink-0"
          >
            +
          </button>
        </div>
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
