# Bàn giao Sale Pipeline cho WeWIN Admin

Thêm nút **Sale Pipeline** cạnh **Chat History**. Dùng layout, sidebar và phiên admin hiện có. Mở mặc định **Tổng quan**, bên trong có **NTL** và **XVNT**. Tài khoản ngoài WeWIN có thể mở **Mo-thu.html** bằng Chrome ngay sau khi giải nén. Bản này dùng tên và số liệu giả lập, hỗ trợ chuyển tab, đổi biểu đồ, tìm kiếm.

## A. Nhúng web app đã triển khai cho admin nội bộ

Khi admin dùng trình duyệt đăng nhập Google WeWIN và được phép xem dashboard, nhúng URL NTL vào vùng nội dung của nút Sale Pipeline. Một iframe đủ cho cả ba màn hình khi deployment NTL đã đọc được cả hai cơ sở. Kiểm tra từ website thật, vì chính sách đăng nhập hoặc trình duyệt có thể chặn phiên Google trong iframe. Cung cấp liên kết mở tab mới nếu cần đăng nhập Google.

```html
<iframe
  title="Sale Pipeline WeWIN"
  src="https://script.google.com/a/macros/wewin.edu.vn/s/AKfycbxhlaASeAExE7Yc0c2xYdp8YC0Df9KsPucOigfyVzrZRch0MJycYmbygvi-u1buxcgaoA/exec"
  referrerpolicy="no-referrer"
  style="display:block;width:100%;height:calc(100dvh - 140px);min-height:520px;border:0"
></iframe>
```

- Deployment NTL: [Mở NTL](https://script.google.com/a/macros/wewin.edu.vn/s/AKfycbxhlaASeAExE7Yc0c2xYdp8YC0Df9KsPucOigfyVzrZRch0MJycYmbygvi-u1buxcgaoA/exec).
- Deployment XVNT: [Mở XVNT](https://script.google.com/a/macros/wewin.edu.vn/s/AKfycbx8yLcJWGEjMFg5JnqE4oPRcl1XOWdodV-cXq_CCNZxCI-kQiyC0HdXz_WcpkHotH9M/exec).
- Middleware của website giới hạn trang cho admin. Quyền Google Workspace và quyền admin của Apps Script vẫn áp dụng cho iframe. Link trần cần danh sách ADMIN_EMAILS ở dự án khi dùng cơ chế cho phép email. Nếu dùng vé nhúng nội bộ, IT tạo vé trên backend sau khi kiểm tra quyền admin; vé không thay thế lớp đăng nhập Google của deployment nội bộ.

## B. Admin chỉ cần tài khoản website, kể cả khi ở ngoài miền

Thay iframe Google bằng giao diện **sale-pipeline.html** được phục vụ trên cùng tên miền với website, chẳng hạn tại `/admin/sale-pipeline/view`. Đặt trang này sau middleware admin. Có thể nhúng chính URL nội bộ này trong vùng nội dung. File HTML gọi `GET /api/admin/sale-pipeline?branch=NTL&mode=summary`. Dữ liệu chi tiết dùng `mode=detail`; chi nhánh còn lại dùng `branch=XVNT`.

**Adapter máy chủ kèm theo áp dụng cho Node.js 20+** hỗ trợ Request/Response chuẩn Fetch, gồm route handler Next.js chạy Node. Sao chép **sale-pipeline-server.mjs** vào thư mục backend. Cài `npm install google-auth-library` trong dự án. Nếu dùng PHP hoặc .NET, giữ nguyên HTML và triển khai cùng hợp đồng API theo adapter và dữ liệu giả lập trong Mo-thu.html.

Ví dụ gắn route cho Next.js App Router. Điều chỉnh hai đường import và tên hàm kiểm tra phiên cho đúng repo. Hàm kiểm tra phải xác minh session và vai trò admin ở máy chủ, trả về boolean.

```js
// app/api/admin/sale-pipeline/route.js
import { createSalePipelineHandler } from '@/server/sale-pipeline-server.mjs';
import { isAdminRequest } from '@/server/auth';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const GET = createSalePipelineHandler(isAdminRequest);
```

**IT cấu hình dữ liệu thật trên môi trường máy chủ.** Bật Google Sheets API trong dự án Google Cloud và gắn danh tính dịch vụ dành cho website qua Application Default Credentials. Quản trị viên cấp quyền **Người xem** trên đúng hai bảng nguồn cho danh tính dịch vụ theo chính sách Workspace. Nếu doanh nghiệp hạn chế chia sẻ cho tài khoản dịch vụ thì IT cần dùng danh tính đọc đã được tổ chức phê duyệt trước khi chạy. Với môi trường dùng file thông tin xác thực, GOOGLE_APPLICATION_CREDENTIALS chỉ trỏ đến secret đã được cấp phát trên máy chủ. Không đưa file khóa vào gói bàn giao, Git hoặc HTML.

Trong cấu hình backend, đặt `WEWIN_NTL_SHEET_ID` và `WEWIN_XVNT_SHEET_ID` bằng phần giữa `/spreadsheets/d/` và `/edit` của hai bảng tương ứng. ID này khác mã deployment Apps Script. Backend gọi Sheets API với scope spreadsheets.readonly, chỉ đọc các cột cần thiết ở SALE và LEADs. Trình duyệt chỉ gọi API cùng tên miền. Phương án này hoạt động độc lập với hai URL /exec.

## Kiểm tra khi tích hợp

1. Mở Mo-thu.html ngoại tuyến, thử ba tab và tìm học viên mẫu. Dùng file này cho việc dựng giao diện.
2. Với phương án A, thử cả URL trực tiếp và iframe bằng admin Google được phép. IT đối chiếu NTL và XVNT cùng tải trong một trang Tổng quan.
3. Với phương án B, dùng tài khoản không có quyền gọi thẳng API và kiểm tra bị từ chối. Dùng admin thật gọi summary/detail cho từng cơ sở. Summary không chứa danh sách học viên. So sánh tổng thu với SALE!C6, số đăng ký với H6/J6, tổng lead với LEADs!C5, MKT với checkbox P của dòng có tên ở B.
4. Nếu một cơ sở lỗi, số tổng hai cơ sở phải báo chưa đủ dữ liệu. Đối chiếu một lượt đăng ký thiếu phí, một lượt thiếu tên nhân viên và tra cứu tiếng Việt không dấu. Chỉ đưa tính năng lên website chính thức sau khi IT kiểm tra với dữ liệu thật.
