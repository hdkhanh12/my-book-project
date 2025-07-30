'use client';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Avatar from '@/components/Avatar';
import Toast from '@/components/Toast'; 
import ConfirmationModal from '@/components/ConfirmationModal'; 


export default function SettingsPage() {
    const { user, dispatch } = useContext(AuthContext);
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    // State cho Toast
    const [toast, setToast] = useState({ message: '', type: 'success', show: false });

    const showToast = (message, type = 'success') => {
        setToast({ message, type, show: true });
    };

    useEffect(() => {
        // Nếu không có user, chuyển về trang đăng nhập
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);
   

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/password`, {
                userId: user._id,
                oldPassword,
                newPassword,
            });
            showToast("Đổi mật khẩu thành công!");
            setOldPassword('');
            setNewPassword('');
        } catch (error) {
            showToast(error.response?.data || "Không thể đổi mật khẩu.", "error");
        }
    };

    const handleDeleteAccount = async () => {
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}`, {
                data: { userId: user._id }
            });
            showToast("Xóa tài khoản thành công!");
            dispatch({ type: 'LOGOUT' });
            router.push('/');
        } catch (error) {
            showToast("Lỗi: Không thể xóa tài khoản.", "error");
        } finally {
            setIsModalOpen(false); // Đóng modal
        }
    };
    
    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    }

    
    const handleAvatarUpload = async (e) => {
        e.preventDefault();
        if (!avatarFile) return;

        const data = new FormData();
        data.append("avatar", avatarFile);
        data.append("userId", user._id);

        try {
            const res = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${user._id}/avatar`, data);
        
            // Thêm timestamp vào URL trả về để chống cache
            const newAvatarUrl = `${res.data.avatarUrl}?t=${new Date().getTime()}`;

            // Gọi action UPDATE_USER với avatarUrl mới
            dispatch({ type: "UPDATE_USER", payload: { avatar: newAvatarUrl } });

            // Cập nhật lại state của Toast
            showToast("Cập nhật avatar thành công!");
            setPreview(null);
            setAvatarFile(null);

        } catch (error) {
            showToast("Lỗi: Không thể cập nhật avatar.", "error");
        }
    }

    // Hiển thị một thông báo tải trong khi chờ chuyển hướng
    if (!user) {
        return <div className="text-center p-8">Đang chuyển đến trang đăng nhập...</div>;
    } 

    return (
        <div className="container mx-auto p-8 max-w-2xl">
            <h1 className="text-3xl font-bold mb-8">Cài đặt tài khoản</h1>

            {/* --- Thay đổi Avatar --- */}
            <div className="mb-8 p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Thay đổi Avatar</h2>
                <div className="flex items-center gap-4">
                    {preview 
                        ? <img src={preview} alt="Preview" className="w-20 h-20 rounded-full object-cover" /> 
                        : <Avatar username={user.username} avatarUrl={user.avatar} />
                    }
                    <form onSubmit={handleAvatarUpload}>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        {avatarFile && <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md">Tải lên</button>}
                    </form>
                </div>
            </div>

            {/* --- Đổi mật khẩu --- */}
            <div className="mb-8 p-6 border rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Đổi mật khẩu</h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <input type="password" placeholder="Mật khẩu cũ" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-3 py-2 border rounded-md" />
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Đổi mật khẩu</button>
                </form>
            </div>

            {/* --- Xóa tài khoản --- */}
            <div className="p-6 border border-red-500 rounded-lg">
                <h2 className="text-xl font-semibold text-red-600 mb-4">Xóa tài khoản</h2>
                <p className="mb-4">Hành động này sẽ xóa vĩnh viễn tài khoản và tất cả dữ liệu của bạn.</p>
                <button onClick={handleDeleteAccount} className="px-4 py-2 bg-red-600 text-white rounded-md">Xác nhận xóa</button>
            </div>

            {/* Render Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                title="Xác nhận Xóa tài khoản"
                message="Bạn có chắc chắn muốn xóa tài khoản của mình không? Tất cả dữ liệu sẽ bị mất vĩnh viễn."
                onConfirm={confirmDelete}
                onCancel={() => setIsModalOpen(false)}
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