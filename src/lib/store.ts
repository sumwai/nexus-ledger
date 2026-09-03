import { Transaction } from "./types";
import fs from "fs";
import path from "path";
import seedTransactions from "./transactions-seed.json";

const DATA_FILE = path.join(process.cwd(), "data", "transactions.json");

// 内存单例缓存（适配 Serverless 环境）
let inMemoryStore: Transaction[] = seedTransactions as Transaction[];

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      inMemoryStore = JSON.parse(data);
    }
    return inMemoryStore;
  } catch (error) {
    console.error("Failed to read transactions from disk, using memory store:", error);
    return inMemoryStore;
  }
}

export async function saveTransactions(txs: Transaction[]): Promise<boolean> {
  inMemoryStore = txs;
  try {
    ensureDirectoryExistence(DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(txs, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to save transactions to disk:", error);
    return true; // 内存已更新
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
