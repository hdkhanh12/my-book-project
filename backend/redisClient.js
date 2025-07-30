const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
    console.log("✅ Kết nối tới Redis thành công!");
});

redis.on('error', (err) => {
    console.error("❌ Lỗi kết nối Redis:", err);
});

module.exports = redis;