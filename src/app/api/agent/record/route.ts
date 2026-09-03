import { NextRequest, NextResponse } from "next/server";
import { addTransaction, getTransactions } from "@/lib/store";
import { Category, AccountType, TransactionType } from "@/lib/types";

// 辅助启发式分类器（备用逻辑）
function inferCategory(text: string): { category: Category; type: TransactionType } {
  const t = text.toLowerCase();
  if (t.includes("工资") || t.includes("薪水") || t.includes("收入") || t.includes("兼职")) return { category: "salary", type: "income" };
  if (t.includes("奖金") || t.includes("补贴") || t.includes("红包")) return { category: "bonus", type: "income" };
  if (t.includes("理财") || t.includes("基金") || t.includes("股票") || t.includes("收益") || t.includes("利息")) return { category: "invest", type: "income" };

  if (t.includes("饭") || t.includes("餐") || t.includes("吃") || t.includes("外卖") || t.includes("咖啡") || t.includes("茶") || t.includes("肯德基") || t.includes("麦当劳")) return { category: "food", type: "expense" };
  if (t.includes("打车") || t.includes("车费") || t.includes("地铁") || t.includes("公交") || t.includes("加油") || t.includes("高铁") || t.includes("机票") || t.includes("滴滴")) return { category: "transport", type: "expense" };
  if (t.includes("买") || t.includes("购物") || t.includes("淘宝") || t.includes("京东") || t.includes("衣服") || t.includes("鞋")) return { category: "shopping", type: "expense" };
  if (t.includes("房租") || t.includes("物业") || t.includes("水电") || t.includes("电费") || t.includes("水费") || t.includes("燃气")) return { category: "housing", type: "expense" };
  if (t.includes("电影") || t.includes("游戏") || t.includes("玩") || t.includes("门票") || t.includes("旅游")) return { category: "entertainment", type: "expense" };
  if (t.includes("手机") || t.includes("电脑") || t.includes("数码") || t.includes("耳机") || t.includes("键盘")) return { category: "digital", type: "expense" };
  if (t.includes("药") || t.includes("医院") || t.includes("体检") || t.includes("看病")) return { category: "medical", type: "expense" };
  if (t.includes("课") || t.includes("学费") || t.includes("书") || t.includes("考试")) return { category: "education", type: "expense" };

  return { category: "other", type: "expense" };
}

function inferAccount(text: string): AccountType {
  const t = text.toLowerCase();
  if (t.includes("微信") || t.includes("零钱")) return "wechat";
  if (t.includes("支付宝") || t.includes("花呗")) return "alipay";
  if (t.includes("信用卡")) return "bank_credit";
  if (t.includes("银行卡") || t.includes("储蓄卡") || t.includes("招行") || t.includes("建行") || t.includes("工行") || t.includes("农行")) return "bank_debit";
  if (t.includes("现金")) return "cash";
  return "wechat";
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const apiKey = req.headers.get("x-api-key");
    const secret = process.env.LEDGER_API_KEY || "nexus-ledger-secret";

    // 校验秘钥（如果有提供配置）
    if (apiKey && apiKey !== secret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 格式 1：结构化输入（Agent 已经解析好字段）
    if (body.amount && body.title) {
      const tx = await addTransaction({
        amount: Number(body.amount),
        type: body.type || "expense",
        category: body.category || "other",
        account: body.account || "wechat",
        title: body.title,
        note: body.note || "",
        date: body.date || new Date().toISOString().replace("T", " ").substring(0, 19),
        createdBy: "agent"
      });
      return NextResponse.json({
        success: true,
        message: `✅ Agent 记账成功：【${tx.title}】 ${tx.type === "expense" ? "-" : "+"}${tx.amount} 元`,
        data: tx
      });
    }

    // 格式 2：自然语言输入（如 "中午吃黄焖鸡花了 26 微信支付"）
    if (body.prompt || body.message || body.text) {
      const rawText: string = body.prompt || body.message || body.text;
      
      // 提取金额（匹配数字，支持小数）
      const amountMatch = rawText.match(/(\d+(?:\.\d+)?)\s*(?:元|块|rmb|¥)?/i);
      if (!amountMatch) {
        return NextResponse.json({ 
          success: false, 
          error: "无法识别记账金额，请在消息中包含具体数字（例如：午饭 25 元）" 
        }, { status: 400 });
      }

      const amount = parseFloat(amountMatch[1]);
      const { category, type } = inferCategory(rawText);
      const account = inferAccount(rawText);

      // 清理出标题（提取关键词）
      let title = rawText
        .replace(/(\d+(?:\.\d+)?)\s*(?:元|块|rmb|¥)?/gi, "")
        .replace(/(微信支付|支付宝|银行卡|信用卡|现金|花呗)/g, "")
        .replace(/(记一笔|帮我记|记账|花了|消费了|买了)/g, "")
        .trim();
      
      if (!title) title = "日常支出";

      const tx = await addTransaction({
        amount,
        type,
        category,
        account,
        title,
        note: `微信自然语言录入: "${rawText}"`,
        date: new Date().toISOString().replace("T", " ").substring(0, 19),
        createdBy: "agent"
      });

      return NextResponse.json({
        success: true,
        message: `✅ 智能记账成功！\n- 账目：${tx.title}\n- 金额：${tx.type === "expense" ? "-" : "+"}${tx.amount} 元\n- 分类：${tx.category}\n- 账户：${tx.account}`,
        data: tx
      });
    }

    return NextResponse.json({ success: false, error: "缺少参数 (amount+title 或 message)" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
