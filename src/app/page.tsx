"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  TrendingDown, 
  TrendingUp, 
  Wallet, 
  PieChart as PieChartIcon, 
  Calendar, 
  Smartphone, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  ChevronRight,
  Filter,
  X,
  CreditCard,
  Building2,
  Coins,
  MessageCircle,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Gift,
  MoreHorizontal
} from "lucide-react";
import { Transaction, CATEGORIES, ACCOUNTS, Category, AccountType, TransactionType } from "@/lib/types";

export default function MobileLedgerApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "records" | "agent">("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 弹窗状态
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // 记账表单状态
  const [txType, setTxType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("food");
  const [account, setAccount] = useState<AccountType>("wechat");
  const [note, setNote] = useState("");

  // Agent 模拟对话记账状态
  const [agentInput, setAgentInput] = useState("");
  const [agentLogs, setAgentLogs] = useState<string[]>([
    "💡 Agent 提示：你可以在这里输入自然语言，例如：'午饭吃牛肉面 28 微信' 或 '打车 35 支付宝'，也可以直接在微信发消息给我记账！"
  ]);

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.items);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 统计计算
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // 分类统计
  const categoryStats = CATEGORIES.map(cat => {
    const total = transactions
      .filter(t => t.category === cat.id && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    const count = transactions.filter(t => t.category === cat.id && t.type === "expense").length;
    return { ...cat, total, count };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // 提交记账
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      alert("请输入有效金额");
      return;
    }
    if (!title.trim()) {
      alert("请输入账目名称");
      return;
    }

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          type: txType,
          category,
          account,
          title: title.trim(),
          note: note.trim(),
          source: "web"
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddOpen(false);
        setAmount("");
        setTitle("");
        setNote("");
        fetchData();
      } else {
        alert(data.error || "记账失败");
      }
    } catch (err) {
      alert("请求异常");
    }
  };

  // Agent 模拟调用
  const handleAgentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) return;

    const userMsg = agentInput.trim();
    setAgentLogs(prev => [...prev, `👤 你: ${userMsg}`]);
    setAgentInput("");

    try {
      const res = await fetch("/api/agent/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (data.success) {
        setAgentLogs(prev => [...prev, `🤖 ${data.message}`]);
        fetchData();
      } else {
        setAgentLogs(prev => [...prev, `⚠️ 记账失败: ${data.error}`]);
      }
    } catch (err) {
      setAgentLogs(prev => [...prev, "❌ 连接 API 异常"]);
    }
  };

  // 删除一条账目
  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这笔记录吗？")) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 图标映射
  const renderCategoryIcon = (catId: Category) => {
    switch (catId) {
      case "food": return <Utensils className="w-4 h-4 text-amber-400" />;
      case "shopping": return <ShoppingBag className="w-4 h-4 text-pink-400" />;
      case "transport": return <Car className="w-4 h-4 text-blue-400" />;
      case "housing": return <Home className="w-4 h-4 text-purple-400" />;
      case "entertainment": return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case "digital": return <Smartphone className="w-4 h-4 text-indigo-400" />;
      case "medical": return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case "education": return <GraduationCap className="w-4 h-4 text-cyan-400" />;
      case "salary": return <Wallet className="w-4 h-4 text-emerald-400" />;
      case "bonus": return <Gift className="w-4 h-4 text-amber-400" />;
      default: return <MoreHorizontal className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col justify-between max-w-md mx-auto border-x border-slate-800/80 shadow-2xl relative font-sans select-none pb-24">
      {/* 顶部 Header */}
      <header className="px-5 pt-7 pb-4 bg-[#090D16]/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between border-b border-slate-800/60">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <h1 className="text-lg font-bold tracking-wide bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
              Nexus Ledger
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">智能随身记账 & 数据资产</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab("agent")}
            className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center gap-1.5 active:scale-95 transition-all shadow-inner"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent 接口</span>
          </button>
        </div>
      </header>

      {/* 主屏内容区 */}
      <main className="flex-1 px-4 py-4 space-y-5 overflow-y-auto">
        {activeTab === "overview" && (
          <>
            {/* 核心资产卡片 (FinTech Glassmorphism) */}
            <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-[#131E3A] via-[#0E172C] to-[#0A0F1D] border border-blue-500/20 shadow-xl">
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <span className="text-xs font-medium text-slate-400 tracking-wider">本月净结余 (CNY)</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                  2026.09
                </span>
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-light">¥</span>
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {netBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* 收支双栏 */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">总收入</div>
                    <div className="text-sm font-bold text-emerald-400">
                      +¥{totalIncome.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-medium">总支出</div>
                    <div className="text-sm font-bold text-rose-400">
                      -¥{totalExpense.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 快速动作栏 */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setTxType("expense"); setIsAddOpen(true); }}
                className="p-3.5 rounded-2xl bg-[#121A2D] hover:bg-[#18233C] border border-slate-800 flex items-center gap-3 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                  -
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200">记一笔支出</div>
                  <div className="text-[10px] text-slate-500">餐饮 / 出行 / 购物</div>
                </div>
              </button>

              <button 
                onClick={() => { setTxType("income"); setIsAddOpen(true); }}
                className="p-3.5 rounded-2xl bg-[#121A2D] hover:bg-[#18233C] border border-slate-800 flex items-center gap-3 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  +
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-slate-200">记一笔收入</div>
                  <div className="text-[10px] text-slate-500">薪资 / 奖金 / 收益</div>
                </div>
              </button>
            </div>

            {/* 最近明细列表 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-slate-300">近期收支明细</span>
                <button 
                  onClick={() => setActiveTab("records")} 
                  className="text-[11px] text-blue-400 flex items-center gap-0.5 hover:underline"
                >
                  查看全部 <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 6).map((tx) => (
                  <div 
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-[#111827]/70 border border-slate-800/80 flex items-center justify-between hover:border-slate-700/80 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
                        {renderCategoryIcon(tx.category)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-slate-100">{tx.title}</span>
                          {tx.createdBy === "agent" && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-300 text-[9px] font-mono border border-indigo-500/30">
                              Agent
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{tx.date.substring(5, 16)}</span>
                          <span>•</span>
                          <span>{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-xs font-bold ${tx.type === "expense" ? "text-slate-100" : "text-emerald-400"}`}>
                        {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                      </div>
                      {tx.note && (
                        <div className="text-[10px] text-slate-400 max-w-[100px] truncate mt-0.5">
                          {tx.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 统计页面 */}
        {activeTab === "stats" && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800">
              <h3 className="text-xs font-semibold text-slate-400 mb-3">支出分类构成</h3>
              <div className="space-y-3">
                {categoryStats.map((item) => {
                  const percentage = totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : "0";
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {renderCategoryIcon(item.id)}
                          <span className="text-slate-200">{item.label}</span>
                          <span className="text-[10px] text-slate-500">({item.count}笔)</span>
                        </div>
                        <div className="font-semibold text-slate-100">
                          ¥{item.total.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 流水明细全部页面 */}
        {activeTab === "records" && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-semibold text-slate-300">全部流水记录 ({transactions.length})</span>
            </div>
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="p-3 rounded-2xl bg-[#111827]/70 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                      {renderCategoryIcon(tx.category)}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-100">{tx.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {tx.date} • {ACCOUNTS.find(a => a.id === tx.account)?.label}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-xs font-bold ${tx.type === "expense" ? "text-slate-100" : "text-emerald-400"}`}>
                      {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agent 开放 API & 模拟调试页面 */}
        {activeTab === "agent" && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-indigo-200">微信 & Agent 接口开放规范</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                本系统已内置标准的 HTTP 记账端点。你在微信中发送任何记账指令，Hermes Agent 即可调用接口秒级写入：
              </p>
              <div className="mt-3 p-2.5 rounded-xl bg-black/50 border border-slate-800 font-mono text-[10px] text-slate-300">
                POST /api/agent/record<br />
                Body: &#123; &quot;message&quot;: &quot;午饭 25 元 微信支付&quot; &#125;
              </div>
            </div>

            {/* 模拟 Agent 调试对话窗口 */}
            <div className="p-4 rounded-3xl bg-[#111827] border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300">自然语言记账演练</span>
              <div className="h-44 overflow-y-auto space-y-2 p-3 bg-black/40 rounded-2xl border border-slate-800/80 font-mono text-xs">
                {agentLogs.map((log, i) => (
                  <div key={i} className="text-slate-300 leading-relaxed break-words">{log}</div>
                ))}
              </div>

              <form onSubmit={handleAgentSubmit} className="flex gap-2">
                <input 
                  type="text"
                  placeholder="例如: 买了杯咖啡 18 微信"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold active:scale-95 transition-all"
                >
                  发送
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* 底部固定移动端 Tab 导航 */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#090D16]/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2 z-30 flex items-center justify-around">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "overview" ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px]">概览</span>
        </button>

        <button 
          onClick={() => setActiveTab("stats")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "stats" ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <PieChartIcon className="w-5 h-5" />
          <span className="text-[10px]">统计</span>
        </button>

        {/* 核心记账大按钮 (FAB) */}
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border-2 border-[#090D16] active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button 
          onClick={() => setActiveTab("records")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "records" ? "text-blue-400 font-semibold" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">明细</span>
        </button>

        <button 
          onClick={() => setActiveTab("agent")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === "agent" ? "text-indigo-400 font-semibold" : "text-slate-400 hover:text-slate-300"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">Agent</span>
        </button>
      </footer>

      {/* 记账录入抽屉/模态框 */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end max-w-md mx-auto animate-in fade-in">
          <div className="bg-[#111827] border-t border-slate-700/80 rounded-t-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              {/* 收支类型切换 */}
              <div className="flex bg-slate-800 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`px-4 py-1 rounded-lg text-xs font-semibold transition-all ${
                    txType === "expense" ? "bg-rose-500 text-white shadow" : "text-slate-400"
                  }`}
                >
                  支出
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`px-4 py-1 rounded-lg text-xs font-semibold transition-all ${
                    txType === "income" ? "bg-emerald-500 text-white shadow" : "text-slate-400"
                  }`}
                >
                  收入
                </button>
              </div>

              <button 
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* 金额大输入 */}
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium">输入金额</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-slate-400">¥</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-3xl font-extrabold text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* 账目名称 */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">账目描述</label>
                <input
                  type="text"
                  placeholder="例如：午饭牛肉面、买衣服等"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* 分类网格 */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">选择分类</label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.filter(c => c.type === "both" || c.type === txType).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-2 rounded-xl flex flex-col items-center gap-1 border transition-all ${
                        category === cat.id 
                          ? "bg-blue-600/20 border-blue-500 text-blue-300" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {renderCategoryIcon(cat.id)}
                      <span className="text-[10px]">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 支付账户 */}
              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-400">支付账户</label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ACCOUNTS.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setAccount(acc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-all ${
                        account === acc.id 
                          ? "bg-indigo-600/30 border-indigo-500 text-indigo-300" 
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-98 transition-all"
              >
                保存记账
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
