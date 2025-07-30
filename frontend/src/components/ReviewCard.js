'use client';

import Avatar from './Avatar';

// Component hiển thị các rating
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

export default function ReviewCard({ review, onUpvote, currentUser, handleDelete, isAdmin }) {
  // Lấy dữ liệu an toàn, phòng trường hợp user bị xóa
  const username = review.userId?.username || "Người dùng ẩn danh";
  const avatarUrl = review.userId?.avatar;
  const hasUpvoted = review.upvoters?.includes(currentUser?._id);
  
  return (
    <div className="relative border-b border-[var(--navbar-border)] py-4 group">
      <div className="flex items-center mb-2">
        <Avatar username={username} avatarUrl={avatarUrl} />
        <div className="ml-3">
          <p className="font-semibold text-sm">{username}</p>
          <StarRating rating={review.rating} />
        </div>
      </div>
      <p className="text-[var(--muted-foreground)] pr-8">
        {review.comment}
      </p>

      {/* Hiển thị nút xóa nếu là admin */}
      {isAdmin && (
          <button
              onClick={() => handleDelete(review._id)}
              className="absolute top-4 right-0 p-1.5 rounded-full text-gray-400 hover:bg-[var(--hover-bg)] hover:text-red-500 transition opacity-0 group-hover:opacity-100"
              title="Xóa đánh giá"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
          </button>
      )}

      <div className="mt-2 flex items-center space-x-4">
          <button 
              onClick={() => onUpvote(review._id)} 
              disabled={!currentUser}
              className={`flex items-center space-x-1 text-sm ${hasUpvoted ? 'text-blue-500' : 'text-[var(--muted-foreground)]'} disabled:cursor-not-allowed`}
          >
              <span>👍</span>
              <span>{review.upvoteCount || 0}</span>
          </button>
      </div>
    </div>
  );
}