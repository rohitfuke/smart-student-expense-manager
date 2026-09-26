import { useEffect, useRef, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import "./App.css";
import ExpenseForm from "./ExpenseForm";

const API_BASE_URL = "http://127.0.0.1:8000";

const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
];

// =====================================================
// Date Formatting Helpers
// =====================================================

const formatShortDate = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });
};

const formatWeekLabel = (weekValue) => {
  const parts = String(weekValue).split("/");

  if (parts.length !== 2) {
    return formatShortDate(weekValue);
  }

  const start = new Date(`${parts[0]}T00:00:00`);
  const end = new Date(`${parts[1]}T00:00:00`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return weekValue;
  }

  const startLabel = start.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  const endLabel = end.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
  });

  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const endDay = end.toLocaleDateString("en-IN", {
      day: "numeric",
    });

    return `${start.toLocaleDateString("en-IN", {
      month: "short",
    })} ${start.getDate()}–${endDay}`;
  }

  return `${startLabel}–${endLabel}`;
};

// =====================================================
// Chart Container
// =====================================================

function ChartFrame({ children, height = 280 }) {
  const frameRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = frameRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = Math.floor(
        element.getBoundingClientRect().width
      );

      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="chart-frame"
      style={{
        width: "100%",
        height: `${height}px`,
        minWidth: 0,
        position: "relative",
      }}
    >
      {width > 0 ? children(width, height) : null}
    </div>
  );
}

// =====================================================
// Main App
// =====================================================

function App() {
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    const savedBudget = localStorage.getItem("monthlyBudget");

    return savedBudget ? Number(savedBudget) : 10000;
  });

  // Expenses now come from SQL database through FastAPI.
  // LocalStorage is NOT used as an expense database.
  const [expenses, setExpenses] = useState([]);

  // Navigation
  const [activeSection, setActiveSection] = useState("home");

  // Search / filter / sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");

  // Smart Insights
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState("");

  // Backend Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState("");

  // Analytics refresh
  const [analyticsRefreshing, setAnalyticsRefreshing] =
    useState(false);

  // =====================================================
  // Save Monthly Budget
  // =====================================================

  useEffect(() => {
    localStorage.setItem(
      "monthlyBudget",
      monthlyBudget
    );
  }, [monthlyBudget]);

  // =====================================================
  // Fetch Expenses From SQL Database
  // =====================================================

  const fetchExpenses = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();

      setExpenses(data);
    } catch (error) {
      console.error(
        "Expenses API error:",
        error
      );

      setExpenses([]);

      alert(
        "Unable to load expenses. Make sure the FastAPI server is running."
      );
    }
  };

  // =====================================================
  // Fetch Backend Analytics
  // =====================================================

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const response = await fetch(
        `${API_BASE_URL}/analytics/summary`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch analytics"
        );
      }

      const data = await response.json();

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Analytics API error:",
        error
      );

      setAnalyticsError(
        "Unable to load backend analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  // =====================================================
  // Fetch Smart Insights
  // =====================================================

  const fetchInsights = async () => {
    try {
      setInsightsLoading(true);
      setInsightsError("");

      const response = await fetch(
        `${API_BASE_URL}/analytics/insights`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch insights"
        );
      }

      const data = await response.json();

      setInsights(data.insights || []);
    } catch (error) {
      console.error(
        "Insights API error:",
        error
      );

      setInsightsError(
        "Unable to load Smart Insights. Make sure the FastAPI server is running."
      );
    } finally {
      setInsightsLoading(false);
    }
  };

  // =====================================================
  // Refresh Analytics
  // =====================================================

  const refreshAnalytics = async () => {
    try {
      setAnalyticsRefreshing(true);

      await Promise.all([
        fetchAnalytics(),
        fetchInsights(),
      ]);
    } finally {
      setAnalyticsRefreshing(false);
    }
  };

  // =====================================================
  // Initial Dashboard Load
  // =====================================================

  useEffect(() => {
    fetchExpenses();
    fetchAnalytics();
    fetchInsights();
  }, []);

  // =====================================================
  // Local Dashboard Calculations
  // =====================================================

  const totalSpent = expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0
  );

  const remaining =
    monthlyBudget - totalSpent;

  const budgetUsed =
    monthlyBudget > 0
      ? (totalSpent / monthlyBudget) * 100
      : 0;

  const budgetProgress = Math.min(
    Math.max(budgetUsed, 0),
    100
  );

  let budgetHealth = "";

  if (budgetUsed < 50) {
    budgetHealth = "Healthy Budget";
  } else if (budgetUsed <= 80) {
    budgetHealth = "Watch Spending";
  } else {
    budgetHealth = "Budget Risk";
  }

  const remainingPercentage =
    monthlyBudget > 0
      ? (remaining / monthlyBudget) * 100
      : 0;

  let remainingBudgetWarning = "";

  if (monthlyBudget <= 0) {
    remainingBudgetWarning =
      "Set a monthly budget.";
  } else if (remainingPercentage > 30) {
    remainingBudgetWarning =
      "Budget is on track";
  } else if (remainingPercentage >= 10) {
    remainingBudgetWarning =
      "⚠️ Budget getting low";
  } else {
    remainingBudgetWarning =
      "🚨 Very low budget remaining";
  }

  // =====================================================
  // Spending Status
  // =====================================================

  let spendingStatus = "";

  if (budgetUsed < 50) {
    spendingStatus = "Low Spending";
  } else if (budgetUsed <= 80) {
    spendingStatus = "Moderate Spending";
  } else {
    spendingStatus = "High Spending";
  }

  // =====================================================
  // Daily Average & Projection
  // =====================================================

  const uniqueDates = new Set(
    expenses.map((expense) => expense.date)
  );

  const numberOfDays = uniqueDates.size;

  const dailyAverage =
    numberOfDays > 0
      ? totalSpent / numberOfDays
      : 0;

  const projectedMonthlySpending =
    dailyAverage * 30;

  const projectedDifference =
    projectedMonthlySpending -
    monthlyBudget;

  let projectionStatus = "";

  if (monthlyBudget <= 0) {
    projectionStatus =
      "Set a monthly budget to see your projection.";
  } else if (projectedDifference > 0) {
    projectionStatus =
      `Projected to exceed budget by ₹${projectedDifference.toFixed(
        2
      )}`;
  } else {
    projectionStatus =
      `Projected to stay within budget by ₹${Math.abs(
        projectedDifference
      ).toFixed(2)}`;
  }

  // =====================================================
  // Backend Category Chart Data
  // =====================================================

  const backendCategoryChartData =
    analytics?.category_spending
      ? Object.entries(
          analytics.category_spending
        ).map(([category, amount]) => ({
          name: category,
          value: Number(amount),
        }))
      : [];

  // =====================================================
  // Backend Daily Chart Data
  // =====================================================

  const backendDailyChartData =
    analytics?.daily_spending
      ? Object.entries(
          analytics.daily_spending
        )
          .map(([date, amount]) => ({
            date,
            displayDate: formatShortDate(date),
            amount: Number(amount),
          }))
          .sort(
            (a, b) =>
              new Date(a.date) -
              new Date(b.date)
          )
      : [];

  // =====================================================
  // Backend Weekly Chart Data
  // =====================================================

  const backendWeeklyChartData =
    analytics?.weekly_spending
      ? Object.entries(
          analytics.weekly_spending
        )
          .map(([week, amount]) => ({
            week,
            displayWeek: formatWeekLabel(week),
            amount: Number(amount),
          }))
          .sort(
            (a, b) =>
              new Date(
                a.week.split("/")[0]
              ) -
              new Date(
                b.week.split("/")[0]
              )
          )
      : [];

  // =====================================================
  // Backend Anomaly Data
  // =====================================================

  const backendAnomalies =
    analytics?.anomalies || [];

  // =====================================================
  // ADD EXPENSE
  // =====================================================

  const addExpense = async (expense) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(expense),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add expense"
        );
      }

      const savedExpense =
        await response.json();

      // Update React state only.
      // Database is the source of truth.
      setExpenses((currentExpenses) => [
        ...currentExpenses,
        savedExpense,
      ]);

      await Promise.all([
        fetchAnalytics(),
        fetchInsights(),
      ]);
    } catch (error) {
      console.error(
        "Add expense API error:",
        error
      );

      alert(
        "Unable to save expense. Please make sure the FastAPI server is running."
      );
    }
  };

  // =====================================================
  // DELETE EXPENSE
  // =====================================================

  const deleteExpense = async (id) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/expenses/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete expense"
        );
      }

      setExpenses((currentExpenses) =>
        currentExpenses.filter(
          (expense) =>
            expense.id !== id
        )
      );

      await Promise.all([
        fetchAnalytics(),
        fetchInsights(),
      ]);
    } catch (error) {
      console.error(
        "Delete expense API error:",
        error
      );

      alert(
        "Unable to delete expense. Please make sure the FastAPI server is running."
      );
    }
  };

  // =====================================================
  // DELETE ALL EXPENSES
  // =====================================================

  const deleteAllExpenses = async () => {
    if (expenses.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        "Delete all expenses? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      const responses =
        await Promise.all(
          expenses.map((expense) =>
            fetch(
              `${API_BASE_URL}/expenses/${expense.id}`,
              {
                method: "DELETE",
              }
            )
          )
        );

      const failedDeletes =
        responses.filter(
          (response) =>
            !response.ok
        );

      if (failedDeletes.length > 0) {
        throw new Error(
          "Some expenses could not be deleted."
        );
      }

      setExpenses([]);

      await Promise.all([
        fetchAnalytics(),
        fetchInsights(),
      ]);
    } catch (error) {
      console.error(
        "Delete all expenses API error:",
        error
      );

      await fetchExpenses();

      alert(
        "Unable to delete all expenses. Please try again."
      );
    }
  };

  // =====================================================
  // Search / Filter / Sorting
  // =====================================================

  const filteredExpenses = [...expenses]
    .filter((expense) => {
      const matchesSearch =
        expense.name
          .toLowerCase()
          .includes(
            searchTerm.toLowerCase()
          );

      const matchesCategory =
        categoryFilter === "All" ||
        expense.category ===
          categoryFilter;

      return (
        matchesSearch &&
        matchesCategory
      );
    })
    .sort((a, b) => {
      if (sortOption === "newest") {
        return (
          new Date(b.date) -
          new Date(a.date)
        );
      }

      if (sortOption === "oldest") {
        return (
          new Date(a.date) -
          new Date(b.date)
        );
      }

      if (sortOption === "highest") {
        return (
          Number(b.amount) -
          Number(a.amount)
        );
      }

      if (sortOption === "lowest") {
        return (
          Number(a.amount) -
          Number(b.amount)
        );
      }

      return 0;
    });

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="app">

      {/* =========================
          Header
      ========================= */}

      <header className="header">
        <div className="header-content">

          <div className="brand">
            <h1>SmartSpend</h1>
            <p>
              Smart Student Expense &
              Budget Manager
            </p>
          </div>

          <nav className="nav">

            <button
              className={
                activeSection === "home"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                setActiveSection("home")
              }
            >
              🏠 Home
            </button>

            <button
              className={
                activeSection === "expenses"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                setActiveSection("expenses")
              }
            >
              💳 Expenses
            </button>

            <button
              className={
                activeSection === "analytics"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                setActiveSection("analytics")
              }
            >
              📊 Analytics
            </button>

            <button
              className={
                activeSection === "insights"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                setActiveSection("insights")
              }
            >
              🧠 Insights
            </button>

            <button
              className={
                activeSection === "anomalies"
                  ? "nav-button active"
                  : "nav-button"
              }
              onClick={() =>
                setActiveSection("anomalies")
              }
            >
              🚨 Anomalies
            </button>

          </nav>
        </div>
      </header>

      <main className="dashboard">

        <div
          key={activeSection}
          className="page-enter"
        >

          {/* =====================================================
              HOME
          ===================================================== */}

          {activeSection === "home" && (
            <>
              <h2>Dashboard</h2>

              <p className="welcome">
                Manage your money, smarter.
              </p>

              <section className="budget-section">

                <h2>
                  Set Monthly Budget
                </h2>

                <input
                  type="number"
                  min="0"
                  placeholder="Enter your monthly budget"
                  value={monthlyBudget}
                  onChange={(e) => {
                    const value =
                      Number(
                        e.target.value
                      );

                    if (value >= 0) {
                      setMonthlyBudget(
                        value
                      );
                    }
                  }}
                />

              </section>

              <section className="cards">

                <div className="card">
                  <p>Monthly Budget</p>
                  <h3>
                    ₹
                    {monthlyBudget.toFixed(
                      2
                    )}
                  </h3>
                </div>

                <div className="card">
                  <p>Total Spent</p>
                  <h3>
                    ₹
                    {totalSpent.toFixed(
                      2
                    )}
                  </h3>
                </div>

                <div className="card">
                  <p>Remaining</p>
                  <h3>
                    ₹
                    {remaining.toFixed(
                      2
                    )}
                  </h3>
                </div>

                <div className="card">
                  <p>Budget Used</p>
                  <h3>
                    {budgetUsed.toFixed(
                      1
                    )}
                    %
                  </h3>
                </div>

              </section>

              <section className="budget-health">

                <h2>Budget Health</h2>

                <p>
                  {budgetHealth}
                </p>

              </section>

              <section className="remaining-budget-warning">

                <h2>
                  Remaining Budget Status
                </h2>

                <p>
                  {remainingBudgetWarning}
                </p>

                {monthlyBudget > 0 && (
                  <p>
                    {remainingPercentage.toFixed(
                      1
                    )}
                    % of your budget
                    remains.
                  </p>
                )}

              </section>

              <section className="budget-progress">

                <h2>
                  Budget Progress
                </h2>

                <p>
                  {budgetProgress.toFixed(
                    1
                  )}
                  % of budget used
                </p>

                <progress
                  value={budgetProgress}
                  max="100"
                />

              </section>

              <section className="spending-status">

                <h2>
                  Spending Status
                </h2>

                <p>
                  {spendingStatus}
                </p>

              </section>

              <section className="daily-average">

                <h2>
                  Daily Average Spending
                </h2>

                <p>
                  ₹
                  {dailyAverage.toFixed(
                    2
                  )}{" "}
                  per day
                </p>

              </section>

              <section className="projected-spending">

                <h2>
                  Projected Monthly Spending
                </h2>

                <p>
                  ₹
                  {projectedMonthlySpending.toFixed(
                    2
                  )}
                </p>

              </section>

              <section className="projection-status">

                <h2>
                  Budget Projection
                </h2>

                <p>
                  {projectionStatus}
                </p>

              </section>
            </>
          )}

          {/* =====================================================
              EXPENSES
          ===================================================== */}

          {activeSection === "expenses" && (
            <>

              <div className="section-heading">

                <h2>Expenses</h2>

                <p className="welcome">
                  Add, search, filter and
                  manage your expenses.
                </p>

              </div>

              <ExpenseForm
                onAddExpense={addExpense}
              />

              <section className="recent">

                <div className="recent-header">

                  <h2>
                    Recent Expenses
                  </h2>

                  {expenses.length > 0 && (
                    <button
                      onClick={
                        deleteAllExpenses
                      }
                    >
                      Delete All
                    </button>
                  )}

                </div>

                {expenses.length > 0 && (

                  <div className="expense-filters">

                    <input
                      className="expense-input"
                      type="text"
                      placeholder="🔎 Search expenses..."
                      value={searchTerm}
                      onChange={(e) =>
                        setSearchTerm(
                          e.target.value
                        )
                      }
                    />

                    <select
                      className="expense-input"
                      value={categoryFilter}
                      onChange={(e) =>
                        setCategoryFilter(
                          e.target.value
                        )
                      }
                    >
                      <option value="All">
                        All Categories
                      </option>

                      <option value="Food">
                        Food
                      </option>

                      <option value="Transport">
                        Transport
                      </option>

                      <option value="Education">
                        Education
                      </option>

                      <option value="Shopping">
                        Shopping
                      </option>

                      <option value="Entertainment">
                        Entertainment
                      </option>

                      <option value="Other">
                        Other
                      </option>

                    </select>

                    <select
                      className="expense-input"
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(
                          e.target.value
                        )
                      }
                    >

                      <option value="newest">
                        Newest First
                      </option>

                      <option value="oldest">
                        Oldest First
                      </option>

                      <option value="highest">
                        Highest Amount
                      </option>

                      <option value="lowest">
                        Lowest Amount
                      </option>

                    </select>

                  </div>

                )}

                {expenses.length === 0 ? (

                  <div className="empty">
                    <p>
                      No expenses added yet.
                    </p>
                  </div>

                ) : filteredExpenses.length === 0 ? (

                  <div className="empty">
                    <p>
                      No expenses match
                      your filters.
                    </p>
                  </div>

                ) : (

                  filteredExpenses.map(
                    (expense) => (

                      <div
                        className="expense-item"
                        key={expense.id}
                      >

                        <div>

                          <strong>
                            {expense.name}
                          </strong>

                          <p>
                            {expense.category}
                          </p>

                          <p>
                            {expense.date}
                          </p>

                        </div>

                        <div>

                          <strong>
                            ₹
                            {Number(
                              expense.amount
                            ).toFixed(2)}
                          </strong>

                          <button
                            onClick={() =>
                              deleteExpense(
                                expense.id
                              )
                            }
                          >
                            Delete
                          </button>

                        </div>

                      </div>

                    )
                  )

                )}

              </section>

            </>
          )}

          {/* =====================================================
              ANALYTICS
          ===================================================== */}

          {activeSection === "analytics" && (
            <>

              <div className="section-heading">

                <h2>Analytics</h2>

                <p className="welcome">
                  Explore your spending
                  data and trends.
                </p>

              </div>

              <section className="smart-insights">

                <div className="smart-insights-header">

                  <div>

                    <h2>
                      📊 Backend Analytics
                    </h2>

                    <p>
                      Analytics powered by
                      FastAPI, Pandas &
                      NumPy.
                    </p>

                  </div>

                  <button
                    onClick={
                      refreshAnalytics
                    }
                    disabled={
                      analyticsRefreshing
                    }
                  >
                    {analyticsRefreshing
                      ? "Refreshing..."
                      : "Refresh Analytics"}
                  </button>

                </div>

                {analyticsLoading ? (

                  <div className="insights-loading">
                    <p>
                      Loading backend
                      analytics...
                    </p>
                  </div>

                ) : analyticsError ? (

                  <div className="insights-error">
                    <p>
                      {analyticsError}
                    </p>
                  </div>

                ) : analytics ? (

                  <>

                    <div className="insights-list">

                      <div className="insight-item">
                        <span className="insight-icon">
                          💰
                        </span>

                        <p>
                          Backend Total
                          Spent: ₹
                          {Number(
                            analytics.total_spent
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          📈
                        </span>

                        <p>
                          Backend Average
                          Expense: ₹
                          {Number(
                            analytics.average_expense
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          📊
                        </span>

                        <p>
                          Median Expense: ₹
                          {Number(
                            analytics.median_expense
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          🔝
                        </span>

                        <p>
                          Highest Expense: ₹
                          {Number(
                            analytics.highest_expense
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          💳
                        </span>

                        <p>
                          Lowest Expense: ₹
                          {Number(
                            analytics.lowest_expense
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          📉
                        </span>

                        <p>
                          Standard Deviation:{" "}
                          {Number(
                            analytics.standard_deviation
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          📐
                        </span>

                        <p>
                          Variance:{" "}
                          {Number(
                            analytics.variance
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          🧾
                        </span>

                        <p>
                          Total Expenses:{" "}
                          {
                            analytics.expense_count
                          }
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          📅
                        </span>

                        <p>
                          Peak Spending Day:{" "}
                          {analytics.peak_spending_day ||
                            "No data"}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          🔥
                        </span>

                        <p>
                          Peak Day Spending: ₹
                          {Number(
                            analytics.peak_spending_amount ||
                              0
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          🗓️
                        </span>

                        <p>
                          Monthly Spending:{" "}
                          {analytics.monthly_spending &&
                          Object.keys(
                            analytics.monthly_spending
                          ).length > 0
                            ? Object.entries(
                                analytics.monthly_spending
                              )
                                .map(
                                  (
                                    [
                                      month,
                                      amount,
                                    ]
                                  ) =>
                                    `${month}: ₹${Number(
                                      amount
                                    ).toFixed(
                                      2
                                    )}`
                                )
                                .join(
                                  " • "
                                )
                            : "No data"}
                        </p>
                      </div>

                      <div className="insight-item">
                        <span className="insight-icon">
                          🚨
                        </span>

                        <p>
                          Anomalies Detected:{" "}
                          {analytics.anomaly_count ||
                            0}
                        </p>
                      </div>

                    </div>

                    <div className="analytics-chart-grid">

                      {backendCategoryChartData.length >
                        0 && (

                        <div className="backend-chart chart-card">

                          <h3>
                            Backend Category
                            Distribution
                          </h3>

                          <ChartFrame height={280}>

                            {(
                              chartWidth,
                              chartHeight
                            ) => (

                              <PieChart
                                width={
                                  chartWidth
                                }
                                height={
                                  chartHeight
                                }
                              >

                                <Pie
                                  data={
                                    backendCategoryChartData
                                  }
                                  dataKey="value"
                                  nameKey="name"
                                  cx="50%"
                                  cy="45%"
                                  innerRadius={
                                    58
                                  }
                                  outerRadius={
                                    92
                                  }
                                  paddingAngle={
                                    2
                                  }
                                  labelLine={
                                    false
                                  }
                                  label={({
                                    name,
                                    percent,
                                  }) =>
                                    `${name} ${(
                                      percent *
                                      100
                                    ).toFixed(
                                      0
                                    )}%`
                                  }
                                  isAnimationActive
                                  animationBegin={
                                    0
                                  }
                                  animationDuration={
                                    900
                                  }
                                  animationEasing="ease-out"
                                >

                                  {backendCategoryChartData.map(
                                    (
                                      entry,
                                      index
                                    ) => (

                                      <Cell
                                        key={`backend-category-${index}`}
                                        fill={
                                          CHART_COLORS[
                                            index %
                                              CHART_COLORS.length
                                          ]
                                        }
                                      />

                                    )
                                  )}

                                </Pie>

                                <Tooltip
                                  formatter={(
                                    value
                                  ) => [
                                    `₹${Number(
                                      value
                                    ).toFixed(
                                      2
                                    )}`,
                                    "Spending",
                                  ]}
                                />

                                <Legend
                                  verticalAlign="bottom"
                                  height={28}
                                  iconType="circle"
                                />

                              </PieChart>

                            )}

                          </ChartFrame>

                        </div>

                      )}

                      {backendDailyChartData.length >
                        0 && (

                        <div className="backend-chart chart-card">

                          <h3>
                            Backend Daily
                            Spending
                          </h3>

                          <ChartFrame height={280}>

                            {(
                              chartWidth,
                              chartHeight
                            ) => (

                              <LineChart
                                width={
                                  chartWidth
                                }
                                height={
                                  chartHeight
                                }
                                data={
                                  backendDailyChartData
                                }
                                margin={{
                                  top: 10,
                                  right: 18,
                                  left: 8,
                                  bottom: 8,
                                }}
                              >

                                <CartesianGrid
                                  strokeDasharray="3 3"
                                />

                                <XAxis
                                  dataKey="displayDate"
                                  tickLine={false}
                                  axisLine={false}
                                  tickMargin={8}
                                  interval="preserveStartEnd"
                                />

                                <YAxis
                                  width={62}
                                  tickLine={false}
                                  axisLine={false}
                                  tickFormatter={(
                                    value
                                  ) =>
                                    `₹${value}`
                                  }
                                />

                                <Tooltip
                                  labelFormatter={(
                                    _,
                                    payload
                                  ) =>
                                    payload?.[0]
                                      ?.payload
                                      ?.date || ""
                                  }
                                  formatter={(
                                    value
                                  ) => [
                                    `₹${Number(
                                      value
                                    ).toFixed(
                                      2
                                    )}`,
                                    "Spending",
                                  ]}
                                />

                                <Line
                                  type="monotone"
                                  dataKey="amount"
                                  name="Daily Spending"
                                  stroke="#38bdf8"
                                  strokeWidth={3}
                                  dot={{
                                    r: 4,
                                  }}
                                  activeDot={{
                                    r: 7,
                                  }}
                                  isAnimationActive
                                  animationBegin={
                                    0
                                  }
                                  animationDuration={
                                    1100
                                  }
                                  animationEasing="ease-out"
                                />

                              </LineChart>

                            )}

                          </ChartFrame>

                        </div>

                      )}

                    </div>

                    {backendWeeklyChartData.length >
                      0 && (

                      <div className="backend-chart chart-card weekly-chart-card">

                        <h3>
                          Backend Weekly
                          Spending
                        </h3>

                        <ChartFrame height={280}>

                          {(
                            chartWidth,
                            chartHeight
                          ) => (

                            <BarChart
                              width={
                                chartWidth
                              }
                              height={
                                chartHeight
                              }
                              data={
                                backendWeeklyChartData
                              }
                              margin={{
                                top: 10,
                                right: 18,
                                left: 8,
                                bottom: 8,
                              }}
                            >

                              <CartesianGrid
                                strokeDasharray="3 3"
                              />

                              <XAxis
                                dataKey="displayWeek"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                interval="preserveStartEnd"
                              />

                              <YAxis
                                width={62}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(
                                  value
                                ) =>
                                  `₹${value}`
                                }
                              />

                              <Tooltip
                                labelFormatter={(
                                  _,
                                  payload
                                ) =>
                                  payload?.[0]
                                    ?.payload
                                    ?.displayWeek ||
                                  ""
                                }
                                formatter={(
                                  value
                                ) => [
                                  `₹${Number(
                                    value
                                  ).toFixed(
                                    2
                                  )}`,
                                  "Weekly Spending",
                                ]}
                              />

                              <Bar
                                dataKey="amount"
                                name="Weekly Spending"
                                fill="#38bdf8"
                                radius={[
                                  10,
                                  10,
                                  0,
                                  0,
                                ]}
                                maxBarSize={
                                  140
                                }
                                minPointSize={6}
                                isAnimationActive
                                animationBegin={
                                  0
                                }
                                animationDuration={
                                  1000
                                }
                                animationEasing="ease-out"
                              />

                            </BarChart>

                          )}

                        </ChartFrame>

                      </div>

                    )}

                  </>

                ) : (

                  <div className="insights-empty">
                    <p>
                      No backend analytics
                      available.
                    </p>
                  </div>

                )}

              </section>

            </>
          )}

          {/* =====================================================
              SMART INSIGHTS
          ===================================================== */}

          {activeSection === "insights" && (
            <>

              <div className="section-heading">

                <h2>
                  Smart Insights
                </h2>

                <p className="welcome">
                  Data-driven insights
                  from your spending
                  patterns.
                </p>

              </div>

              <section className="smart-insights">

                <div className="smart-insights-header">

                  <div>

                    <h2>
                      🧠 Smart Insights
                    </h2>

                    <p>
                      Data-driven insights
                      from your spending
                      patterns.
                    </p>

                  </div>

                  <button
                    onClick={fetchInsights}
                    disabled={
                      insightsLoading
                    }
                  >
                    {insightsLoading
                      ? "Analyzing..."
                      : "Refresh Insights"}
                  </button>

                </div>

                {insightsLoading ? (

                  <div className="insights-loading">
                    <p>
                      Analyzing your
                      spending...
                    </p>
                  </div>

                ) : insightsError ? (

                  <div className="insights-error">
                    <p>
                      {insightsError}
                    </p>
                  </div>

                ) : insights.length ===
                  0 ? (

                  <div className="insights-empty">
                    <p>
                      Add some expenses
                      to generate Smart
                      Insights.
                    </p>
                  </div>

                ) : (

                  <div className="insights-list">

                    {insights.map(
                      (
                        insight,
                        index
                      ) => (

                        <div
                          className="insight-item"
                          key={index}
                        >

                          <span className="insight-icon">
                            💡
                          </span>

                          <p>
                            {insight}
                          </p>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>

            </>
          )}

          {/* =====================================================
              ANOMALIES
          ===================================================== */}

          {activeSection === "anomalies" && (
            <>

              <div className="section-heading">

                <h2>
                  Anomaly Detection
                </h2>

                <p className="welcome">
                  Review statistically
                  unusual spending
                  activity.
                </p>

              </div>

              <section className="smart-insights">

                <div className="smart-insights-header">

                  <div>

                    <h2>
                      🚨 Anomaly Detection
                    </h2>

                    <p>
                      Unusual expenses
                      detected using
                      statistical analysis.
                    </p>

                  </div>

                  <button
                    onClick={
                      refreshAnalytics
                    }
                    disabled={
                      analyticsRefreshing
                    }
                  >
                    {analyticsRefreshing
                      ? "Refreshing..."
                      : "Refresh Anomalies"}
                  </button>

                </div>

                {analyticsLoading ? (

                  <div className="insights-loading">
                    <p>
                      Loading anomaly
                      data...
                    </p>
                  </div>

                ) : analyticsError ? (

                  <div className="insights-error">
                    <p>
                      {analyticsError}
                    </p>
                  </div>

                ) : analytics ? (

                  <div className="anomaly-section">

                    <div className="anomaly-header">

                      <div>

                        <h3>
                          🚨 Detected
                          Anomalies
                        </h3>

                        <p>
                          These expenses
                          were identified
                          by the backend
                          statistical
                          analysis.
                        </p>

                      </div>

                      <span className="anomaly-count">
                        {analytics.anomaly_count ||
                          0}{" "}
                        detected
                      </span>

                    </div>

                    {backendAnomalies.length ===
                    0 ? (

                      <div className="anomaly-empty">

                        <span>
                          ✅
                        </span>

                        <div>

                          <strong>
                            No unusual
                            expenses
                            detected
                          </strong>

                          <p>
                            Your current
                            expenses do not
                            contain
                            statistically
                            unusual values.
                          </p>

                        </div>

                      </div>

                    ) : (

                      <div className="anomaly-list">

                        {backendAnomalies.map(
                          (
                            anomaly,
                            index
                          ) => (

                            <div
                              className="anomaly-item"
                              key={
                                anomaly.id ||
                                `${anomaly.name}-${index}`
                              }
                            >

                              <div className="anomaly-main">

                                <div className="anomaly-icon">
                                  🚨
                                </div>

                                <div>

                                  <h4>
                                    {
                                      anomaly.name
                                    }
                                  </h4>

                                  <p>
                                    {
                                      anomaly.category
                                    }{" "}
                                    •{" "}
                                    {
                                      anomaly.date
                                    }
                                  </p>

                                </div>

                              </div>

                              <div className="anomaly-amount">

                                <strong>
                                  ₹
                                  {Number(
                                    anomaly.amount
                                  ).toFixed(
                                    2
                                  )}
                                </strong>

                                <span>
                                  {Number(
                                    anomaly.average_multiple ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                  x average
                                </span>

                              </div>

                              <div className="anomaly-details">

                                <div>

                                  <span>
                                    Above Average
                                  </span>

                                  <strong>
                                    {Number(
                                      anomaly.percentage_above_average ||
                                        0
                                    ).toFixed(
                                      1
                                    )}
                                    %
                                  </strong>

                                </div>

                                <div>

                                  <span>
                                    Average
                                    Expense
                                  </span>

                                  <strong>
                                    ₹
                                    {Number(
                                      analytics.average_expense ||
                                        0
                                    ).toFixed(
                                      2
                                    )}
                                  </strong>

                                </div>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                ) : (

                  <div className="insights-empty">

                    <p>
                      No anomaly data
                      available.
                    </p>

                  </div>

                )}

              </section>

            </>
          )}

        </div>

      </main>

    </div>
  );
}

export default App;