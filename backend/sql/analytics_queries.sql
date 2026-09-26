-- ============================================
-- SmartSpend SQL Analytics Queries
-- ============================================


-- 1. Overall Expense Statistics
SELECT
    COUNT(*) AS expense_count,
    COALESCE(SUM(amount), 0) AS total_spent,
    COALESCE(AVG(amount), 0) AS average_expense,
    COALESCE(MAX(amount), 0) AS highest_expense,
    COALESCE(MIN(amount), 0) AS lowest_expense
FROM expenses;


-- 2. Category-wise Spending
SELECT
    category,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_spent,
    ROUND(
        (SUM(amount) * 100.0) /
        NULLIF((SELECT SUM(amount) FROM expenses), 0),
        2
    ) AS percentage
FROM expenses
GROUP BY category
ORDER BY total_spent DESC;


-- 3. Daily Spending Trend
SELECT
    date,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_spent
FROM expenses
GROUP BY date
ORDER BY date ASC;


-- 4. Monthly Spending
SELECT
    strftime('%Y-%m', date) AS month,
    COUNT(*) AS expense_count,
    SUM(amount) AS total_spent,
    AVG(amount) AS average_expense
FROM expenses
GROUP BY strftime('%Y-%m', date)
ORDER BY month ASC;


-- 5. Top 5 Individual Expenses
SELECT
    id,
    name,
    amount,
    category,
    date
FROM expenses
ORDER BY amount DESC
LIMIT 5;


-- 6. Highest Spending Category
SELECT
    category,
    SUM(amount) AS total_spent
FROM expenses
GROUP BY category
ORDER BY total_spent DESC
LIMIT 1;