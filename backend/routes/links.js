const router = require('express').Router();
const PurchaseLink = require('../models/PurchaseLink');
const { verifyToken, verifyAdmin } = require('../verifyToken'); 
const axios = require('axios');

// --- LẤY TẤT CẢ LINK CỦA MỘT CUỐN SÁCH ---
router.get("/:bookId", async (req, res) => {
    try {
        // Sắp xếp theo isPrimary (true lên trước), sau đó đến upvotes
        const links = await PurchaseLink.find({ 
            bookId: req.params.bookId,
            status: 'approved' // <-- CHỈ LẤY LINK ĐÃ DUYỆT
        }).sort({ isPrimary: -1, upvotes: -1 });
        res.status(200).json(links);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- NGƯỜI DÙNG GỬI MỘT LINK MỚI ---
router.post("/", verifyToken, async (req, res) => {
    try {
        const longUrl = req.body.url;
        let shortUrl = longUrl; // Mặc định

        // Gọi API của TinyURL để rút gọn link
        try {
            const tinyUrlRes = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
            if (tinyUrlRes.data && tinyUrlRes.data !== "Error") {
                shortUrl = tinyUrlRes.data;
            }
        } catch (tinyErr) {
            console.error("Lỗi khi rút gọn link:", tinyErr);
            // Dùng link cũ
        }
        
        const newLinkData = {
            ...req.body,
            shortUrl: shortUrl,
            // Nếu người gửi là admin, tự động duyệt
            status: req.user.role === 'admin' ? 'approved' : 'pending' 
        };
        
        const newLink = new PurchaseLink(newLinkData);
        const savedLink = await newLink.save();
        res.status(201).json(savedLink);

    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT ĐẶT LINK LÀM LINK CHÍNH (ADMIN ONLY) ---
router.put("/:linkId/set-primary", verifyAdmin, async (req, res) => {
    try {
        const linkToUpdate = await PurchaseLink.findById(req.params.linkId);
        if (!linkToUpdate) {
            return res.status(404).json("Không tìm thấy link.");
        }

        // Bước 1: Đặt tất cả các link khác của cuốn sách này thành not primary
        await PurchaseLink.updateMany(
            { bookId: linkToUpdate.bookId },
            { $set: { isPrimary: false } }
        );

        // Bước 2: Đặt link được chọn thành primary
        linkToUpdate.isPrimary = true;
        await linkToUpdate.save();

        res.status(200).json("Đã cập nhật link chính thành công.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT XÓA LINK MUA SÁCH (ADMIN ONLY) ---
router.delete("/:linkId", verifyAdmin, async (req, res) => {
    try {
        await PurchaseLink.findByIdAndDelete(req.params.linkId);
        res.status(200).json("Link đã được xóa.");
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;