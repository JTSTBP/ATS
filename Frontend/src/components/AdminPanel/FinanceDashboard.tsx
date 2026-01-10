import { useState, useEffect } from "react";
import axios from "axios";
import { TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const FinanceDashboard = () => {
    const [summaryData, setSummaryData] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        profitMargin: 0,
    });
    const [summaryFilter, setSummaryFilter] = useState("monthly");
    const [monthlyData, setMonthlyData] = useState([]);
    const [categoryExpenses, setCategoryExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSummary();
        fetchMonthlyTrends();
        fetchExpensesByCategory();
    }, [summaryFilter]);

    const fetchSummary = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/invoices/summary`,
                { params: { filter: summaryFilter } }
            );
            setSummaryData(response.data);
        } catch (error) {
            console.error("Error fetching summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyTrends = async () => {
        try {
            // Fetch monthly income/expense trends
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/invoices/monthly-trends`
            );
            setMonthlyData(response.data || []);
        } catch (error) {
            console.error("Error fetching monthly trends:", error);
            // Fallback to empty array if endpoint doesn't exist
            setMonthlyData([]);
        }
    };

    const fetchExpensesByCategory = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/expenses/by-category`
            );
            setCategoryExpenses(response.data || []);
        } catch (error) {
            console.error("Error fetching expenses by category:", error);
            setCategoryExpenses([]);
        }
    };

    const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Finance Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of financial performance</p>
                </div>
                <select
                    value={summaryFilter}
                    onChange={(e) => setSummaryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                    <option value="weekly">This Week</option>
                    <option value="monthly">This Month</option>
                    <option value="yearly">This Year</option>
                    <option value="all">All Time</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Income */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl shadow-md border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-700">Total Income</p>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900">
                        ₹{summaryData.totalIncome.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-2">Revenue from invoices</p>
                </div>

                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl shadow-md border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-red-700">Total Expenses</p>
                        <TrendingDown className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-900">
                        ₹{summaryData.totalExpenses.toLocaleString()}
                    </p>
                    <p className="text-xs text-red-600 mt-2">Operating costs</p>
                </div>

                {/* Net Profit */}
                <div className={`bg-gradient-to-br ${summaryData.netProfit >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-orange-50 to-orange-100 border-orange-200'} p-6 rounded-xl shadow-md border`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm font-medium ${summaryData.netProfit >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                            Net Profit
                        </p>
                        <DollarSign className={`w-5 h-5 ${summaryData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                    </div>
                    <p className={`text-3xl font-bold ${summaryData.netProfit >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
                        ₹{summaryData.netProfit.toLocaleString()}
                    </p>
                    <p className={`text-xs mt-2 ${summaryData.netProfit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        Income - Expenses
                    </p>
                </div>

                {/* Profit Margin */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-md border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-purple-700">Profit Margin</p>
                        <PieChart className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                        {summaryData.profitMargin}%
                    </p>
                    <p className="text-xs text-purple-600 mt-2">Profitability ratio</p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trends Chart */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Monthly Trends
                    </h3>
                    {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Income"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    name="Expenses"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            <p>No monthly trend data available</p>
                        </div>
                    )}
                </div>

                {/* Expenses by Category */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Expenses by Category
                    </h3>
                    {categoryExpenses.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <RechartsPieChart>
                                <Pie
                                    data={categoryExpenses}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryExpenses.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </RechartsPieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-[300px] flex items-center justify-center text-gray-400">
                            <p>No expense category data available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Income vs Expenses Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Income vs Expenses Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                        data={[
                            {
                                name: "Financial Overview",
                                Income: summaryData.totalIncome,
                                Expenses: summaryData.totalExpenses,
                            },
                        ]}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Income" fill="#10b981" />
                        <Bar dataKey="Expenses" fill="#ef4444" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default FinanceDashboard;
