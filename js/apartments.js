// Apartments management functionality
class ApartmentsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredApartments = [];
        this.currentEditId = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.modal = new bootstrap.Modal(document.getElementById('apartmentModal'));
        this.updateStatistics();
        this.loadApartments();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchApartments(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        // Form validation
        const form = document.getElementById('apartmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveApartment();
            });
        }

        // Auto-calculate management fee based on area
        const areaInput = document.getElementById('area');
        if (areaInput) {
            areaInput.addEventListener('input', (e) => {
                this.calculateManagementFee(e.target.value);
            });
        }
    }

    updateStatistics() {
        const apartments = tct8Manager.data.apartments;
        const total = apartments.length;
        const occupied = apartments.filter(a => a.status === 'occupied').length;
        const vacant = apartments.filter(a => a.status === 'vacant').length;
        const maintenance = apartments.filter(a => a.status === 'maintenance').length;

        this.updateStat('totalApartments', total);
        this.updateStat('occupiedApartments', occupied);
        this.updateStat('vacantApartments', vacant);
        this.updateStat('maintenanceApartments', maintenance);
    }

    updateStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.add('fade-in');
        }
    }

    loadApartments() {
        this.filteredApartments = [...tct8Manager.data.apartments];
        this.renderTable();
        this.renderPagination();
    }

    searchApartments(query) {
        if (!query.trim()) {
            this.filteredApartments = [...tct8Manager.data.apartments];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredApartments = tct8Manager.data.apartments.filter(apartment => 
                apartment.number.toLowerCase().includes(searchTerm) ||
                apartment.owner.toLowerCase().includes(searchTerm) ||
                apartment.phone.includes(searchTerm) ||
                apartment.type.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredApartments = [...tct8Manager.data.apartments];
        } else {
            this.filteredApartments = tct8Manager.data.apartments.filter(apartment => 
                apartment.status === status
            );
        }
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    renderTable() {
        const tbody = document.getElementById('apartmentsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageApartments = this.filteredApartments.slice(startIndex, endIndex);

        if (pageApartments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-4 text-muted">
                        <i class="fas fa-home"></i>
                        Không có căn hộ nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageApartments.map(apartment => `
            <tr>
                <td>
                    <span class="fw-bold">${apartment.number}</span>
                </td>
                <td>${apartment.floor}</td>
                <td>
                    <span class="badge bg-info">${apartment.type}</span>
                </td>
                <td>${apartment.area} m²</td>
                <td>
                    ${this.getStatusBadge(apartment.status)}
                </td>
                <td>
                    ${apartment.owner || '<span class="text-muted">Chưa có</span>'}
                </td>
                <td>
                    ${apartment.phone || '<span class="text-muted">Chưa có</span>'}
                </td>
                <td>
                    <span class="text-success fw-bold">${tct8Manager.formatCurrency(apartment.monthlyFee)}</span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="apartmentsManager.editApartment(${apartment.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="apartmentsManager.viewApartment(${apartment.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="apartmentsManager.deleteApartment(${apartment.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update showing info
        this.updateShowingInfo(startIndex, endIndex);
    }

    getStatusBadge(status) {
        const badges = {
            'occupied': '<span class="status-badge status-active"><i class="fas fa-user"></i> Đang ở</span>',
            'vacant': '<span class="status-badge status-pending"><i class="fas fa-door-open"></i> Trống</span>',
            'maintenance': '<span class="status-badge status-inactive"><i class="fas fa-tools"></i> Bảo trì</span>'
        };
        return badges[status] || status;
    }

    updateShowingInfo(startIndex, endIndex) {
        const total = this.filteredApartments.length;
        const showingFrom = total > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(endIndex, total);

        document.getElementById('showingFrom').textContent = showingFrom;
        document.getElementById('showingTo').textContent = showingTo;
        document.getElementById('totalRecords').textContent = total;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredApartments.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="apartmentsManager.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="apartmentsManager.goToPage(1)">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="apartmentsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="apartmentsManager.goToPage(${totalPages})">${totalPages}</a></li>`;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="apartmentsManager.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredApartments.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.renderPagination();
        }
    }

    calculateManagementFee(area) {
        if (area && !isNaN(area)) {
            const fee = parseInt(area) * 20000; // 20,000 VND per m²
            const monthlyFeeInput = document.getElementById('monthlyFee');
            if (monthlyFeeInput && !monthlyFeeInput.value) {
                monthlyFeeInput.value = fee;
            }
        }
    }

    showAddApartmentModal() {
        this.currentEditId = null;
        document.getElementById('apartmentModalTitle').textContent = 'Thêm căn hộ mới';
        this.clearForm();
        this.modal.show();
    }

    editApartment(id) {
        const apartment = tct8Manager.data.apartments.find(a => a.id === id);
        if (!apartment) return;

        this.currentEditId = id;
        document.getElementById('apartmentModalTitle').textContent = 'Chỉnh sửa căn hộ';
        this.fillForm(apartment);
        this.modal.show();
    }

    viewApartment(id) {
        const apartment = tct8Manager.data.apartments.find(a => a.id === id);
        if (!apartment) return;

        // Get residents in this apartment
        const residents = tct8Manager.data.residents.filter(r => r.apartmentId === id);
        const payments = tct8Manager.data.payments.filter(p => p.apartmentId === id);
        
        const residentsInfo = residents.length > 0 
            ? residents.map(r => `<li>${r.name} (${r.relationship})</li>`).join('')
            : '<li class="text-muted">Chưa có cư dân</li>';

        const paymentHistory = payments.slice(-3).map(p => 
            `<li>${p.month}: ${tct8Manager.formatCurrency(p.total)} - ${p.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</li>`
        ).join('');

        Swal.fire({
            title: `Căn hộ ${apartment.number}`,
            html: `
                <div class="text-start">
                    <h6>Thông tin căn hộ:</h6>
                    <ul class="list-unstyled">
                        <li><strong>Tầng:</strong> ${apartment.floor}</li>
                        <li><strong>Loại:</strong> ${apartment.type}</li>
                        <li><strong>Diện tích:</strong> ${apartment.area} m²</li>
                        <li><strong>Trạng thái:</strong> ${this.getStatusText(apartment.status)}</li>
                        <li><strong>Phí quản lý:</strong> ${tct8Manager.formatCurrency(apartment.monthlyFee)}</li>
                    </ul>
                    
                    <h6>Thông tin chủ hộ:</h6>
                    <ul class="list-unstyled">
                        <li><strong>Tên:</strong> ${apartment.owner || 'Chưa có'}</li>
                        <li><strong>Điện thoại:</strong> ${apartment.phone || 'Chưa có'}</li>
                        <li><strong>Email:</strong> ${apartment.email || 'Chưa có'}</li>
                        <li><strong>Ngày chuyển vào:</strong> ${apartment.moveInDate ? tct8Manager.formatDate(apartment.moveInDate) : 'Chưa có'}</li>
                    </ul>
                    
                    <h6>Cư dân hiện tại:</h6>
                    <ul>${residentsInfo}</ul>
                    
                    ${paymentHistory ? `<h6>Lịch sử thanh toán gần đây:</h6><ul>${paymentHistory}</ul>` : ''}
                </div>
            `,
            width: 600,
            confirmButtonText: 'Đóng'
        });
    }

    getStatusText(status) {
        const statusMap = {
            'occupied': 'Đang ở',
            'vacant': 'Trống',
            'maintenance': 'Bảo trì'
        };
        return statusMap[status] || status;
    }

    fillForm(apartment) {
        document.getElementById('apartmentId').value = apartment.id;
        document.getElementById('apartmentNumber').value = apartment.number;
        document.getElementById('floor').value = apartment.floor;
        document.getElementById('apartmentType').value = apartment.type;
        document.getElementById('area').value = apartment.area;
        document.getElementById('status').value = apartment.status;
        document.getElementById('monthlyFee').value = apartment.monthlyFee;
        document.getElementById('ownerName').value = apartment.owner || '';
        document.getElementById('ownerPhone').value = apartment.phone || '';
        document.getElementById('ownerEmail').value = apartment.email || '';
        document.getElementById('moveInDate').value = apartment.moveInDate ? 
            new Date(apartment.moveInDate).toISOString().split('T')[0] : '';
    }

    clearForm() {
        document.getElementById('apartmentForm').reset();
        document.getElementById('apartmentId').value = '';
        
        // Remove validation classes
        const inputs = document.querySelectorAll('#apartmentForm .form-control, #apartmentForm .form-select');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        // Remove error messages
        const errors = document.querySelectorAll('#apartmentForm .field-error');
        errors.forEach(error => error.remove());
    }

    validateForm() {
        const form = document.getElementById('apartmentForm');
        let isValid = true;

        // Required fields validation
        const requiredFields = [
            { id: 'apartmentNumber', name: 'Số căn hộ' },
            { id: 'floor', name: 'Tầng' },
            { id: 'apartmentType', name: 'Loại căn hộ' },
            { id: 'area', name: 'Diện tích' },
            { id: 'status', name: 'Trạng thái' },
            { id: 'monthlyFee', name: 'Phí quản lý' }
        ];

        requiredFields.forEach(field => {
            const input = document.getElementById(field.id);
            const value = input.value.trim();
            
            if (!value) {
                showFieldError(input, [`${field.name} là bắt buộc`]);
                isValid = false;
            } else {
                showFieldError(input, []);
            }
        });

        // Apartment number uniqueness check
        const apartmentNumber = document.getElementById('apartmentNumber').value.trim();
        if (apartmentNumber) {
            const existingApartment = tct8Manager.data.apartments.find(a => 
                a.number === apartmentNumber && a.id !== this.currentEditId
            );
            if (existingApartment) {
                showFieldError(document.getElementById('apartmentNumber'), ['Số căn hộ đã tồn tại']);
                isValid = false;
            }
        }

        // Area validation
        const area = document.getElementById('area').value;
        if (area && (isNaN(area) || parseInt(area) <= 0)) {
            showFieldError(document.getElementById('area'), ['Diện tích phải là số dương']);
            isValid = false;
        }

        // Monthly fee validation
        const monthlyFee = document.getElementById('monthlyFee').value;
        if (monthlyFee && (isNaN(monthlyFee) || parseInt(monthlyFee) < 0)) {
            showFieldError(document.getElementById('monthlyFee'), ['Phí quản lý phải là số không âm']);
            isValid = false;
        }

        // Email validation
        const email = document.getElementById('ownerEmail').value.trim();
        if (email) {
            const errors = validateInput(document.getElementById('ownerEmail'), { email: true });
            showFieldError(document.getElementById('ownerEmail'), errors);
            if (errors.length > 0) isValid = false;
        }

        // Phone validation
        const phone = document.getElementById('ownerPhone').value.trim();
        if (phone) {
            const errors = validateInput(document.getElementById('ownerPhone'), { phone: true });
            showFieldError(document.getElementById('ownerPhone'), errors);
            if (errors.length > 0) isValid = false;
        }

        return isValid;
    }

    saveApartment() {
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        if (this.currentEditId) {
            // Update existing apartment
            const index = tct8Manager.data.apartments.findIndex(a => a.id === this.currentEditId);
            if (index !== -1) {
                tct8Manager.data.apartments[index] = { ...formData, id: this.currentEditId };
                tct8Manager.showSuccess('Căn hộ đã được cập nhật thành công!');
            }
        } else {
            // Add new apartment
            const newId = Math.max(...tct8Manager.data.apartments.map(a => a.id), 0) + 1;
            tct8Manager.data.apartments.push({ ...formData, id: newId });
            tct8Manager.showSuccess('Căn hộ mới đã được thêm thành công!');
        }

        tct8Manager.saveData();
        this.modal.hide();
        this.updateStatistics();
        this.loadApartments();
    }

    getFormData() {
        return {
            number: document.getElementById('apartmentNumber').value.trim(),
            floor: parseInt(document.getElementById('floor').value),
            type: document.getElementById('apartmentType').value,
            area: parseInt(document.getElementById('area').value),
            status: document.getElementById('status').value,
            monthlyFee: parseInt(document.getElementById('monthlyFee').value),
            owner: document.getElementById('ownerName').value.trim(),
            phone: document.getElementById('ownerPhone').value.trim(),
            email: document.getElementById('ownerEmail').value.trim(),
            moveInDate: document.getElementById('moveInDate').value ? 
                new Date(document.getElementById('moveInDate').value) : null
        };
    }

    deleteApartment(id) {
        const apartment = tct8Manager.data.apartments.find(a => a.id === id);
        if (!apartment) return;

        // Check if apartment has residents
        const residents = tct8Manager.data.residents.filter(r => r.apartmentId === id);
        if (residents.length > 0) {
            Swal.fire({
                icon: 'error',
                title: 'Không thể xóa',
                text: 'Căn hộ này còn cư dân. Vui lòng chuyển cư dân trước khi xóa căn hộ.'
            });
            return;
        }

        tct8Manager.showConfirm(
            `Bạn có chắc chắn muốn xóa căn hộ ${apartment.number}?`,
            () => {
                const index = tct8Manager.data.apartments.findIndex(a => a.id === id);
                if (index !== -1) {
                    tct8Manager.data.apartments.splice(index, 1);
                    tct8Manager.saveData();
                    tct8Manager.showSuccess('Căn hộ đã được xóa thành công!');
                    this.updateStatistics();
                    this.loadApartments();
                }
            }
        );
    }
}

// Global functions for modal
function showAddApartmentModal() {
    apartmentsManager.showAddApartmentModal();
}

function saveApartment() {
    apartmentsManager.saveApartment();
}

// Initialize apartments manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tct8Manager) {
            window.apartmentsManager = new ApartmentsManager();
        }
    }, 100);
});