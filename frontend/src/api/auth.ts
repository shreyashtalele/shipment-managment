const BASE_URL = "http://localhost:8000";

/**
 * Logs in the user and stores access token in localStorage
 */
export const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await res.json();

    // ✅ Save access token to localStorage
    localStorage.setItem("token", data.access_token);

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
};

/**
 * Registers a new user
 */
export const registerUser = async (email: string, password: string) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || "Registration failed");
    }

    return res.json();
  } catch (err) {
    console.error("Registration error:", err);
    throw err;
  }
};

/**
 * Get token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem("token");
};

/**
 * Clear token on logout
 */
export const logoutUser = () => {
  localStorage.removeItem("token");
};
