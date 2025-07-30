const router = require('express').Router();
const Review = require('../models/Review');
const jwt = require('jsonwebtoken');
const redis = require('../redisClient');
const { verifyAdmin } = require('../verifyToken');
const { verifyToken } = require('../verifyToken');

// --- ENDPOINT TẠO MỘT REVIEW MỚI ---
router.post("/", verifyToken, async (req, res) => {
  const newReview = new Review({
      ...req.body,
      userId: req.user.id // Lấy userId từ token đã xác thực
  });
  try {
    const savedReview = await newReview.save();

    // XÓA CACHE CỦA CUỐN SÁCH TƯƠNG ỨNG
    const cacheKey = `reviews:${req.body.bookId}`;
    await redis.del(cacheKey);
    // console.log(`CACHE CLEARED for ${cacheKey}`);

    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- ENDPOINT LẤY TẤT CẢ REVIEW CỦA MỘT CUỐN SÁCH ---
router.get("/:bookId", async (req, res) => {
  const { bookId } = req.params;
  const cacheKey = `reviews:${bookId}`;

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
    }

    const reviews = await Review.aggregate([
        { $match: { bookId: req.params.bookId } },
        { $addFields: { upvoteCount: { $size: "$upvoters" } } },
        { $sort: { upvoteCount: -1, createdAt: -1 } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $project: { comment: 1, rating: 1, createdAt: 1, upvoteCount: 1, 'user.username': 1, 'user.avatar': 1, upvoters: 1 } }
    ]);

    await redis.set(cacheKey, JSON.stringify(reviews), 'EX', 900);

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json(err);
  }
});

// --- ENDPOINT XÓA REVIEW (CHỈ ADMIN) ---
router.delete("/:id", verifyAdmin, async (req, res) => {
    try {
        await Review.findByIdAndDelete(req.params.id);

        await redis.del('admin:all-reviews', 'admin:stats');

        res.status(200).json("Đánh giá đã được xóa.");
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- ENDPOINT SỬA REVIEW (CHỈ ADMIN) ---
router.put("/:id", verifyAdmin, async (req, res) => {
    try {
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: { comment: req.body.comment } },
            { new: true } // Trả về document đã được cập nhật
        );

        await redis.del('admin:all-reviews', 'admin:stats');
        
        res.status(200).json(updatedReview);
    } catch (err) {
        res.status(500).json(err);
    }
});

// API để upvote
router.put("/:id/upvote", verifyToken, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) return res.status(404).json("Không tìm thấy review.");

        // Logic upvote/un-upvote
        if (review.upvoters.includes(req.user.id)) {
            await review.updateOne({ $pull: { upvoters: req.user.id } });
            res.status(200).json("Đã bỏ upvote.");
        } else {
            await review.updateOne({ $push: { upvoters: req.user.id } });
            res.status(200).json("Đã upvote.");
        }

        // XÓA CACHE CỦA CUỐN SÁCH TƯƠNG ỨNG
        const cacheKey = `reviews:${review.bookId}`;
        await redis.del(cacheKey);
        // console.log(`CACHE CLEARED for ${cacheKey}`); 

    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;