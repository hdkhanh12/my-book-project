const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, user) => {
            if (err) return res.status(403).json("Token không hợp lệ!");
            req.user = user; // Lưu thông tin user đã giải mã vào request
            next();
        });
    } else {
        return res.status(401).json("Bạn chưa được xác thực!");
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role === 'admin') {
            next();
        } else {
            res.status(403).json("Bạn không có quyền truy cập!");
        }
    });
};

module.exports = { verifyToken, verifyAdmin };