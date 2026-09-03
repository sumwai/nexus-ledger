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
  RefreshCw,
  CreditCard,
  Building2,
  Coins,
  MessageCircle,
  Utensils,
  ShoppingBag,
  Car,
  Home,
  Users,
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
  Tag as TagIcon,
  Search,
  Boxes,
  ShieldCheck,
  Activity,
  Filter,
  Check
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";
import { Transaction, CategoryMeta, DEFAULT_CATEGORIES, ACCOUNTS, TransactionType } from "@/lib/types";

export default function MobileLedgerApp() {
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "records" | "categories">("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryMeta[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  
  // 筛选与下钻状态
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");
  const [selectedCategoryDetail, setSelectedCategoryDetail] = useState<CategoryMeta | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedCounterparty, setSelectedCounterparty] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  // 图表专属分类与标签过滤
  const [chartCategoryFilter, setChartCategoryFilter] = useState<string>("all");
  const [chartRange, setChartRange] = useState<"7d" | "14d" | "30d" | "all">("14d");

  // 编辑标签 & 分类弹窗
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [customTagInput, setCustomTagInput] = useState<string>("");

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

  // 全量标签池提炼
  const allTagsList = useMemo(() => {
    const map = new Map<string, number>();
    transactions.forEach(t => {
      (t.tags || []).forEach(tag => {
        map.set(tag, (map.get(tag) || 0) + 1);
      });
    });
    return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [transactions]);

  // 高频交易方列表
  const counterpartiesList = useMemo(() => {
    const map = new Map<string, { count: number; totalExpense: number; totalIncome: number }>();
    transactions.forEach(t => {
      const name = t.title.trim();
      if (!name || name === "日常收支" || name === "/") return;
      const cur = map.get(name) || { count: 0, totalExpense: 0, totalIncome: 0 };
      cur.count += 1;
      if (t.type === "expense") cur.totalExpense += t.amount;
      if (t.type === "income") cur.totalIncome += t.amount;
      map.set(name, cur);
    });

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [transactions]);

  // 全局过滤后的流水
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      if (selectedMonth !== "all" && !tx.date.startsWith(selectedMonth)) return false;
      if (filterType !== "all" && tx.type !== filterType) return false;
      if (selectedCategoryDetail && tx.category !== selectedCategoryDetail.id) return false;
      if (selectedTag && (!tx.tags || !tx.tags.includes(selectedTag))) return false;
      if (selectedCounterparty && tx.title.trim() !== selectedCounterparty) return false;
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const inTags = (tx.tags || []).some(tg => tg.toLowerCase().includes(kw));
        return inTags || tx.title.toLowerCase().includes(kw) || (tx.note && tx.note.toLowerCase().includes(kw));
      }
      return true;
    });
  }, [transactions, selectedMonth, filterType, selectedCategoryDetail, selectedTag, selectedCounterparty, searchKeyword]);

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

  // 当前列表统计
  const currentListTotalIncome = useMemo(() => {
    return filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

  const currentListTotalExpense = useMemo(() => {
    return filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  }, [filteredTransactions]);

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

  // 每日收支折线/面积图数据构造
  const dailyChartData = useMemo(() => {
    const periodTxs = transactions.filter(t => {
      if (selectedMonth !== "all" && !t.date.startsWith(selectedMonth)) return false;
      if (chartCategoryFilter !== "all" && t.category !== chartCategoryFilter) return false;
      return true;
    });
    
    const dateMap = new Map<string, { income: number; expense: number }>();
    
    periodTxs.forEach(tx => {
      const day = tx.date.substring(0, 10);
      const cur = dateMap.get(day) || { income: 0, expense: 0 };
      if (tx.type === "income") cur.income += tx.amount;
      if (tx.type === "expense") cur.expense += tx.amount;
      dateMap.set(day, cur);
    });

    let sortedDays = Array.from(dateMap.keys()).sort();
    
    if (chartRange === "7d") {
      sortedDays = sortedDays.slice(-7);
    } else if (chartRange === "14d") {
      sortedDays = sortedDays.slice(-14);
    } else if (chartRange === "30d") {
      sortedDays = sortedDays.slice(-30);
    }

    return sortedDays.map(day => {
      const val = dateMap.get(day) || { income: 0, expense: 0 };
      return {
        date: day,
        displayDate: `${day.substring(5, 7)}/${day.substring(8, 10)}`,
        支出: parseFloat(val.expense.toFixed(2)),
        收入: parseFloat(val.income.toFixed(2)),
        净结余: parseFloat((val.income - val.expense).toFixed(2))
      };
    });
  }, [transactions, selectedMonth, chartCategoryFilter, chartRange]);

  // 图表分类下的总支出与总收入汇总
  const chartSummary = useMemo(() => {
    const exp = dailyChartData.reduce((s, d) => s + d.支出, 0);
    const inc = dailyChartData.reduce((s, d) => s + d.收入, 0);
    return { exp, inc };
  }, [dailyChartData]);

  // 按日期分组流水
  const groupedTransactionsByDate = useMemo(() => {
    const groups: { dateStr: string; dayTitle: string; totalExp: number; totalInc: number; items: Transaction[] }[] = [];
    const map = new Map<string, Transaction[]>();

    filteredTransactions.forEach(tx => {
      const day = tx.date.substring(0, 10);
      const list = map.get(day) || [];
      list.push(tx);
      map.set(day, list);
    });

    Array.from(map.entries()).forEach(([day, items]) => {
      const totalExp = items.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const totalInc = items.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      
      const d = new Date(day);
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      const dayTitle = `${day.substring(5, 7)}月${day.substring(8, 10)}日 ${weekdays[d.getDay()] || ""}`;

      groups.push({ dateStr: day, dayTitle, totalExp, totalInc, items });
    });

    return groups;
  }, [filteredTransactions]);

  // 图标与背景色映射
  const renderCategoryIcon = (catId: string, customColor?: string) => {
    const meta = categories.find(c => c.id === catId);
    const color = customColor || meta?.color || "#64748B";

    switch (catId) {
      case "tokenmp_project": return <Boxes className="w-4 h-4 text-indigo-600" />;
      case "deposit_asset": return <ShieldCheck className="w-4 h-4 text-cyan-600" />;
      case "food": return <Utensils className="w-4 h-4 text-amber-600" />;
      case "shopping": return <ShoppingBag className="w-4 h-4 text-pink-600" />;
      case "transport": return <Car className="w-4 h-4 text-blue-600" />;
      case "housing": return <Home className="w-4 h-4 text-purple-600" />;
      case "social": return <Users className="w-4 h-4 text-orange-600" />;
      case "entertainment": return <Gamepad2 className="w-4 h-4 text-emerald-600" />;
      case "digital": return <Smartphone className="w-4 h-4 text-indigo-600" />;
      case "medical": return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case "education": return <GraduationCap className="w-4 h-4 text-cyan-600" />;
      case "salary": return <Wallet className="w-4 h-4 text-emerald-600" />;
      case "bonus": return <Gift className="w-4 h-4 text-amber-600" />;
      case "invest": return <TrendingUp className="w-4 h-4 text-blue-600" />;
      default: return <TagIcon className="w-4 h-4" style={{ color }} />;
    }
  };

  const getCategoryBgClass = (catId: string) => {
    switch (catId) {
      case "tokenmp_project": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "deposit_asset": return "bg-cyan-50 text-cyan-600 border-cyan-100";
      case "food": return "bg-amber-50 text-amber-600 border-amber-100";
      case "shopping": return "bg-pink-50 text-pink-600 border-pink-100";
      case "transport": return "bg-blue-50 text-blue-600 border-blue-100";
      case "housing": return "bg-purple-50 text-purple-600 border-purple-100";
      case "social": return "bg-orange-50 text-orange-600 border-orange-100";
      case "entertainment": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "digital": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "medical": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-600 border-slate-200/80";
    }
  };

  // 快捷更新流水分类与标签
  const handleUpdateTx = async (txId: string, newCatId?: string, newTags?: string[]) => {
    try {
      const payload: any = { id: txId };
      if (newCatId) payload.category = newCatId;
      if (newTags !== undefined) payload.tags = newTags;

      const res = await fetch("/api/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(prev => prev.map(t => t.id === txId ? { ...t, ...payload } : t));
        if (editingTx && editingTx.id === txId) {
          setEditingTx(prev => prev ? { ...prev, ...payload } : null);
        }
      } else {
        alert(data.error);
      }
    } catch {
      alert("修改异常");
    }
  };

  // 切换/增删标签
  const toggleTagOnEditingTx = (tag: string) => {
    if (!editingTx) return;
    const currentTags = editingTx.tags || [];
    const nextTags = currentTags.includes(tag) 
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleUpdateTx(editingTx.id, undefined, nextTags);
  };

  // 添加自定义标签
  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx || !customTagInput.trim()) return;
    const tag = customTagInput.trim().replace(/^#/, "");
    const currentTags = editingTx.tags || [];
    if (!currentTags.includes(tag)) {
      handleUpdateTx(editingTx.id, undefined, [...currentTags, tag]);
    }
    setCustomTagInput("");
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

  // 下钻分类
  const handleDrilldownCategory = (cat: CategoryMeta) => {
    setSelectedCategoryDetail(cat);
    setSelectedTag(null);
    setSelectedCounterparty(null);
    setActiveTab("records");
  };

  // 下钻标签
  const handleDrilldownTag = (tag: string) => {
    setSelectedTag(tag);
    setSelectedCategoryDetail(null);
    setSelectedCounterparty(null);
    setActiveTab("records");
  };

  // 下钻交易方
  const handleDrilldownCounterparty = (name: string) => {
    setSelectedCounterparty(name);
    setSelectedCategoryDetail(null);
    setSelectedTag(null);
    setActiveTab("records");
  };

  // 自定义图表 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const currentCatName = chartCategoryFilter === "all" ? "全部收支" : categories.find(c => c.id === chartCategoryFilter)?.label;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 p-3 rounded-2xl shadow-xl text-xs space-y-1.5 font-mono text-white">
          <div className="font-sans font-bold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between gap-2">
            <span>{payload[0]?.payload?.date}</span>
            <span className="text-[10px] text-indigo-400 bg-indigo-950/80 px-1.5 py-0.2 rounded border border-indigo-700/50">{currentCatName}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span className="flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              支出
            </span>
            <span className="font-bold">-¥{payload.find((p: any) => p.name === "支出")?.value?.toFixed(2) || "0.00"}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span className="flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              收入
            </span>
            <span className="font-bold">+¥{payload.find((p: any) => p.name === "收入")?.value?.toFixed(2) || "0.00"}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen bg-[#F6F8FA] text-slate-900 flex flex-col font-sans select-none pb-24">
      {/* 顶部 Header */}
      <header className="w-full bg-white/90 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-200/60 shadow-[0_2px_12px_rgba(0,0,0,0.03)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-900 flex items-center justify-center text-white shadow-md shadow-indigo-950/20 border border-slate-700/30 shrink-0">
            <Wallet className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 whitespace-nowrap">
                Nexus Ledger
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/60 shadow-2xs whitespace-nowrap hidden sm:inline-block">
                {transactions.length} 笔流水
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium whitespace-nowrap truncate">智能财务资产看板</p>
          </div>
        </div>

        {/* 月份切换器与操作 */}
        <div className="flex items-center gap-2 shrink-0">
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-semibold rounded-xl px-2.5 sm:px-3 py-2 text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs transition-all whitespace-nowrap"
          >
            <option value="all">全部周期</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 active:scale-95 transition-all text-xs flex items-center gap-1.5 shadow-2xs shrink-0"
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
            {/* 核心资产主卡片 */}
            <div className="w-full relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0A0F1D] text-white shadow-2xl shadow-slate-950/20 border border-slate-700/50">
              <div className="absolute -right-16 -top-16 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                      {selectedMonth === "all" ? "累计净收支结余" : `${selectedMonth} 净结余`}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5 whitespace-nowrap">
                    <span className="text-sm font-light text-slate-400">¥</span>
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                      {netBalance.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 text-xs font-semibold border border-white/15 shadow-inner whitespace-nowrap shrink-0">
                  {selectedMonth === "all" ? "全周期" : selectedMonth}
                </div>
              </div>

              {/* 收支双栏指标 */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-800/90">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap">总收入</div>
                    <div className="text-sm sm:text-base font-bold text-emerald-400 font-mono whitespace-nowrap truncate">
                      +¥{totalIncome.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0 shadow-inner">
                    <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-slate-400 font-medium whitespace-nowrap">总支出</div>
                    <div className="text-sm sm:text-base font-bold text-rose-400 font-mono whitespace-nowrap truncate">
                      -¥{totalExpense.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 📈 每日收支走势分析卡片 */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/70 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-800">每日收支走势分析</h3>
                      {chartCategoryFilter !== "all" && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-200/80">
                          只看: {categories.find(c => c.id === chartCategoryFilter)?.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {chartCategoryFilter === "all" ? "全部分类收支波动曲线" : `【${categories.find(c => c.id === chartCategoryFilter)?.label}】专项每日走势`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* 图表分类过滤下拉框 */}
                  <select
                    value={chartCategoryFilter}
                    onChange={(e) => setChartCategoryFilter(e.target.value)}
                    className="bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/80 text-xs font-bold rounded-xl px-2.5 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 shadow-2xs transition-all whitespace-nowrap"
                  >
                    <option value="all">🏷️ 全部分类图表</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>

                  {/* 时间跨度切换 */}
                  <div className="flex bg-slate-100/90 p-0.5 rounded-xl border border-slate-200/60 text-xs">
                    <button
                      onClick={() => setChartRange("7d")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        chartRange === "7d" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      7天
                    </button>
                    <button
                      onClick={() => setChartRange("14d")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        chartRange === "14d" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      14天
                    </button>
                    <button
                      onClick={() => setChartRange("30d")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        chartRange === "30d" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      30天
                    </button>
                    <button
                      onClick={() => setChartRange("all")}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        chartRange === "all" ? "bg-white text-indigo-600 shadow-2xs" : "text-slate-500"
                      }`}
                    >
                      全部
                    </button>
                  </div>
                </div>
              </div>

              {/* 图表分类快捷胶囊导航 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap shrink-0">图表过滤:</span>
                <button
                  onClick={() => setChartCategoryFilter("all")}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all ${
                    chartCategoryFilter === "all"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  全部
                </button>
                {categories.slice(0, 8).map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setChartCategoryFilter(chartCategoryFilter === cat.id ? "all" : cat.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1 ${
                      chartCategoryFilter === cat.id
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 scale-102"
                        : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* 折线面积图主体 */}
              <div className="w-full h-64 sm:h-72 pt-2">
                {dailyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis 
                        dataKey="displayDate" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#94A3B8", fontSize: 11 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: "#94A3B8", fontSize: 11 }}
                        tickFormatter={(v) => `¥${v}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="支出" 
                        stroke="#F43F5E" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#expenseGrad)" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="收入" 
                        stroke="#10B981" 
                        strokeWidth={2.5}
                        fillOpacity={1} 
                        fill="url(#incomeGrad)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    该分类在当前周期暂无图表数据
                  </div>
                )}
              </div>

              {/* 图例与当前图表汇总 */}
              <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-5 font-semibold">
                  <div className="flex items-center gap-2 text-rose-600">
                    <span className="w-3 h-1.5 rounded-full bg-rose-500" />
                    <span>每日支出</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600">
                    <span className="w-3 h-1.5 rounded-full bg-emerald-500" />
                    <span>每日收入</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1 sm:mt-0">
                  {chartSummary.exp > 0 && <span>期间支出: <b className="text-slate-800">¥{chartSummary.exp.toFixed(2)}</b></span>}
                  {chartSummary.inc > 0 && <span>期间收入: <b className="text-emerald-600">+¥{chartSummary.inc.toFixed(2)}</b></span>}
                </div>
              </div>
            </div>

            {/* 双栏布局 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：分类支出分布 */}
              <div className="lg:col-span-1 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">主要消费去向</h3>
                    <p className="text-[11px] text-slate-400">点击卡片可快速下钻明细</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab("stats")}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-0.5 whitespace-nowrap"
                  >
                    全部 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {categoryStats.slice(0, 6).map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => handleDrilldownCategory(item)}
                      className="p-3 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/50 border border-slate-100 hover:border-indigo-200/80 cursor-pointer active:scale-98 transition-all group"
                    >
                      <div className="flex justify-between items-center text-xs mb-1.5 gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl border ${getCategoryBgClass(item.id)} shadow-2xs group-hover:scale-105 transition-transform shrink-0`}>
                            {renderCategoryIcon(item.id, item.color)}
                          </div>
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0">({item.count}笔)</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                          <span className="font-extrabold text-slate-900 font-mono">¥{item.total.toFixed(2)}</span>
                          <span className="text-[10px] font-bold text-slate-400">({item.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：近期流水精选 */}
              <div className="lg:col-span-2 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-xs space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">最新收支流水</h3>
                    <p className="text-[11px] text-slate-400">点击商家名可筛选交易方，点击分类/标签可修改</p>
                  </div>
                  <button 
                    onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); setActiveTab("records"); }}
                    className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-0.5 whitespace-nowrap"
                  >
                    全部流水 <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  {transactions.slice(0, 7).map((tx) => (
                    <div 
                      key={tx.id}
                      className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-slate-300/80 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={`w-11 h-11 rounded-2xl border ${getCategoryBgClass(tx.category)} shadow-2xs flex items-center justify-center shrink-0`}>
                          {renderCategoryIcon(tx.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <button 
                              onClick={() => handleDrilldownCounterparty(tx.title.trim())}
                              className="text-sm font-bold text-slate-800 hover:text-indigo-600 text-left transition-colors truncate block max-w-full"
                              title={tx.title}
                            >
                              {tx.title}
                            </button>
                            {tx.createdBy === "agent" && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-200/60 shrink-0">
                                <Bot className="w-2.5 h-2.5" /> Agent
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                            <span className="shrink-0">{tx.date.substring(5, 16)}</span>
                            <span className="shrink-0">•</span>
                            <button 
                              onClick={() => setEditingTx(tx)}
                              className="font-semibold text-slate-600 hover:text-indigo-600 bg-slate-200/60 hover:bg-indigo-50 px-1.5 py-0.2 rounded transition-colors shrink-0"
                              title="点击修改分类与标签"
                            >
                              {categories.find(c => c.id === tx.category)?.label || tx.category} ✎
                            </button>
                            {/* 标签徽标 */}
                            {(tx.tags || []).slice(0, 2).map((tg) => (
                              <button
                                key={tg}
                                onClick={() => handleDrilldownTag(tg)}
                                className="px-1.5 py-0.2 rounded bg-indigo-50/90 text-indigo-600 border border-indigo-200/60 text-[10px] font-bold shrink-0 hover:bg-indigo-100"
                              >
                                #{tg}
                              </button>
                            ))}
                            <span className="shrink-0">•</span>
                            <span className="truncate">{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap shrink-0 pl-1">
                        <span className={`text-base font-extrabold font-mono tracking-tight ${tx.type === "expense" ? "text-slate-900" : "text-emerald-600"}`}>
                          {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                        </span>
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
                  <div className="text-base font-extrabold text-slate-900 font-mono">¥{totalExpense.toFixed(2)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryStats.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleDrilldownCategory(item)}
                    className="p-4 rounded-2xl bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-100 hover:border-indigo-200/80 cursor-pointer active:scale-98 transition-all space-y-3 group shadow-2xs hover:shadow-md"
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2.5 rounded-xl border ${getCategoryBgClass(item.id)} shadow-2xs group-hover:scale-105 transition-transform shrink-0`}>
                          {renderCategoryIcon(item.id, item.color)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                            {item.label}
                          </div>
                          <div className="text-xs text-slate-400 whitespace-nowrap">共 {item.count} 笔支出</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 whitespace-nowrap">
                        <div className="text-base font-extrabold text-slate-900 font-mono">¥{item.total.toFixed(2)}</div>
                        <div className="text-xs text-indigo-600 font-bold">{item.percentage}%</div>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px] text-slate-400 group-hover:text-indigo-600 font-medium whitespace-nowrap">
                      <span>查看明细账单</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. 全量流水 Tab (时间轴卡片流 + 分类/标签多维复合过滤) */}
        {activeTab === "records" && (
          <div className="w-full space-y-5">
            {/* 顶栏筛选与统计卡片 */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {(selectedCategoryDetail || selectedTag || selectedCounterparty) && (
                    <button 
                      onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); }}
                      className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center gap-1 text-xs font-bold mr-1 shadow-2xs shrink-0 whitespace-nowrap"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> 全部
                    </button>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-base font-black text-slate-800 flex items-center gap-1.5 truncate">
                      {selectedCategoryDetail && <span>【{selectedCategoryDetail.label}】分类明细</span>}
                      {selectedTag && <span>【#{selectedTag}】标签明细</span>}
                      {selectedCounterparty && <span>【{selectedCounterparty}】交易明细</span>}
                      {!selectedCategoryDetail && !selectedTag && !selectedCounterparty && <span>全量流水明细</span>}
                    </h2>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 whitespace-nowrap overflow-x-auto">
                      <span className="shrink-0">{filteredTransactions.length} 笔记录</span>
                      {currentListTotalExpense > 0 && (
                        <span className="font-bold text-slate-900 shrink-0">
                          支: -¥{currentListTotalExpense.toFixed(2)}
                        </span>
                      )}
                      {currentListTotalIncome > 0 && (
                        <span className="font-bold text-emerald-600 shrink-0">
                          收: +¥{currentListTotalIncome.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 收支类型切换 */}
                <div className="flex bg-slate-100/90 p-1 rounded-2xl w-fit border border-slate-200/60 shadow-2xs shrink-0">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFilterType("expense")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    仅支出
                  </button>
                  <button
                    onClick={() => setFilterType("income")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      filterType === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    仅收入
                  </button>
                </div>
              </div>

              {/* 四联复合筛选行：分类 + 标签 + 交易方 + 搜索 */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                {/* 分类下拉 */}
                <div className="sm:col-span-1">
                  <select
                    value={selectedCategoryDetail?.id || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setSelectedCategoryDetail(null);
                      } else {
                        const targetCat = categories.find(c => c.id === val);
                        if (targetCat) setSelectedCategoryDetail(targetCat);
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none transition-colors shadow-2xs whitespace-nowrap ${
                      selectedCategoryDetail 
                        ? "bg-indigo-50/90 border-indigo-300 text-indigo-700" 
                        : "bg-slate-50/90 border-slate-200 text-slate-800 focus:border-indigo-500"
                    }`}
                  >
                    <option value="">🏷️ 全部收支分类 ({categories.length})</option>
                    {categories.map((c) => {
                      const count = transactions.filter(t => (selectedMonth === "all" || t.date.startsWith(selectedMonth)) && t.category === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.label} ({count}笔)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* 🎯 标签筛选下拉 */}
                <div className="sm:col-span-1">
                  <select
                    value={selectedTag || ""}
                    onChange={(e) => setSelectedTag(e.target.value ? e.target.value : null)}
                    className={`w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none transition-colors shadow-2xs whitespace-nowrap ${
                      selectedTag 
                        ? "bg-indigo-50/90 border-indigo-300 text-indigo-700" 
                        : "bg-slate-50/90 border-slate-200 text-slate-800 focus:border-indigo-500"
                    }`}
                  >
                    <option value="">#️⃣ 全部标签 ({allTagsList.length})</option>
                    {allTagsList.map((t) => (
                      <option key={t.name} value={t.name}>
                        #{t.name} ({t.count}笔)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 交易方下拉 */}
                <div className="sm:col-span-1">
                  <select
                    value={selectedCounterparty || ""}
                    onChange={(e) => setSelectedCounterparty(e.target.value ? e.target.value : null)}
                    className="w-full px-3 py-2 bg-slate-50/90 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs whitespace-nowrap"
                  >
                    <option value="">👤 全部收/付款方 ({counterpartiesList.length})</option>
                    {counterpartiesList.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.count}笔)
                      </option>
                    ))}
                  </select>
                </div>

                {/* 搜索框 */}
                <div className="sm:col-span-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text"
                    placeholder="搜索商家/备注/标签..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-8 py-2 bg-slate-50/90 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors shadow-2xs"
                  />
                  {searchKeyword && (
                    <button onClick={() => setSearchKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 常用标签与分类快捷胶囊栏 */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium whitespace-nowrap shrink-0">标签快捷:</span>
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 transition-all ${
                    !selectedTag
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  全部
                </button>
                {allTagsList.slice(0, 8).map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTag(selectedTag === t.name ? null : t.name)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all flex items-center gap-1 ${
                      selectedTag === t.name
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20 scale-102"
                        : "bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50"
                    }`}
                  >
                    <span>#{t.name}</span>
                    <span className="text-[9px] opacity-80">({t.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 按日期时间轴分组渲染流水列表 */}
            <div className="space-y-4">
              {groupedTransactionsByDate.map((group) => (
                <div key={group.dateStr} className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/70 shadow-xs space-y-2.5">
                  {/* 日期分组标题栏 */}
                  <div className="flex justify-between items-center px-1 pb-2 border-b border-slate-100/90 text-xs">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-extrabold text-slate-800">{group.dayTitle}</span>
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">({group.dateStr})</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono font-bold text-[11px] whitespace-nowrap">
                      {group.totalExp > 0 && (
                        <span className="text-slate-600">支出 ¥{group.totalExp.toFixed(2)}</span>
                      )}
                      {group.totalInc > 0 && (
                        <span className="text-emerald-600">收入 +¥{group.totalInc.toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* 该日期下的明细卡片列表 */}
                  <div className="space-y-2 pt-1">
                    {group.items.map((tx) => (
                      <div 
                        key={tx.id}
                        className="p-3 rounded-2xl bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className={`w-11 h-11 rounded-2xl border ${getCategoryBgClass(tx.category)} shadow-2xs flex items-center justify-center shrink-0`}>
                            {renderCategoryIcon(tx.category)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 min-w-0">
                              <button 
                                onClick={() => handleDrilldownCounterparty(tx.title.trim())}
                                className="text-sm font-bold text-slate-800 hover:text-indigo-600 text-left transition-colors truncate block max-w-full"
                                title={tx.title}
                              >
                                {tx.title}
                              </button>
                              {tx.createdBy === "agent" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-bold border border-indigo-200/60 shrink-0">
                                  <Bot className="w-2.5 h-2.5" /> Agent
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                              <span className="shrink-0">{tx.date.substring(11, 16)}</span>
                              <span className="shrink-0">•</span>
                              <button 
                                onClick={() => setEditingTx(tx)}
                                className="font-semibold text-slate-600 hover:text-indigo-600 bg-slate-200/60 hover:bg-indigo-50 px-1.5 py-0.2 rounded transition-colors shrink-0"
                                title="点击修改分类与标签"
                              >
                                {categories.find(c => c.id === tx.category)?.label || tx.category} ✎
                              </button>
                              {/* 标签徽标 */}
                              {(tx.tags || []).map((tg) => (
                                <button
                                  key={tg}
                                  onClick={() => handleDrilldownTag(tg)}
                                  className="px-1.5 py-0.2 rounded bg-indigo-50/90 text-indigo-600 border border-indigo-200/60 text-[10px] font-bold shrink-0 hover:bg-indigo-100"
                                >
                                  #{tg}
                                </button>
                              ))}
                              <span className="shrink-0">•</span>
                              <span className="truncate">{ACCOUNTS.find(a => a.id === tx.account)?.label || tx.account}</span>
                              {tx.note && <span className="text-slate-400 text-[11px] truncate hidden sm:inline">({tx.note})</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pl-1">
                          <div className="text-right whitespace-nowrap">
                            <span className={`text-base font-black font-mono tracking-tight ${tx.type === "expense" ? "text-slate-900" : "text-emerald-600"}`}>
                              {tx.type === "expense" ? "-" : "+"}¥{tx.amount.toFixed(2)}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteTx(tx.id)}
                            className="p-2 text-slate-300 hover:text-rose-600 transition-colors shrink-0"
                            title="删除记录"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="bg-white rounded-3xl p-12 border border-slate-200/70 text-center text-slate-400 space-y-2">
                  <p className="text-sm font-semibold">没有匹配到任何流水账单</p>
                  {(selectedCategoryDetail || selectedTag || selectedCounterparty) && (
                    <button 
                      onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); }}
                      className="text-xs text-indigo-600 underline font-bold"
                    >
                      清除所有筛选条件
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. 分类管理 Tab */}
        {activeTab === "categories" && (
          <div className="w-full bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">分类库管理</h2>
                <p className="text-xs text-slate-500">查看系统预设及自建分类，用于记账与自动归类</p>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shadow-md shadow-indigo-500/20 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>新建分类</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {categories.map((cat) => (
                <div 
                  key={cat.id}
                  onClick={() => handleDrilldownCategory(cat)}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between group hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all shadow-2xs hover:shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl border ${getCategoryBgClass(cat.id)} shadow-2xs shrink-0`}>
                      {renderCategoryIcon(cat.id, cat.color)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{cat.label}</div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap">
                        {cat.isCustom ? "自建分类" : "系统内置"}
                      </div>
                    </div>
                  </div>

                  {cat.isCustom && (
                    <button
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
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
      <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/90 backdrop-blur-xl border-t border-slate-200/70 px-4 py-3 z-30 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <button 
          onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); setActiveTab("overview"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
            activeTab === "overview" ? "text-indigo-600 font-black scale-105" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          <Wallet className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] whitespace-nowrap">资产概览</span>
        </button>

        <button 
          onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); setActiveTab("stats"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
            activeTab === "stats" ? "text-indigo-600 font-black scale-105" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          <PieChartIcon className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] whitespace-nowrap">分类统计</span>
        </button>

        <button 
          onClick={() => { setSelectedCategoryDetail(null); setSelectedTag(null); setSelectedCounterparty(null); setActiveTab("records"); }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
            activeTab === "records" ? "text-indigo-600 font-black scale-105" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] whitespace-nowrap">时间轴流水</span>
        </button>

        <button 
          onClick={() => setActiveTab("categories")}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
            activeTab === "categories" ? "text-indigo-600 font-black scale-105" : "text-slate-400 hover:text-slate-800"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
          <span className="text-[11px] whitespace-nowrap">分类库</span>
        </button>
      </footer>

      {/* 修改分类与编辑标签弹窗 */}
      {editingTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-base font-black text-slate-900 truncate">编辑账目属性</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{editingTx.title} (¥{editingTx.amount})</p>
              </div>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. 标签管理模块 */}
            <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5 text-indigo-600" /> 快捷标签 (多选)
              </span>
              
              {/* 常用候选标签 */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["服务器", "AI/API", "Apple", "闲鱼", "TokenMP", "堂食快餐", "自用"].map((tag) => {
                  const isChecked = (editingTx.tags || []).includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTagOnEditingTx(tag)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                        isChecked 
                          ? "bg-indigo-600 text-white shadow-xs scale-102" 
                          : "bg-white text-slate-600 border border-slate-200 hover:border-indigo-300"
                      }`}
                    >
                      <span>#{tag}</span>
                      {isChecked && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* 自定义新增标签 */}
              <form onSubmit={handleAddCustomTag} className="flex gap-1.5 pt-1.5">
                <input
                  type="text"
                  placeholder="新建标签 (如 #域名)..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button 
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  添加
                </button>
              </form>
            </div>

            {/* 2. 重新选择主分类 */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">切换主分类</span>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleUpdateTx(editingTx.id, cat.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      editingTx.category === cat.id
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20 scale-102"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    {renderCategoryIcon(cat.id, editingTx.category === cat.id ? "#FFFFFF" : cat.color)}
                    <span className="text-[10px] truncate w-full text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新建分类抽屉 */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900">自建新分类</h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">分类名称</label>
                <input
                  type="text"
                  placeholder="例如：宠物用品、游戏娱乐、健身等"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">收支类型</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setNewCatType("expense")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newCatType === "expense" ? "bg-rose-50 border-rose-400 text-rose-600 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    支出
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType("income")}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newCatType === "income" ? "bg-emerald-50 border-emerald-400 text-emerald-600 shadow-2xs" : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    收入
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">标识色彩</label>
                <div className="flex gap-2 mt-2">
                  {["#6366F1", "#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#EF4444", "#06B6D4"].map((c) => (
                    <div 
                      key={c}
                      onClick={() => setNewCatColor(c)}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${newCatColor === c ? "scale-125 ring-2 ring-offset-2 ring-indigo-500" : "hover:scale-110"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 active:scale-98 transition-all mt-2"
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
