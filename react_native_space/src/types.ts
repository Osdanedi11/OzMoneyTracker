export interface Category {
  id: number;
  name: string;
  color: string;
  isDefault: number;
  createdAt: string;
}

export interface Expense {
  id: number;
  name: string;
  amount: number;
  categoryId: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseWithCategory extends Expense {
  categoryName: string;
  categoryColor: string;
}

export interface CategorySummary {
  id: number;
  name: string;
  color: string;
  total: number;
  count: number;
}

export interface MonthlyTotal {
  month: string;
  total: number;
  count: number;
}
