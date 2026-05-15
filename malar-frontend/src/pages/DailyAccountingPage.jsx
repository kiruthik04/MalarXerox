import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { api } from '../services/api';

const DailyAccountingPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const json = await api.getDashboardHistorical();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totals = data.reduce((acc, curr) => ({
    income: acc.income + curr.income,
    expense: acc.expense + curr.expense,
    profit: acc.profit + curr.netProfit
  }), { income: 0, expense: 0, profit: 0 });

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="admin-card" style={{ textAlign: 'center', padding: '3rem' }}>Loading daily accounting data...</div>;
  if (error) return <div className="admin-card" style={{ color: '#ef4444', padding: '2rem' }}>Error: {error}</div>;

  return (
    <div className="daily-accounting-container">
      {/* Summary Cards */}
      <div className="overview-stats" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-title">Total Income (Period)</div>
          <div className="stat-value" style={{ color: 'var(--primary-dark)' }}>₹{totals.income.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Expenses (Period)</div>
          <div className="stat-value" style={{ color: '#ef4444' }}>₹{totals.expense.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: `4px solid ${totals.profit >= 0 ? '#22c55e' : '#ef4444'}` }}>
          <div className="stat-title">Net Profit / Loss</div>
          <div className="stat-value" style={{ color: totals.profit >= 0 ? '#16a34a' : '#dc2626' }}>
            ₹{totals.profit.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="page-header" style={{ marginBottom: '1.5rem' }}>
          <h3><Calendar size={20} style={{ marginRight: '0.5rem' }} /> Daily Accounting Summary</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Grouped by date, including all bills and expenses.</p>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Income</th>
                <th className="text-right">Expense</th>
                <th className="text-right">Net Profit</th>
                <th style={{ width: '200px' }}>Visual Comparison</th>
              </tr>
            </thead>
            <tbody>
              {data.map((day, idx) => {
                const total = day.income + day.expense;
                const incomePercent = total > 0 ? (day.income / total) * 100 : 0;
                const expensePercent = total > 0 ? (day.expense / total) * 100 : 0;

                return (
                  <tr key={day.date}>
                    <td style={{ fontWeight: 600 }}>{formatDate(day.date)}</td>
                    <td className="text-right" style={{ color: '#16a34a', fontWeight: 600 }}>₹{day.income.toFixed(2)}</td>
                    <td className="text-right" style={{ color: '#ef4444' }}>₹{day.expense.toFixed(2)}</td>
                    <td className="text-right" style={{ fontWeight: 700, color: day.netProfit >= 0 ? '#1e40af' : '#b91c1c' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        {day.netProfit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        ₹{day.netProfit.toFixed(2)}
                      </div>
                    </td>
                    <td>
                      <div style={{ 
                        height: '10px', 
                        width: '100%', 
                        background: '#f1f5f9', 
                        borderRadius: '10px', 
                        display: 'flex', 
                        overflow: 'hidden',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                      }}>
                        <div style={{ width: `${incomePercent}%`, background: '#22c55e', height: '100%' }} title={`Income: ${incomePercent.toFixed(1)}%`} />
                        <div style={{ width: `${expensePercent}%`, background: '#ef4444', height: '100%' }} title={`Expense: ${expensePercent.toFixed(1)}%`} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {data.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Info size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No historical data available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyAccountingPage;
