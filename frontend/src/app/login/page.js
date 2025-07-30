'use client';

import { useContext, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const { loading, error, dispatch } = useContext(AuthContext);
  const router = useRouter();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch({ type: 'LOGIN_START' });
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, credentials);
      dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
      router.push('/');
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE', payload: err.response.data });
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-[var(--navbar-bg)] text-[var(--foreground)] rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Đăng nhập</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input 
              type="email" 
              id="email" 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 mt-1 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md" 
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Mật khẩu</label>
            <input 
              type="password" 
              id="password" 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 mt-1 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full px-4 py-2 font-bold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập"}
          </button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </form>
        <p className="text-sm text-center">
            Chưa có tài khoản? <Link href="/signup" className="text-blue-600 hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}