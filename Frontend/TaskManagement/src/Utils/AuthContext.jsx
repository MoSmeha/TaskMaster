// src/contexts/AuthContext.js
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
// Import useMemo and useCallback

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "" && storedUser !== "undefined") {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        console.error("Failed to parse user from localStorage:", e);
        localStorage.removeItem("user");
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || null
  );

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Make login, logout, and hasRole functions stable using useCallback
  const login = useCallback(
    (authData) => {
      if (authData && authData.isSuccess) {
        setUser({
          userId: authData.userId,
          username: authData.username,
          email: authData.email,
          roles: authData.roles || [],
        });
        setToken(authData.token);
        return true;
      }
      return false;
    },
    [setUser, setToken]
  ); // Dependencies: state setters are stable references

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
  }, [setUser, setToken]); // Dependencies: state setters are stable references

  const hasRole = useCallback(
    (role) => {
      if (!user || !user.roles) {
        return false;
      }
      return user.roles.includes(role);
    },
    [user]
  ); // Dependency: user object

  // Memoize the value object provided by the context
  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      hasRole, // Use the memoized function
      login, // Use the memoized function
      logout, // Use the memoized function
    }),
    [user, token, hasRole, login, logout]
  ); // Dependencies: recreate value if these change

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
