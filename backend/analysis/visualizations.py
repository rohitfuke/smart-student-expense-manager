import sqlite3
import os

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns


# ============================================
# SmartSpend - Data Visualizations
# ============================================

DATABASE_PATH = "smartspend.db"
OUTPUT_DIR = "backend/analysis/plots"


def load_data():
    """Load expense data from SQLite database."""

    connection = sqlite3.connect(DATABASE_PATH)

    query = """
        SELECT
            id,
            name,
            amount,
            category,
            date
        FROM expenses
    """

    df = pd.read_sql_query(query, connection)

    connection.close()

    return df


def prepare_data(df):
    """Clean and prepare data for visualization."""

    df = df.copy()

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["amount", "category", "date"]
    )

    return df


def create_output_directory():
    """Create plot output directory."""

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )


# ============================================
# 1. Category Spending Bar Chart
# ============================================

def plot_category_spending(df):

    category_data = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    plt.figure(figsize=(10, 6))

    sns.barplot(
        x=category_data.values,
        y=category_data.index
    )

    plt.title(
        "SmartSpend - Category-wise Spending"
    )

    plt.xlabel("Total Spending (INR)")
    plt.ylabel("Category")

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "category_spending.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 2. Daily Spending Trend
# ============================================

def plot_daily_spending(df):

    daily_data = (
        df.groupby("date")["amount"]
        .sum()
        .sort_index()
    )

    plt.figure(figsize=(10, 6))

    sns.lineplot(
        x=daily_data.index,
        y=daily_data.values,
        marker="o"
    )

    plt.title(
        "SmartSpend - Daily Spending Trend"
    )

    plt.xlabel("Date")
    plt.ylabel("Spending (INR)")

    plt.xticks(rotation=45)

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "daily_spending_trend.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 3. Expense Distribution
# ============================================

def plot_expense_distribution(df):

    plt.figure(figsize=(10, 6))

    sns.histplot(
        data=df,
        x="amount",
        bins=10,
        kde=True
    )

    plt.title(
        "SmartSpend - Expense Amount Distribution"
    )

    plt.xlabel("Expense Amount (INR)")
    plt.ylabel("Frequency")

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "expense_distribution.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 4. Expense Box Plot
# ============================================

def plot_expense_boxplot(df):

    plt.figure(figsize=(10, 5))

    sns.boxplot(
        x=df["amount"]
    )

    plt.title(
        "SmartSpend - Expense Outlier Analysis"
    )

    plt.xlabel("Expense Amount (INR)")

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "expense_boxplot.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 5. Category Expense Count
# ============================================

def plot_category_count(df):

    category_count = (
        df["category"]
        .value_counts()
        .sort_values(ascending=False)
    )

    plt.figure(figsize=(10, 6))

    sns.barplot(
        x=category_count.values,
        y=category_count.index
    )

    plt.title(
        "SmartSpend - Number of Expenses by Category"
    )

    plt.xlabel("Number of Expenses")
    plt.ylabel("Category")

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "category_expense_count.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 6. Category Percentage Pie Chart
# ============================================

def plot_category_percentage(df):

    category_data = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(ascending=False)
    )

    plt.figure(figsize=(8, 8))

    plt.pie(
        category_data.values,
        labels=category_data.index,
        autopct="%1.1f%%",
        startangle=90
    )

    plt.title(
        "SmartSpend - Spending Distribution by Category"
    )

    plt.tight_layout()

    path = os.path.join(
        OUTPUT_DIR,
        "category_percentage.png"
    )

    plt.savefig(
        path,
        dpi=150,
        bbox_inches="tight"
    )

    plt.close()

    print(f"Created: {path}")


# ============================================
# 7. Statistical Summary
# ============================================

def print_visualization_summary(df):

    amounts = df["amount"].to_numpy()

    print("\n" + "=" * 60)
    print("VISUALIZATION DATA SUMMARY")
    print("=" * 60)

    print(
        f"Total Spending : INR{np.sum(amounts):.2f}"
    )

    print(
        f"Average Expense: INR{np.mean(amounts):.2f}"
    )

    print(
        f"Median Expense : INR{np.median(amounts):.2f}"
    )

    print(
        f"Std Deviation  : INR{np.std(amounts):.2f}"
    )

    print(
        f"Expense Count  : {len(amounts)}"
    )


# ============================================
# Main Execution
# ============================================

if __name__ == "__main__":

    print("\n" + "=" * 60)
    print("SMARTSPEND - VISUAL ANALYTICS")
    print("=" * 60)

    try:

        create_output_directory()

        df = load_data()

        if df.empty:

            print("\nNo expense records found.")

        else:

            df = prepare_data(df)

            print(
                f"\nLoaded {len(df)} expense records."
            )

            print_visualization_summary(df)

            print("\nGenerating visualizations...\n")

            plot_category_spending(df)

            plot_daily_spending(df)

            plot_expense_distribution(df)

            plot_expense_boxplot(df)

            plot_category_count(df)

            plot_category_percentage(df)

            print("\n" + "=" * 60)
            print("VISUAL ANALYTICS COMPLETED")
            print("=" * 60)

    except Exception as error:

        print("\nVISUALIZATION ERROR:")
        print(error)