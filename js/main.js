// Main application JavaScript
class TCT8Manager {
    constructor() {
        this.data = {
            apartments: [],
            residents: [],
            fees: [],
            notifications: [],
            payments: []
        };
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.updateUserInfo();
        this.setActiveNavItem();
    }

    async loadData() {
        try {
            // Load sample data or from localStorage
            const savedData = localStorage.getItem('tct8_data');
            if (savedData) {
                this.data = JSON.parse(savedData);
            } else {
                await this.loadSampleData();
                this.saveData();
            }
        } catch (error) {
            console.error('Error loading data:', error);
            await this.loadSampleData();
        }
    }

    async loadSampleData() {
        // Generate sample apartments
        this.data.apartments = this.generateSampleApartments(20);
        
        // Generate sample residents
        this.data.residents = this.generateSampleResidents(45);
        
        // Generate sample fees
        this.data.fees = this.generateSampleFees();
        
        // Generate sample notifications
        this.data.notifications = this.generateSampleNotifications();
        
        // Generate sample payments
        this.data.payments = this.generateSamplePayments();
    }

    generateSampleApartments(count) {
        const apartments = [];
        const floors = ['1', '2', '3', '4', '5', '6', '7', '8'];
        const rooms = ['01', '02', '03', '04', '05'];
        const statuses = ['occupied', 'vacant', 'maintenance'];
        const types = ['1PN', '2PN', '3PN'];

        for (let i = 0; i < count; i++) {
            const floor = floors[Math.floor(Math.random() * floors.length)];
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const apartmentNumber = floor + room;
            
            apartments.push({
                id: i + 1,
                number: apartmentNumber,
                floor: parseInt(floor),
                type: types[Math.floor(Math.random() * types.length)],
                area: 45 + Math.floor(Math.random() * 55), // 45-100 m2
                status: statuses[Math.floor(Math.random() * statuses.length)],
                monthlyFee: 1500000 + Math.floor(Math.random() * 1000000), // 1.5-2.5M
                owner: '',
                phone: '',
                email: '',
                moveInDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28))
            });
        }

        return apartments.sort((a, b) => a.number.localeCompare(b.number));
    }

    generateSampleResidents(count) {
        const residents = [];
        const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng'];
        const lastNames = ['Văn Anh', 'Thị Bình', 'Văn Cường', 'Thị Dung', 'Văn Em', 'Thị Fang', 'Văn Giang', 'Thị Hoa', 'Văn Inh', 'Thị Kim'];

        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const apartment = this.data.apartments[Math.floor(Math.random() * this.data.apartments.length)];
            
            residents.push({
                id: i + 1,
                name: `${firstName} ${lastName}`,
                apartmentId: apartment?.id || 1,
                apartmentNumber: apartment?.number || '101',
                phone: '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                email: `resident${i + 1}@email.com`,
                idNumber: Math.floor(Math.random() * 1000000000).toString().padStart(9, '0'),
                dateOfBirth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
                relationship: Math.random() > 0.3 ? 'Chủ hộ' : 'Thành viên',
                emergencyContact: '09' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0'),
                status: Math.random() > 0.1 ? 'active' : 'inactive'
            });
        }

        return residents;
    }

    generateSampleFees() {
        const feeTypes = [
            { name: 'Phí quản lý', amount: 20000, unit: 'm2' },
            { name: 'Tiền điện', amount: 3500, unit: 'kWh' },
            { name: 'Tiền nước', amount: 25000, unit: 'm3' },
            { name: 'Phí dịch vụ', amount: 500000, unit: 'căn hộ' },
            { name: 'Phí gửi xe', amount: 300000, unit: 'căn hộ' }
        ];

        return feeTypes.map((fee, index) => ({
            id: index + 1,
            ...fee,
            description: `${fee.name} hàng tháng`,
            isActive: true
        }));
    }

    generateSampleNotifications() {
        const notifications = [
            {
                id: 1,
                title: 'Thông báo cắt điện định kỳ',
                content: 'Tòa nhà sẽ cắt điện để bảo trì hệ thống từ 8:00-12:00 ngày 15/12/2024',
                type: 'warning',
                date: new Date('2024-12-10'),
                isImportant: true,
                status: 'published'
            },
            {
                id: 2,
                title: 'Thông báo họp cư dân',
                content: 'Cuộc họp cư dân định kỳ sẽ được tổ chức vào 19:00 ngày 20/12/2024',
                type: 'info',
                date: new Date('2024-12-08'),
                isImportant: false,
                status: 'published'
            },
            {
                id: 3,
                title: 'Chúc mừng năm mới 2025',
                content: 'Ban quản lý tòa nhà chúc tất cả cư dân một năm mới an khang thịnh vượng',
                type: 'success',
                date: new Date('2024-12-31'),
                isImportant: true,
                status: 'draft'
            }
        ];

        return notifications;
    }

    generateSamplePayments() {
        const payments = [];
        const months = ['2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'];
        
        this.data.apartments.forEach(apartment => {
            months.forEach(month => {
                if (Math.random() > 0.2) { // 80% apartments have payments
                    payments.push({
                        id: payments.length + 1,
                        apartmentId: apartment.id,
                        apartmentNumber: apartment.number,
                        month: month,
                        managementFee: apartment.area * 20000,
                        serviceFee: 500000,
                        electricBill: Math.floor(Math.random() * 500000) + 200000,
                        waterBill: Math.floor(Math.random() * 200000) + 100000,
                        parkingFee: 300000,
                        total: 0,
                        paidDate: Math.random() > 0.3 ? new Date(month + '-' + (Math.floor(Math.random() * 28) + 1)) : null,
                        status: Math.random() > 0.3 ? 'paid' : 'pending',
                        paymentMethod: Math.random() > 0.5 ? 'bank_transfer' : 'cash'
                    });
                }
            });
        });

        // Calculate totals
        payments.forEach(payment => {
            payment.total = payment.managementFee + payment.serviceFee + 
                          payment.electricBill + payment.waterBill + payment.parkingFee;
        });

        return payments;
    }

    saveData() {
        try {
            localStorage.setItem('tct8_data', JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        window.toggleSidebar = () => {
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.toggle('show');
        };

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggle = document.querySelector('.mobile-menu-toggle');
            
            if (window.innerWidth <= 768 && 
                sidebar.classList.contains('show') && 
                !sidebar.contains(e.target) && 
                !toggle.contains(e.target)) {
                sidebar.classList.remove('show');
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth > 768) {
                sidebar.classList.remove('show');
            }
        });
    }

    updateUserInfo() {
        const user = authManager.getCurrentUser();
        if (user) {
            const userNameEl = document.getElementById('userName');
            const userRoleEl = document.getElementById('userRole');
            const userAvatarEl = document.getElementById('userAvatar');

            if (userNameEl) userNameEl.textContent = user.name;
            if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Quản trị viên' : 'Quản lý';
            if (userAvatarEl) {
                userAvatarEl.innerHTML = user.name.charAt(0).toUpperCase();
            }
        }
    }

    setActiveNavItem() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // Utility functions
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleDateString('vi-VN');
    }

    formatDateTime(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        return date.toLocaleString('vi-VN');
    }

    showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Đang tải...</div>';
        }
    }

    showError(element, message = 'Có lỗi xảy ra') {
        if (element) {
            element.innerHTML = `<div class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle"></i> ${message}</div>`;
        }
    }

    showSuccess(message) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: message,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            alert(`Thành công! ${message}`);
        }
    }

    showConfirm(message, callback) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Xác nhận',
                text: message,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#007bff',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Xác nhận',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed && callback) {
                    callback();
                }
            });
        } else {
            if (confirm(message) && callback) {
                callback();
            }
        }
    }

    // Export data functionality
    exportToJSON() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `tct8_data_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importFromJSON(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                this.data = importedData;
                this.saveData();
                this.showSuccess('Nhập dữ liệu thành công!');
                location.reload();
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: 'File không hợp lệ!'
                    });
                } else {
                    alert('Lỗi: File không hợp lệ!');
                }
            }
        };
        reader.readAsText(file);
    }
}

// Initialize the application
const tct8Manager = new TCT8Manager();