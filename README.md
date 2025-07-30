Buksugai - Ứng dụng Gợi ý Sách thông minh

1. Mục đích Dự án
   
  Buksugai được tạo ra để giải quyết vấn đề tìm kiếm sách truyền thống, vốn thường cứng nhắc và dựa trên từ khóa chính xác. Mục tiêu của dự án là xây dựng một công cụ tìm kiếm sách thông minh, có khả năng hiểu ngôn ngữ tự nhiên của người dùng để đưa ra các gợi ý phù hợp nhất.

  Ngoài ra, dự án còn hướng tới việc xây dựng một cộng đồng nhỏ, nơi người dùng có thể chia sẻ đánh giá, bình chọn và tìm kiếm các địa chỉ mua sách uy tín, từ đó mở ra tiềm năng cho việc tích hợp các mô hình tiếp thị liên kết.

2. Các Tính năng Chính
   
  Đối với Người dùng:

    Tìm kiếm AI thông minh: Tích hợp Google Gemini API để phân tích các truy vấn tìm kiếm phức tạp (ví dụ: "sách của Nguyễn Nhật Ánh về mùa hè") và tạo ra các kết quả tìm kiếm tối ưu.

    Hệ thống Đánh giá & Bình chọn: Người dùng có thể đánh giá sách theo thang điểm sao, viết bình luận chi tiết và bình chọn (upvote) cho các đánh giá hữu ích khác.

    Quản lý Cá nhân: Đăng ký, đăng nhập, cập nhật thông tin cá nhân (mật khẩu, avatar), và quản lý danh sách sách yêu thích.

    Gợi ý Link mua sách: Một hệ thống crowdsourcing cho phép cộng đồng cùng nhau đóng góp và quản lý các link mua sách từ nhiều sàn thương mại điện tử.

    Trải nghiệm Hiện đại: Giao diện responsive, hỗ trợ theme Sáng/Tối, skeleton loading và các thông báo Toast mang lại trải nghiệm mượt mà.

  Đối với Quản trị viên (Admin):

    Bảng điều khiển (Dashboard): Hiển thị các thống kê trực quan về tổng số người dùng, số lượng đánh giá, các link đang chờ duyệt...

    Quản lý Người dùng & Phân quyền: Xem danh sách, xóa người dùng và thay đổi vai trò (user/admin).

    Kiểm duyệt Nội dung: Toàn quyền quản lý các đánh giá (sửa, xóa) và các link mua sách do người dùng gửi lên (duyệt, từ chối, đặt làm link chính).

3. Công nghệ sử dụng và Lý do lựa chọn

  Frontend:

    Next.js (React): Được chọn vì khả năng tối ưu hóa hiệu năng (SSR, SSG), hệ thống routing mạnh mẽ và trải nghiệm phát triển mượt mà.

    Tailwind CSS: Cung cấp khả năng xây dựng giao diện hiện đại, responsive một cách nhanh chóng và nhất quán.

  Backend:

    Node.js & Express.js: Nền tảng JavaScript phổ biến, hiệu năng cao, và đồng bộ với hệ sinh thái công nghệ của dự án.

    JSON Web Tokens (JWT): Sử dụng để xác thực người dùng một cách an toàn và stateless.

  Database & Caching:

    MongoDB: Lựa chọn NoSQL vì cấu trúc dữ liệu linh hoạt, rất phù hợp để lưu trữ thông tin người dùng, review, và các dữ liệu có cấu trúc đa dạng.

    Mongoose: Thư viện ODM giúp việc tạo model và tương tác với MongoDB trở nên dễ dàng, có cấu trúc.

    Redis: Được tích hợp để cache các yêu cầu API tốn thời gian, giúp tăng tốc độ phản hồi của server và giảm tải cho các API bên ngoài.

  APIs & Dịch vụ ngoài:

    Google Books API: Nguồn cung cấp dữ liệu sách cốt lõi.

    Google Gemini API: "Bộ não" của tính năng tìm kiếm, giúp phân tích và hiểu truy vấn của người dùng.

    Cloudinary: Giải pháp lưu trữ ảnh avatar trên cloud.
