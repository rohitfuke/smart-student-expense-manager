import pandas as pd
import numpy as np


def empty_analytics_result():
    """
    Return a consistent empty analytics response.
    """

    return {
        "total_spent": 0,
        "average_expense": 0,
        "median_expense": 0,
        "highest_expense": 0,
        "lowest_expense": 0,
        "expense_count": 0,

        "category_spending": {},
        "category_percentages": {},
        "highest_category": None,

        "standard_deviation": 0,
        "variance": 0,

        "daily_spending": {},
        "weekly_spending": {},
        "monthly_spending": {},

        "peak_spending_day": None,
        "peak_spending_amount": 0,

        "anomalies": [],
        "anomaly_count": 0,

        "outlier_method": "IQR + Z-Score",
        "iqr_upper_bound": 0,
        "z_score_threshold": 2,

        "spending_concentration": 0,

        "smart_insights": []
    }


def analyze_expenses(expenses):

    # ============================================
    # 1. Empty Data Handling
    # ============================================

    if not expenses:
        return empty_analytics_result()

    # ============================================
    # 2. Create DataFrame
    # ============================================

    df = pd.DataFrame(expenses)

    # ============================================
    # 3. Data Cleaning
    # ============================================

    df["amount"] = pd.to_numeric(
        df["amount"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["amount"]
    )

    if df.empty:
        return empty_analytics_result()

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    df = df.dropna(
        subset=["date"]
    )

    if df.empty:
        return empty_analytics_result()

    # Remove negative expenses
    df = df[df["amount"] >= 0]

    if df.empty:
        return empty_analytics_result()

    amounts = df["amount"].astype(float).to_numpy()

    # ============================================
    # 4. Basic Statistics
    # ============================================

    total_spent = float(
        np.sum(amounts)
    )

    average_expense = float(
        np.mean(amounts)
    )

    median_expense = float(
        np.median(amounts)
    )

    highest_expense = float(
        np.max(amounts)
    )

    lowest_expense = float(
        np.min(amounts)
    )

    expense_count = int(
        len(amounts)
    )

    # ============================================
    # 5. Category-wise Spending
    # ============================================

    category_spending = (
        df.groupby("category")["amount"]
        .sum()
        .sort_values(
            ascending=False
        )
    )

    category_spending_dict = {
        str(category): float(amount)
        for category, amount
        in category_spending.items()
    }

    # ============================================
    # 6. Category Percentages
    # ============================================

    if total_spent > 0:

        category_percentages = {
            category: round(
                (amount / total_spent) * 100,
                2
            )
            for category, amount
            in category_spending_dict.items()
        }

    else:

        category_percentages = {
            category: 0
            for category
            in category_spending_dict
        }

    # ============================================
    # 7. Highest Spending Category
    # ============================================

    highest_category = (
        str(category_spending.index[0])
        if not category_spending.empty
        else None
    )

    # ============================================
    # 8. Advanced Statistics
    # ============================================

    standard_deviation = float(
        np.std(amounts)
    )

    variance = float(
        np.var(amounts)
    )

    # ============================================
    # 9. Daily Spending
    # ============================================

    daily_spending = (
        df.groupby(
            df["date"].dt.strftime(
                "%Y-%m-%d"
            )
        )["amount"]
        .sum()
        .sort_index()
    )

    daily_spending_dict = {
        str(date): float(amount)
        for date, amount
        in daily_spending.items()
    }

    # ============================================
    # 10. Peak Spending Day
    # ============================================

    if not daily_spending.empty:

        peak_day = daily_spending.idxmax()

        peak_amount = float(
            daily_spending.max()
        )

    else:

        peak_day = None
        peak_amount = 0

    # ============================================
    # 11. Weekly Spending
    # ============================================

    weekly_spending = (
        df.groupby(
            df["date"].dt.to_period("W")
        )["amount"]
        .sum()
        .sort_index()
    )

    weekly_spending_dict = {
        str(week): float(amount)
        for week, amount
        in weekly_spending.items()
    }

    # ============================================
    # 12. Monthly Spending
    # ============================================

    monthly_spending = (
        df.groupby(
            df["date"].dt.to_period("M")
        )["amount"]
        .sum()
        .sort_index()
    )

    monthly_spending_dict = {
        str(month): float(amount)
        for month, amount
        in monthly_spending.items()
    }

    # ============================================
    # 13. IQR Outlier Detection
    # ============================================

    q1 = float(
        np.percentile(
            amounts,
            25
        )
    )

    q3 = float(
        np.percentile(
            amounts,
            75
        )
    )

    iqr = q3 - q1

    iqr_upper_bound = (
        q3 + (1.5 * iqr)
    )

    iqr_outlier_mask = (
        df["amount"] > iqr_upper_bound
    )

    # ============================================
    # 14. Z-Score Analysis
    # ============================================

    if standard_deviation > 0:

        z_scores = (
            (df["amount"] - average_expense)
            / standard_deviation
        )

    else:

        z_scores = pd.Series(
            np.zeros(len(df)),
            index=df.index
        )

    df["z_score"] = z_scores

    z_score_threshold = 2

    z_score_outlier_mask = (
        df["z_score"].abs()
        >= z_score_threshold
    )

    # ============================================
    # 15. Combined Anomaly Detection
    # ============================================

    anomaly_mask = (
        iqr_outlier_mask
        | z_score_outlier_mask
    )

    anomaly_df = df[
        anomaly_mask
    ].copy()

    anomalies = []

    for _, row in anomaly_df.iterrows():

        amount = float(
            row["amount"]
        )

        z_score = float(
            row["z_score"]
        )

        average_multiple = (
            amount / average_expense
            if average_expense > 0
            else 0
        )

        percentage_above_average = (
            (
                (amount - average_expense)
                / average_expense
            ) * 100
            if average_expense > 0
            else 0
        )

        iqr_detected = bool(
            row["amount"]
            > iqr_upper_bound
        )

        z_score_detected = bool(
            abs(z_score)
            >= z_score_threshold
        )

        # Severity
        if (
            abs(z_score) >= 3
            or amount >= (
                average_expense * 5
            )
        ):
            severity = "High"

        elif (
            abs(z_score) >= 2
            or iqr_detected
        ):
            severity = "Medium"

        else:
            severity = "Low"

        detection_methods = []

        if iqr_detected:
            detection_methods.append(
                "IQR"
            )

        if z_score_detected:
            detection_methods.append(
                "Z-Score"
            )

        anomalies.append({

            "id": (
                int(row["id"])
                if "id" in row
                and pd.notna(row["id"])
                else None
            ),

            "name": str(
                row.get(
                    "name",
                    "Unknown"
                )
            ),

            "amount": amount,

            "category": str(
                row.get(
                    "category",
                    "Unknown"
                )
            ),

            "date": row["date"].strftime(
                "%Y-%m-%d"
            ),

            "z_score": round(
                z_score,
                2
            ),

            "average_multiple": round(
                average_multiple,
                2
            ),

            "percentage_above_average": round(
                percentage_above_average,
                2
            ),

            "severity": severity,

            "detection_methods": (
                detection_methods
            )
        })

    # ============================================
    # 16. Spending Concentration
    # ============================================

    spending_concentration = 0

    if (
        highest_category
        and total_spent > 0
    ):

        spending_concentration = round(
            (
                category_spending_dict[
                    highest_category
                ]
                / total_spent
            ) * 100,
            2
        )

    # ============================================
    # 17. Smart Analytical Insights
    # ============================================

    smart_insights = []

    # Total spending
    smart_insights.append(
        f"Total spending is INR "
        f"{total_spent:.2f} across "
        f"{expense_count} expenses."
    )

    # Average vs median
    if average_expense > median_expense:

        smart_insights.append(
            "The average expense is significantly "
            "higher than the median, indicating that "
            "large transactions are increasing the "
            "overall spending average."
        )

    elif average_expense < median_expense:

        smart_insights.append(
            "The median expense is higher than the "
            "average, indicating relatively lower "
            "typical transaction values."
        )

    else:

        smart_insights.append(
            "The average and median expenses are "
            "similar, indicating a relatively balanced "
            "expense distribution."
        )

    # Dominant category
    if highest_category:

        smart_insights.append(
            f"{highest_category} is the dominant "
            f"spending category, representing "
            f"{spending_concentration:.2f}% "
            f"of total spending."
        )

    # Spending variability
    if (
        average_expense > 0
        and standard_deviation
        > average_expense
    ):

        smart_insights.append(
            "Spending amounts show high variability "
            "because the standard deviation is higher "
            "than the average expense."
        )

    elif average_expense > 0:

        smart_insights.append(
            "Spending amounts show relatively "
            "moderate variability."
        )

    # Peak spending day
    if peak_day:

        smart_insights.append(
            f"The highest daily spending was "
            f"INR {peak_amount:.2f} on "
            f"{peak_day}."
        )

    # Anomaly insight
    if anomalies:

        smart_insights.append(
            f"{len(anomalies)} unusual expense(s) "
            f"were detected using IQR and Z-Score "
            f"analysis."
        )

    else:

        smart_insights.append(
            "No statistically unusual expenses "
            "were detected using the current "
            "IQR and Z-Score thresholds."
        )

    # Largest expense
    if average_expense > 0:

        largest_multiple = (
            highest_expense
            / average_expense
        )

        if largest_multiple >= 3:

            smart_insights.append(
                f"The largest expense of "
                f"INR {highest_expense:.2f} is "
                f"{largest_multiple:.1f}x the "
                f"average transaction value."
            )

    # ============================================
    # 18. Final Analytics Result
    # ============================================

    return {

        # Basic statistics
        "total_spent": total_spent,

        "average_expense": average_expense,

        "median_expense": median_expense,

        "highest_expense": highest_expense,

        "lowest_expense": lowest_expense,

        "expense_count": expense_count,

        # Category analytics
        "category_spending": (
            category_spending_dict
        ),

        "category_percentages": (
            category_percentages
        ),

        "highest_category": (
            highest_category
        ),

        # Statistical analytics
        "standard_deviation": round(
            standard_deviation,
            2
        ),

        "variance": round(
            variance,
            2
        ),

        # Time analytics
        "daily_spending": (
            daily_spending_dict
        ),

        "weekly_spending": (
            weekly_spending_dict
        ),

        "monthly_spending": (
            monthly_spending_dict
        ),

        "peak_spending_day": (
            peak_day
        ),

        "peak_spending_amount": (
            peak_amount
        ),

        # Anomaly analytics
        "anomalies": anomalies,

        "anomaly_count": len(
            anomalies
        ),

        "outlier_method": (
            "IQR + Z-Score"
        ),

        "iqr_upper_bound": round(
            iqr_upper_bound,
            2
        ),

        "z_score_threshold": (
            z_score_threshold
        ),

        # Insight analytics
        "spending_concentration": (
            spending_concentration
        ),

        "smart_insights": (
            smart_insights
        )
    }