# Kết nối Sale Pipeline khi Google chỉ cho phép truy cập trong miền

Website giữ tài khoản và mật khẩu admin. Apps Script chủ động gửi báo cáo qua HTTPS đến backend. URL /exec và Google Cloud service account không tham gia luồng này. Hai Sheet giữ nguyên quyền chia sẻ. Web lưu bản đồng bộ gần nhất của mỗi cơ sở, có tên học viên và học phí trong phần Sale. Chỉ bật đồng bộ đến hosting được WeWIN cho phép nhận các dữ liệu đó. Với LEADs chỉ gửi thống kê tổng hợp.

## Bạn quản lý website làm trước

1. Dùng adapter Node.js 20+ trong gói thay cho src/server/sale-pipeline-server.mjs hiện tại. Giữ GET /api/admin/sale-pipeline và hàm kiểm tra session admin đang dùng. Giữ màn hình, tìm kiếm, phân trang như hiện tại. Đặt trang ở chế độ động, không cache dữ liệu admin.
2. Bản mẫu dùng PostgreSQL. Dùng DB riêng của website với kết nối máy chủ DATABASE_URL, cài pg bằng npm install pg và chạy schema.sql. Nếu hosting dùng kho dữ liệu khác, chuyển hai truy vấn đọc/ghi sang kho đó với khóa theo cơ sở và chỉ nhận bản mới hơn. Không dùng tệp tạm khi triển khai serverless. Chỉ role backend được đọc/ghi bảng. Nếu dùng PostgreSQL có API tự động như Supabase, giữ bảng trong schema riêng cho backend hoặc bật RLS và thu hồi quyền của anon/authenticated. Cấu hình mã hóa kết nối theo nhà cung cấp.
3. Tạo hai khóa ngẫu nhiên độc lập (mỗi khóa tối thiểu 32 ký tự). Có thể sinh riêng từng khóa bằng node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))". Trên hosting lưu SALE_SYNC_SECRET_NTL và SALE_SYNC_SECRET_XVNT dưới dạng server secrets. Cung cấp từng khóa cho người quản lý Apps Script bằng kênh bảo mật.
4. Thêm route POST /api/internal/sale-pipeline/sync. Với Next.js App Router, tạo src/app/api/internal/sale-pipeline/sync/route.ts:

```ts
import { receiveSaleSnapshot } from '@/server/sale-pipeline-server.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const POST = receiveSaleSnapshot;
```

Route POST dùng chữ ký HMAC để xác thực Apps Script, cho phép đi qua middleware đăng nhập tương tác. Chỉ áp dụng ngoại lệ cho đúng đường dẫn POST này. GET của admin vẫn bắt buộc session admin. Triển khai xong gửi URL HTTPS chính thức của route POST cho người quản lý Sheet. URL không chuyển hướng và không ghi payload, chữ ký hay khóa vào log.

## Bạn quản lý NTL và XVNT làm sau

1. Trong mỗi dự án Apps Script **dashboard** đã nhận bộ Code.gs của Sale Pipeline, tạo thêm file script tên Sync và dán nội dung Sync-addon.gs. File dùng hàm readBranch_ và hằng BRANCH từ bộ dashboard đã bàn giao. Không dán vào dự án quản lý lớp hoặc dự án khác. Không thay Code.gs, không sửa Sheet.
2. Project Settings → Script properties. Trong từng dự án điền SALE_SYNC_URL = URL bạn làm web cung cấp và SALE_SYNC_SECRET = khóa của đúng cơ sở. Hai dự án dùng cùng URL nhưng khóa khác nhau. Giữ các khóa ngoài mã nguồn và ngoài HTML.
3. Từ editor chọn enableSaleSync_, nhấn Run và cấp quyền nếu được hỏi. Lần đầu gửi một bản để kiểm tra; khi website xác nhận, mã tạo lịch chạy mỗi 5 phút. Thực hiện cho cả NTL và XVNT. Đây là chạy từ editor/trigger, không cần sửa deployment hoặc có mục Anyone. Chạy disableSaleSync_ để dừng lịch do tài khoản đó tạo. Dừng lịch không xóa dữ liệu đã đồng bộ ở hosting.
4. Admin đăng nhập web, mở Sale Pipeline → Tổng quan và bấm Làm mới. Sau lần đồng bộ đầu của cả hai bên, tổng mới hiện đủ; xác minh thời điểm dữ liệu và số liệu so với Sheet. Nút Làm mới đọc bản máy chủ đang có. Nếu dữ liệu đứng lâu, xem Apps Script → Executions và kiểm tra quota/quyền kết nối ra đúng URL. Nếu tổ chức chặn gửi dữ liệu đến hosting này, cần xác nhận với quản trị viên trước khi bật.
