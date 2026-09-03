import { Transaction } from "./types";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "data", "transactions.json");

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "tx-init-1",
    type: "income",
    amount: 18500,
    category: "salary",
    account: "bank_debit",
    title: "9月基本工资",
    note: "税后到账",
    date: "2026-09-01 10:00:00",
    createdAt: new Date().toISOString(),
    createdBy: "user"
  },
  {
    id: "tx-init-2",
    type: "expense",
    amount: 42.5,
    category: "food",
    account: "wechat",
    title: "午餐煲仔饭",
    note: "台州特色小吃",
    date: "2026-09-02 12:30:00",
    createdAt: new Date().toISOString(),
    createdBy: "agent"
  },
  {
    id: "tx-init-3",
    type: "expense",
    amount: 28,
    category: "transport",
    account: "alipay",
    title: "网约车出行",
    note: "台州市区出行",
    date: "2026-09-02 18:40:00",
    createdAt: new Date().toISOString(),
    createdBy: "agent"
  },
  {
    id: "tx-init-4",
    type: "expense",
    amount: 199,
    category: "shopping",
    account: "wechat",
    title: "优衣库日用T恤",
    note: "换季衣物",
    date: "2026-09-03 14:15:00",
    createdAt: new Date().toISOString(),
    createdBy: "user"
  },
  {
    id: "tx-init-5",
    type: "expense",
    amount: 15,
    category: "food",
    account: "wechat",
    title: "冰美式咖啡",
    note: "下午提神",
    date: "2026-09-03 15:30:00",
    createdAt: new Date().toISOString(),
    createdBy: "agent"
  }
];

export async function getTransactions(): Promise<Transaction[]> {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      ensureDirectoryExistence(DATA_FILE);
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_TRANSACTIONS, null, 2), "utf-8");
      return INITIAL_TRANSACTIONS;
    }
    const data = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to read transactions:", error);
    return INITIAL_TRANSACTIONS;
  }
}

export async function saveTransactions(txs: Transaction[]): Promise<boolean> {
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(txs, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save transactions:", error);
    return false;
  }
}

export async function addTransaction(tx: Omit<Transaction, "id" | "createdAt"> & { id?: string }): Promise<Transaction> {
  const current = await getTransactions();
  const newTx: Transaction = {
    ...tx,
    id: tx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString()
  };
  const updated = [newTx, ...current];
  await saveTransactions(updated);
  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const current = await getTransactions();
  const filtered = current.filter(t => t.id !== id);
  if (filtered.length === current.length) return false;
  return await saveTransactions(filtered);
}
