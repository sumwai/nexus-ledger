import { NextRequest, NextResponse } from "next/server";
import { getTransactions, addTransaction, deleteTransaction } from "@/lib/store";
import { Category, AccountType, TransactionType } from "@/lib/types";

// 通用认证检查（用于保护 Agent API 或外部访问）
function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const apiKeyHeader = req.headers.get("x-api-key");
  const expectedKey = process.env.LEDGER_API_KEY || "nexus-ledger-secret";

  if (apiKeyHeader === expectedKey) return true;
  if (authHeader && authHeader.replace("Bearer ", "").trim() === expectedKey) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month"); // e.g. "2026-09"
    const type = searchParams.get("type");   // "income" | "expense"
    const category = searchParams.get("category");

    let txs = await getTransactions();

    if (month) {
      txs = txs.filter(t => t.date.startsWith(month));
    }
    if (type) {
      txs = txs.filter(t => t.type === type);
    }
    if (category) {
      txs = txs.filter(t => t.category === category);
    }

    // 统计数据
    const totalIncome = txs
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = txs
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        count: txs.length,
        items: txs
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, type = "expense", category = "other", account = "wechat", title, note = "", date, source = "web" } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "金额必须是大于 0 的有效数字" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ success: false, error: "标题或账目说明不能为空" }, { status: 400 });
    }

    // 格式化时间
    const now = new Date();
    const formattedDate = date || now.toISOString().replace("T", " ").substring(0, 19);

    const newTx = await addTransaction({
      amount: Number(amount),
      type: type as TransactionType,
      category: category as Category,
      account: account as AccountType,
      title,
      note,
      date: formattedDate,
      createdBy: source === "agent" ? "agent" : "user"
    });

    return NextResponse.json({
      success: true,
      message: "记账成功",
      data: newTx
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "缺少账目 ID" }, { status: 400 });
    }
    const ok = await deleteTransaction(id);
    return NextResponse.json({ success: ok, message: ok ? "已删除" : "未找到对应账目" });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
