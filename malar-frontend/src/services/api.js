const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Helper to get token from localStorage
const getToken = () => {
  try {
    const saved = localStorage.getItem('malar_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.token;
    }
  } catch (e) {
    return null;
  }
  return null;
};

// Generic fetch wrapper
const fetchApi = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle No Content (204)
  if (response.status === 204) {
    return null;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // Standardize error format
    const errorMessage = data && typeof data === 'object' && data.error 
      ? data.error 
      : data && typeof data === 'object' && data.message
        ? data.message
        : typeof data === 'string' 
          ? data 
          : 'An unexpected error occurred';
    throw new Error(errorMessage);
  }

  return data;
};

export const api = {
  // Auth
  login: (credentials) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  
  // Dashboard
  getDashboardData: () => fetchApi('/api/dashboard/data'),
  getDashboardHistorical: () => fetchApi('/api/dashboard/historical'),
  
  // Services & Catalog
  getServices: () => fetchApi('/api/services'),
  addService: (service) => fetchApi('/api/services', { method: 'POST', body: JSON.stringify(service) }),
  updateService: (id, service) => fetchApi(`/api/services/${id}`, { method: 'PUT', body: JSON.stringify(service) }),
  deleteService: (id) => fetchApi(`/api/services/${id}`, { method: 'DELETE' }),
  
  // Inventory
  getInventory: () => fetchApi('/api/stock'),
  addInventoryItem: (item) => fetchApi('/api/stock', { method: 'POST', body: JSON.stringify(item) }),
  updateInventoryItem: (id, item) => fetchApi(`/api/stock/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventoryItem: (id) => fetchApi(`/api/stock/${id}`, { method: 'DELETE' }),
  
  // Billing
  saveBill: (billData) => fetchApi('/api/billing/save', { method: 'POST', body: JSON.stringify(billData) }),
  getBillHistory: () => fetchApi('/api/billing/history'),
  
  // Users (Admin only)
  getUsers: () => fetchApi('/api/auth/users'),
  registerUser: (userData) => fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  deleteUser: (id) => fetchApi(`/api/auth/users/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => fetchApi('/api/suppliers'),
  addSupplier: (data) => fetchApi('/api/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  getSupplierHistory: (id) => fetchApi(`/api/suppliers/${id}/history`),
  addSupplierBill: (id, data) => fetchApi(`/api/suppliers/${id}/bill`, { method: 'POST', body: JSON.stringify(data) }),

  // Small Income
  getSmallIncomeHistory: () => fetchApi('/api/small-income/history'),
  addSmallIncome: (data) => fetchApi('/api/small-income/add', { method: 'POST', body: JSON.stringify(data) }),

  // Pending Orders
  getPendingOrders: () => fetchApi('/api/pending-orders'),
  addPendingOrder: (data) => fetchApi('/api/pending-orders', { method: 'POST', body: JSON.stringify(data) }),
  completePendingOrder: (id) => fetchApi(`/api/pending-orders/${id}/complete`, { method: 'PUT' }),
  deletePendingOrder: (id) => fetchApi(`/api/pending-orders/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => fetchApi('/api/expenses'),
  addExpense: (data) => fetchApi('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  // Debts
  getDebts: () => fetchApi('/api/debts'),
  addDebt: (data) => fetchApi('/api/debts', { method: 'POST', body: JSON.stringify(data) }),
  settleDebt: (id, data) => fetchApi(`/api/debts/${id}/settle`, { method: 'PUT', body: JSON.stringify(data) }),
  settleMultipleDebts: (data) => fetchApi('/api/debts/settle-multiple', { method: 'POST', body: JSON.stringify(data) }),
  deleteDebt: (id) => fetchApi(`/api/debts/${id}`, { method: 'DELETE' })
};
