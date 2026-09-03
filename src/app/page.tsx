"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Wallet, 
  PieChart as PieChartIcon, 
  Calendar, 
  Smartphone, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Trash2, 
  ChevronRight,
  Filter,
  RefreshCw,
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
  MoreHorizontal,
  Bot
} from "lucide-react";
import { Transaction, CATEGORIES, ACCOUNTS, Category, AccountType, TransactionType } from "@/lib/types";

export default function MobileLedgerApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "records">("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-09");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

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
      case "food": return <Utensils className="w-4 h-4 text-amber-600" />;
      case "shopping": return <ShoppingBag className="w-4 h-4 text-pink-600" />;
      case "transport": return <Car className="w-4 h-4 text-blue-600" />;
      case "housing": return <Home className="w-4 h-4 text-purple-600" />;
      case "entertainment": return <Gamepad2 className="w-4 h-4 text-emerald-600" />;
      case "digital": return <Smartphone className="w-4 h-4 text-indigo-600" />;
      case "medical": return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case "education": return <GraduationCap className="w-4 h-4 text-cyan-600" />;
      case "salary": return <Wallet className="w-4 h-4 text-emerald-600" />;
      case "bonus": return <Gift className="w-4 h-4 text-amber-600" />;
      case "invest": return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default: return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-20">
      {/* 顶部 Header (全宽自适应) */}
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Nexus Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60">
                Agent 实时同步
              </span>
            </div>
            <p className="text-xs text-slate-500">财务资产概览与可视化报表</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all text-xs flex items-center gap-1.5"
            title="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">刷新</span>
          </button>
        </div>
      </header>

      {/* 主体全屏内容区 */}
      <main className="w-full flex-1 px-4 sm:px-8 py-5 max-w-7xl mx-auto space-y-6">
        {activeTab === "overview" && (
          <>
            {/* 核心资产卡片 (亮色卡片 + 柔和渐变) */}
            <div className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium text-blue-100 tracking-wider">本月净结余 (CNY)</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-light text-blue-200">¥</span>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      {netBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                  {selectedMonth}
                </div>
              </div>

              {/* 收支双栏 */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-white/15">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-emerald-300">
                    <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-100 font-medium">总收入</div>
                    <div className="text-base sm:text-lg font-bold text-white">
                      +¥{totalIncome.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-rose-200">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="text-xs text-blue-100 font-medium">总支出</div>
                    <div className="text-base sm:text-lg font-bold text-white">
                      -¥{totalExpense.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 双栏布局（大屏自适应并排，移动端纵向堆叠） */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧/上方：分类支出进度概览 */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">支出分类分布</h3>
                  <button 
                    onClick={() => setActiveTab("stats")}
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    详情 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {categoryStats.slice(0, 5).map((item) => {
                    const percentage = totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="p-1 rounded-lg bg-slate-100">
                              {renderCategoryIcon(item.id)}
                            </div>
                            <span className="font-medium text-slate-700">{item.label}</span>
                          </div>
                          <span className="font-semibold text-slate-900">
                            ¥{item.total.toFixed(2)} <span className="text-[11px] text-slate-400 font-normal">({percentage}%)</span>
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {categoryStats.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">暂无支出数据</div>
                  )}
                </div>
              </div>

              {/* 右侧：近期收支明细流 */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">近期收支记录</h3>
                  <button 
                    onClick={() => setActiveTab("records")}
                    className="text-xs text-blue-600 hover:underline flex items-center"
                  >
                    查看全部 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {transactions.slice(0, 7).map((tx) => (
                    <div 
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 border border-slate-100 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/70 shadow-xs flex items-center justify-center">
                          {renderCategoryIcon(tx.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-slate-800">{tx.title}</span>
                            {tx.createdBy === "agent" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-medium border border-indigo-200/60">
                                <Bot className="w-2.5 h-2.5" /> Agent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{tx.date.substring(5, 16)}</span>
                            <span>•</span>
                            <span>{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
                            {tx.note && <span className="text-slate-400 hidden sm:inline">({tx.note})</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-sm font-bold ${tx.type === "expense" ? "text-slate-900" : "text-emerald-600"}`}>
                          {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-xs text-slate-400">暂无任何流水记录</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* 统计分类图表页 */}
        {activeTab === "stats" && (
          <div className="w-full space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">全部分类支出统计</h2>
                  <p className="text-xs text-slate-500">当月各维度消费支出详细分析</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">支出总计</div>
                  <div className="text-base font-bold text-slate-900">¥{totalExpense.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryStats.map((item) => {
                  const percentage = totalExpense > 0 ? ((item.total / totalExpense) * 100).toFixed(1) : "0";
                  return (
                    <div key={item.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                            {renderCategoryIcon(item.id)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800">{item.label}</div>
                            <div className="text-xs text-slate-400">共计 {item.count} 笔支出</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">¥{item.total.toFixed(2)}</div>
                          <div className="text-xs text-blue-600 font-semibold">{percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-blue-600"
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

        {/* 流水明细页 */}
        {activeTab === "records" && (
          <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">全量流水账单</h2>
                <p className="text-xs text-slate-500">共收录 {filteredTransactions.length} 笔财务流水</p>
              </div>

              {/* 筛选切换 */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setFilterType("all")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterType("expense")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === "expense" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  仅支出
                </button>
                <button
                  onClick={() => setFilterType("income")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    filterType === "income" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                  }`}
                >
                  仅收入
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {filteredTransactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/60 shadow-xs flex items-center justify-center">
                      {renderCategoryIcon(tx.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-800">{tx.title}</span>
                        {tx.createdBy === "agent" && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-medium border border-indigo-200/60">
                            <Bot className="w-2.5 h-2.5" /> Agent
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{ACCOUNTS.find(a => a.id === tx.account)?.label}</span>
                        {tx.note && <span className="text-slate-400">({tx.note})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${tx.type === "expense" ? "text-slate-900" : "text-emerald-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部 Tab 导航 (亮色玻璃质感) */}
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 z-30 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => setActiveTab("overview")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "overview" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[11px]">财务概览</span>
        </button>

        <button 
          onClick={() => setActiveTab("stats")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "stats" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PieChartIcon className="w-5 h-5" />
          <span className="text-[11px]">分类统计</span>
        </button>

        <button 
          onClick={() => setActiveTab("records")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "records" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px]">明细流水</span>
        </button>
      </footer>
    </div>
  );
}
