"use client";

import { useEffect, useState } from "react";

export interface CountdownResult {
  timeLeft: number; // 剩余秒数
  formatted: string; // 格式化文本，如 "0天 00:15:32"
  progressPercent: number; // 0 - 100 进度百分比
  isEnded: boolean; // 是否已到期
}

/**
 * 精准读秒倒计时 Hook
 * @param closeUnixSeconds 封盘时间戳（秒）
 * @param openUnixSeconds 开盘时间戳（秒，用于计算总时长与进度条）
 */
export function useCountdown(
  closeUnixSeconds: number | undefined,
  openUnixSeconds?: number | undefined
): CountdownResult {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!closeUnixSeconds) return;

    setNow(Math.floor(Date.now() / 1000));

    const timer = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [closeUnixSeconds]);

  if (!closeUnixSeconds) {
    return {
      timeLeft: 0,
      formatted: "--:--:--",
      progressPercent: 0,
      isEnded: true,
    };
  }

  const timeLeft = Math.max(0, closeUnixSeconds - now);
  const isEnded = timeLeft <= 0;

  // 格式化：天 时 分 秒（带秒钟跳动）
  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  const hoursStr = String(hours).padStart(2, "0");
  const minsStr = String(mins).padStart(2, "0");
  const secsStr = String(secs).padStart(2, "0");

  const formatted = days > 0
    ? `${days}天 ${hoursStr}:${minsStr}:${secsStr}`
    : `${hoursStr}:${minsStr}:${secsStr}`;

  // 计算进度条：总时长 = 封盘时间 - 开盘时间（未设置开盘时间时，默认按标准单期 7 天 604800 秒）
  const defaultDuration = 7 * 86400;
  const totalDuration = (openUnixSeconds && closeUnixSeconds > openUnixSeconds)
    ? (closeUnixSeconds - openUnixSeconds)
    : defaultDuration;

  // 已过去时间 (elapsed) = 周期总时长 - 剩余时间
  const elapsed = Math.max(0, totalDuration - timeLeft);

  // 进度百分比：已进行时间 / 总时长（随时间推移从 0% 逐渐增长到 100%）
  let progressPercent = 0;
  if (isEnded) {
    progressPercent = 100;
  } else if (totalDuration > 0) {
    progressPercent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
  }

  return {
    timeLeft,
    formatted,
    progressPercent,
    isEnded,
  };
}
