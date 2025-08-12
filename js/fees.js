// Fees management functionality
class FeesManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.filteredPayments = [];
        this.currentEditId = null;
        this.paymentModal = null;
        this.generateBillModal = null;
        this.init();
    }

    init() {
        this.paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        this.generateBillModal = new bootstrap.Modal(document.getElementById('generateBillModal'));
        this.updateStatistics();
        this.loadPayments();
        this.loadFeeStructure();
        this.loadBills();
        this.setupEventListeners();
        this.populateFilters();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('paymentSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchPayments(e.target.value);
            });
        }

        // Month filter
        const monthFilter = document.getElementById('monthFilter');
        if (monthFilter) {
            monthFilter.addEventListener('change', (e) => {
                this.filterByMonth(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('paymentStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        // Auto calculate total
        const billInputs = ['electricBill', 'waterBill', 'parkingFee'];
        billInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => this.calculateTotal());
            }
        });

        // Tab switching
        const tabs = document.querySelectorAll('#feeTabs button');
        tabs.forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                const targetId = e.target.getAttribute('data-bs-target');
                if (targetId === '#bills') {
                    this.loadBills();
                } else if (targetId === '#fee-structure') {
                    this.loadFeeStructure();
                }
            });
        });
    }

    updateStatistics() {
        const payments = tct8Manager.data.payments;
        const currentMonth = new Date().toISOString().substr(0, 7);
        
        // Total revenue (all paid payments)
        const totalRevenue = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.total, 0);
        
        // Pending payments (current month)
        const pendingPayments = payments
            .filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + p.total, 0);
        
        // Overdue payments (older than current month and not paid)
        const overduePayments = payments
            .filter(p => p.status === 'pending' && p.month < currentMonth).length;
        
        // Collection rate
        const currentMonthPayments = payments.filter(p => p.month === currentMonth);
        const paidCount = currentMonthPayments.filter(p => p.status === 'paid').length;
        const collectionRate = currentMonthPayments.length > 0 ? 
            Math.round((paidCount / currentMonthPayments.length) * 100) : 0;

        this.updateStat('totalRevenue', tct8Manager.formatCurrency(totalRevenue));
        this.updateStat('pendingPayments', tct8Manager.formatCurrency(pendingPayments));
        this.updateStat('overduePayments', overduePayments);
        this.updateStat('collectionRate', collectionRate + '%');
    }

    updateStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.add('fade-in');
        }
    }

    populateFilters() {
        const monthFilter = document.getElementById('monthFilter');
        const billApartments = document.getElementById('billApartments');
        
        if (!monthFilter || !billApartments) return;

        // Populate month filter with last 12 months
        const months = this.getLast12Months();
        months.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.textContent = this.formatMonth(month);
            monthFilter.appendChild(option);
        });

        // Populate apartments for bill generation
        const apartments = tct8Manager.data.apartments.sort((a, b) => a.number.localeCompare(b.number));
        apartments.forEach(apartment => {
            const option = document.createElement('option');
            option.value = apartment.id;
            option.textContent = apartment.number;
            billApartments.appendChild(option);
        });
    }

    getLast12Months() {
        const months = [];
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toISOString().substr(0, 7));
        }
        
        return months;
    }

    formatMonth(month) {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    }

    loadPayments() {
        this.filteredPayments = [...tct8Manager.data.payments];
        this.renderPaymentsTable();
        this.renderPaymentsPagination();
    }

    searchPayments(query) {
        if (!query.trim()) {
            this.filteredPayments = [...tct8Manager.data.payments];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredPayments = tct8Manager.data.payments.filter(payment => 
                payment.apartmentNumber.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.renderPaymentsTable();
        this.renderPaymentsPagination();
    }

    filterByMonth(month) {
        if (!month) {
            this.filteredPayments = [...tct8Manager.data.payments];
        } else {
            this.filteredPayments = tct8Manager.data.payments.filter(payment => 
                payment.month === month
            );
        }
        this.currentPage = 1;
        this.renderPaymentsTable();
        this.renderPaymentsPagination();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredPayments = [...tct8Manager.data.payments];
        } else {
            this.filteredPayments = tct8Manager.data.payments.filter(payment => 
                payment.status === status
            );
        }
        this.currentPage = 1;
        this.renderPaymentsTable();
        this.renderPaymentsPagination();
    }

    renderPaymentsTable() {
        const tbody = document.getElementById('paymentsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pagePayments = this.filteredPayments.slice(startIndex, endIndex);

        if (pagePayments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                        <i class="fas fa-credit-card"></i>
                        Không có thanh toán nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pagePayments.map(payment => `
            <tr>
                <td>
                    <span class="fw-bold">${payment.apartmentNumber}</span>
                </td>
                <td>
                    <span class="badge bg-info">${this.formatMonth(payment.month)}</span>
                </td>
                <td>
                    ${tct8Manager.formatCurrency(payment.managementFee || 0)}
                </td>
                <td>
                    ${tct8Manager.formatCurrency(payment.electricBill || 0)}
                </td>
                <td>
                    ${tct8Manager.formatCurrency(payment.waterBill || 0)}
                </td>
                <td>
                    ${tct8Manager.formatCurrency(payment.serviceFee || 0)}
                </td>
                <td>
                    <span class="fw-bold text-primary">${tct8Manager.formatCurrency(payment.total)}</span>
                </td>
                <td>
                    ${this.getPaymentStatusBadge(payment)}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="feesManager.editPayment(${payment.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="feesManager.printBill(${payment.id})" title="In hóa đơn">
                            <i class="fas fa-print"></i>
                        </button>
                        ${payment.status === 'pending' ? `
                        <button class="btn btn-sm btn-outline-success" onclick="feesManager.quickPay(${payment.id})" title="Thanh toán nhanh">
                            <i class="fas fa-check"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Update showing info
        this.updatePaymentShowingInfo(startIndex, endIndex);
    }

    getPaymentStatusBadge(payment) {
        const currentMonth = new Date().toISOString().substr(0, 7);
        
        if (payment.status === 'paid') {
            return '<span class="status-badge status-active"><i class="fas fa-check"></i> Đã thanh toán</span>';
        } else if (payment.month < currentMonth) {
            return '<span class="status-badge status-inactive"><i class="fas fa-exclamation-triangle"></i> Quá hạn</span>';
        } else {
            return '<span class="status-badge status-pending"><i class="fas fa-clock"></i> Chưa thanh toán</span>';
        }
    }

    updatePaymentShowingInfo(startIndex, endIndex) {
        const total = this.filteredPayments.length;
        const showingFrom = total > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(endIndex, total);

        document.getElementById('paymentShowingFrom').textContent = showingFrom;
        document.getElementById('paymentShowingTo').textContent = showingTo;
        document.getElementById('paymentTotalRecords').textContent = total;
    }

    renderPaymentsPagination() {
        const totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
        const pagination = document.getElementById('paymentPagination');
        
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="feesManager.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="feesManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="feesManager.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredPayments.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderPaymentsTable();
            this.renderPaymentsPagination();
        }
    }

    loadBills() {
        const container = document.getElementById('billsContainer');
        if (!container) return;

        // Group payments by month
        const paymentsByMonth = {};
        tct8Manager.data.payments.forEach(payment => {
            if (!paymentsByMonth[payment.month]) {
                paymentsByMonth[payment.month] = [];
            }
            paymentsByMonth[payment.month].push(payment);
        });

        const months = Object.keys(paymentsByMonth).sort().reverse().slice(0, 6);
        
        if (months.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    <i class="fas fa-file-invoice"></i>
                    Chưa có hóa đơn nào
                </div>
            `;
            return;
        }

        container.innerHTML = months.map(month => {
            const payments = paymentsByMonth[month];
            const totalAmount = payments.reduce((sum, p) => sum + p.total, 0);
            const paidCount = payments.filter(p => p.status === 'paid').length;
            const collectionRate = Math.round((paidCount / payments.length) * 100);

            return `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="stat-card">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h6 class="mb-0">${this.formatMonth(month)}</h6>
                            <span class="badge ${collectionRate === 100 ? 'bg-success' : 'bg-warning'}">${collectionRate}%</span>
                        </div>
                        <div class="mb-3">
                            <div class="small text-muted">Tổng số hóa đơn</div>
                            <div class="h5 mb-0">${payments.length}</div>
                        </div>
                        <div class="mb-3">
                            <div class="small text-muted">Tổng tiền</div>
                            <div class="h6 mb-0 text-primary">${tct8Manager.formatCurrency(totalAmount)}</div>
                        </div>
                        <div class="mb-3">
                            <div class="small text-muted">Đã thu</div>
                            <div class="text-success">${paidCount}/${payments.length}</div>
                        </div>
                        <div class="btn-group w-100" role="group">
                            <button class="btn btn-sm btn-outline-primary" onclick="feesManager.viewMonthDetails('${month}')">
                                <i class="fas fa-eye"></i> Xem
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="feesManager.exportMonth('${month}')">
                                <i class="fas fa-download"></i> Xuất
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadFeeStructure() {
        const tbody = document.getElementById('feeStructureTableBody');
        if (!tbody) return;

        const fees = tct8Manager.data.fees;

        if (fees.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-muted">
                        <i class="fas fa-cogs"></i>
                        Chưa có cấu trúc phí nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = fees.map(fee => `
            <tr>
                <td>
                    <span class="fw-bold">${fee.name}</span>
                </td>
                <td>
                    <span class="text-primary fw-bold">${tct8Manager.formatCurrency(fee.amount)}</span>
                </td>
                <td>
                    <span class="badge bg-secondary">${fee.unit}</span>
                </td>
                <td>
                    ${fee.description || '<span class="text-muted">Không có</span>'}
                </td>
                <td>
                    ${fee.isActive ? 
                        '<span class="status-badge status-active"><i class="fas fa-check"></i> Hoạt động</span>' :
                        '<span class="status-badge status-inactive"><i class="fas fa-times"></i> Không hoạt động</span>'
                    }
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="feesManager.editFeeType(${fee.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-${fee.isActive ? 'warning' : 'success'}" 
                                onclick="feesManager.toggleFeeStatus(${fee.id})" 
                                title="${fee.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}">
                            <i class="fas fa-${fee.isActive ? 'pause' : 'play'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    editPayment(id) {
        const payment = tct8Manager.data.payments.find(p => p.id === id);
        if (!payment) return;

        this.currentEditId = id;
        this.fillPaymentForm(payment);
        this.paymentModal.show();
    }

    fillPaymentForm(payment) {
        document.getElementById('paymentId').value = payment.id;
        document.getElementById('paymentApartment').value = payment.apartmentNumber;
        document.getElementById('paymentMonth').value = this.formatMonth(payment.month);
        document.getElementById('managementFee').value = payment.managementFee || 0;
        document.getElementById('serviceFee').value = payment.serviceFee || 0;
        document.getElementById('electricBill').value = payment.electricBill || 0;
        document.getElementById('waterBill').value = payment.waterBill || 0;
        document.getElementById('parkingFee').value = payment.parkingFee || 0;
        document.getElementById('totalAmount').value = payment.total;
        document.getElementById('paymentMethod').value = payment.paymentMethod || 'cash';
        document.getElementById('paidDate').value = payment.paidDate ? 
            new Date(payment.paidDate).toISOString().split('T')[0] : '';
        document.getElementById('paymentNotes').value = payment.notes || '';
    }

    calculateTotal() {
        const managementFee = parseFloat(document.getElementById('managementFee').value) || 0;
        const serviceFee = parseFloat(document.getElementById('serviceFee').value) || 0;
        const electricBill = parseFloat(document.getElementById('electricBill').value) || 0;
        const waterBill = parseFloat(document.getElementById('waterBill').value) || 0;
        const parkingFee = parseFloat(document.getElementById('parkingFee').value) || 0;

        const total = managementFee + serviceFee + electricBill + waterBill + parkingFee;
        document.getElementById('totalAmount').value = total;
    }

    savePayment() {
        const paymentData = this.getPaymentFormData();
        
        const index = tct8Manager.data.payments.findIndex(p => p.id === this.currentEditId);
        if (index !== -1) {
            tct8Manager.data.payments[index] = { ...tct8Manager.data.payments[index], ...paymentData };
            tct8Manager.saveData();
            tct8Manager.showSuccess('Thông tin thanh toán đã được cập nhật!');
            this.paymentModal.hide();
            this.updateStatistics();
            this.loadPayments();
        }
    }

    getPaymentFormData() {
        return {
            electricBill: parseFloat(document.getElementById('electricBill').value) || 0,
            waterBill: parseFloat(document.getElementById('waterBill').value) || 0,
            parkingFee: parseFloat(document.getElementById('parkingFee').value) || 0,
            total: parseFloat(document.getElementById('totalAmount').value) || 0,
            paymentMethod: document.getElementById('paymentMethod').value,
            paidDate: document.getElementById('paidDate').value ? 
                new Date(document.getElementById('paidDate').value) : null,
            notes: document.getElementById('paymentNotes').value.trim(),
            status: document.getElementById('paidDate').value ? 'paid' : 'pending'
        };
    }

    markAsPaid() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paidDate').value = today;
        
        this.calculateTotal();
        this.savePayment();
    }

    quickPay(id) {
        const payment = tct8Manager.data.payments.find(p => p.id === id);
        if (!payment) return;

        const message = `Xác nhận thanh toán cho căn hộ ${payment.apartmentNumber} tháng ${this.formatMonth(payment.month)}?\nSố tiền: ${tct8Manager.formatCurrency(payment.total)}`;
        
        if (typeof tct8Manager.showConfirm === 'function') {
            tct8Manager.showConfirm(message, () => {
                payment.status = 'paid';
                payment.paidDate = new Date();
                payment.paymentMethod = 'cash';
                
                tct8Manager.saveData();
                tct8Manager.showSuccess('Đã đánh dấu thanh toán thành công!');
                this.updateStatistics();
                this.loadPayments();
            });
        } else {
            if (confirm(message)) {
                payment.status = 'paid';
                payment.paidDate = new Date();
                payment.paymentMethod = 'cash';
                
                tct8Manager.saveData();
                alert('Đã đánh dấu thanh toán thành công!');
                this.updateStatistics();
                this.loadPayments();
            }
        }
    }

    showGenerateBillModal() {
        const currentMonth = new Date().toISOString().substr(0, 7);
        document.getElementById('billMonth').value = currentMonth;
        this.generateBillModal.show();
    }

    generateBills() {
        const month = document.getElementById('billMonth').value;
        const apartmentFilter = document.getElementById('billApartments').value;
        const includeParkingFee = document.getElementById('includeParkingFee').checked;

        if (!month) {
            alert('Vui lòng chọn tháng!');
            return;
        }

        let apartments = tct8Manager.data.apartments;
        if (apartmentFilter !== 'all') {
            apartments = apartments.filter(a => a.id === parseInt(apartmentFilter));
        }

        let generatedCount = 0;

        apartments.forEach(apartment => {
            // Check if bill already exists
            const existingPayment = tct8Manager.data.payments.find(p => 
                p.apartmentId === apartment.id && p.month === month
            );

            if (!existingPayment) {
                const newPayment = {
                    id: Math.max(...tct8Manager.data.payments.map(p => p.id), 0) + 1,
                    apartmentId: apartment.id,
                    apartmentNumber: apartment.number,
                    month: month,
                    managementFee: apartment.area * 20000, // 20k per m2
                    serviceFee: 500000,
                    electricBill: Math.floor(Math.random() * 500000) + 200000,
                    waterBill: Math.floor(Math.random() * 200000) + 100000,
                    parkingFee: includeParkingFee ? 300000 : 0,
                    total: 0,
                    status: 'pending',
                    paidDate: null,
                    paymentMethod: null,
                    notes: ''
                };

                newPayment.total = newPayment.managementFee + newPayment.serviceFee + 
                                 newPayment.electricBill + newPayment.waterBill + newPayment.parkingFee;

                tct8Manager.data.payments.push(newPayment);
                generatedCount++;
            }
        });

        if (generatedCount > 0) {
            tct8Manager.saveData();
            tct8Manager.showSuccess(`Đã tạo ${generatedCount} hóa đơn mới cho tháng ${this.formatMonth(month)}!`);
            this.generateBillModal.hide();
            this.updateStatistics();
            this.loadPayments();
            this.loadBills();
        } else {
            alert('Tất cả hóa đơn cho tháng này đã được tạo!');
        }
    }

    printBill(id) {
        const payment = tct8Manager.data.payments.find(p => p.id === id);
        if (!payment) return;

        const apartment = tct8Manager.data.apartments.find(a => a.id === payment.apartmentId);
        const resident = tct8Manager.data.residents.find(r => r.apartmentId === payment.apartmentId && r.relationship === 'Chủ hộ');

        const billContent = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h2 style="color: #007bff; margin: 0;">TCT8 BUILDING</h2>
                    <p style="margin: 5px 0;">HÓA ĐƠN THANH TOÁN PHÍ QUẢN LÝ</p>
                    <p style="margin: 0; font-size: 14px;">Tháng ${this.formatMonth(payment.month)}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>Căn hộ:</strong> ${payment.apartmentNumber}</p>
                    <p><strong>Chủ hộ:</strong> ${resident ? resident.name : 'Chưa cập nhật'}</p>
                    <p><strong>Diện tích:</strong> ${apartment ? apartment.area + ' m²' : 'Chưa cập nhật'}</p>
                    <p><strong>Ngày tạo:</strong> ${new Date().toLocaleDateString('vi-VN')}</p>
                </div>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Khoản phí</th>
                            <th style="border: 1px solid #ddd; padding: 12px; text-align: right;">Số tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Phí quản lý</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tct8Manager.formatCurrency(payment.managementFee || 0)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Phí dịch vụ</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tct8Manager.formatCurrency(payment.serviceFee || 0)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Tiền điện</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tct8Manager.formatCurrency(payment.electricBill || 0)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Tiền nước</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tct8Manager.formatCurrency(payment.waterBill || 0)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 8px;">Phí gửi xe</td>
                            <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${tct8Manager.formatCurrency(payment.parkingFee || 0)}</td>
                        </tr>
                        <tr style="background-color: #f8f9fa; font-weight: bold;">
                            <td style="border: 1px solid #ddd; padding: 12px;">TỔNG CỘNG</td>
                            <td style="border: 1px solid #ddd; padding: 12px; text-align: right; color: #007bff;">${tct8Manager.formatCurrency(payment.total)}</td>
                        </tr>
                    </tbody>
                </table>
                
                ${payment.status === 'paid' ? `
                <div style="text-align: center; color: #28a745; font-weight: bold; margin-bottom: 20px;">
                    ✓ ĐÃ THANH TOÁN - ${payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('vi-VN') : ''}
                </div>
                ` : `
                <div style="margin-bottom: 20px;">
                    <p><strong>Thông tin thanh toán:</strong></p>
                    <p>• Tiền mặt: Văn phòng quản lý tầng 1</p>
                    <p>• Chuyển khoản: Ngân hàng BIDV - STK: 1234567890</p>
                    <p>• Hạn thanh toán: Trước ngày 15 hàng tháng</p>
                </div>
                `}
                
                <div style="text-align: center; font-size: 12px; color: #666;">
                    <p>Cảm ơn quý cư dân đã sử dụng dịch vụ!</p>
                    <p>Liên hệ: 028-1234-5678 | Email: contact@tct8building.com</p>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hóa đơn ${payment.apartmentNumber} - ${this.formatMonth(payment.month)}</title>
                <style>
                    @media print {
                        body { margin: 0; }
                        @page { margin: 1cm; }
                    }
                </style>
            </head>
            <body>
                ${billContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    exportBills() {
        // Simple CSV export
        const headers = ['Căn hộ', 'Tháng', 'Phí quản lý', 'Phí dịch vụ', 'Tiền điện', 'Tiền nước', 'Phí gửi xe', 'Tổng cộng', 'Trạng thái'];
        const csvContent = [
            headers.join(','),
            ...tct8Manager.data.payments.map(payment => [
                payment.apartmentNumber,
                payment.month,
                payment.managementFee || 0,
                payment.serviceFee || 0,
                payment.electricBill || 0,
                payment.waterBill || 0,
                payment.parkingFee || 0,
                payment.total,
                payment.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `hoa_don_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Global functions
function showGenerateBillModal() {
    feesManager.showGenerateBillModal();
}

function generateBills() {
    feesManager.generateBills();
}

function savePayment() {
    feesManager.savePayment();
}

function markAsPaid() {
    feesManager.markAsPaid();
}

function exportBills() {
    feesManager.exportBills();
}

function printBills() {
    feesManager.printBill();
}

// Initialize fees manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tct8Manager) {
            window.feesManager = new FeesManager();
        }
    }, 100);
});