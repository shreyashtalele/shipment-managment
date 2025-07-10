// api/auth.ts

export const loginUser = async (email: string, password: string) => {
  try {
    const res = await fetch("http://localhost:8000/auth/login", {
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

    return res.json();
  } catch (err) {
    throw err;
  }
};

export const registerUser = async (email: string, password: string) => {
  try {
    const res = await fetch("http://localhost:8000/auth/register", {
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
    throw err;
  }
};
