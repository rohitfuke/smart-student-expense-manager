from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import engine, get_db
from backend.models import Base, Expense
from backend.analytics import analyze_expenses
from backend.sql_analytics import get_sql_analytics


# =========================
# Database Initialization
# =========================

Base.metadata.create_all(bind=engine)


# =========================
# FastAPI Application
# =========================

app = FastAPI(
    title="SmartSpend API",
    description="Smart Student Expense & Budget Manager API",
    version="1.0.0"
)


# =========================
# CORS Configuration
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://smart-student-expense-manager.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# Expense Schema
# =========================

class ExpenseCreate(BaseModel):
    name: str
    amount: float
    category: str
    date: str


# =========================
# Basic Routes
# =========================

@app.get("/")
def root():
    return {
        "message": "SmartSpend API is running 🚀"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


# =========================
# Expense Routes
# =========================

@app.get("/expenses")
def get_expenses(
    db: Session = Depends(get_db)
):
    return db.query(Expense).all()


@app.post("/expenses")
def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db)
):
    new_expense = Expense(
        name=expense.name,
        amount=expense.amount,
        category=expense.category,
        date=expense.date
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully",
        "id": expense_id
    }


# =========================
# Analytics Summary
# =========================

@app.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db)
):
    expenses = db.query(Expense).all()

    expense_data = [
        {
            "id": expense.id,
            "name": expense.name,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.date
        }
        for expense in expenses
    ]

    return analyze_expenses(expense_data)


# =========================
# Smart Insights
# =========================

@app.get("/analytics/insights")
def get_analytics_insights(
    db: Session = Depends(get_db)
):
    expenses = db.query(Expense).all()

    expense_data = [
        {
            "id": expense.id,
            "name": expense.name,
            "amount": expense.amount,
            "category": expense.category,
            "date": expense.date
        }
        for expense in expenses
    ]

    analytics = analyze_expenses(expense_data)

    insights = []

    # No expenses
    if analytics["expense_count"] == 0:
        return {
            "insights": [
                "Add some expenses to generate Smart Insights."
            ]
        }

    # Total spending
    insights.append(
        f"You have spent ₹{analytics['total_spent']:.2f} "
        f"across {analytics['expense_count']} expenses."
    )

    # Average expense
    insights.append(
        f"Your average expense is "
        f"₹{analytics['average_expense']:.2f}."
    )

    # Highest expense
    insights.append(
        f"Your highest single expense is "
        f"₹{analytics['highest_expense']:.2f}."
    )

    # Lowest expense
    insights.append(
        f"Your lowest single expense is "
        f"₹{analytics['lowest_expense']:.2f}."
    )

    # Highest category
    highest_category = analytics["highest_category"]

    if highest_category:
        category_percentage = analytics[
            "category_percentages"
        ][highest_category]

        insights.append(
            f"{highest_category} is your highest spending "
            f"category, accounting for "
            f"{category_percentage:.2f}% of your total spending."
        )

    # Spending consistency
    if analytics["standard_deviation"] == 0:
        insights.append(
            "Your expenses are currently very consistent in amount."
        )
    elif analytics["standard_deviation"] < analytics["average_expense"]:
        insights.append(
            "Your spending amounts are relatively consistent."
        )
    else:
        insights.append(
            "Your spending amounts show significant variation."
        )

    # Anomaly detection
    if analytics["anomaly_count"] > 0:
        insights.append(
            f"{analytics['anomaly_count']} unusual spending "
            f"pattern(s) were detected in your expenses."
        )
    else:
        insights.append(
            "No unusual spending was detected in your current expenses."
        )

    return {
        "insights": insights
    }


# =========================
# SQL Analytics
# =========================

@app.get("/analytics/sql")
def get_sql_analytics_endpoint(
    db: Session = Depends(get_db)
):
    return get_sql_analytics(db)