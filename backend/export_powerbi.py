import pandas as pd
from sqlalchemy import create_engine

DATABASE_URL = "sqlite:///./smartspend.db"

engine = create_engine(DATABASE_URL)


def export_powerbi_dataset():
    query = """
        SELECT
            id,
            name,
            amount,
            category,
            date
        FROM expenses
        ORDER BY date ASC, id ASC;
    """

    df = pd.read_sql(query, engine)

    if df.empty:
        print("No expense records found.")
        return

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["amount", "date"]
    )

    # Time dimensions for Power BI
    df["year"] = df["date"].dt.year
    df["month"] = df["date"].dt.month
    df["month_name"] = df["date"].dt.strftime("%B")
    df["year_month"] = df["date"].dt.strftime("%Y-%m")
    df["day_name"] = df["date"].dt.strftime("%A")

    # Sort chronologically
    df = df.sort_values(
        by=["date", "id"]
    )

    output_path = (
        "backend/analysis/"
        "powerbi_expenses.csv"
    )

    df.to_csv(
        output_path,
        index=False
    )

    print("=" * 60)
    print("POWER BI DATASET EXPORT")
    print("=" * 60)

    print(f"Records exported : {len(df)}")
    print(f"Total spending   : ₹{df['amount'].sum():.2f}")
    print(f"Categories       : {df['category'].nunique()}")
    print(f"Date range       : {df['date'].min().date()} → "
          f"{df['date'].max().date()}")

    print("\nColumns:")
    for column in df.columns:
        print(f" - {column}")

    print(
        f"\nCreated: {output_path}"
    )

    print("=" * 60)


if __name__ == "__main__":
    export_powerbi_dataset()