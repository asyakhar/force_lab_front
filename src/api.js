import API_CONFIG from './config';

// Функция для проверки, не истекает ли токен скоро
const isTokenExpiringSoon = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const expiresIn = payload.exp * 1000 - Date.now();
    // Если токен истекает меньше чем через 5 минут - обновить
    return expiresIn < 5 * 60 * 1000;
  } catch (e) {
    return true;
  }
};

// Автоматическое обновление токена
const autoRefreshToken = async () => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  if (!refreshToken) return false;

  try {
    console.log("🔄 Автообновление токена...");
    const response = await fetch(`${API_CONFIG.baseURL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      console.log("✅ Токен обновлен");
      window.dispatchEvent(new Event("authChange"));
      return true;
    } else {
      console.log("❌ Ошибка обновления токена");
      return false;
    }
  } catch (err) {
    console.error("❌ Ошибка сети при обновлении:", err);
    return false;
  }
};

export const fetchWithAuth = async (url, options = {}) => {
  let accessToken = sessionStorage.getItem("accessToken");
  
  // ✅ ПРОВЕРЯЕМ, НЕ НУЖНО ЛИ ОБНОВИТЬ ТОКЕН
  if (accessToken && isTokenExpiringSoon(accessToken)) {
    console.log("⏰ Токен скоро истекает, обновляем...");
    const refreshed = await autoRefreshToken();
    if (refreshed) {
      accessToken = sessionStorage.getItem("accessToken");
    }
  }
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.baseURL}${url}`;
  
  let response = await fetch(fullUrl, { ...options, headers });
  
  // ✅ ЕСЛИ 401 - ПРОБУЕМ ОБНОВИТЬ ТОКЕН
  if (response.status === 401) {
    console.log("🔒 401 - пробуем обновить токен");
    const refreshed = await autoRefreshToken();
    
    if (refreshed) {
      accessToken = sessionStorage.getItem("accessToken");
      headers["Authorization"] = `Bearer ${accessToken}`;
      // Повторяем запрос с новым токеном
      response = await fetch(fullUrl, { ...options, headers });
      console.log("✅ Запрос повторен, статус:", response.status);
    } else {
      // Редирект на логин
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      window.dispatchEvent(new Event("authChange"));
      window.location.href = "/login";
    }
  }
  
  return response;
};

export const api = {
  get: (url, options = {}) => 
    fetchWithAuth(url, { ...options, method: 'GET' }),
  
  post: (url, data, options = {}) => 
    fetchWithAuth(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  put: (url, data, options = {}) => 
    fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  
  delete: (url, options = {}) => 
    fetchWithAuth(url, { ...options, method: 'DELETE' })
};