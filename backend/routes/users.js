const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const axios = require('axios');
const { verifyToken } = require('../verifyToken');

// --- Cấu hình Multer để lưu file ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "public/images"); // Lưu file vào thư mục public/images
    },
    filename: (req, file, cb) => {
        // Thêm timestamp để tên file không bị trùng
        cb(null, Date.now() + "_" + file.originalname);
    },
});
const upload = multer({ storage: storage });

// --- ENDPOINT ĐỔI MẬT KHẨU ---
router.put("/:id/password", async (req, res) => {
    if (req.body.userId === req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json("Không tìm thấy người dùng");

            const isPasswordCorrect = await bcrypt.compare(req.body.oldPassword, user.password);
            if (!isPasswordCorrect) return res.status(400).json("Mật khẩu cũ không đúng!");

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.newPassword, salt);
            await user.save();
            res.status(200).json("Cập nhật mật khẩu thành công!");
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Bạn không có quyền thực hiện hành động này.");
    }
});

// --- ENDPOINT XÓA TÀI KHOẢN ---
router.delete("/:id", async (req, res) => {
    if (req.body.userId === req.params.id) {
        try {
            await User.findByIdAndDelete(req.params.id);
            res.status(200).json("Tài khoản đã được xóa.");
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Bạn không có quyền thực hiện hành động này.");
    }
});

// --- ENDPOINT CẬP NHẬT AVATAR ---
// upload.single('avatar') sẽ tự động tải file lên Cloudinary
router.put("/:id/avatar", verifyToken, upload.single('avatar'), async (req, res) => {
     if (req.user.id === req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            // URL của ảnh giờ sẽ là URL bảo mật từ Cloudinary
            const avatarUrl = req.file.path; 
            await user.updateOne({ $set: { avatar: avatarUrl } });
            res.status(200).json({ message: "Cập nhật avatar thành công!", avatarUrl: avatarUrl });
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Bạn không có quyền thực hiện hành động này.");
    }
});

// --- ENDPOINT THÊM SÁCH VÀO DANH SÁCH YÊU THÍCH ---
router.put("/:id/favorite", async (req, res) => {    
    // Kiểm tra xem id người dùng có khớp với id trong request không
    if (req.body.userId === req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            // $addToSet sẽ thêm bookId vào mảng favoriteBooks nếu nó chưa tồn tại
            await user.updateOne({ $addToSet: { favoriteBooks: req.body.bookId } });
            res.status(200).json("Đã thêm sách vào danh sách yêu thích.");
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Bạn không có quyền thực hiện hành động này.");
    }
});

// --- ENDPOINT XÓA SÁCH KHỎI DANH SÁCH YÊU THÍCH ---
router.put("/:id/unfavorite", async (req, res) => {
    if (req.body.userId === req.params.id) {
        try {
            const user = await User.findById(req.params.id);
            // $pull sẽ xóa bookId khỏi mảng favoriteBooks
            await user.updateOne({ $pull: { favoriteBooks: req.body.bookId } });
            res.status(200).json("Đã xóa sách khỏi danh sách yêu thích.");
        } catch (err) {
            res.status(500).json(err);
        }
    } else {
        res.status(403).json("Bạn không có quyền thực hiện hành động này.");
    }
});

// --- ENDPOINT LẤY DANH SÁCH SÁCH YÊU THÍCH ---
router.get("/:id/favorites", async (req, res) => {
    try {
        // 1. Tìm người dùng và chỉ lấy trường favoriteBooks
        const user = await User.findById(req.params.id, 'favoriteBooks');
        if (!user) {
            return res.status(404).json("Không tìm thấy người dùng.");
        }

        // 2. Gọi Google Books API để lấy thông tin chi tiết cho từng bookId
        // Dùng Promise.all để gửi nhiều request cùng lúc, tăng tốc độ
        const bookDetailsPromises = user.favoriteBooks.map(bookId =>
            axios.get(`https://www.googleapis.com/books/v1/volumes/${bookId}?key=${process.env.GOOGLE_BOOKS_API_KEY}`)
        );

        const bookDetailsResponses = await Promise.all(bookDetailsPromises);

        // 3. Trích xuất dữ liệu từ các response
        const favoriteBooksDetails = bookDetailsResponses.map(response => response.data);

        res.status(200).json(favoriteBooksDetails);

    } catch (err) {
        console.error(err);
        res.status(500).json(err);
    }
});

module.exports = router;