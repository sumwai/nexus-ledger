"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Bot,
  Plus,
  X,
  ArrowLeft,
  SlidersHorizontal,
  Tag,
  Search
} from "lucide-react";
import { Transaction, CategoryMeta, DEFAULT_CATEGORIES, ACCOUNTS, Category, TransactionType } from "@/lib/types";

export default function MobileLedgerApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "records" | "categories">("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryMeta[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  
  // 筛选与下钻状态
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryMeta | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // 新建分类模态框
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatType, setNewCatType] = useState<TransactionType>("expense");
  const [newCatColor, setNewCatColor] = useState("#3B82F6");

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, catRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch("/api/categories")
      ]);
      const txJson = await txRes.json();
      const catJson = await catRes.json();
      if (txJson.success) setTransactions(txJson.data.items);
      if (catJson.success && Array.isArray(catJson.data)) setCategories(catJson.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 月份列表
  const months = useMemo(() => {
    return Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).filter(Boolean).sort().reverse();
  }, [transactions]);

  // 全局过滤后的流水
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedMonth !== "all" && !tx.date.startsWith(selectedMonth)) return false;
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (selectedCategoryDetail && tx.category !== selectedCategoryDetail.id) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        return tx.title.toLowerCase().includes(kw) || (tx.note && tx.note.toLowerCase().includes(kw));
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, selectedCategoryDetail, searchKeyword]);

  // 统计计算
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => (selectedMonth === "all" || t.date.startsWith(selectedMonth)) && t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => (selectedMonth === "all" || t.date.startsWith(selectedMonth)) && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth]);

  const netBalance = totalIncome - totalExpense;

  // 分类支出统计
  const categoryStats = useMemo(() => {
    const periodTxs = transactions.filter(t => (selectedMonth === "all" || t.date.startsWith(selectedMonth)) && t.type === "expense");
    const periodTotalExp = periodTxs.reduce((sum, t) => sum + t.amount, 0);

    return categories.map(cat => {
      const matchTxs = periodTxs.filter(t => t.category === cat.id);
      const total = matchTxs.reduce((sum, t) => sum + t.amount, 0);
      const count = matchTxs.length;
      return { ...cat, total, count, percentage: periodTotalExp > 0 ? ((total / periodTotalExp) * 100).toFixed(1) : "0" };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  }, [transactions, categories, selectedMonth]);

  // 图标映射
  const renderCategoryIcon = (catId: string, customColor?: string) => {
    const meta = categories.find(c => c.id === catId);
    const color = customColor || meta?.color || "#64748B";

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
      default: return <Tag className="w-4 h-4" style={{ color }} />;
    }
  };

  // 创建自建分类
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatLabel.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newCatLabel.trim(),
          type: newCatType,
          color: newCatColor
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddCategoryOpen(false);
        setNewCatLabel("");
        fetchData();
      } else {
        alert(data.error || "创建失败");
      }
    } catch {
      alert("请求异常");
    }
  };

  // 删除自建分类
  const handleDeleteCategory = async (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("确定要删除这个自建分类吗？")) return;
    try {
      const res = await fetch(`/api/categories?id=${catId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 删除一条账目
  const handleDeleteTx = async (id: string) => {
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

  // 下钻到某个分类的详细流水
  const handleDrilldownCategory = (cat: CategoryMeta) => {
    setSelectedCategoryDetail(cat);
    setActiveTab("records");
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none pb-24">
      {/* 顶部 Header (全宽自适应) */}
      <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 shadow-xs px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Nexus Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60">
                {transactions.length} 笔真实流水
              </span>
            </div>
            <p className="text-xs text-slate-500">智能财务洞察与资产看板</p>
          </div>
        </div>

        {/* 月份切换器与操作 */}
        <div className="flex items-center gap-2">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="all">全部账单周期</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all text-xs flex items-center gap-1.5"
            title="刷新数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* 主体全屏内容区 */}
      <main className="w-full flex-1 px-4 sm:px-8 py-5 max-w-7xl mx-auto space-y-6">
        
        {/* 1. 概览 Tab */}
        {activeTab === "overview" && (
          <>
            {/* 核心资产卡片 */}
            <div className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/10">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-medium text-blue-100 tracking-wider">
                    {selectedMonth === "all" ? "总收支结余 (CNY)" : `${selectedMonth} 结余 (CNY)`}
                  </span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-sm font-light text-blue-200">¥</span>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                      {netBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                  {selectedMonth === "all" ? "全部周期" : selectedMonth}
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
                      +¥{totalIncome.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
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
                      -¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 双栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：分类支出分布（支持点击下钻） */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">支出分类排行</h3>
                    <p className="text-[11px] text-slate-400">点击分类可直接下钻查看明细</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("stats")}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center"
                  >
                    全部 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {categoryStats.slice(0, 6).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleDrilldownCategory(item)}
                      className="p-2.5 rounded-2xl hover:bg-blue-50/60 border border-transparent hover:border-blue-100 cursor-pointer active:scale-98 transition-all group"
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs transition-all">
                            {renderCategoryIcon(item.id, item.color)}
                          </div>
                          <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400">({item.count}笔)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">¥{item.total.toFixed(2)}</span>
                          <span className="text-[10px] text-slate-400">({item.percentage}%)</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {categoryStats.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">当前周期无支出</div>
                  )}
                </div>
              </div>

              {/* 右侧：近期流水 */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">近期收支明细</h3>
                    <p className="text-[11px] text-slate-400">来自微信账单与 Agent 同步录入</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedCategoryDetail(null); setActiveTab("records"); }}
                    className="text-xs text-blue-600 font-medium hover:underline flex items-center"
                  >
                    查看全部流水 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {transactions.slice(0, 8).map((tx) => (
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
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span>{tx.date.substring(5, 16)}</span>
                            <span>•</span>
                            <span>{categories.find(c => c.id === tx.category)?.label || tx.category}</span>
                            <span>•</span>
                            <span>{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
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
                </div>
              </div>
            </div>
          </>
        )}

        {/* 2. 分类全景统计 Tab */}
        {activeTab === "stats" && (
          <div className="w-full space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">分类支出深度分析</h2>
                  <p className="text-xs text-slate-500">点击任意分类卡片可下钻查看该分类的所有账目流水</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">周期支出总额</div>
                  <div className="text-base font-bold text-slate-900">¥{totalExpense.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryStats.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleDrilldownCategory(item)}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-blue-200/80 cursor-pointer active:scale-98 transition-all space-y-3 group shadow-xs hover:shadow"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs group-hover:scale-105 transition-transform">
                          {renderCategoryIcon(item.id, item.color)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.label}
                          </div>
                          <div className="text-xs text-slate-400">共 {item.count} 笔支出</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">¥{item.total.toFixed(2)}</div>
                        <div className="text-xs text-blue-600 font-semibold">{item.percentage}%</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400 group-hover:text-blue-500">
                      <span>查看明细账单</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 流水明细 Tab（支持分类下钻与搜索） */}
        {activeTab === "records" && (
          <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            {/* 顶栏控制 */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  {selectedCategoryDetail && (
                    <button 
                      onClick={() => setSelectedCategoryDetail(null)}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-semibold mr-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 全部
                    </button>
                  )}
                  <h2 className="text-base font-bold text-slate-800">
                    {selectedCategoryDetail ? `【${selectedCategoryDetail.label}】分类明细` : "全量财务流水"}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  共筛选出 {filteredTransactions.length} 笔记录
                  {selectedCategoryDetail && (
                    <span className="ml-2 font-medium text-rose-600">
                      (累计: ¥{filteredTransactions.reduce((s, t) => s + t.amount, 0).toFixed(2)})
                    </span>
                  )}
                </p>
              </div>

              {/* 搜索与类型切换 */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* 关键词搜索框 */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="搜索商家、商品或备注..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full sm:w-48 pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  {searchKeyword && (
                    <button onClick={() => setSearchKeyword("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 过滤切换 */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
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
                    支出
                  </button>
                  <button
                    onClick={() => setFilterType("income")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      filterType === "income" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    收入
                  </button>
                </div>
              </div>
            </div>

            {/* 流水明细列表 */}
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
                        <span className="font-medium text-slate-600">
                          {categories.find(c => c.id === tx.category)?.label || tx.category}
                        </span>
                        <span>•</span>
                        <span>{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
                        {tx.note && <span className="text-slate-400 text-[11px] hidden sm:inline">({tx.note})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`text-sm font-bold ${tx.type === "expense" ? "text-slate-900" : "text-emerald-600"}`}>
                      {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                    </div>
                    <button 
                      onClick={() => handleDeleteTx(tx.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <p className="text-sm">没有匹配到任何流水账单</p>
                  {selectedCategoryDetail && (
                    <button 
                      onClick={() => setSelectedCategoryDetail(null)}
                      className="text-xs text-blue-600 underline font-medium"
                    >
                      清除分类筛选
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. 分类管理与自建分类 Tab */}
        {activeTab === "categories" && (
          <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">分类库管理</h2>
                <p className="text-xs text-slate-500">查看系统预设及自建分类，用于记账与自动归类</p>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>新建分类</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {categories.map((cat) => (
                <div 
                  key={cat.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between group hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/60 shadow-xs">
                      {renderCategoryIcon(cat.id, cat.color)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{cat.label}</div>
                      <div className="text-[10px] text-slate-400">
                        {cat.isCustom ? "自建分类" : "系统内置"}
                      </div>
                    </div>
                  </div>

                  {cat.isCustom && (
                    <button
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="删除自建分类"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 底部 Tab 导航 */}
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2.5 z-30 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => { setSelectedCategoryDetail(null); setActiveTab("overview"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "overview" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[11px]">资产概览</span>
        </button>

        <button 
          onClick={() => { setSelectedCategoryDetail(null); setActiveTab("stats"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "stats" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PieChartIcon className="w-5 h-5" />
          <span className="text-[11px]">分类统计</span>
        </button>

        <button 
          onClick={() => { setSelectedCategoryDetail(null); setActiveTab("records"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "records" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[11px]">全量流水</span>
        </button>

        <button 
          onClick={() => setActiveTab("categories")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeTab === "categories" ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[11px]">分类管理</span>
        </button>
      </footer>

      {/* 新建分类弹窗 */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">自建新分类</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">分类名称</label>
                <input
                  type="text"
                  placeholder="例如：宠物猫粮、游戏充值、健身等"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">分类类型</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewCatType("expense")}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      newCatType === "expense" ? "bg-rose-50 border-rose-400 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    支出
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType("income")}
                    className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                      newCatType === "income" ? "bg-emerald-50 border-emerald-400 text-emerald-600" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    收入
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">标识色彩</label>
                <div className="flex gap-2 mt-1.5">
                  {["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4"].map((c) => (
                    <div 
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${newCatColor === c ? "scale-125 ring-2 ring-offset-2 ring-slate-400" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-98 transition-all mt-2"
              >
                确认创建
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
