const mongoose = require('mongoose');

const PurchaseLinkSchema = new mongoose.Schema({
  bookId: {
    type: String,
    required: true,
    index: true, // Đánh index để tìm kiếm nhanh hơn
  },
  storeName: {
    type: String,
    required: true, // Ví dụ: "Tiki", "Shopee", "Fahasa"
  },
  url: {
    type: String,
    required: true,
  },
  shortUrl: {
     type: String 
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  upvotes: {
    type: Number,
    default: 1,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // Các trạng thái hợp lệ
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('PurchaseLink', PurchaseLinkSchema);