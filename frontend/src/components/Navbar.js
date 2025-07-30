'use client';

import { useContext, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar'; 
import ThemeToggleButton from './ThemeToggleButton';

export default function Navbar() {
  const { user, dispatch } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); 
  const router = useRouter();
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
  };

  // Xử lý click ra ngoài để đóng dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);


  return (
    <nav className="bg-[var(--navbar-bg)] shadow-sm dark:border-b border-[var(--navbar-border)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-2xl sm:text-3xl font-bold text-blue-700 dark:text-blue-500">
          Buksugai
        </Link>

        {/* --- Menu cho Desktop --- */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggleButton />
          {user ? (
            <>
              {user.role === 'admin' ? (
                <Link href="/admin" className="font-semibold text-blue-500 hover:text-blue-600">Quản lý</Link>
              ) : (
                <Link href="/favorites" className="font-semibold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">Sách Yêu Thích</Link>
              )}
              <div className="relative" ref={dropdownRef}>
                <div onClick={() => setDropdownOpen(!dropdownOpen)}>
                  <Avatar username={user.username} avatarUrl={user.avatar} />
                </div>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--dropdown-bg)] rounded-md shadow-lg py-1 border border-[var(--navbar-border)]">
                    <Link href="/settings" className="block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Cài đặt</Link>
                    <button onClick={handleLogout} className="w-full text-left block px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Đăng xuất</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 font-semibold text-[var(--muted-foreground)] rounded-md hover:bg-[var(--hover-bg)]">Đăng nhập</Link>
              <Link href="/register" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">Đăng ký</Link>
            </>
          )}
        </div>

        {/* --- Nút = cho Mobile --- */}
        <div className="md:hidden flex items-center">
            <ThemeToggleButton />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="ml-2 p-2 rounded-md text-[var(--foreground)]">
                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    )}
                </svg>
            </button>
        </div>
      </div>

      {/* --- Menu cho Mobile --- */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {user ? (
            <>
              {user.role === 'admin' ? (
                 <Link href="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-yellow-400">Quản lý</Link>
              ) : (
                 <Link href="/favorites" className="block px-3 py-2 rounded-md text-base font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Sách Yêu Thích</Link>
              )}
              <Link href="/settings" className="block px-3 py-2 rounded-md text-base font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Cài đặt</Link>
              <button onClick={handleLogout} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-[var(--hover-bg)]">Đăng xuất</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Đăng nhập</Link>
              <Link href="/signup" className="block px-3 py-2 rounded-md text-base font-medium text-[var(--foreground)] hover:bg-[var(--hover-bg)]">Đăng ký</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}