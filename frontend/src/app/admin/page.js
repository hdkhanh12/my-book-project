'use client';

import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image'; 
import Toast from '@/components/Toast';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function AdminPage() {
    const { user } = useContext(AuthContext);
    const router = useRouter();
    const [stats, setStats] = useState({ userCount: 0, reviewCount: 0 });
    const [reviews, setReviews] = useState([]);
    const [users, setUsers] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [links, setLinks] = useState([]);
    const [booksWithLinks, setBooksWithLinks] = useState([]);
    const [pendingLinks, setPendingLinks] = useState([])
    const [bookTitles, setBookTitles] = useState({});
    const [bookInfoMap, setBookInfoMap] = useState({});
    
    // State cho Modal và Toast
    const [toast, setToast] = useState({ message: '', type: 'success', show: false });
    const [reviewToDelete, setReviewToDelete] = useState(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    // State cho việc sửa review 
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editedComment, setEditedComment] = useState("")

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            router.push('/'); // Chuyển hướng nếu không phải admin
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, reviewsRes, usersRes, booksWithLinksRes, pendingLinksRes] = await Promise.all([
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
                        headers: { Authorization: `Bearer ${user.accessToken}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews`, {
                        headers: { Authorization: `Bearer ${user.accessToken}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
                        headers: { Authorization: `Bearer ${user.accessToken}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/books-with-links`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                    }),
                    axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/links/pending`, {
                    headers: { Authorization: `Bearer ${user.accessToken}` }
                    }),
                ]);

                // Cập nhật các state chính
                setStats(statsRes.data);
                const fetchedReviews = reviewsRes.data; // Lưu reviews vào biến tạm
                setReviews(reviewsRes.data);
                setUsers(usersRes.data);
                setPendingLinks(pendingLinksRes.data);
                
                /* Làm giàu dữ liệu cho Sách đã có Link mua */
                // Lấy danh sách bookId từ API
                const bookIds = booksWithLinksRes.data;

                // Gọi Google Books API cho từng ID để lấy thông tin chi tiết
                const bookDetailsPromises = bookIds.map(id =>
                    axios.get(`https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`)
                );                
                const bookDetailsResponses = await Promise.all(bookDetailsPromises);
                const detailedBooks = bookDetailsResponses.map(res => res.data);
                setBooksWithLinks(detailedBooks);
                
                /* Làm giàu dữ liệu cho Quản lý Đánh giá */
                if (fetchedReviews.length > 0) {
                    const uniqueBookIdsFromReviews = [...new Set(fetchedReviews.map(r => r.bookId))];
                    const reviewBookDetailsPromises = uniqueBookIdsFromReviews.map(id =>
                        axios.get(`https://www.googleapis.com/books/v1/volumes/${id}?key=${process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY}`)
                    );
                    const reviewBookDetailsResponses = await Promise.all(reviewBookDetailsPromises);

                    const infoMap = {};
                    reviewBookDetailsResponses.forEach(res => {
                        if (res.data) {
                            infoMap[res.data.id] = {
                                title: res.data.volumeInfo.title,
                                imageUrl: res.data.volumeInfo.imageLinks?.thumbnail
                            };
                        }
                    });
                    setBookInfoMap(infoMap);
                }

            } catch (error) {
                console.error("Lỗi khi tải dữ liệu admin:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, router]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
    };

    const handleDeleteReview = async (reviewId) => {
        setReviewToDelete(reviewId);
        setIsReviewModalOpen(true);
    };

    const confirmDeleteReview = async () => {
        if (!reviewToDelete) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewToDelete}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setReviews(reviews.filter(r => r._id !== reviewToDelete));
            showToast("Đã xóa đánh giá.");
        } catch (error) {
            showToast("Xóa thất bại!", "error");
        } finally {
            setIsReviewModalOpen(false);
            setReviewToDelete(null);
        }
    };

    // Hàm xóa user
    const handleDeleteUser = (userId) => {
        setUserToDelete(userId);
        setIsUserModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userToDelete}`, {
                headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            setUsers(users.filter(u => u._id !== userToDelete));
            showToast("Đã xóa người dùng.");
        } catch (error) {
            showToast("Xóa thất bại!", "error");
        } finally {
            setIsUserModalOpen(false);
            setUserToDelete(null);
        }
    };


    const handleEditClick = (review) => {
        setEditingReviewId(review._id);
        setEditedComment(review.comment);
    };

    const handleSaveEdit = async (reviewId) => {
        try {
            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/${reviewId}`,
                { comment: editedComment },
                { headers: { Authorization: `Bearer ${user.accessToken}` } }
            );
            // Cập nhật lại review trong state
            setReviews(reviews.map(r => r._id === reviewId ? res.data : r));
            showToast("Đã cập nhật đánh giá.");
        } catch (error) {
            showToast("Cập nhật thất bại!", "error");
        } finally {
            setEditingReviewId(null);
        }
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditedComment("");
    };

    const handleSetPrimary = async (linkId) => {
        try {
                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/links/${linkId}/set-primary`, {}, {
            headers: { Authorization: `Bearer ${user.accessToken}` }
            });
            // Tải lại dữ liệu links để cập nhật giao diện
            const linksRes = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/links`);
            setLinks(linksRes.data);
            showToast("Đã cập nhật link chính.");
        } catch (error) {
            showToast("Cập nhật thất bại!", "error");
        }
    };

    const handleLinkApproval = async (linkId, status) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/links/${linkId}/status`, 
                { status },
                { headers: { Authorization: `Bearer ${user.accessToken}` } }
            );
            setPendingLinks(pendingLinks.filter(link => link._id !== linkId));
            showToast(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} link.`);
        } catch (error) {
            showToast("Thao tác thất bại!", "error");
        }
    };

    if (loading) {
        return <div className="text-center p-8">Đang tải trang quản trị...</div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8">Trang Quản trị</h1>

            {/* Phần thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[var(--navbar-bg)] p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[var(--muted-foreground)]">Tổng người dùng</h2>
                    <p className="text-4xl font-bold">{stats.userCount}</p>
                </div>
                <div className="bg-[var(--navbar-bg)] p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold text-[var(--muted-foreground)]">Tổng đánh giá</h2>
                    <p className="text-4xl font-bold">{stats.reviewCount}</p>
                </div>
            </div>

            {/* Phần quản lý người dùng */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Quản lý Người dùng</h2>
                <div className="overflow-x-auto">
                <div className="bg-[var(--navbar-bg)] p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
                    {users.map(u => (
                        <div key={u._id} className="flex items-center justify-between border-b border-[var(--navbar-border)] py-3 last:border-b-0">
                            <div>
                                <p className="font-semibold">{u.username} <span className="text-xs text-blue-500">{u.role}</span></p>
                                <p className="text-sm text-[var(--muted-foreground)]">{u.email}</p>
                            </div>
                            <button onClick={() => handleDeleteUser(u._id)} className="text-red-500 hover:text-red-700">Xóa</button>
                        </div>
                    ))}
                </div></div>
            </div>

            {/* Phần quản lý Link mua sách */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Sách đã có Link mua</h2>
                <div className="overflow-x-auto">
                <div className="bg-[var(--navbar-bg)] p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
                    {booksWithLinks.map(book => (
                        <div key={book.id} className="flex items-center justify-between border-b border-[var(--navbar-border)] py-3 last:border-b-0">
                            <div className="flex items-center gap-4">
                                <Image 
                                    src={book.volumeInfo.imageLinks?.thumbnail || '/placeholder.png'}
                                    alt={book.volumeInfo.title}
                                    width={40}
                                    height={60}
                                    className="rounded-md object-cover"
                                />
                                <div>
                                    <p className="font-semibold truncate max-w-md">{book.volumeInfo.title}</p>
                                    <p className="text-xs text-[var(--muted-foreground)] font-mono">{book.id}</p>
                                </div>
                            </div>
                            <Link href={`/book/${book.id}`} className="text-blue-500 hover:underline font-semibold flex-shrink-0 ml-4">
                                Quản lý
                            </Link>
                        </div>
                    ))}
                </div>
                </div>
            </div>

            {/* Phần quản lý đánh giá */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Quản lý Đánh giá</h2>
                <div className="overflow-x-auto">
                <div className="bg-[var(--navbar-bg)] p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
                    {reviews.map(review => (
                        <div key={review._id} className="border-b border-[var(--navbar-border)] py-4 last:border-b-0">
                            {/* --- Phần thông tin review --- */}
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <Image
                                        src={bookInfoMap[review.bookId]?.imageUrl || '/placeholder.png'}
                                        alt="Book cover"
                                        width={48}
                                        height={72}
                                        className="rounded-md object-cover flex-shrink-0"
                                    />
                                    <div>
                                        <p className="font-semibold">{review.userId?.username || 'Người dùng đã xóa'}</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">
                                            Trong sách: 
                                            <Link href={`/book/${review.bookId}`} className="hover:underline font-semibold">
                                                {bookInfoMap[review.bookId]?.title || review.bookId}
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                    <button onClick={() => handleEditClick(review)} className="text-gray-500 hover:text-blue-500 transition">Sửa</button>
                                    <button onClick={() => handleDeleteReview(review._id)} className="text-gray-500 hover:text-red-500 transition">Xóa</button>
                                </div>
                            </div>

                            {/* --- Phần sửa hoặc hiển thị comment --- */}
                            <div className="mt-2">
                                {editingReviewId === review._id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editedComment}
                                            onChange={(e) => setEditedComment(e.target.value)}
                                            className="w-full mt-1 p-2 bg-[var(--search-bg)] border border-[var(--navbar-border)] rounded-md text-sm"
                                            rows="3"
                                        />
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={handleCancelEdit} className="px-3 py-1 text-xs rounded-md hover:bg-[var(--hover-bg)]">Hủy</button>
                                            <button onClick={() => handleSaveEdit(review._id)} className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">Lưu</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-[var(--foreground)] italic"></p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>   
                </div>
            </div>


            {/* --- PHẦN DUYỆT LINK MUA SÁCH MỚI --- */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Duyệt Link Mua Sách ({pendingLinks.length})</h2>
                <div className="overflow-x-auto">
                <div className="bg-[var(--navbar-bg)] p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
                    {pendingLinks.map(link => (
                        <div key={link._id} className="...">
                            <div>
                                <p>Sách: {link.bookId}</p>
                                <p>Cửa hàng: {link.storeName}</p>
                                <a href={link.url} /*...*/>{link.shortUrl || link.url}</a>
                                <p>Người gửi: {link.submittedBy?.username}</p>
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={() => handleLinkApproval(link._id, 'approved')} className="text-green-500">Duyệt</button>
                                <button onClick={() => handleLinkApproval(link._id, 'rejected')} className="text-red-500">Từ chối</button>
                            </div>
                        </div>
                    ))}
                    {pendingLinks.length === 0 && <p>Không có link nào chờ duyệt.</p>}
                </div>
                </div>
            </div>

            {/* Modal và Toast */}
            <ConfirmationModal
                isOpen={isUserModalOpen}
                title="Xác nhận Xóa Người dùng"
                message="Bạn có chắc muốn xóa người dùng này? Mọi đánh giá của họ cũng sẽ bị xóa vĩnh viễn."
                onConfirm={confirmDeleteUser}
                onCancel={() => setIsUserModalOpen(false)}
            />
            <ConfirmationModal
                isOpen={isReviewModalOpen}
                title="Xác nhận Xóa Đánh giá"
                message="Bạn có chắc muốn xóa vĩnh viễn đánh giá này không?"
                onConfirm={confirmDeleteReview}
                onCancel={() => setIsReviewModalOpen(false)}
            />
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