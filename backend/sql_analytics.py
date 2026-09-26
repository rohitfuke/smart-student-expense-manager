from sqlalchemy import text
from sqlalchemy.orm import Session


def get_sql_analytics(db: Session):
    # =========================
    # 1. Overall Statistics
    # =========================

    overall_query = text("""
        SELECT
            COUNT(*) AS expense_count,
            COALESCE(SUM(amount), 0) AS total_spent,
            COALESCE(AVG(amount), 0) AS average_expense,
            COALESCE(MAX(amount), 0) AS highest_expense,
            COALESCE(MIN(amount), 0) AS lowest_expense
        FROM expenses
    """)

    overall_result = db.execute(overall_query).mappings().one()

    # =========================
    # 2. Category-wise Spending
    # =========================

    category_query = text("""
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
        ORDER BY total_spent DESC
    """)

    category_results = db.execute(category_query).mappings().all()

    category_spending = [
        {
            "category": row["category"],
            "expense_count": int(row["expense_count"]),
            "total_spent": float(row["total_spent"]),
            "percentage": float(row["percentage"] or 0),
        }
        for row in category_results
    ]

    # =========================
    # 3. Daily Spending
    # =========================

    daily_query = text("""
        SELECT
            date,
            COUNT(*) AS expense_count,
            SUM(amount) AS total_spent
        FROM expenses
        GROUP BY date
        ORDER BY date ASC
    """)

    daily_results = db.execute(daily_query).mappings().all()

    daily_spending = [
        {
            "date": row["date"],
            "expense_count": int(row["expense_count"]),
            "total_spent": float(row["total_spent"]),
        }
        for row in daily_results
    ]

    # =========================
    # 4. Monthly Spending
    # =========================

    monthly_query = text("""
        SELECT
            strftime('%Y-%m', date) AS month,
            COUNT(*) AS expense_count,
            SUM(amount) AS total_spent,
            AVG(amount) AS average_expense
        FROM expenses
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month ASC
    """)

    monthly_results = db.execute(monthly_query).mappings().all()

    monthly_spending = [
        {
            "month": row["month"],
            "expense_count": int(row["expense_count"]),
            "total_spent": float(row["total_spent"]),
            "average_expense": float(row["average_expense"]),
        }
        for row in monthly_results
    ]

    # =========================
    # 5. Top 5 Expenses
    # =========================

    top_expenses_query = text("""
        SELECT
            id,
            name,
            amount,
            category,
            date
        FROM expenses
        ORDER BY amount DESC
        LIMIT 5
    """)

    top_expenses_results = db.execute(
        top_expenses_query
    ).mappings().all()

    top_expenses = [
        {
            "id": int(row["id"]),
            "name": row["name"],
            "amount": float(row["amount"]),
            "category": row["category"],
            "date": row["date"],
        }
        for row in top_expenses_results
    ]

    # =========================
    # 6. Highest Spending Category
    # =========================

    highest_category_query = text("""
        SELECT
            category,
            SUM(amount) AS total_spent
        FROM expenses
        GROUP BY category
        ORDER BY total_spent DESC
        LIMIT 1
    """)

    highest_category_result = db.execute(
        highest_category_query
    ).mappings().first()

    highest_category = None

    if highest_category_result:
        highest_category = {
            "category": highest_category_result["category"],
            "total_spent": float(
                highest_category_result["total_spent"]
            ),
        }

    # =========================
    # Final SQL Analytics Result
    # =========================

    return {
        "overall": {
            "expense_count": int(overall_result["expense_count"]),
            "total_spent": float(overall_result["total_spent"]),
            "average_expense": float(
                overall_result["average_expense"]
            ),
            "highest_expense": float(
                overall_result["highest_expense"]
            ),
            "lowest_expense": float(
                overall_result["lowest_expense"]
            ),
        },
        "category_spending": category_spending,
        "daily_spending": daily_spending,
        "monthly_spending": monthly_spending,
        "top_expenses": top_expenses,
        "highest_category": highest_category,
    }