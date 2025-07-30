'use client'; 

import React from 'react';
import { useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import useFetch from '@/hooks/useFetch';
import ReviewCard from '@/components/ReviewCard'; 
import ReviewForm from '@/components/ReviewForm'; 
import Toast from '@/components/Toast'; 
import ConfirmationModal from '@/components/ConfirmationModal';


export default function BookDetailPage({ params }) {
  const { id } = React.use(params);
  const { user, dispatch } = useContext(AuthContext); // Lấy thông tin người dùng từ context
  const [reviews, setReviews] = useState([]); // State để lưu danh sách review

  const [toast, setToast] = useState({ message: '', type: 'success', show: false });

  // Sử dụng hook useFetch để lấy dữ liệu sách
  const { data: book, loading, error } = useFetch(
    id ? `https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}` : null
  );

  // Kiểm tra xem sách này đã được yêu thích chưa
  const [isFavorited, setIsFavorited] = useState(false);

  // State để quản lý modal xóa review
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  const [purchaseLinks, setPurchaseLinks] = useState([]);

  // STATE cho Form thêm Link
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");


  // useEffect để cập nhật isFavorited mỗi khi user hoặc id thay đổi
  useEffect(() => {
    setIsFavorited(user?.favoriteBooks?.includes(id));
  }, [user, id]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, show: true });
  };
 
  const handleToggleFavorite = async () => {
    if (!user) return;
    const endpoint = isFavorited ? 'unfavorite' : 'favorite';
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/${endpoint}`, {
        userId: user._id,
        bookId: id,
      });

      // Cập nhật lại context
      const updatedFavorites = isFavorited
        ? user.favoriteBooks.filter(bookId => bookId !== id)
        : [...user.favoriteBooks, id];
      
      dispatch({ type: 'UPDATE_FAVORITES', payload: updatedFavorites });
      showToast(isFavorited ? "Đã xóa khỏi yêu thích." : "Đã thêm vào yêu thích!", "success");

    } catch (err) {
      showToast("Có lỗi xảy ra, vui lòng thử lại.", "error");
      console.error(err);
    }
  };

  const handleDeleteReview = (reviewId) => {
        setReviewToDelete(reviewId); // Lưu ID của review cần xóa
        setIsReviewModalOpen(true);  // Mở modal xác nhận
    };

  // Hàm thực hiện xóa sau khi người dùng xác nhận
  const confirmDeleteReview = async () => {
      if (!reviewToDelete) return;

      try {
          await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewToDelete}`, {
              headers: { Authorization: `Bearer ${user.accessToken}` }
          });
          setReviews(reviews.filter(review => review._id !== reviewToDelete));
          showToast("Đã xóa đánh giá.");
      } catch (err) {
          showToast("Xóa thất bại!", "error");
      } finally {
          // Đóng modal và reset state
          setIsReviewModalOpen(false);
          setReviewToDelete(null);
      }
  };

  // --- HÀM XỬ LÝ GỬI LINK MỚI ---
    const handleAddLink = async (e) => {
        e.preventDefault();
        if (!storeName || !linkUrl) {
            return showToast("Vui lòng điền đủ thông tin.", "warning");
        }
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/links`, {
                bookId: id,
                storeName,
                url: linkUrl,
                submittedBy: user._id,
            }, {
                headers: {
                    Authorization: `Bearer ${user.accessToken}`
            }
            });
            setPurchaseLinks(prevLinks => [...prevLinks, res.data]); // Cập nhật UI ngay lập tức
            showToast("Thêm link thành công!");
            // Reset và đóng form
            setStoreName("");
            setLinkUrl("");
            setShowLinkForm(false);
        } catch (error) {
            showToast("Thêm link thất bại.", "error");
        }
    };

    const handleSetPrimary = async (linkId) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/links/${linkId}/set-primary`, {}, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            // Tải lại danh sách link để cập nhật UI
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/links/${id}`);
            setPurchaseLinks(res.data);
            showToast("Đã cập nhật link chính.");
        } catch (error) {
            showToast("Cập nhật thất bại!", "error");
        }
    };

    const handleDeleteLink = async (linkId) => {
        if (window.confirm("Bạn có chắc muốn xóa link này?")) {
            try {
                await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/links/${linkId}`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                });
                setPurchaseLinks(purchaseLinks.filter(link => link._id !== linkId));
                showToast("Đã xóa link.");
            } catch (error) {
                showToast("Xóa thất bại!", "error");
            }
        }
    };

    // Hàm handleUpvote
    const handleUpvote = async (reviewId) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}/upvote`, {}, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            // Tải lại review để cập nhật số vote
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}`);
            setReviews(res.data);
        } catch (err) {
            showToast("Có lỗi xảy ra.", "error");
        }
    };

  // Lấy danh sách review khi trang được tải
  useEffect(() => {
    const fetchLinks = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/links/${id}`);
            setPurchaseLinks(res.data);
        } catch (err) {
            console.error("Lỗi khi tải link mua sách:", err);
        }
    };
    if (id) {
        fetchLinks();
    };
    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${id}`);
            setReviews(res.data);
        } catch (err) {
            console.error("Lỗi khi tải review:", err);
        }
    };
    if (id) {
        fetchReviews();
    }
  }, [id]);

  

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-72px)]">
        <p>Đang tải thông tin sách...</p>
      </div>
    );
  }

  if (error || !book) {
    return <div className="text-center p-8">Không tìm thấy thông tin sách.</div>;
  }

  const { volumeInfo } = book;
  let imageUrl = volumeInfo.imageLinks?.thumbnail || "/placeholder.png";
  if (imageUrl && imageUrl.includes('zoom=1')) {
    imageUrl = imageUrl.replace('zoom=1', 'zoom=3s');
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        {/* Cột ảnh bìa */}
        <div className="md:col-span-1">
          <div className="sticky top-24 flex justify-center">
            <div className="w-64 h-96 relative shadow-xl rounded-lg">
              <Image
                src={imageUrl}
                alt={`Bìa sách ${volumeInfo.title}`}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Cột thông tin sách */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-bold mb-2">{volumeInfo.title}</h1>
          <p className="text-xl text-[var(--muted-foreground)] mb-6">
            bởi {volumeInfo.authors?.join(', ') || "Không rõ tác giả"}
          </p>

          {/* Các nút */}
          <div className="flex items-center space-x-4 mb-8">
            {user && (
              <button 
                onClick={handleToggleFavorite} 
                className={`px-5 py-3 font-bold border-2 rounded-lg transition duration-300 flex items-center gap-2 ${
                  isFavorited 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-transparent border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <span>{isFavorited ? '💖 Đã yêu thích' : '❤ Thêm vào Yêu thích'}</span>
              </button>
            )}
            {volumeInfo.previewLink && (
              <a 
                href={volumeInfo.previewLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-5 py-3 font-bold text-[var(--foreground)] bg-transparent border-2 border-[var(--navbar-border)] rounded-lg hover:bg-[var(--hover-bg)] transition duration-300"
              >
                📖 Đọc thử
              </a>
            )}
            {purchaseLinks.length > 0 && (
                <a 
                    href={purchaseLinks[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition duration-300 flex items-center gap-2"
                >
                  <span>🛒</span> Mua ngay
                </a>
            )}
          </div>
          
          {/* Thông tin chi tiết */}
          <div className="space-y-4 mb-8 text-sm">
            <div className="flex">
              <span className="w-32 font-semibold text-[var(--muted-foreground)]">Nhà xuất bản</span>
              <span>{volumeInfo.publisher || "Không rõ"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-[var(--muted-foreground)]">Ngày xuất bản</span>
              <span>{volumeInfo.publishedDate || "Không rõ"}</span>
            </div>
            <div className="flex">
              <span className="w-32 font-semibold text-[var(--muted-foreground)]">Số trang</span>
              <span>{volumeInfo.pageCount || "Không rõ"}</span>
            </div>
          </div>
          
          {/* Mô tả sách */}
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="font-bold text-lg">Mô tả</h3>
            <div dangerouslySetInnerHTML={{ __html: volumeInfo.description || "<p>Không có mô tả.</p>" }} />
          </div>
        </div>
      </div>

          {/* --- NƠI CÓ THỂ MUA SÁCH --- */}
          <div className="mb-8">
              <h3 className="font-bold text-lg mb-4">Bạn có thể tìm mua</h3>
              <div className="space-y-3">
                  {/* --- GIAO DIỆN CHO ADMIN --- */}
                  {user?.role === 'admin' && purchaseLinks.map(link => (
                      <div key={link._id} className="flex items-center justify-between p-3 bg-[var(--hover-bg)] rounded-lg">
                          <div>
                              <p className="font-semibold">{link.storeName} {link.isPrimary && "⭐"}</p>
                              <a href={link.shortUrl} target="_blank" className="text-xs text-[var(--muted-foreground)] italic hover:underline truncate max-w-xs">{link.shortUrl}</a>
                          </div>
                          <div className="flex items-center space-x-3">
                              {!link.isPrimary && (
                                  <button onClick={() => handleSetPrimary(link._id)} className="text-xs text-blue-500 hover:underline">Đặt làm chính</button>
                              )}
                              <button onClick={() => handleDeleteLink(link._id)} className="text-xs text-red-500 hover:underline">Xóa</button>
                          </div>
                      </div>
                  ))}

                  {/* --- GIAO DIỆN CHO USER THƯỜNG --- */}
                  {user?.role !== 'admin' && (
                      purchaseLinks.length > 0 ? (
                          purchaseLinks.map(link => (
                              <a 
                                  key={link._id} 
                                  href={link.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-3 bg-[var(--hover-bg)] rounded-lg hover:ring-2 hover:ring-blue-500 transition"
                              >
                                  <span className="font-semibold">{link.storeName}</span>
                                  <span className="text-sm text-blue-500">Đi đến trang mua →</span>
                              </a>
                          ))
                      ) : (
                          <p className="text-sm text-[var(--muted-foreground)]">Chưa có gợi ý nào về nơi mua cuốn sách này.</p>
                      )
                  )}
            </div>

              {/* Form để thêm link mới */}
              {user && (
                  <div className="mt-4">
                      {!showLinkForm ? (
                          <p className="text-sm text-[var(--muted-foreground)]">
                              Đóng góp link mua sách? 
                              <button onClick={() => setShowLinkForm(true)} className="ml-1 font-semibold text-blue-500 hover:underline">
                                  Thêm link   
                              </button>
                          </p>
                      ) : (
                          <form onSubmit={handleAddLink} className="p-4 mt-4 border border-[var(--navbar-border)] rounded-lg space-y-3">
                              <input 
                                  type="text" 
                                  placeholder="Tên sàn TMĐT (ví dụ: Shopee, Tiki, Fahasa...)"
                                  value={storeName}
                                  onChange={(e) => setStoreName(e.target.value)}
                                  className="w-full px-3 py-2 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md"
                              />
                              <input 
                                  type="url"
                                  placeholder="Dán link sản phẩm vào đây..."
                                  value={linkUrl}
                                  onChange={(e) => setLinkUrl(e.target.value)}
                                  className="w-full px-3 py-2 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md"
                              />
                              <div className="flex justify-end space-x-2">
                                  <button type="button" onClick={() => setShowLinkForm(false)} className="px-3 py-1 text-xs rounded-md hover:bg-[var(--hover-bg)]">Hủy</button>
                                  <button type="submit" className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700">Lưu</button>
                              </div>
                          </form>
                      )}
                  </div>
              )}
          </div>
          
          {/* REVIEW */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Đánh giá của độc giả</h2>
            {/* Form review chỉ hiện khi đã đăng nhập */}
            {user && (
              <ReviewForm 
                bookId={id} 
                onReviewSubmitted={(newReview) => {
                    // Thêm review mới vào đầu danh sách để cập nhật giao diện ngay lập tức
                    setReviews([newReview, ...reviews]);
                }}
              />
            )}
        
            {/* Danh sách các review */}
            <div className="mt-8">
                {reviews.length > 0 ? (
                    reviews.map(review => (
                        <ReviewCard 
                            key={review._id} 
                            review={review} 
                            onUpvote={handleUpvote} 
                            currentUser={user} 
                            isAdmin={user?.role === 'admin'}
                            handleDelete={handleDeleteReview}
                        />
                    ))
                ) : (
                    <p className="text-[var(--muted-foreground)]">Chưa có đánh giá nào cho cuốn sách này.</p>
                )}
            </div>
          </div>

          {/* Modal xác nhận xóa review */}
          <ConfirmationModal
              isOpen={isReviewModalOpen}
              title="Xác nhận Xóa Đánh giá"
              message="Bạn có chắc chắn muốn xóa vĩnh viễn đánh giá này không?"
              onConfirm={confirmDeleteReview}
              onCancel={() => setIsReviewModalOpen(false)}
          />

          {/* Render Toast */}
          {toast.show && (
              <Toast 
                  message={toast.message} 
                  type={toast.type} 
                  onClose={() => setToast({ ...toast, show: false })}
              />
          )}

    </div>
  );
}