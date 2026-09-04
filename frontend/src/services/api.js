const API_BASE = "/api";

function getAuthHeaders(isMultipart = false) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isMultipart = options.body instanceof FormData;
  const headers = { ...getAuthHeaders(isMultipart), ...(options.headers || {}) };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || "GET"}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (email, password) =>
      request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (userData) =>
      request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      }),
    getMe: () => request("/auth/me"),
    forgotPassword: (email) =>
      request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  },

  // Users (Admin)
  users: {
    list: (role) => request(role ? `/users?role=${role}` : "/users"),
    updateStatus: (userId, status) =>
      request(`/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // Products
  products: {
    list: (q, categoryId) => {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (categoryId) params.append("category_id", categoryId);
      const qs = params.toString();
      return request(qs ? `/products?${qs}` : "/products");
    },
    get: (id) => request(`/products/${id}`),
    create: (data) =>
      request("/products", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id) =>
      request(`/products/${id}`, {
        method: "DELETE",
      }),
    categories: () => request("/products/categories"),
  },

  // OCR Extraction
  ocr: {
    extract: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return request("/ocr/extract", {
        method: "POST",
        body: formData,
      });
    },
  },

  // Compliance Rule Engine
  compliance: {
    check: (data) =>
      request("/compliance/check", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: (id) => request(`/compliance/${id}`),
    getByProduct: (productId) => request(`/compliance/product/${productId}`),
  },

  // Rules Configuration
  rules: {
    list: (activeOnly = false, category = "") => {
      const params = new URLSearchParams();
      if (activeOnly) params.append("active_only", "true");
      if (category) params.append("category", category);
      const qs = params.toString();
      return request(qs ? `/rules?${qs}` : "/rules");
    },
    get: (id) => request(`/rules/${id}`),
    create: (data) =>
      request("/rules", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      request(`/rules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    toggle: (id) =>
      request(`/rules/${id}/toggle`, {
        method: "PATCH",
      }),
    delete: (id) =>
      request(`/rules/${id}`, {
        method: "DELETE",
      }),
  },

  // Field Inspections
  inspections: {
    list: (status) =>
      request(status ? `/inspections?status_filter=${status}` : "/inspections"),
    get: (id) => request(`/inspections/${id}`),
    create: (data) =>
      request("/inspections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id, status, remarks) =>
      request(`/inspections/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks }),
      }),
  },

  // PDF Reports
  reports: {
    generate: (inspectionId) =>
      request(`/reports/generate/${inspectionId}`, {
        method: "POST",
      }),
    getDownloadUrl: (reportId) => `${API_BASE}/reports/${reportId}/download`,
    getByInspection: (inspectionId) =>
      request(`/reports/inspection/${inspectionId}`),
  },

  // Consumer Complaints
  complaints: {
    list: (status) =>
      request(status ? `/complaints?status_filter=${status}` : "/complaints"),
    create: (data) =>
      request("/complaints", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateStatus: (id, status) =>
      request(`/complaints/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // Dashboard & Analytics
  dashboard: {
    stats: () => request("/dashboard/stats"),
  },

  // System Audit
  audit: {
    list: (limit = 100, action = "", entity = "") => {
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      if (action) params.append("action", action);
      if (entity) params.append("entity", entity);
      return request(`/audit?${params.toString()}`);
    },
  },
};
