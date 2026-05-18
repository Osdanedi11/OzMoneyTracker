# OzMoneyTracker — Local SQLite Database Schema

Database file: `ozmoneytracker.db` (opened via `expo-sqlite`)

## Tables

### categories

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL, UNIQUE |
| color | TEXT | NOT NULL (hex color string e.g. '#F59E0B') |
| isDefault | INTEGER | NOT NULL, DEFAULT 0 (0 = custom, 1 = default; SQLite has no boolean) |
| createdAt | TEXT | NOT NULL, DEFAULT (datetime('now')) — ISO8601 string |

**Seed data** (inserted on first launch when table is empty):

| name | color | isDefault |
|---|---|---|
| Alimentación | #F59E0B | 1 |
| Transporte | #3B82F6 | 1 |
| Entretenimiento | #EC4899 | 1 |
| Salud | #10B981 | 1 |
| Servicios | #8B5CF6 | 1 |

**Indexes**:
- `idx_categories_isDefault` on `isDefault` (for filtering default vs custom)

---

### expenses

| Column | Type | Constraints |
|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL, max 100 chars (enforced in app) |
| amount | REAL | NOT NULL, must be > 0 (enforced in app) |
| categoryId | INTEGER | NOT NULL, FOREIGN KEY REFERENCES categories(id) ON DELETE RESTRICT |
| date | TEXT | NOT NULL — stored as ISO8601 date string 'YYYY-MM-DD' |
| createdAt | TEXT | NOT NULL, DEFAULT (datetime('now')) — ISO8601 string |
| updatedAt | TEXT | NOT NULL, DEFAULT (datetime('now')) — ISO8601 string |

**Indexes**:
- `idx_expenses_date` on `date` DESC (primary sort/filter column)
- `idx_expenses_categoryId` on `categoryId` (for joins and category summaries)
- `idx_expenses_date_categoryId` on `(date, categoryId)` (for monthly category aggregations)

**ON DELETE RESTRICT** on categoryId ensures a category cannot be deleted while expenses reference it. The app UI enforces this by checking expense count before allowing category deletion.

---

## Key Queries (for DatabaseProvider implementation reference)

### Get expenses for a month
```sql
SELECT e.*, c.name AS categoryName, c.color AS categoryColor
FROM expenses e
JOIN categories c ON e.categoryId = c.id
WHERE e.date >= ? AND e.date < ?
ORDER BY e.date DESC, e.createdAt DESC
```
Parameters: first day of month ('2025-03-01'), first day of next month ('2025-04-01')

### Get category summary for a month
```sql
SELECT c.id, c.name, c.color, COALESCE(SUM(e.amount), 0) AS total, COUNT(e.id) AS count
FROM categories c
LEFT JOIN expenses e ON e.categoryId = c.id AND e.date >= ? AND e.date < ?
GROUP BY c.id
HAVING total > 0
ORDER BY total DESC
```

### Get monthly totals (last 6 months)
```sql
SELECT strftime('%Y-%m', e.date) AS month, SUM(e.amount) AS total, COUNT(e.id) AS count
FROM expenses e
WHERE e.date >= ?
GROUP BY month
ORDER BY month DESC
```
Parameter: date 6 months ago

### Get month total
```sql
SELECT COALESCE(SUM(amount), 0) AS total, COUNT(id) AS count
FROM expenses
WHERE date >= ? AND date < ?
```

### Get top 5 expenses for a month
```sql
SELECT e.*, c.name AS categoryName, c.color AS categoryColor
FROM expenses e
JOIN categories c ON e.categoryId = c.id
WHERE e.date >= ? AND e.date < ?
ORDER BY e.amount DESC
LIMIT 5
```

### Check if category has expenses (before deletion)
```sql
SELECT COUNT(id) AS count FROM expenses WHERE categoryId = ?
```

### Insert expense
```sql
INSERT INTO expenses (name, amount, categoryId, date, createdAt, updatedAt)
VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
```

### Update expense
```sql
UPDATE expenses SET name = ?, amount = ?, categoryId = ?, date = ?, updatedAt = datetime('now')
WHERE id = ?
```

### Delete expense
```sql
DELETE FROM expenses WHERE id = ?
```

---

## Migration Strategy

In `DatabaseProvider` on mount:
1. `db.execAsync('PRAGMA journal_mode = WAL;')` — for better concurrent read performance
2. `db.execAsync('PRAGMA foreign_keys = ON;')` — enforce FK constraints
3. Run CREATE TABLE IF NOT EXISTS for both tables
4. Run CREATE INDEX IF NOT EXISTS for all indexes
5. Check if categories table is empty → if so, insert seed data

All operations use the async API from `expo-sqlite`.
