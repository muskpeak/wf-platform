"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { BetItem } from "../../views/world/store/useWorldLottoStore";

export interface CurrentBetSummaryCardProps {
  bets: BetItem[];
  removeBet: (id: string) => void;
  clearBets: () => void;
  updateBetMultiplier: (id: string, multiplier: number) => void;
  onConfirm?: () => void;
}

export function CurrentBetSummaryCard({
  bets,
  removeBet,
  clearBets,
  updateBetMultiplier,
  onConfirm,
}: CurrentBetSummaryCardProps) {
  const totalTickets = bets.length;
  const totalMultiplier = bets.reduce((acc, b) => acc + (b.multiplier || 1), 0);
  const totalPay = totalMultiplier * 1; // 1 USDT base price

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      alert(`确认投注成功！共 ${totalTickets} 注，总计支付 ${totalPay.toFixed(2)} USDT`);
    }
  };

  return (
    <div className="bg-white rounded-[22px] sm:rounded-[26px] p-4 sm:p-6 flex flex-col justify-between gap-5 border border-[#eef3fa] shadow-xs h-full">
      {/* 上半部分：标题、清空与号码列表 */}
      <div className="flex flex-col gap-4 flex-1">
        {/* 1. 标题与一键清空 */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[16px] sm:text-[18px] font-bold text-[#163300]">本次投注</h3>
            <span className="text-[12px] text-[#707070]">已选 {totalTickets} 注</span>
          </div>
          <button
            type="button"
            onClick={clearBets}
            disabled={bets.length === 0}
            className="bg-[#dfeaff] hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed text-[#163300] text-[12px] sm:text-[13px] font-bold px-4 py-1.5 rounded-full transition-colors active:scale-95 cursor-pointer"
          >
            清空
          </button>
        </div>

        <div className="h-px bg-[#f0f2f5] w-full" />

        {/* 2. 已选注列表 */}
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center justify-between text-[13px] font-bold text-[#4b5767] px-1">
            <span>号码</span>
            <span>倍率 / 操作</span>
          </div>

          {bets.length === 0 ? (
            <div className="flex-1 min-h-[140px] flex items-center justify-center text-center text-[#9aa6b2] text-[13px] bg-[#fbfcfd] rounded-2xl border border-dashed border-gray-200 p-4">
              暂无已选号码，请在左侧选号或点击"随机"生成
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-2 px-2.5 sm:px-3 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-colors"
                >
                  {/* 号码 */}
                  <div className="font-mono font-bold text-[18px] sm:text-[20px] tracking-[2px] text-[#163300]">
                    {bet.numbers.join("")}
                  </div>

                  {/* 右侧：倍率调控 + 删除 */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#dfeaff]/60 rounded-full px-2 py-0.5 border border-[#c9dbfc]">
                      <button
                        type="button"
                        onClick={() => updateBetMultiplier(bet.id, bet.multiplier - 1)}
                        disabled={bet.multiplier <= 1}
                        className="text-[14px] font-bold text-[#163300] hover:text-black disabled:opacity-30 px-1 cursor-pointer"
                        title="减倍"
                      >
                        −
                      </button>
                      <span className="font-mono font-bold text-[13px] text-[#163300] min-w-[28px] text-center">
                        {bet.multiplier}x
                      </span>
                      <button
                        type="button"
                        onClick={() => updateBetMultiplier(bet.id, bet.multiplier + 1)}
                        disabled={bet.multiplier >= 10000}
                        className="text-[14px] font-bold text-[#008cff] hover:text-blue-700 disabled:opacity-30 px-1 cursor-pointer"
                        title="加倍"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBet(bet.id)}
                      className="border border-[#8c8c8c]/50 hover:border-red-400 hover:text-red-500 text-[#64748b] text-[12px] px-2.5 py-1 rounded-full transition-colors active:scale-95 cursor-pointer flex items-center gap-1"
                      title="删除此注"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 下半部分：结算明细 */}
      <div className="flex flex-col gap-4 pt-3 border-t border-[#f0f2f5]">
        <div className="flex flex-col gap-2 text-[14px]">
          <div className="flex items-center justify-between text-[#64748b]">
            <span>总注数</span>
            <span className="font-semibold text-[#0f172a] font-mono">{totalTickets} 注</span>
          </div>
          <div className="flex items-center justify-between text-[#64748b]">
            <span>累计总倍数</span>
            <span className="font-semibold text-[#0f172a] font-mono">{totalMultiplier} 倍</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <span className="text-[16px] font-extrabold text-[#0f172a]">预计支付</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[13px] font-bold text-[#64748b]">USDT</span>
              <span className="text-[22px] sm:text-[24px] font-black text-[#008ef0] font-mono">
                {totalPay.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <button
          type="button"
          disabled={bets.length === 0}
          onClick={handleConfirm}
          className="w-full bg-[#008cff] hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold h-[48px] sm:h-[52px] rounded-full text-[16px] shadow-sm shadow-blue-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center"
        >
          确认投注
        </button>
      </div>
    </div>
  );
}
