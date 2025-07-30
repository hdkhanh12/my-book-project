const router = require('express').Router();
const User = require('../models/User'); // Import User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- ENDPOINT ĐĂNG KÝ (REGISTER) ---
router.post("/register", async (req, res) => {
  try {
    // 1. Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // 2. Tạo người dùng mới
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
    });

    // 3. Lưu người dùng vào database và trả về phản hồi
    const user = await newUser.save();
    res.status(201).json(user); 

  } catch (err) {
    // Bắt lỗi nếu username/email trùng lặp hoặc có lỗi khác
    res.status(500).json(err);
  }
});

// --- ENDPOINT ĐĂNG NHẬP (LOGIN) ---
router.post("/login", async (req, res) => {
  try {
    // 1. Tìm người dùng bằng email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json("Người dùng không tồn tại.");
    }

    // 2. So sánh mật khẩu
    const isPasswordCorrect = await bcrypt.compare(req.body.password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json("Sai mật khẩu.");
    }

    // 3. Kiểm tra xem JWT_SECRET_KEY có tồn tại không
    if (!process.env.JWT_SECRET_KEY) {
        return res.status(500).json("Lỗi server: JWT secret key chưa được cấu hình.");
    }

    // 4. Tạo JWT Token
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "3d" }
    );

    // Dùng toObject() để có một object an toàn, sau đó xóa password
    const userObject = user.toObject();
    delete userObject.password;

    // 5. Trả về thông tin user và token
    res.status(200).json({ ...userObject, accessToken });

  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;