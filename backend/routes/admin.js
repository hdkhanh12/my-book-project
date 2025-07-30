const router = require('express').Router();
const User = require('../models/User');
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');
const redis = require('../redisClient');
const PurchaseLink = require('../models/PurchaseLink');
const { verifyAdmin } = require('../verifyToken');

// --- ENDPOINT LẤY THỐNG KÊ ---
router.get("/stats", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:stats';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const userCount = await User.countDocuments();
        const reviewCount = await Review.countDocuments();
        const stats = { userCount, reviewCount };

        await redis.set(cacheKey, JSON.stringify(stats), 'EX', 1800);
        res.status(200).json(stats);
    } catch (err) { res.status(500).json(err); }
});

// --- ENDPOINT LẤY TẤT CẢ REVIEWS ---
router.get("/reviews", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:all-reviews';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const reviews = await Review.find().populate('userId', 'username').sort({ createdAt: -1 });
        await redis.set(cacheKey, JSON.stringify(reviews), 'EX', 900); 
        res.status(200).json(reviews);
    } catch (err) { res.status(500).json(err); }
});

// --- ENDPOINT LẤY TẤT CẢ USERS ---
router.get("/users", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:all-users';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const users = await User.find().select("-password").sort({ createdAt: -1 });
        await redis.set(cacheKey, JSON.stringify(users), 'EX', 900); 
        res.status(200).json(users);
    } catch (err) { res.status(500).json(err); }
});

// --- ENDPOINT XÓA MỘT USER ---
router.delete("/users/:id", verifyAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        // Xóa tất cả review của user này
        await Review.deleteMany({ userId: req.params.id });

        // Xóa các cache liên quan
        await redis.del('admin:all-users', 'admin:stats');

        res.status(200).json("Người dùng đã được xóa.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT LẤY TẤT CẢ LINKS (ADMIN ONLY) ---
router.get("/links", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:all-links';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const links = await PurchaseLink.find().sort({ createdAt: -1 });
        await redis.set(cacheKey, JSON.stringify(links), 'EX', 900);
        res.status(200).json(links);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT LẤY CÁC SÁCH ĐÃ CÓ LINK MUA ---
router.get("/books-with-links", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:books-with-links';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const bookIds = await PurchaseLink.distinct("bookId");
        await redis.set(cacheKey, JSON.stringify(bookIds), 'EX', 900); 
        res.status(200).json(bookIds);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT LẤY CÁC LINK ĐANG CHỜ DUYỆT ---
router.get("/links/pending", verifyAdmin, async (req, res) => {
    const cacheKey = 'admin:pending-links';
    try {
        const cachedData = await redis.get(cacheKey);
        if (cachedData) return res.status(200).json(JSON.parse(cachedData));

        const pendingLinks = await PurchaseLink.find({ status: 'pending' }).populate('submittedBy', 'username');
        await redis.set(cacheKey, JSON.stringify(pendingLinks), 'EX', 900);
        res.status(200).json(pendingLinks);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT DUYỆT/TỪ CHỐI LINK ---
router.put("/links/:linkId/status", verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body; // status sẽ là 'approved' hoặc 'rejected'
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json("Trạng thái không hợp lệ.");
        }
        const updatedLink = await PurchaseLink.findByIdAndUpdate(
            req.params.linkId,
            { $set: { status: status } },
            { new: true }
        );

        await redis.del('admin:pending-links', 'admin:all-links', 'admin:books-with-links');

        res.status(200).json(updatedLink);
    } catch (err) {
        res.status(500).json(err);
    }
});


module.exports = router;