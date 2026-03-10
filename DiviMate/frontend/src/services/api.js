import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──
export const registerUser = (data) => API.post("/users/register", data);
export const loginUser = (data) => API.post("/users/login", data);
export const getProfile = () => API.get("/users/profile");
export const updateDietType = (data) => API.put("/users/diet", data);
export const updateProfile = (data) => API.put("/users/profile", data);
export const updateEmail = (data) => API.put("/users/email", data);
export const requestPhoneOtp = () => API.post("/users/phone-otp");
export const updatePhone = (data) => API.put("/users/phone", data);
export const uploadAvatar = (formData) =>
  API.put("/users/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Dashboard ──
export const getDashboard = () => API.get("/users/dashboard");
export const getDashboardChartData = () => API.get("/users/dashboard/chart-data");

// ── Groups ──
export const createGroup = (data) => API.post("/groups", data);
export const getMyGroups = () => API.get("/groups");
export const addMember = (data) => API.put("/groups/add-member", data);
export const blockMember = (data) => API.put("/groups/block-member", data);
export const unblockMember = (data) => API.put("/groups/unblock-member", data);
export const inviteMemberByEmail = (data) => API.post("/groups/invite", data);
export const searchUserByEmail = (email) => API.get(`/groups/search-user?email=${encodeURIComponent(email)}`);

// ── Expenses ──
export const addExpense = (data) => API.post("/expenses/add", data);
export const getGroupExpenses = (groupId) => API.get(`/expenses/group/${groupId}`);
export const getGroupChartData = (groupId) => API.get(`/expenses/group/${groupId}/chart-data`);
export const getGroupBalances = (groupId) => API.get(`/expenses/group/${groupId}/balances`);

// ── Settlements ──
export const createSettlement = (data) => API.post("/settlements/create", data);
export const getGroupSettlements = (groupId) => API.get(`/settlements/group/${groupId}`);
export const getMySettlements = () => API.get("/settlements/my");

// ── Notifications ──
export const getNotifications = () => API.get("/notifications");
export const markNotificationsRead = () => API.put("/notifications/mark-read");

// ── AI ──
export const analyzeMenu = (formData) =>
  API.post("/ai/analyze", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Chat ──
export const getGroupMessages = (groupId) => API.get(`/chat/${groupId}`);
export const sendMessageAPI = (groupId, text) => API.post(`/chat/${groupId}`, { text });

export default API;
