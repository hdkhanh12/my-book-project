'use client'; 

import { useState, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import BookCard from '../components/BookCard';
import { ThemeContext } from '@/context/ThemeContext'; 
import "./globals.css";
import BookCardSkeleton from '../components/BookCardSkeleton';


export default function HomePage() {
  const [query, setQuery] = useState('');
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); 
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchWrapperRef = useRef(null);

  // State cho việc tải thêm
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Lấy trạng thái theme từ Context 
  const { theme } = useContext(ThemeContext);

  // useEffect chỉ chạy 1 lần khi trang được tải
  useEffect(() => {
    const fetchTrendingBooks = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trending`);
        setBooks(response.data.items || []);
        setTotalItems(response.data.totalItems || 0);
      } catch (err) {
        setError('Không thể tải sách đang xu hướng.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingBooks();
  }, []); // Mảng rỗng đảm bảo chỉ chạy 1 lần

  const handleSearch = async (e, searchQuery = query) => {
    e.preventDefault(); // Ngăn form reload lại trang
    if (!searchQuery) return;

    setPage(1); // Reset về trang 1
    setBooks([]); // Xóa sách cũ
    setIsLoading(true); 
    setIsLoadingMore(false); 
    setError(null);
    setHasSearched(true);

    try {
      // Gọi API backend
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, { query: searchQuery, page: 1 });
      setBooks(response.data.items || []);
      setTotalItems(response.data.totalItems || 0); // Lưu lại tổng số kết quả
      console.log("Dữ liệu nhận được:", response.data.items); 

      // Cập nhật lịch sử sau khi tìm kiếm thành công
      const newHistory = [searchQuery, ...history.filter(item => item !== searchQuery)].slice(0, 5); // Lưu 5 mục gần nhất
      setHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      setShowHistory(false); // Ẩn box lịch sử

    } catch (err) {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm để tải thêm sách
  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setIsLoadingMore(true); 
    setError(null);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, { query, page: nextPage });
      // Thêm sách mới vào danh sách cũ
      setBooks(prevBooks => [...prevBooks, ...(response.data.items || [])]); 
      setPage(nextPage);
    } catch (err) {
      setError('Lỗi khi tải thêm sách.');
      console.error(err);
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Load lịch sử từ localStorage khi component được tải
  useEffect(() => {
      const savedHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
      setHistory(savedHistory);
  }, []);

  // Xử lý click ra ngoài để đóng box lịch sử
  useEffect(() => {
      function handleClickOutside(event) {
          if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
              setShowHistory(false);
          }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [searchWrapperRef]);


  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">📚 Tìm kiếm cuốn sách yêu thích của bạn</h1>
        <p className="text-1.5xl text-gray-600">Gợi ý các đầu sách theo mô tả</p>
      </div>

    {/* Form tìm kiếm */}
    <div ref={searchWrapperRef} className="relative w-full max-w-2xl mx-auto mb-12">
      <form 
        onSubmit={handleSearch} 
        className="relative bg-[var(--search-bg)] rounded-full shadow-md hover:shadow-lg focus-within:shadow-lg transition-shadow duration-300"
      >
        {/* Icon tìm kiếm */}
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Ô input */}
        <input
          type="text"
          onFocus={() => setShowHistory(true)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm sách hoặc nhập một chủ đề..."
          spellCheck="false" 
          className="w-full h-12 pl-14 pr-12 bg-transparent border-none rounded-full text-[var(--search-text)] focus:outline-none focus:ring-0"
        />
    
        {/* Nút submit ẩn */}
        <button type="submit" className="hidden" aria-label="Tìm kiếm"></button>
        </form>

        {/* Box lịch sử tìm kiếm */}
        {showHistory && history.length > 0 && (
               <div className="absolute top-full mt-2 w-full bg-[var(--navbar-bg)] rounded-lg shadow-lg border border-[var(--navbar-border)] overflow-hidden z-40">
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                    setQuery(item);
                    handleSearch({ preventDefault: () => {} }, item);
                }}
                className="w-full text-left px-5 py-3 text-sm hover:bg-[var(--hover-bg)] transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        )}
    </div>    

      {/* Vùng hiển thị kết quả */}
      <div className="min-h-[400px]">
          <div className="text-center mb-8">
              {hasSearched ? (
                  <h2 className="text-2xl font-bold">Kết quả tìm kiếm</h2>
              ) : (
                  <h2 className="text-2xl font-bold">Có thể bạn quan tâm</h2>
              )}
          </div>

          {/* Nếu đang tải lần đầu, hiển thị Skeleton */}
          {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {Array.from({ length: 12 }).map((_, index) => <BookCardSkeleton key={index} />)}
              </div>
          )}

          {/* Nếu có lỗi, hiển thị lỗi */}
          {!isLoading && error && (
              <p className="text-center text-red-500">{error}</p>
          )}

          {/* Nếu không tải và không có lỗi, hiển thị kết quả */}
          {!isLoading && !error && (
              <>
                  {/* Grid hiển thị sách */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                      {books.map((book, index) => (
                          <BookCard key={`${book.id}-${index}`} book={book} />
                      ))}
                  </div>

                  {/* Thông báo khi không có sách */}
                  {books.length === 0 && (hasSearched || (!hasSearched && !isLoading)) && (
                      <p className="text-center">
                          {hasSearched ? "Không tìm thấy cuốn sách nào phù hợp." : "Không thể tải sách xu hướng."}
                      </p>
                  )}
              </>
          )}
      </div>

      {/* Icon loading khi "tải thêm" */}
      {isLoadingMore && (
          <div className="flex justify-center items-center mt-8">
              <svg className="animate-spin h-8 w-8 text-[var(--foreground)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          </div>
      )}

      {/* Nút Xem Thêm (ẩn đi khi đang tải bất kỳ thứ gì) */}
      {hasSearched && !isLoading && !isLoadingMore && books.length > 0 && books.length < totalItems && (
          <div className="text-center mt-8">
              <button 
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                  Xem thêm
              </button>
          </div>
      )}
    </main>
  );
}