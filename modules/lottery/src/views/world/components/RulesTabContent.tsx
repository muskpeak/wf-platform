"use client";

import React, { type ReactNode, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Coins,
  Database,
  Gem,
  Info,
  ShieldCheck,
  Trophy,
} from "lucide-react";

type RuleCategory = "flow" | "numbers" | "backup" | "conditions" | "rewards";

interface RuleCategoryConfig {
  id: RuleCategory;
  label: string;
  render: () => ReactNode;
}

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}

interface StepItemProps {
  index: number;
  title: string;
  children: ReactNode;
}

interface InfoPanelProps {
  title: string;
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
  icon?: ReactNode;
}

const SOURCE_ROWS = [
  { position: "第 1 位", flag: "🇺🇸", country: "美国", lottery: "Powerball", day: "周六" },
  { position: "第 2 位", flag: "🇨🇳", country: "中国", lottery: "体彩大乐透", day: "周六" },
  { position: "第 3 位", flag: "🇩🇪", country: "德国", lottery: "Lotto 6aus49", day: "周六" },
  { position: "第 4 位", flag: "🇯🇵", country: "日本", lottery: "LOTO 7", day: "周五" },
  { position: "第 5 位", flag: "🇬🇧", country: "英国", lottery: "Thunderball", day: "周六" },
  { position: "第 6 位", flag: "🇫🇷", country: "法国", lottery: "LOTO", day: "周六" },
  { position: "第 7 位", flag: "🇮🇹", country: "意大利", lottery: "SuperEnalotto", day: "周六" },
];

const TIME_BLOCKS = [
  { time: "Sun 16:00 - Fri 07:59", title: "投注期", badge: "开启投注", className: "bg-[#008cff]" },
  { time: "Fri 08:00 - Sun 13:59", title: "封盘期", badge: "停止投注", className: "bg-[#929292]" },
  { time: "Sun 14:00 - 15:59", title: "结算派奖", badge: "自动校验", className: "bg-[#f59e0b]" },
];

const PRIZE_RULES = [
  { medal: "🥇", name: "一等奖", cap: "1000万 (封顶)", condition: "7 位数字全部匹配", odds: "平均中奖概率: 1 / 1000万" },
  { medal: "🥈", name: "二等奖", cap: "100万 (封顶)", condition: "第 1 至 6 位匹配，第 7 位不匹配", odds: "平均中奖概率: 约 1 / 111万" },
  { medal: "🥉", name: "三等奖", cap: "1万 (封顶)", condition: "第 1 至 5 位匹配，第 6 位不匹配", odds: "平均中奖概率: 约 1 / 11.1万" },
  { medal: "🏅", name: "四等奖", cap: "100 / 注", condition: "任意连续 4 位匹配", odds: "平均中奖概率: 约 1 / 2703" },
  { medal: "🎖️", name: "五等奖", cap: "5 / 注", condition: "任意连续 3 位匹配", odds: "平均中奖概率: 约 1 / 216" },
];

const CATEGORIES: RuleCategoryConfig[] = [
  { id: "flow", label: "玩法流程", render: () => <FlowRules /> },
  { id: "numbers", label: "号码说明", render: () => <NumberRules /> },
  { id: "backup", label: "替补规则", render: () => <BackupRules /> },
  { id: "conditions", label: "中奖条件", render: () => <WinningRules /> },
  { id: "rewards", label: "奖项说明", render: () => <RewardRules /> },
];

function SectionCard({ icon, title, children, className = "" }: SectionCardProps) {
  return (
    <section className={`bg-white border border-[#e7ebf4] rounded-2xl p-5 flex flex-col gap-5 ${className}`}>
      <div className="min-h-[48px] rounded-[30px] bg-[#e7ebf4] px-5 py-3 flex items-center gap-2 text-[#303030]">
        <span className="shrink-0 text-[#5b6472] [&_svg]:size-5">{icon}</span>
        <h3 className="text-[16px] font-bold leading-5">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function StepItem({ index, title, children }: StepItemProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="size-6 rounded-full bg-[#e7ebf4] flex items-center justify-center text-[14px] font-bold text-[#163300] shrink-0">
          {index}
        </span>
        <h4 className="text-[16px] font-bold text-[#1e293b] leading-6">{title}</h4>
      </div>
      <p className="text-[13px] sm:text-[14px] text-[#475569] leading-5">{children}</p>
    </div>
  );
}

function InfoPanel({ title, children, tone = "neutral", icon }: InfoPanelProps) {
  const toneClass = {
    neutral: "bg-[#f3f4f8] text-[#475569]",
    success: "bg-[#f7fff9] text-[#166534]",
    warning: "bg-[#fffdf5] text-[#92400e]",
    danger: "bg-[#fff8f9] text-[#9f1239]",
  }[tone];

  return (
    <div className={`rounded-xl p-4 flex flex-col gap-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {icon && <span className="[&_svg]:size-4 shrink-0">{icon}</span>}
        <h4 className="text-[15px] sm:text-[16px] font-bold leading-6">{title}</h4>
      </div>
      <div className="text-[13px] sm:text-[14px] leading-5">{children}</div>
    </div>
  );
}

function FlowRules() {
  return (
    <SectionCard icon={<Info />} title="玩法流程 (如何参与)">
      <div className="flex flex-col gap-6">
        <StepItem index={1} title="选择号码">
          玩家需从 <strong className="text-black">0000000</strong> 到{" "}
          <strong className="text-black">9999999</strong> 中，任意挑选一个{" "}
          <strong className="text-black">7 位数</strong> 作为一注投注号码。
        </StepItem>
        <StepItem index={2} title="投注金额">
          每注固定售价为 <strong className="text-black">1 USDC</strong>。
        </StepItem>
        <StepItem index={3} title="购买限制">
          为防范恶意套利，每个钱包地址单期最多购买 <strong className="text-black">10 注</strong>。
          您可以在单张彩票上自由设置购买倍率（最高 999 倍），但总注数不可超过上限。
        </StepItem>
      </div>

      <div className="bg-[#e7ebf4] rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 text-[#1e293b]">
          <CalendarDays className="size-[18px]" />
          <h4 className="text-[16px] font-bold">周期与时间 (UTC 标准)</h4>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {TIME_BLOCKS.map((block) => (
            <div key={block.title} className={`${block.className} min-h-[128px] rounded-2xl p-4 text-white flex flex-col gap-3`}>
              <p className="text-[12px] font-black leading-[15px]">{block.time}</p>
              <p className="text-[14px] font-bold">{block.title}</p>
              <p className="text-[10px] font-medium opacity-95">{block.badge}</p>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function NumberRules() {
  return (
    <section className="bg-white border border-[#f1f5f9] rounded-[30px] px-4 py-6 flex flex-col gap-5">
      <div className="h-12 rounded-[30px] bg-[#e7ebf4] px-6 flex items-center gap-2 text-[#303030]">
        <Database className="h-4 w-6 shrink-0 text-[#4b5767]" />
        <h3 className="text-[16px] font-bold leading-4">开奖号码数据来源</h3>
      </div>

      <p className="text-[16px] font-medium text-[#475569] leading-6">
        本平台的 7 位开奖号码（第 1 位至第 7 位）分别来自全球 7 个主力国家官方彩票的当期开奖结果。
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-start">
        <div className="border border-[#f1f5f9] rounded-[30px] overflow-hidden bg-white">
          <div className="grid grid-cols-[48px_112px_84px_48px] gap-2 h-[58px] items-center bg-[#f8fafc] px-3 pt-4 text-[12px] font-bold text-[#64748b]">
            <span>号码位置</span>
            <span>国家</span>
            <span>官方彩票名称</span>
            <span className="text-center">开奖时间</span>
          </div>
          {SOURCE_ROWS.map((row) => (
            <div key={row.position} className="grid grid-cols-[48px_112px_84px_48px] gap-2 h-12 items-center border-t border-[#f1f5f9] px-3 text-[12px] font-bold text-[#0f172a]">
              <span className="text-center">{row.position}</span>
              <span className="min-w-0 flex items-center gap-2">
                <span className="text-[18px] leading-none shrink-0">{row.flag}</span>
                <span className="min-w-0 leading-none">
                  <span className="block truncate tracking-[-0.5px]">{row.country}</span>
                  <span className="block truncate text-[10px] leading-[10px] tracking-[1px] text-[#94a3b8] uppercase">
                    Main Source
                  </span>
                </span>
              </span>
              <span className="truncate">{row.lottery}</span>
              <span className="text-center">{row.day}</span>
            </div>
          ))}
        </div>

        <div className="bg-[#e7ebf4] rounded-[30px] px-4 py-[25px] flex flex-col gap-[14px] overflow-hidden">
          <div className="flex items-center gap-2 py-[3px]">
            <ShieldCheck className="size-[22px] text-[#4b5767]" />
            <h4 className="text-[16px] font-bold leading-4 text-[#303030]">号码提取规则</h4>
          </div>
          <p className="text-[10px] leading-5 text-[#4b5767]">
            取各国指定官方彩票正选号码池中，
            <strong className="font-black underline decoration-[#818cf8]">
              按从小到大排列的最后一个数字的尾数（个位数）
            </strong>
            。
          </p>

          <div className="rounded-[20px] bg-[#f3f4f8] border border-[#dfeaff] px-[14px] py-[21px] flex flex-col items-center gap-3">
            <div className="w-full flex items-center gap-[15px]">
              <span className="text-[24px] leading-none">🇺🇸</span>
              <p className="text-[14px] font-bold leading-[14px] text-[#1e293b]">
                举例说明 (以美国 Powerball 为例)：
              </p>
            </div>
            <p className="text-[12px] font-bold uppercase leading-3 text-[#94a3b8]">1. 官方开奖号码 (正选球)</p>
            <div className="flex justify-center gap-2">
              {["10", "15", "20", "45", "68"].map((num) => (
                <span key={num} className={`size-10 rounded-full border-2 flex items-center justify-center text-[16px] font-bold ${num === "68" ? "bg-[#08f] border-[#08f] text-white" : "bg-white border-[#e2e8f0] text-[#475569]"}`}>
                  {num}
                </span>
              ))}
            </div>
            <div className="w-full pl-9">
              <p className="text-[14px] font-bold leading-5 text-[#334155]">
                从小到大排列，最后一个数字为 <span className="text-[#0188ff] text-[18px] leading-7">68</span>
              </p>
              <p className="mt-0.5 text-[12px] leading-4 text-[#64748b]">（不计入 Powerball 的红色强力球）</p>
            </div>
            <div className="w-full rounded-[50px] bg-[#4b5767] px-4 py-3.5 flex items-center justify-between gap-3 text-white">
              <span className="text-[12px] font-bold">最终提取本平台第 1 位开奖号码为：</span>
              <span className="text-[20px] leading-7 font-bold">8</span>
            </div>
          </div>

          <p className="flex gap-2 text-[10px] italic leading-4 text-[#3e3e3e]">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>
              郑重声明：本平台提取规则严格排除且不使用任何特别球、附加球或强力球，确保数据源的纯粹性。
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

function BackupRules() {
  return (
    <SectionCard icon={<CalendarDays />} title="节假日休市与顺位替补规则">
      <p className="text-[16px] text-[#475569] leading-6">
        当上述主力国家因法定节假日发生彩票停售或突发延期时，系统不会停止运转，而是会自动触发
        <strong className="text-black">“去中心化顺位替补机制”</strong>。
      </p>

      <InfoPanel title="备用替补国家池">
        <div className="flex flex-col gap-2">
          {["🇨🇦 加拿大 (Lotto 6/49, 周六)", "🇧🇷 巴西 (Mega-Sena, 周六)"].map((item, index) => (
            <div key={item} className="flex items-center gap-2">
              <span className="size-5 rounded-full bg-[#e4eaf6] flex items-center justify-center text-[10px] font-bold text-[#71717a]">
                {index + 1}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </InfoPanel>

      <InfoPanel title="替补自动执行逻辑">
        <div className="flex flex-col gap-2">
          <p><strong className="text-[#1e293b]">单国休市：</strong>由加拿大当期提取尾数填补。</p>
          <p><strong className="text-[#1e293b]">双国休市：</strong>按从左至右顺序，左侧由加拿大填补，右侧由巴西填补。</p>
          <p><strong className="text-[#1e293b]">极端情况：</strong>若 3 个及以上国家同时休市，判定流局。</p>
        </div>
      </InfoPanel>
    </SectionCard>
  );
}

function WinningRules() {
  return (
    <SectionCard icon={<Trophy />} title="中奖条件">
      <p className="text-[16px] text-[#475569] leading-6">
        开奖的 7 位数字分别来自美、中、德、日、英、法、意七个国家官方彩票当期主号码池的最后一个尾数。
      </p>

      <div className="border border-[#f8fafc] rounded-[24px] overflow-hidden">
        <div className="bg-[#f8fafc] px-4 py-3 flex items-center justify-between text-[#64748b] font-bold">
          <span className="text-[16px]">奖项</span>
          <span className="text-[12px]">中奖金额 (USDC)</span>
        </div>
        {PRIZE_RULES.map((rule, index) => (
          <div key={rule.name} className={`p-4 flex flex-col gap-2 ${index !== PRIZE_RULES.length - 1 ? "border-b border-[#f1f5f9]" : ""}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-bold text-[#0f172a]">{rule.medal} {rule.name}</span>
              <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[10px] font-bold text-[#08f]">{rule.cap}</span>
            </div>
            <p className="text-[13px] text-[#475569] leading-[18px]">{rule.condition}</p>
            <p className="text-[12px] text-[#64748b]">{rule.odds}</p>
          </div>
        ))}
      </div>

      <InfoPanel title="领奖提示" tone="success" icon={<CheckCircle2 />}>
        中奖后，请及时在平台页面手动点击“领取”按钮，奖金将通过智能合约直接发放至您的去中心化钱包中。若未及时领取，奖金会一直安全保存在合约内。
      </InfoPanel>

      <InfoPanel title="匹配规则" tone="warning" icon={<Info />}>
        奖项按最高匹配原则兑奖，不兼中兼得（即若中得一等奖，不再重复计算二、三等奖）。
      </InfoPanel>
    </SectionCard>
  );
}

function RewardRules() {
  return (
    <div className="flex flex-col gap-5">
      <section className="bg-white border border-[#e7ebf4] rounded-2xl p-5 flex flex-col gap-5">
        <div className="h-12 rounded-[30px] bg-[#e7ebf4] px-5 flex items-center gap-2 text-[#303030]">
          <Coins className="size-5 shrink-0 text-[#4b5767]" />
          <h3 className="text-[16px] font-bold leading-4">奖项说明与奖金分配</h3>
        </div>

        <p className="text-[16px] text-[#475569] leading-6">
          每期总销售额的 <strong className="text-black">80%</strong> 将直接注入彩票奖金池。
        </p>

        <PrizeSection title="固定奖 (四等奖、五等奖)">
          <p className="text-[14px] text-[#475569] leading-5">固定奖将从当期奖金池中优先赔付。</p>
          <div className="flex flex-col gap-2">
            <PrizePayout name="🏅 四等奖" value="100 USDC / 注" />
            <PrizePayout name="🎖️ 五等奖" value="5 USDC / 注" />
          </div>
        </PrizeSection>

        <PrizeSection title="浮动大奖 (一、二、三等奖)">
          <p className="text-[14px] text-[#475569] leading-5">扣除固定奖后的剩余奖金池（包含历史滚存），将按比例分配：</p>
          <div className="flex flex-col gap-3">
            <div className="rounded-xl bg-[#08f] p-4 text-white">
              <p className="text-[14px] font-bold">一等奖 (50%)</p>
              <p className="mt-1 text-[24px] font-black leading-8">1,000万 USDC</p>
              <p className="mt-1 text-[12px] opacity-80">最高封顶</p>
            </div>
            <PrizeShare title="二等奖 (30%)" value="100万 USDC" className="bg-[#e2f3ff]" />
            <PrizeShare title="三等奖 (20%)" value="1万 USDC" className="bg-[#f3f7ff]" />
          </div>
        </PrizeSection>

        <div className="rounded-lg bg-[#fff8f9] px-3 py-4 flex flex-col gap-2 text-[#9f1239]">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 shrink-0" />
            <h4 className="text-[14px] font-bold leading-4">熔断风控机制：</h4>
          </div>
          <p className="text-[12px] leading-4">
            为保护奖池健康，若当期四、五等奖中奖人数激增，导致总固定赔付金额超过当期总销售额的 50% 时，将触发安全熔断。此时奖金将降级为浮动奖，按比例缩放瓜分这 50% 的资金上限。
          </p>
        </div>
      </section>

      <section className="bg-[#e7ebf4] border border-[#e7ebf4] rounded-[30px] p-4 flex flex-col gap-3 overflow-hidden">
        <div className="flex items-center gap-2 py-[3px]">
          <Gem className="size-5 shrink-0 text-[#4b5767]" />
          <h3 className="text-[16px] font-bold leading-4 text-[#303030]">超级滚存池</h3>
        </div>
        <p className="text-[12px] leading-5 text-[#0c0d10]">
          如果当期一、二、三等奖无人中奖，或者单注奖金分配超过了封顶上限，所有未发出的多余资金将 100% 滚存至下一期的对应奖池中，形成不断累积的超级巨奖池！
        </p>
        <p className="text-[12px] leading-[18px] text-[#94a3b8]">提示：滚存规则适用于所有参与 T1 投注的用户。</p>
      </section>
    </div>
  );
}

function PrizeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="h-4 w-1 rounded-sm bg-[#08f]" />
        <h4 className="text-[16px] font-bold text-[#1e293b] leading-6">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function PrizePayout({ name, value }: { name: string; value: string }) {
  return (
    <div className="bg-[#f8fafc] rounded-lg p-3 flex items-center justify-between gap-3 text-[14px] font-bold">
      <span className="text-[#0f172a]">{name}</span>
      <span className="text-[#08f] whitespace-nowrap">{value}</span>
    </div>
  );
}

function PrizeShare({ title, value, className }: { title: string; value: string; className: string }) {
  return (
    <div className={`${className} rounded-xl p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[14px] font-bold text-[#08f]">{title}</p>
        <p className="text-[12px] text-[#dfeaff]">最高封顶</p>
      </div>
      <p className="text-[18px] font-bold text-[#312e81] leading-7">{value}</p>
    </div>
  );
}

export function RulesTabContent() {
  const [activeCategory, setActiveCategory] = useState<RuleCategory>("flow");
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeConfig = CATEGORIES.find((cat) => cat.id === activeCategory) ?? CATEGORIES[0];

  const handleCategoryClick = (category: RuleCategory, element: HTMLButtonElement | null) => {
    setActiveCategory(category);
    const scroller = tabListRef.current;
    if (!scroller || !element) return;

    const targetLeft = element.offsetLeft - (scroller.clientWidth - element.offsetWidth) / 2;
    scroller.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: "smooth",
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div ref={tabListRef} className="overflow-x-auto -mx-3 px-3 sm:-mx-4 sm:px-4 lg:mx-0 lg:px-0">
        <div className="flex items-center gap-2 min-w-max lg:min-w-0 lg:flex-wrap">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={(event) => handleCategoryClick(cat.id, event.currentTarget)}
                className={`h-8 px-[18px] rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap ${
                  isActive ? "bg-[#131416] text-white" : "text-[#707070] hover:bg-white/70 hover:text-[#303030]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full lg:max-w-4xl">{activeConfig.render()}</div>
    </div>
  );
}
