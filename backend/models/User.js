const mongoose = require('mongoose');

// Định nghĩa Schema cho người dùng
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
   avatar: {
    type: String,
    default: "", // Giá trị mặc định là một chuỗi rỗng
  },
  favoriteBooks: [
    {
      type: String, // Lưu một mảng các ID của sách dạng chuỗi
    }
  ],
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user', // Mặc định mọi tài khoản mới là 'user'
  },
}, { timestamps: true }); // Tự động thêm 2 trường createdAt và updatedAt

// Tạo và xuất ra Model từ Schema đã định nghĩa
// Mongoose sẽ tự động tạo một collection tên là "users" trong database
module.exports = mongoose.model('User', UserSchema);