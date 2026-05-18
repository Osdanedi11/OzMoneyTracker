import * as SQLite from 'expo-sqlite';
import type { Category, ExpenseWithCategory, CategorySummary, MonthlyTotal } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('ozmoneytracker.db');
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getDb();

  await database.execAsync('PRAGMA journal_mode = WAL;');
  await database.execAsync('PRAGMA foreign_keys = ON;');

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      isDefault INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      categoryId INTEGER NOT NULL,
      date TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_categories_isDefault ON categories(isDefault);');
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);');
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_categoryId ON expenses(categoryId);');
  await database.execAsync('CREATE INDEX IF NOT EXISTS idx_expenses_date_categoryId ON expenses(date, categoryId);');

  // Seed default categories
  const count = await database.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM categories;');
  if ((count?.cnt ?? 0) === 0) {
    const defaults = [
      { name: 'Alimentación', color: '#F59E0B' },
      { name: 'Transporte', color: '#3B82F6' },
      { name: 'Entretenimiento', color: '#EC4899' },
      { name: 'Salud', color: '#10B981' },
      { name: 'Servicios', color: '#8B5CF6' },
    ];
    for (const cat of defaults) {
      await database.runAsync(
        'INSERT INTO categories (name, color, isDefault) VALUES (?, ?, 1);',
        [cat.name, cat.color]
      );
    }
  }
}

// --- Categories ---
export async function getCategories(): Promise<Category[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<Category>('SELECT * FROM categories ORDER BY isDefault DESC, name ASC;');
  return rows ?? [];
}

export async function addCategory(name: string, color: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('INSERT INTO categories (name, color, isDefault) VALUES (?, ?, 0);', [name, color]);
}

export async function updateCategory(id: number, name: string, color: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE categories SET name = ?, color = ? WHERE id = ? AND isDefault = 0;', [name, color, id]);
}

export async function deleteCategory(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM categories WHERE id = ? AND isDefault = 0;', [id]);
}

export async function getCategoryExpenseCount(categoryId: number): Promise<number> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(id) as count FROM expenses WHERE categoryId = ?;', [categoryId]);
  return result?.count ?? 0;
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const database = await getDb();
  const result = await database.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?;', [id]);
  return result ?? null;
}

// --- Expenses ---
export async function getExpensesForMonth(startDate: string, endDate: string): Promise<ExpenseWithCategory[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name AS categoryName, c.color AS categoryColor
     FROM expenses e
     JOIN categories c ON e.categoryId = c.id
     WHERE e.date >= ? AND e.date < ?
     ORDER BY e.date DESC, e.createdAt DESC;`,
    [startDate, endDate]
  );
  return rows ?? [];
}

export async function getRecentExpenses(startDate: string, endDate: string, limit: number = 5): Promise<ExpenseWithCategory[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name AS categoryName, c.color AS categoryColor
     FROM expenses e
     JOIN categories c ON e.categoryId = c.id
     WHERE e.date >= ? AND e.date < ?
     ORDER BY e.date DESC, e.createdAt DESC
     LIMIT ?;`,
    [startDate, endDate, limit]
  );
  return rows ?? [];
}

export async function getMonthTotal(startDate: string, endDate: string): Promise<{ total: number; count: number }> {
  const database = await getDb();
  const result = await database.getFirstAsync<{ total: number; count: number }>(
    'SELECT COALESCE(SUM(amount), 0) AS total, COUNT(id) AS count FROM expenses WHERE date >= ? AND date < ?;',
    [startDate, endDate]
  );
  return { total: result?.total ?? 0, count: result?.count ?? 0 };
}

export async function getCategorySummary(startDate: string, endDate: string): Promise<CategorySummary[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<CategorySummary>(
    `SELECT c.id, c.name, c.color, COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
     FROM categories c
     LEFT JOIN expenses e ON e.categoryId = c.id AND e.date >= ? AND e.date < ?
     GROUP BY c.id
     HAVING total > 0
     ORDER BY total DESC;`,
    [startDate, endDate]
  );
  return rows ?? [];
}

export async function getMonthlyTotals(sinceDate: string): Promise<MonthlyTotal[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<MonthlyTotal>(
    `SELECT strftime('%Y-%m', e.date) AS month, SUM(e.amount) AS total, COUNT(e.id) AS count
     FROM expenses e
     WHERE e.date >= ?
     GROUP BY month
     ORDER BY month DESC;`,
    [sinceDate]
  );
  return rows ?? [];
}

export async function getTopExpenses(startDate: string, endDate: string, limit: number = 5): Promise<ExpenseWithCategory[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name AS categoryName, c.color AS categoryColor
     FROM expenses e
     JOIN categories c ON e.categoryId = c.id
     WHERE e.date >= ? AND e.date < ?
     ORDER BY e.amount DESC
     LIMIT ?;`,
    [startDate, endDate, limit]
  );
  return rows ?? [];
}

export async function addExpense(name: string, amount: number, categoryId: number, date: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO expenses (name, amount, categoryId, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'));',
    [name, amount, categoryId, date]
  );
}

export async function updateExpense(id: number, name: string, amount: number, categoryId: number, date: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE expenses SET name = ?, amount = ?, categoryId = ?, date = ?, updatedAt = datetime(\'now\') WHERE id = ?;',
    [name, amount, categoryId, date, id]
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
}

export async function getExpenseById(id: number): Promise<ExpenseWithCategory | null> {
  const database = await getDb();
  const result = await database.getFirstAsync<ExpenseWithCategory>(
    `SELECT e.*, c.name AS categoryName, c.color AS categoryColor
     FROM expenses e
     JOIN categories c ON e.categoryId = c.id
     WHERE e.id = ?;`,
    [id]
  );
  return result ?? null;
}
