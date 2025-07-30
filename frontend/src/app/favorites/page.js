'use client';

import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import BookCard from '@/components/BookCard';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
    const [favoriteBooks, setFavoriteBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, dispatch } = useContext(AuthContext);
    const router = useRouter();

    useEffect(() => {
        // Nếu không có user, chuyển về trang đăng nhập
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchFavorites = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/favorites`);
                setFavoriteBooks(res.data);
            } catch (err) {
                console.error("Lỗi khi lấy danh sách yêu thích:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user, router]);

    const handleRemoveFavorite = async (bookId) => {
    if (!user) return;
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/unfavorite`, {
        userId: user._id,
        bookId: bookId,
      });
      // Cập nhật giao diện và context
      const updatedFavorites = user.favoriteBooks.filter(id => id !== bookId);
      dispatch({ type: 'UPDATE_FAVORITES', payload: updatedFavorites });
      setFavoriteBooks(prev => prev.filter(book => book.id !== bookId));
    } catch (err) {
      alert("Lỗi khi xóa sách.");
      console.error(err);
    }
  };

    if (loading) {
        return <div className="text-center p-8">Đang tải danh sách yêu thích của bạn...</div>;
    }

    return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Sách Yêu Thích Của Tôi</h1>
      {favoriteBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {favoriteBooks.map((book) => (
            <div key={book.id} className="relative group">
              <BookCard book={book} />
              <button 
                onClick={() => handleRemoveFavorite(book.id)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Xóa khỏi yêu thích"
              >
                {/* Icon thùng rác */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>Bạn chưa có cuốn sách yêu thích nào.</p>
      )}
    </div>
  );
}