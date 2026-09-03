import { NextRequest, NextResponse } from "next/server";
import { CategoryMeta, DEFAULT_CATEGORIES } from "@/lib/types";
import fs from "fs";
import path from "path";

const CATEGORIES_FILE = path.join(process.cwd(), "data", "categories.json");

let inMemoryCategories: CategoryMeta[] = DEFAULT_CATEGORIES;

function getCategoriesStore(): CategoryMeta[] {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const content = fs.readFileSync(CATEGORIES_FILE, "utf-8");
      inMemoryCategories = JSON.parse(content);
    }
    return inMemoryCategories;
  } catch {
    return inMemoryCategories;
  }
}

function saveCategoriesStore(cats: CategoryMeta[]) {
  inMemoryCategories = cats;
  try {
    const dir = path.dirname(CATEGORIES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(cats, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save categories:", e);
  }
}

export async function GET() {
  const cats = getCategoriesStore();
  return NextResponse.json({ success: true, data: cats });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { label, type = "expense", icon = "Tag", color = "#6366F1" } = body;

    if (!label || !label.trim()) {
      return NextResponse.json({ success: false, error: "分类名称不能为空" }, { status: 400 });
    }

    const cats = getCategoriesStore();
    const cleanLabel = label.trim();
    const id = `custom_${Date.now()}`;

    // 检查重复
    if (cats.some(c => c.label === cleanLabel)) {
      return NextResponse.json({ success: false, error: "该分类名称已存在" }, { status: 400 });
    }

    const newCat: CategoryMeta = {
      id,
      label: cleanLabel,
      icon,
      color,
      type,
      isCustom: true
    };

    const updated = [...cats, newCat];
    saveCategoriesStore(updated);

    return NextResponse.json({ success: true, message: "自建分类成功", data: newCat });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "缺少分类 ID" }, { status: 400 });

    const cats = getCategoriesStore();
    const target = cats.find(c => c.id === id);
    if (!target) return NextResponse.json({ success: false, error: "未找到该分类" }, { status: 404 });
    if (!target.isCustom) return NextResponse.json({ success: false, error: "系统默认分类不可删除" }, { status: 400 });

    const filtered = cats.filter(c => c.id !== id);
    saveCategoriesStore(filtered);
    return NextResponse.json({ success: true, message: "删除分类成功" });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
