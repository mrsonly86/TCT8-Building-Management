# TCT8 Building Management System

Hệ thống quản lý tòa nhà TCT8 - Một website quản lý tòa nhà đầy đủ tính năng sử dụng 100% công cụ miễn phí, có thể deploy lên GitHub Pages hoặc Netlify.

## 📸 Demo Screenshots

### Trang đăng nhập
![Login Page](https://github.com/user-attachments/assets/e654cf75-f8df-49a4-b946-22fdf5afd3c0)

### Dashboard chính
![Dashboard](https://github.com/user-attachments/assets/7702a62d-3d05-41f4-80f4-6174fedecc22)

## ✨ Tính năng chính

### 🔐 Xác thực và bảo mật
- **Đăng nhập bảo mật** với username/password
- **Session management** với localStorage/sessionStorage
- **Phân quyền người dùng** (Admin, Manager)
- **Validation form** đầy đủ
- **Escape XSS** cơ bản

### 🏠 Quản lý căn hộ
- Danh sách căn hộ với trạng thái (đang ở, trống, bảo trì)
- Thêm/sửa/xóa thông tin căn hộ
- Tìm kiếm và lọc theo trạng thái
- Quản lý thông tin chủ hộ
- Tính toán phí quản lý tự động

### 👥 Quản lý cư dân
- Thông tin cá nhân cư dân đầy đủ
- Phân loại theo quan hệ (chủ hộ, thành viên)
- Thông tin liên hệ và khẩn cấp
- Lịch sử căn hộ
- Tìm kiếm và lọc cư dân

### 💰 Quản lý phí
- **Tạo hóa đơn tự động** cho từng tháng
- **Quản lý thanh toán** (điện, nước, dịch vụ, phí quản lý)
- **Tính toán tự động** tổng phí
- **In hóa đơn** chuyên nghiệp
- **Tracking trạng thái** thanh toán
- **Báo cáo công nợ** chi tiết

### 📊 Báo cáo và thống kê
- **Báo cáo tài chính** theo tháng/quý/năm
- **Báo cáo công nợ** với danh sách chi tiết
- **Báo cáo cư dân** với phân tích độ tuổi
- **Báo cáo căn hộ** với tỷ lệ lấp đầy
- **Biểu đồ trực quan** với Chart.js
- **Xuất Excel/CSV** dữ liệu

### 📢 Quản lý thông báo
- **Tạo và đăng thông báo** cho cư dân
- **Phân loại thông báo** (thông tin, cảnh báo, khẩn cấp)
- **Đánh dấu quan trọng**
- **Lưu nháp và lên lịch**
- **In thông báo** để dán tại tòa nhà

### 📱 PWA (Progressive Web App)
- **Cài đặt như app** trên điện thoại
- **Hoạt động offline** với Service Worker
- **Cache thông minh** cho tốc độ cao
- **Push notifications** (ready)

## 🛠️ Công nghệ sử dụng (100% miễn phí)

### Frontend
- **HTML5/CSS3/JavaScript**: Core technologies
- **Bootstrap 5**: UI framework responsive
- **Chart.js**: Biểu đồ và thống kê
- **Font Awesome**: Icons đẹp và đa dạng

### Libraries
- **SweetAlert2**: Popup và notifications
- **Print.js**: In ấn chuyên nghiệp (fallback native)
- **Service Worker**: PWA và offline support

### Data & Storage
- **Local Storage**: Lưu trữ dữ liệu local
- **JSON**: Import/export dữ liệu
- **Session Storage**: Quản lý phiên đăng nhập

## 🚀 Cài đặt và sử dụng

### 1. Clone repository
```bash
git clone https://github.com/mrsonly86/TCT8-Building-Management.git
cd TCT8-Building-Management
```

### 2. Chạy local
```bash
# Sử dụng Python
python -m http.server 8000

# Hoặc sử dụng Node.js
npx serve .

# Hoặc sử dụng PHP
php -S localhost:8000
```

### 3. Truy cập website
Mở trình duyệt và truy cập: `http://localhost:8000`

### 4. Đăng nhập
- **Admin**: `admin` / `admin123`
- **Manager**: `manager` / `manager123`

## 🌐 Deploy lên GitHub Pages

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Deploy TCT8 Building Management"
git push origin main
```

### 2. Kích hoạt GitHub Pages
- Vào **Settings** của repository
- Chọn **Pages** trong menu bên trái
- Chọn **Source**: Deploy from a branch
- Chọn **Branch**: main / (root)
- Click **Save**

### 3. Truy cập website
Website sẽ có địa chỉ: `https://username.github.io/TCT8-Building-Management`

## 📁 Cấu trúc thư mục

```
TCT8-Building-Management/
├── 📄 index.html              # Dashboard chính
├── 📄 login.html             # Trang đăng nhập
├── 📄 apartments.html        # Quản lý căn hộ
├── 📄 residents.html         # Quản lý cư dân
├── 📄 fees.html              # Quản lý phí
├── 📄 reports.html           # Báo cáo
├── 📄 notifications.html     # Thông báo
├── 📄 manifest.json          # PWA manifest
├── 📄 sw.js                  # Service Worker
├── 📁 css/
│   └── 📄 style.css          # CSS chính với responsive
├── 📁 js/
│   ├── 📄 main.js            # JavaScript chính
│   ├── 📄 auth.js            # Xác thực
│   ├── 📄 dashboard.js       # Dashboard
│   ├── 📄 apartments.js      # Quản lý căn hộ
│   ├── 📄 residents.js       # Quản lý cư dân
│   ├── 📄 fees.js            # Quản lý phí
│   ├── 📄 reports.js         # Báo cáo
│   └── 📄 notifications.js   # Thông báo
├── 📁 data/
│   └── 📄 sample-data.json   # Dữ liệu mẫu
└── 📁 assets/
    ├── 📁 images/            # Hình ảnh
    └── 📁 icons/             # Icons PWA
```

## 💾 Dữ liệu mẫu

Hệ thống đi kèm với dữ liệu mẫu hoàn chỉnh:
- **20 căn hộ** với thông tin đầy đủ
- **45 cư dân** với các mối quan hệ khác nhau
- **Dữ liệu phí** 6 tháng gần nhất
- **Thông báo mẫu** với nhiều loại khác nhau
- **Lịch sử thanh toán** chi tiết

## 🎯 Hướng dẫn sử dụng

### Đăng nhập
1. Mở website và truy cập trang đăng nhập
2. Sử dụng tài khoản demo hoặc tài khoản đã tạo
3. Hệ thống sẽ chuyển hướng đến Dashboard

### Quản lý căn hộ
1. **Thêm căn hộ**: Click "Thêm căn hộ" và điền thông tin
2. **Chỉnh sửa**: Click icon "Chỉnh sửa" trên từng căn hộ
3. **Tìm kiếm**: Sử dụng ô tìm kiếm hoặc filter theo trạng thái

### Quản lý cư dân
1. **Thêm cư dân**: Click "Thêm cư dân" và chọn căn hộ
2. **Phân loại**: Chọn quan hệ (chủ hộ, thành viên)
3. **Cập nhật**: Chỉnh sửa thông tin cá nhân và liên hệ

### Quản lý phí
1. **Tạo hóa đơn**: Click "Tạo hóa đơn" và chọn tháng
2. **Cập nhật thanh toán**: Chỉnh sửa số tiền điện, nước
3. **Đánh dấu đã thanh toán**: Click "Thanh toán nhanh"
4. **In hóa đơn**: Click icon "In" để in hóa đơn

### Xem báo cáo
1. **Chọn loại báo cáo**: Tài chính, Công nợ, Cư dân, Căn hộ
2. **Chọn thời gian**: Tháng, quý, năm hoặc tùy chọn
3. **Xuất dữ liệu**: Click "Xuất Excel" để tải file

### Quản lý thông báo
1. **Tạo thông báo**: Click "Thêm thông báo"
2. **Phân loại**: Chọn loại (thông tin, cảnh báo, khẩn cấp)
3. **Đăng hoặc lưu nháp**: Chọn trạng thái phù hợp
4. **In thông báo**: Xem trước và in để dán tại tòa nhà

## 🔧 Tùy chỉnh

### Thay đổi thông tin tòa nhà
Chỉnh sửa file `data/sample-data.json`:
```json
{
  "buildingInfo": {
    "name": "Tên tòa nhà của bạn",
    "address": "Địa chỉ mới",
    "contactPhone": "Số điện thoại",
    "contactEmail": "Email liên hệ"
  }
}
```

### Tùy chỉnh giao diện
Chỉnh sửa file `css/style.css`:
```css
:root {
    --primary-color: #your-color;
    --secondary-color: #your-color;
}
```

### Thêm tính năng mới
1. Tạo file HTML mới trong thư mục root
2. Tạo file JS tương ứng trong `js/`
3. Thêm link vào sidebar trong các file HTML
4. Cập nhật `sw.js` để cache file mới

## 🐛 Troubleshooting

### Website không load
- Kiểm tra console browser có lỗi không
- Đảm bảo chạy từ web server (không mở file trực tiếp)
- Kiểm tra đường dẫn file có đúng không

### Dữ liệu không lưu
- Kiểm tra localStorage có hoạt động không
- Xóa cache browser và thử lại
- Kiểm tra chế độ Private/Incognito

### Responsive không hoạt động
- Đảm bảo có meta viewport trong HTML
- Kiểm tra Bootstrap CSS đã load chưa
- Test trên thiết bị thật, không chỉ dev tools

## 🤝 Đóng góp

1. Fork repository này
2. Tạo branch mới: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📝 Changelog

### v1.0.0 (2024-12-12)
- ✅ Hoàn thiện tính năng đăng nhập và xác thực
- ✅ Quản lý căn hộ với CRUD đầy đủ
- ✅ Quản lý cư dân với thông tin chi tiết
- ✅ Quản lý phí với tạo hóa đơn tự động
- ✅ Báo cáo tài chính với biểu đồ
- ✅ Thông báo với tính năng in ấn
- ✅ Responsive design cho mobile
- ✅ PWA với Service Worker
- ✅ Dữ liệu mẫu hoàn chỉnh

## 📄 License

MIT License - Sử dụng tự do cho mục đích cá nhân và thương mại.

## 📞 Liên hệ

- **GitHub**: [mrsonly86](https://github.com/mrsonly86)
- **Email**: contact@tct8building.com (demo)

---

## 🎉 Lời cảm ơn

Cảm ơn các công cụ và thư viện mã nguồn mở:
- [Bootstrap](https://getbootstrap.com/) - UI Framework
- [Chart.js](https://www.chartjs.org/) - Biểu đồ
- [Font Awesome](https://fontawesome.com/) - Icons
- [SweetAlert2](https://sweetalert2.github.io/) - Notifications

**Made with ❤️ for building management**
