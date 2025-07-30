'use client';

import { createContext, useEffect, useReducer } from 'react';

const INITIAL_STATE = {
  user: null,
  loading: false,
  error: null,
};

// Tải trạng thái ban đầu từ localStorage nếu có
try {
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      INITIAL_STATE.user = JSON.parse(storedUser);
    }
  }
} catch (error) {
  console.error("Failed to parse user from localStorage", error);
  INITIAL_STATE.user = null;
}

export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {

  console.log("AuthReducer action:", action.type, "Payload:", action.payload);

  switch (action.type) {
    case 'LOGIN_START':
      return { user: null, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      if (typeof action.payload !== 'object' || !action.payload.accessToken) {
        console.error("LOGIN_SUCCESS payload is invalid:", action.payload);
        return { user: null, loading: false, error: "Dữ liệu đăng nhập không hợp lệ." };
      }
      return { user: action.payload, loading: false, error: null };
    case 'LOGIN_FAILURE':
      return { user: null, loading: false, error: action.payload };
    case 'LOGOUT':
      localStorage.removeItem('user'); // Xóa user khỏi localStorage khi logout
      return { user: null, loading: false, error: null };
    case 'UPDATE_FAVORITES':
      return {
        ...state,
        user: {
          ...state.user,
          favoriteBooks: action.payload,
        },
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };
    default:
      return state;
  }
};

export const AuthContextProvider = ({ children }) => {
  const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

  useEffect(() => {
    // Cập nhật localStorage
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('user');
    }
  }, [state.user]);
  
  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        loading: state.loading,
        error: state.error,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};