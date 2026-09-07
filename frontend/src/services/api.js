const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

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

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    console.error(`API Connection Failed on [${options.method || "GET"}] ${url}:`, error);
    throw new Error(
      `Unable to connect to backend server at ${url}. Please ensure the FastAPI backend is running on port 8000.`
    );
  }

  if (response.status === 204) {
    return null;
  }

  let data;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    const text = await response.text().catch(() => "");
    data = { detail: text || `HTTP ${response.status} ${response.statusText}` };
  }

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    if (data?.detail) {
      if (typeof data.detail === "string") {
        errorMsg = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMsg = data.detail
          .map((d) => {
            if (typeof d === "string") return d;
            const loc = Array.isArray(d.loc) ? d.loc.filter((p) => p !== "body").join(".") : "";
            return loc ? `${loc}: ${d.msg || JSON.stringify(d)}` : (d.msg || JSON.stringify(d));
          })
          .join("; ");
      } else if (typeof data.detail === "object") {
        errorMsg = JSON.stringify(data.detail);
      }
    }
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
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
    sendOtp: (email) =>
      request("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    requestOtp: (email) =>
      request("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    verifyOtp: (email, otp, requestId = null) =>
      request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify(requestId ? { email, otp, request_id: requestId } : { email, otp }),
      }),
    verifyOtpUnified: (email, otp, requestId) =>
      request("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, request_id: requestId }),
      }),
    refreshToken: (refreshToken) =>
      request("/auth/refresh-token", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken }),
      }),
    forgotPassword: (email) =>
      request("/auth/forgot-password/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    sendPasswordResetOtp: (email) =>
      request("/auth/forgot-password/send-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    verifyPasswordResetOtp: (email, otp) =>
      request("/auth/forgot-password/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    resetPassword: (payload) =>
      request("/auth/forgot-password/reset", {
        method: "POST",
        body: JSON.stringify(payload),
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

  // OCR & Real-Time Barcode Extraction
  ocr: {
    extract: (file) => {
      const formData = new FormData();
      formData.append("file", file);
      return request("/ocr/extract", {
        method: "POST",
        body: formData,
      });
    },
    extractMulti: (files) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      return request("/ocr/extract-multi", {
        method: "POST",
        body: formData,
      });
    },
    extractBatch: (files) => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      return request("/ocr/extract-batch", {
        method: "POST",
        body: formData,
      });
    },
    lookupBarcode: (code) => request(`/ocr/barcode/${encodeURIComponent(code)}`),
    realtimeScan: (data) =>
      request("/ocr/realtime-scan", {
        method: "POST",
        body: JSON.stringify(data),
      }),
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
    issueCompanyNotice: (data) =>
      request("/compliance/issue-company-notice", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getNoticeDownloadUrl: (noticeId) =>
      `${API_BASE}/compliance/notice/${encodeURIComponent(noticeId)}/download`,
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

  // Grievances (Officer Portal)
  grievances: {
    list: (status) =>
      request(status ? `/grievances?status_filter=${status}` : "/grievances"),
    get: (docketId) =>
      request(`/grievances/${encodeURIComponent(docketId)}`),
    update: (docketId, data) =>
      request(`/grievances/${encodeURIComponent(docketId)}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    issueNotice: (docketId, data) =>
      request(`/grievances/${encodeURIComponent(docketId)}/issue-notice`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getNoticeDownloadUrl: (noticeId) => `${API_BASE}/grievances/notice/${encodeURIComponent(noticeId)}/download`,
  },

  // Dashboard & Analytics
  dashboard: {
    stats: () => request("/dashboard/stats"),
    activity: (limit = 20) => request(`/dashboard/activity?limit=${limit}`),
  },

  // Health & Connectivity Check
  health: () => request("/health"),

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
