# OzMoneyTracker — UX Specification

## Design Direction

### Theme
Dark theme with deep navy/charcoal tones conveying financial seriousness.
- Background primary: `#0D1117`
- Background secondary: `#161B22`
- Card surface: `#1C2128` with subtle border `#30363D`

### Color Palette
- **Primary**: Midnight Indigo `#4F46E5`
- **Accent**: Cool Cyan `#06B6D4`
- Gradient buttons: `['#4F46E5', '#06B6D4']`
- Success/income: `#10B981`
- Danger/delete: `#EF4444`
- Warning: `#F59E0B`
- Text primary: `#E6EDF3`
- Text secondary: `#8B949E`
- Text muted: `#6E7681`

### Typography
- Display font: **Outfit** (Google Fonts) — bold, 28-32px for dashboard totals
- Heading font: **Outfit SemiBold** — 20-24px
- Body font: **Inter** — 16px
- Caption: **Inter** — 12-14px, `#8B949E`

### Category Colors (for charts/pills)
- Alimentación: `#F59E0B`
- Transporte: `#3B82F6`
- Entretenimiento: `#EC4899`
- Salud: `#10B981`
- Servicios: `#8B5CF6`
- Custom categories cycle through: `#F97316`, `#06B6D4`, `#EF4444`, `#84CC16`, `#E879F9`

---

## File Structure

```
app/
  _layout.tsx              → Root layout: loads fonts, initializes SQLite DB, wraps with DatabaseProvider context, returns <Stack>
  tabs/
    _layout.tsx            → <Tabs> with 4 tabs: Dashboard, Expenses, Reports, Categories
    index.tsx              → Dashboard / Home screen (tab 1)
    expenses.tsx           → Expenses List screen (tab 2)
    reports.tsx            → Summary / Reports screen (tab 3)
    categories.tsx         → Categories screen (tab 4)
  add-expense.tsx          → Add Expense (modal-style push)
  edit-expense/
    [id]/
      index.tsx            → Edit Expense screen
  add-category.tsx         → Add Custom Category (modal-style push)
  edit-category/
    [id]/
      index.tsx            → Edit Custom Category screen
```

---

## Context / State

### DatabaseProvider
Wraps entire app. On mount:
1. Opens SQLite database `ozmoneytracker.db`
2. Runs migrations (CREATE TABLE IF NOT EXISTS for `categories`, `expenses`)
3. Seeds default categories if `categories` table is empty
4. Exposes helper functions via context: `getExpenses`, `addExpense`, `updateExpense`, `deleteExpense`, `getCategories`, `addCategory`, `updateCategory`, `deleteCategory`, `getMonthSummary`, `getCategorySummary`

All queries are async and use `expo-sqlite`'s async API.

---

## Screens

### 1. Dashboard / Home (`tabs/index.tsx`)
**Purpose**: At-a-glance monthly financial overview.

**Layout (top to bottom)**:
- **Header**: App name "OzMoneyTracker" in Outfit Bold 24px, current month/year displayed below in secondary text
- **Month Selector**: Horizontal row with left/right chevron arrows and "March 2025" label. Tapping arrows changes the viewed month.
- **Total Card**: Large glass-effect card showing:
  - Label: "Total Spent" in caption
  - Amount: e.g. "$1,245.80" in Outfit Bold 32px, white
  - Subtitle: "X expenses this month" in muted text
- **Category Breakdown**: Section heading "By Category". List of horizontal bar items, each showing:
  - Category color dot + category name
  - Horizontal progress bar (proportional to total)
  - Dollar amount on the right
  - Only categories with expenses > $0 shown; sorted descending by amount
- **Recent Expenses**: Section heading "Recent" with "See All →" link (navigates to Expenses tab). Shows last 5 expenses for the selected month as compact list items:
  - Category color dot, expense name, date on right, amount on far right bold

**User Actions**:
- Tap left/right arrows → change month
- Tap "See All →" → switch to Expenses tab
- Tap any recent expense → push to `edit-expense/[id]`
- Tap FAB (floating action button, bottom-right, gradient) → push to `add-expense`

---

### 2. Expenses List (`tabs/expenses.tsx`)
**Purpose**: Full scrollable list of expenses with month filtering.

**Layout**:
- **Header**: "Expenses" heading
- **Month Filter**: Same month selector as Dashboard (arrows + month/year label)
- **Expense List** (`@shopify/flash-list`):
  - Each row: category color dot, expense name (body), category name (caption below), date on right (caption), amount on far right (bold body)
  - Swipe left on a row reveals red "Delete" action
  - Tap a row → push to `edit-expense/[id]`
- **Empty State**: When no expenses for selected month — illustration placeholder, "No expenses for [Month Year]" message, "Add Expense" button
- **FAB**: Same gradient FAB → push to `add-expense`

**User Actions**:
- Swipe left → delete with confirmation alert ("Delete this expense?")
- Tap row → push to edit
- Tap FAB → push to add
- Change month filter

---

### 3. Add Expense (`add-expense.tsx`)
**Purpose**: Form to create a new expense.

**Layout**:
- **Header**: "Add Expense" with back arrow (pop)
- **Form fields** (vertical, 16px spacing):
  - **Name**: Text input, floating label "Expense Name", required, max 100 chars
  - **Amount**: Numeric input, floating label "Amount ($)", required, prefix "$", decimal keyboard
  - **Category**: Dropdown/bottom-sheet picker showing all categories (default + custom) with color dots. Required.
  - **Date**: Date picker, defaults to today. Tapping opens native date picker or a calendar bottom sheet.
- **Save Button**: Full-width gradient button "Save Expense". Disabled until all required fields valid.
- Validation: name non-empty, amount > 0, category selected

**User Actions**:
- Fill form → tap Save → expense inserted into SQLite → pop back to previous screen
- Tap back arrow → pop (discard)

---

### 4. Edit Expense (`edit-expense/[id]/index.tsx`)
**Purpose**: Edit an existing expense.

**Layout**: Identical to Add Expense but:
- Header: "Edit Expense"
- Fields pre-populated with existing values
- Save button text: "Update Expense"
- Additional "Delete" button (red outline) at bottom

**User Actions**:
- Edit fields → tap Update → SQLite update → pop back
- Tap Delete → confirmation alert → SQLite delete → pop back
- Tap back → pop (discard changes)

---

### 5. Categories (`tabs/categories.tsx`)
**Purpose**: View and manage expense categories.

**Layout**:
- **Header**: "Categories"
- **Default Categories Section**: Section heading "Default". List of default categories, each showing:
  - Color dot, category name, lock icon indicating non-editable
  - No swipe actions, not tappable for edit
- **Custom Categories Section**: Section heading "Custom". List of user-created categories:
  - Color dot, category name
  - Swipe left reveals red "Delete" action
  - Tap row → push to `edit-category/[id]`
- **Empty Custom State**: "No custom categories yet"
- **Add Button**: Full-width outline button at bottom "+ Add Category" → push to `add-category`

**User Actions**:
- Tap custom category → push to edit
- Swipe left on custom → delete with confirmation (if category has expenses, show warning: "X expenses use this category. They will be moved to 'Otros'." — actually, block deletion if expenses exist, show alert "Cannot delete: X expenses use this category. Reassign them first.")
- Tap Add → push to add-category

---

### 6. Add Category (`add-category.tsx`)
**Purpose**: Create a custom category.

**Layout**:
- **Header**: "New Category" with back arrow
- **Form**:
  - **Name**: Text input, floating label "Category Name", required, max 50 chars
  - **Color Picker**: Grid of 10 preset color swatches. Tap to select. Required.
- **Save Button**: Gradient, "Save Category"

**User Actions**:
- Fill → Save → insert into SQLite → pop back
- Back → discard

---

### 7. Edit Category (`edit-category/[id]/index.tsx`)
**Purpose**: Edit a custom category.

**Layout**: Same as Add Category but pre-populated. Header: "Edit Category". Button: "Update Category". Additional red "Delete" button (same deletion rules as Categories screen).

---

### 8. Summary / Reports (`tabs/reports.tsx`)
**Purpose**: Visual spending reports.

**Layout**:
- **Header**: "Reports"
- **Month Selector**: Same arrows + month/year pattern
- **Monthly Total Card**: Glass card with total for selected month
- **Category Breakdown Chart**: Horizontal bar chart or proportional segmented bar showing spending per category with colors, labels, and amounts. Each bar shows category name, colored bar proportional to spend, dollar amount.
- **Monthly Trend**: Section showing last 6 months as a simple vertical list:
  - Month name, total amount, small horizontal bar proportional to max month
  - Highlights current selected month
- **Top Expenses**: "Top 5 Expenses" list for selected month, sorted by amount descending. Each: name, category pill, amount.

**User Actions**:
- Change month with arrows
- Tap on a category bar → no action (static display)
- Tap on a month in the trend list → updates the selected month across the screen

---

## Navigation

### Structure
- **Root**: `<Stack>` with `app/_layout.tsx`
  - `tabs` → `<Tabs>` layout with 4 tabs
  - `add-expense` → Stack push (modal presentation)
  - `edit-expense/[id]` → Stack push
  - `add-category` → Stack push (modal presentation)
  - `edit-category/[id]` → Stack push

### Tab Bar
- 4 tabs: Dashboard (icon: `home`), Expenses (icon: `receipt`), Reports (icon: `chart-bar`), Categories (icon: `tag`)
- Tab bar background: `#161B22` with top border `#30363D`
- Active tab: primary color `#4F46E5`, inactive: `#6E7681`
- Tab labels shown below icons, caption size

### No auth needed — app launches directly into tabs.

---

## Animation & Motion

- **Screen transitions**: Slide from right for push, slide down for modal-style (add-expense, add-category)
- **FAB**: Scale-in on mount with spring animation
- **List items**: Staggered fade-in on load
- **Cards**: Subtle fade-in on data load
- **Button press**: Scale 0.97 with spring + light haptic
- **Swipe delete**: Smooth reveal with red background
- **Loading**: Skeleton shimmer on Dashboard cards while SQLite queries resolve
- **Month change**: Cross-fade on data transition
- **Respect reduced motion**: Check `AccessibilityInfo` and disable animations accordingly

## Component Standards
- 8pt spacing grid
- Border radius: cards 16px, buttons 12px, inputs 12px, pills 20px
- Touch targets: minimum 44pt
- Accessibility labels on all interactive elements
- All currency formatted as `$X,XXX.XX`
