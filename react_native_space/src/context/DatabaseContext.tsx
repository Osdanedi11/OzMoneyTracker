import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as db from '../db/database';
import type { Category, ExpenseWithCategory, CategorySummary, MonthlyTotal } from '../types';

interface DatabaseContextType {
  isReady: boolean;
  categories: Category[];
  refreshCategories: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  updateCategory: (id: number, name: string, color: string) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;
  getCategoryExpenseCount: (categoryId: number) => Promise<number>;
  getCategoryById: (id: number) => Promise<Category | null>;
  getExpensesForMonth: (start: string, end: string) => Promise<ExpenseWithCategory[]>;
  getRecentExpenses: (start: string, end: string, limit?: number) => Promise<ExpenseWithCategory[]>;
  getMonthTotal: (start: string, end: string) => Promise<{ total: number; count: number }>;
  getCategorySummary: (start: string, end: string) => Promise<CategorySummary[]>;
  getMonthlyTotals: (sinceDate: string) => Promise<MonthlyTotal[]>;
  getTopExpenses: (start: string, end: string, limit?: number) => Promise<ExpenseWithCategory[]>;
  addExpense: (name: string, amount: number, categoryId: number, date: string) => Promise<void>;
  updateExpense: (id: number, name: string, amount: number, categoryId: number, date: string) => Promise<void>;
  deleteExpense: (id: number) => Promise<void>;
  getExpenseById: (id: number) => Promise<ExpenseWithCategory | null>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        await db.initDatabase();
        const cats = await db.getCategories();
        setCategories(cats);
        setIsReady(true);
      } catch (e) {
        console.error('Database init failed:', e);
        setIsReady(true);
      }
    })();
  }, []);

  const refreshCategories = useCallback(async () => {
    const cats = await db.getCategories();
    setCategories(cats);
  }, []);

  const addCategory = useCallback(async (name: string, color: string) => {
    await db.addCategory(name, color);
    await refreshCategories();
  }, [refreshCategories]);

  const updateCategory = useCallback(async (id: number, name: string, color: string) => {
    await db.updateCategory(id, name, color);
    await refreshCategories();
  }, [refreshCategories]);

  const deleteCategory = useCallback(async (id: number) => {
    await db.deleteCategory(id);
    await refreshCategories();
  }, [refreshCategories]);

  const value: DatabaseContextType = {
    isReady,
    categories,
    refreshCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryExpenseCount: db.getCategoryExpenseCount,
    getCategoryById: db.getCategoryById,
    getExpensesForMonth: db.getExpensesForMonth,
    getRecentExpenses: db.getRecentExpenses,
    getMonthTotal: db.getMonthTotal,
    getCategorySummary: db.getCategorySummary,
    getMonthlyTotals: db.getMonthlyTotals,
    getTopExpenses: db.getTopExpenses,
    addExpense: db.addExpense,
    updateExpense: db.updateExpense,
    deleteExpense: db.deleteExpense,
    getExpenseById: db.getExpenseById,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error('useDatabase must be used within DatabaseProvider');
  return ctx;
}
