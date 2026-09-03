import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type TransactionType = "expense" | "income";

export type Category = 
  | "food"         // 餐饮美食
  | "shopping"     // 日用百货/购物
  | "transport"    // 交通出行
  | "housing"      // 住房物业
  | "entertainment"// 休闲娱乐
  | "medical"      // 医疗健康
  | "digital"      // 数码数码
  | "education"    // 学习进修
  | "salary"       // 工资收入
  | "bonus"        // 奖金分红
  | "invest"       // 理财收益
  | "other";       // 其它收支

export type AccountType = 
  | "wechat"       // 微信零钱/零钱通
  | "alipay"       // 支付宝
  | "bank_debit"   // 储蓄卡
  | "bank_credit"  // 信用卡
  | "cash";        // 现金

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  account: AccountType;
  title: string;
  note?: string;
  date: string; // YYYY-MM-DD HH:mm:ss
  createdAt: string;
  createdBy: "user" | "agent";
}

export interface CategoryMeta {
  id: Category;
  label: string;
  icon: string;
  color: string;
  type: TransactionType | "both";
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "food", label: "餐饮美食", icon: "Utensils", color: "#F59E0B", type: "expense" },
  { id: "shopping", label: "购物日用", icon: "ShoppingBag", color: "#EC4899", type: "expense" },
  { id: "transport", label: "交通出行", icon: "Car", color: "#3B82F6", type: "expense" },
  { id: "housing", label: "住房缴费", icon: "Home", color: "#8B5CF6", type: "expense" },
  { id: "entertainment", label: "休闲娱乐", icon: "Gamepad2", color: "#10B981", type: "expense" },
  { id: "digital", label: "数码数码", icon: "Smartphone", color: "#6366F1", type: "expense" },
  { id: "medical", label: "医疗健康", icon: "HeartPulse", color: "#EF4444", type: "expense" },
  { id: "education", label: "学习培训", icon: "GraduationCap", color: "#06B6D4", type: "expense" },
  { id: "salary", label: "工资薪水", icon: "Wallet", color: "#10B981", type: "income" },
  { id: "bonus", label: "奖金补贴", icon: "Gift", color: "#F59E0B", type: "income" },
  { id: "invest", label: "理财分红", icon: "TrendingUp", color: "#3B82F6", type: "income" },
  { id: "other", label: "其它款项", icon: "MoreHorizontal", color: "#64748B", type: "both" },
];

export const ACCOUNTS: { id: AccountType; label: string; icon: string; balanceHint?: string }[] = [
  { id: "wechat", label: "微信支付", icon: "MessageCircle" },
  { id: "alipay", label: "支付宝", icon: "CreditCard" },
  { id: "bank_debit", label: "储蓄卡", icon: "Building2" },
  { id: "bank_credit", label: "信用卡", icon: "CreditCard" },
  { id: "cash", label: "现金", icon: "Coins" },
];
