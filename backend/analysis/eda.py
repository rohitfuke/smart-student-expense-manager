import sqlite3
import pandas as pd
import numpy as np


# ============================================
# SmartSpend - Exploratory Data Analysis
# ============================================

DATABASE_PATH = "smartspend.db"


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


def run_eda(df):
    """Perform exploratory data analysis."""

    print("\n" + "=" * 60)
    print("SMARTSPEND - EXPLORATORY DATA ANALYSIS")
    print("=" * 60)

    # ============================================
    # 1. Dataset Overview
    # ============================================

    print("\n1. DATASET OVERVIEW")
    print("-" * 60)

    print(f"Rows    : {df.shape[0]}")
    print(f"Columns : {df.shape[1]}")

    print("\nColumns:")
    print(list(df.columns))

    print("\nData Types:")
    print(df.dtypes)

    # ============================================
    # 2. First Records
    # ============================================

    print("\n2. SAMPLE DATA")
    print("-" * 60)

    print(df.head())

    # ============================================
    # 3. Missing Value Analysis
    # ============================================

    print("\n3. MISSING VALUE ANALYSIS")
    print("-" * 60)

    missing_values = df.isnull().sum()

    print(missing_values)

    # ============================================
    # 4. Duplicate Analysis
    # ============================================

    print("\n4. DUPLICATE ANALYSIS")
    print("-" * 60)

    duplicate_count = df.duplicated().sum()

    print(f"Duplicate rows: {duplicate_count}")

    # ============================================
    # 5. Descriptive Statistics
    # ============================================

    print("\n5. DESCRIPTIVE STATISTICS")
    print("-" * 60)

    if not df.empty:
        print(df["amount"].describe())

    # ============================================
    # 6. NumPy Statistical Analysis
    # ============================================

    print("\n6. NUMPY STATISTICAL ANALYSIS")
    print("-" * 60)

    if not df.empty:

        amounts = df["amount"].astype(float).to_numpy()

        print(f"Total Spending : ₹{np.sum(amounts):.2f}")
        print(f"Mean           : ₹{np.mean(amounts):.2f}")
        print(f"Median         : ₹{np.median(amounts):.2f}")
        print(f"Standard Dev.  : ₹{np.std(amounts):.2f}")
        print(f"Variance       : ₹{np.var(amounts):.2f}")

        print("\nPercentiles:")

        print(f"25th Percentile: ₹{np.percentile(amounts, 25):.2f}")
        print(f"50th Percentile: ₹{np.percentile(amounts, 50):.2f}")
        print(f"75th Percentile: ₹{np.percentile(amounts, 75):.2f}")

    # ============================================
    # 7. Category Analysis
    # ============================================

    print("\n7. CATEGORY ANALYSIS")
    print("-" * 60)

    if not df.empty:

        category_analysis = (
            df.groupby("category")["amount"]
            .agg(["count", "sum", "mean"])
            .sort_values("sum", ascending=False)
        )

        category_analysis.columns = [
            "expense_count",
            "total_spent",
            "average_expense"
        ]

        print(category_analysis)

    # ============================================
    # 8. Date Analysis
    # ============================================

    print("\n8. DATE ANALYSIS")
    print("-" * 60)

    if not df.empty:

        df["date"] = pd.to_datetime(
            df["date"],
            errors="coerce"
        )

        print(f"Date range: {df['date'].min()} → {df['date'].max()}")

        daily_spending = (
            df.groupby("date")["amount"]
            .sum()
            .sort_index()
        )

        print("\nDaily Spending:")
        print(daily_spending)

    # ============================================
    # 9. IQR Outlier Analysis
    # ============================================

    print("\n9. OUTLIER ANALYSIS - IQR METHOD")
    print("-" * 60)

    if not df.empty:

        amounts = df["amount"].astype(float)

        q1 = np.percentile(amounts, 25)
        q3 = np.percentile(amounts, 75)

        iqr = q3 - q1

        lower_bound = q1 - (1.5 * iqr)
        upper_bound = q3 + (1.5 * iqr)

        outliers = df[
            (df["amount"] < lower_bound)
            | (df["amount"] > upper_bound)
        ]

        print(f"Q1           : ₹{q1:.2f}")
        print(f"Q3           : ₹{q3:.2f}")
        print(f"IQR          : ₹{iqr:.2f}")
        print(f"Lower Bound  : ₹{lower_bound:.2f}")
        print(f"Upper Bound  : ₹{upper_bound:.2f}")

        print(f"\nOutliers detected: {len(outliers)}")

        if not outliers.empty:
            print("\nOutlier Records:")
            print(
                outliers[
                    ["id", "name", "amount", "category", "date"]
                ]
            )
        else:
            print("No IQR-based outliers detected.")

    # ============================================
    # 10. Data Quality Summary
    # ============================================

    print("\n10. DATA QUALITY SUMMARY")
    print("-" * 60)

    print(f"Total records       : {len(df)}")
    print(f"Missing values      : {df.isnull().sum().sum()}")
    print(f"Duplicate records   : {df.duplicated().sum()}")

    print("\n" + "=" * 60)
    print("EDA ANALYSIS COMPLETED")
    print("=" * 60)


# ============================================
# Main Execution
# ============================================

if __name__ == "__main__":

    try:
        df = load_data()

        if df.empty:
            print("\nNo expense records found in the database.")

        else:
            run_eda(df)

    except Exception as error:
        print("\nEDA ERROR:")
        print(error)