import { NextRequest, NextResponse } from "next/server";
import { getTransactions, addTransaction, deleteTransaction, saveTransactions } from "@/lib/store";
import { Category, AccountType, TransactionType } from "@/lib/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const type = searchParams.get("type");
    const category = searchParams.get("category");

    let txs = await getTransactions();

    if (month && month !== "all") {
      txs = txs.filter(t => t.date.startsWith(month));
    }
    if (type && type !== "all") {
      txs = txs.filter(t => t.type === type);
    }
    if (category) {
      txs = txs.filter(t => t.category === category);
    }

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, category } = body;
    if (!id || !category) {
      return NextResponse.json({ success: false, error: "缺少 id 或 category" }, { status: 400 });
    }

    const txs = await getTransactions();
    const target = txs.find(t => t.id === id);
    if (!target) {
      return NextResponse.json({ success: false, error: "未找到对应账目" }, { status: 404 });
    }

    target.category = category;
    await saveTransactions(txs);

    return NextResponse.json({ success: true, message: "分类更新成功", data: target });
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
