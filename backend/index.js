require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const redis = require('./redisClient');

const app = express();
const PORT = process.env.PORT || 8080;
const mongoose = require('mongoose'); 

const authRoute = require('./routes/auth');
const userRoute = require('./routes/users');
const reviewRoute = require('./routes/reviews'); 
const adminRoute = require('./routes/admin');
const linkRoute = require('./routes/links');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- KẾT NỐI TỚI MONGODB ATLAS ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Kết nối tới MongoDB thành công!"))
  .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));


// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoute); 
app.use("/api/users", userRoute);
app.use("/api/reviews", reviewRoute); 
app.use("/api/admin", adminRoute);
app.use("/api/links", linkRoute);


// Các file trong thư mục 'public/images' tại đường dẫn '/images'
app.use("/images", express.static("public/images"));

// --- HÀM GỌI API CỦA GEMINI ---
async function queryGemini(userInput) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const prompt = `
        From the user's Vietnamese query, create an optimized search query string for the Google Books API.
        - Use "intitle:[query]" for specific titles.
        - Use "inauthor:[author]" for specific authors.
        - Use "subject:[genre]" for genres.
        - Combine general keywords with these operators.
        Return a JSON object with a single key: "search_query".

        Example 1:
        User Query: "sách của Nguyễn Nhật Ánh về mùa hè"
        JSON Output: { "search_query": "mùa hè inauthor:Nguyễn Nhật Ánh" }

        Example 2:
        User Query: "tiểu thuyết có tên là nhà giả kim"
        JSON Output: { "search_query": "intitle:nhà giả kim" }

        Example 3:
        User Query: "sách self-help hay nhất"
        JSON Output: { "search_query": "sách hay nhất subject:self-help" }
        
        User Query: "${userInput}"

        JSON Output:
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
            const parsedJson = JSON.parse(jsonMatch[0]);
            return parsedJson.search_query || userInput; // Trả về chuỗi query hoặc query gốc nếu lỗi
        } else {
            return userInput; // Dùng query gốc nếu không parse được JSON
        }
    } catch (e) {
        console.error("Lỗi từ Gemini:", e);
        return userInput; // Dùng query gốc nếu có lỗi
    }
}

/*
// --- HÀM GỌI API CỦA HUGGING FACE ---
async function queryHuggingFace(text) {
  const API_URL = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli";
  const headers = { "Authorization": `Bearer ${process.env.HUGGINGFACE_TOKEN}` };

  const payload = {
    inputs: text,
    parameters: {
      candidate_labels: ["văn học", "lịch sử", "kinh tế", "khoa học viễn tưởng", "trinh thám", "phiêu lưu", "tâm lý", "kinh dị"],
    },
  };

  try {
    const response = await axios.post(API_URL, payload, { headers });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi Hugging Face API:", error.response ? error.response.data : error.message);
    throw new Error("Lỗi khi phân tích thể loại sách.");
  }
} */

// --- ENDPOINT LẤY SÁCH XU HƯỚNG ---
app.get('/api/trending', async (req, res) => {

  const cacheKey = 'trending-books';

  try {
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      // console.log(`CACHE HIT for ${cacheKey}`);
      // Kiểm tra cache trước. Nếu có, trả về dữ liệu từ cache
      return res.status(200).json(JSON.parse(cachedData));
    }

    // console.log(`CACHE MISS for ${cacheKey}`);
    const trendingQuery = "best selling books"; 
    const maxResults = 12;
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes`;
    const params = {
      q: trendingQuery,
      key: process.env.GOOGLE_BOOKS_API_KEY,
      maxResults: maxResults,
      orderBy: 'relevance' // Sắp xếp theo độ liên quan
    };

    const booksResponse = await axios.get(googleBooksUrl, { params });
    const bookData = booksResponse.data;

    await redis.set(cacheKey, JSON.stringify(bookData), 'EX', 1800);

    // Trả kết quả về cho client
    res.status(200).json(bookData);

  } catch (error) {
    console.error("Lỗi khi lấy sách xu hướng:", error);
    res.status(500).json({ error: 'Đã có lỗi xảy ra ở server.' });
  }
});

// --- API ENDPOINT TÌM KIẾM CHÍNH ---
app.post('/api/search', async (req, res) => {
  const { query, page = 1 } = req.body; 

  if (!query) {
    return res.status(400).json({ error: 'Câu tìm kiếm không được để trống.' });
  }

  try {
    // Bước 1: Lấy chuỗi tìm kiếm đã được tối ưu từ Gemini
    const finalQuery = await queryGemini(query);
    
    console.log(`Query gốc: "${query}" -> Query tối ưu: "${finalQuery}"`);

    // Bước 2: Gọi Google Books API
    const maxResults = 12;
    const startIndex = (page - 1) * maxResults;
    const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes`;
    
    const params = {
      q: finalQuery, // Sử dụng trực tiếp query đã tối ưu
      key: process.env.GOOGLE_BOOKS_API_KEY,
      maxResults: maxResults,
      startIndex: startIndex,
      printType: 'books', 
      langRestrict: 'vi'
    };
    const booksResponse = await axios.get(googleBooksUrl, { params });

    res.json(booksResponse.data);

  } catch (error) {
    console.error("Đã có lỗi xảy ra trong quá trình tìm kiếm:", error);
    res.status(500).json({ error: 'Đã có lỗi xảy ra ở server.' });
  }
});


// Route kiểm tra cơ bản
app.get('/', (req, res) => {
  res.send('Chào mừng đến với Backend API cho dự án sách!');
});

// Lắng nghe server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});