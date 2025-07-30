'use client';

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [credentials, setCredentials] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setCredentials((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, credentials);
      router.push('/login');
    } catch (err) {
      setError("Tên người dùng hoặc email đã tồn tại. Vui lòng thử lại.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-[var(--navbar-bg)] text-[var(--foreground)] rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Tạo tài khoản</h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">Tên người dùng</label>
            <input 
              type="text" 
              id="username" 
              onChange={handleChange} 
              required 
              className="w-full px-3 py-2 mt-1 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md" 
            />
          </div>
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
            {loading ? "Đang xử lý..." : "Đăng ký"}
          </button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </form>
        <p className="text-sm text-center">
            Đã có tài khoản? <Link href="/login" className="text-blue-600 hover:underline">Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}