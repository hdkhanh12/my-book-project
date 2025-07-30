'use client';

import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';

export default function ReviewForm({ bookId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !comment) {
      alert("Vui lòng cho điểm và viết bình luận.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews`, {
        bookId,
        userId: user._id,
        rating,
        comment,
      });
      onReviewSubmitted(res.data); // Gửi review mới lên component cha
      setComment("");
      setRating(0);
    } catch (err) {
      console.error(err);
      alert("Gửi đánh giá thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 border-t border-[var(--navbar-border)] pt-6">
      <h3 className="text-xl font-bold mb-4">Viết đánh giá của bạn</h3>
      <div className="mb-4">
        <p className="font-semibold mb-2">Cho điểm:</p>
        <div className="flex items-center">
          {[...Array(5)].map((_, index) => {
            const starValue = index + 1;
            return (
              <button
                type="button"
                key={starValue}
                onClick={() => setRating(starValue)}
                className="focus:outline-none"
              >
                <svg
                  className={`w-7 h-7 cursor-pointer ${starValue <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="comment" className="font-semibold mb-2 block">Bình luận:</label>
        <textarea
          id="comment"
          rows="4"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full p-2 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md"
          placeholder="Chia sẻ cảm nhận của bạn..."
        ></textarea>
      </div>
      <button type="submit" disabled={loading} className="px-5 py-2 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
        {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
      </button>
    </form>
  );
}