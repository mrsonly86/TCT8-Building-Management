// Residents management functionality
class ResidentsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.filteredResidents = [];
        this.currentEditId = null;
        this.modal = null;
        this.init();
    }

    init() {
        this.modal = new bootstrap.Modal(document.getElementById('residentModal'));
        this.updateStatistics();
        this.loadResidents();
        this.setupEventListeners();
        this.populateApartmentFilters();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchResidents(e.target.value);
            });
        }

        // Apartment filter
        const apartmentFilter = document.getElementById('apartmentFilter');
        if (apartmentFilter) {
            apartmentFilter.addEventListener('change', (e) => {
                this.filterByApartment(e.target.value);
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
        const form = document.getElementById('residentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveResident();
            });
        }
    }

    updateStatistics() {
        const residents = tct8Manager.data.residents;
        const total = residents.length;
        const active = residents.filter(r => r.status === 'active').length;
        const householdHeads = residents.filter(r => r.relationship === 'Chủ hộ').length;
        const members = residents.filter(r => r.relationship !== 'Chủ hộ').length;

        this.updateStat('totalResidents', total);
        this.updateStat('activeResidents', active);
        this.updateStat('householdHeads', householdHeads);
        this.updateStat('members', members);
    }

    updateStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.add('fade-in');
        }
    }

    populateApartmentFilters() {
        const apartmentFilter = document.getElementById('apartmentFilter');
        const apartmentSelect = document.getElementById('apartmentId');
        
        if (!apartmentFilter || !apartmentSelect) return;

        const apartments = tct8Manager.data.apartments.sort((a, b) => a.number.localeCompare(b.number));
        
        // Populate apartment filter
        apartments.forEach(apartment => {
            const option = document.createElement('option');
            option.value = apartment.id;
            option.textContent = apartment.number;
            apartmentFilter.appendChild(option);
        });

        // Populate apartment select in modal
        apartments.forEach(apartment => {
            const option = document.createElement('option');
            option.value = apartment.id;
            option.textContent = `${apartment.number} - ${apartment.type}`;
            apartmentSelect.appendChild(option);
        });
    }

    loadResidents() {
        this.filteredResidents = [...tct8Manager.data.residents];
        this.renderTable();
        this.renderPagination();
    }

    searchResidents(query) {
        if (!query.trim()) {
            this.filteredResidents = [...tct8Manager.data.residents];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredResidents = tct8Manager.data.residents.filter(resident => 
                resident.name.toLowerCase().includes(searchTerm) ||
                resident.apartmentNumber.toLowerCase().includes(searchTerm) ||
                resident.phone.includes(searchTerm) ||
                resident.email.toLowerCase().includes(searchTerm) ||
                resident.idNumber.includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    filterByApartment(apartmentId) {
        if (!apartmentId) {
            this.filteredResidents = [...tct8Manager.data.residents];
        } else {
            this.filteredResidents = tct8Manager.data.residents.filter(resident => 
                resident.apartmentId === parseInt(apartmentId)
            );
        }
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredResidents = [...tct8Manager.data.residents];
        } else {
            this.filteredResidents = tct8Manager.data.residents.filter(resident => 
                resident.status === status
            );
        }
        this.currentPage = 1;
        this.renderTable();
        this.renderPagination();
    }

    renderTable() {
        const tbody = document.getElementById('residentsTableBody');
        if (!tbody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageResidents = this.filteredResidents.slice(startIndex, endIndex);

        if (pageResidents.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-muted">
                        <i class="fas fa-users"></i>
                        Không có cư dân nào
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = pageResidents.map(resident => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <div class="user-avatar bg-secondary text-white" style="width: 40px; height: 40px; font-size: 0.8rem;">
                                ${resident.name.charAt(0).toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div class="fw-bold">${resident.name}</div>
                            <div class="small text-muted">${resident.idNumber || 'Chưa có CCCD'}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge bg-primary">${resident.apartmentNumber}</span>
                </td>
                <td>
                    ${this.getRelationshipBadge(resident.relationship)}
                </td>
                <td>
                    <a href="tel:${resident.phone}" class="text-decoration-none">${resident.phone}</a>
                </td>
                <td>
                    ${resident.email ? `<a href="mailto:${resident.email}" class="text-decoration-none">${resident.email}</a>` : '<span class="text-muted">Chưa có</span>'}
                </td>
                <td>
                    ${resident.dateOfBirth ? this.calculateAge(resident.dateOfBirth) : '<span class="text-muted">Chưa có</span>'}
                </td>
                <td>
                    ${this.getStatusBadge(resident.status)}
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="residentsManager.editResident(${resident.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-info" onclick="residentsManager.viewResident(${resident.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="residentsManager.deleteResident(${resident.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Update showing info
        this.updateShowingInfo(startIndex, endIndex);
    }

    getRelationshipBadge(relationship) {
        const badges = {
            'Chủ hộ': '<span class="status-badge status-active"><i class="fas fa-crown"></i> Chủ hộ</span>',
            'Vợ/Chồng': '<span class="status-badge status-pending"><i class="fas fa-heart"></i> Vợ/Chồng</span>',
            'Con': '<span class="status-badge" style="background-color: #e3f2fd; color: #1976d2;"><i class="fas fa-child"></i> Con</span>',
            'Cha/Mẹ': '<span class="status-badge" style="background-color: #f3e5f5; color: #7b1fa2;"><i class="fas fa-user-friends"></i> Cha/Mẹ</span>',
            'Anh/Chị/Em': '<span class="status-badge" style="background-color: #fff3e0; color: #f57c00;"><i class="fas fa-user"></i> Anh/Chị/Em</span>',
            'Thành viên': '<span class="status-badge" style="background-color: #e8f5e8; color: #2e7d32;"><i class="fas fa-user-plus"></i> Thành viên</span>'
        };
        return badges[relationship] || `<span class="badge bg-secondary">${relationship}</span>`;
    }

    getStatusBadge(status) {
        const badges = {
            'active': '<span class="status-badge status-active"><i class="fas fa-check"></i> Hoạt động</span>',
            'inactive': '<span class="status-badge status-inactive"><i class="fas fa-times"></i> Không hoạt động</span>'
        };
        return badges[status] || status;
    }

    calculateAge(dateOfBirth) {
        if (!dateOfBirth) return '';
        
        const birth = new Date(dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return `${age} tuổi<br><small class="text-muted">${tct8Manager.formatDate(birth)}</small>`;
    }

    updateShowingInfo(startIndex, endIndex) {
        const total = this.filteredResidents.length;
        const showingFrom = total > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(endIndex, total);

        document.getElementById('showingFrom').textContent = showingFrom;
        document.getElementById('showingTo').textContent = showingTo;
        document.getElementById('totalRecords').textContent = total;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredResidents.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="residentsManager.goToPage(${this.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;

        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="residentsManager.goToPage(1)">1</a></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="residentsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><a class="page-link" href="#" onclick="residentsManager.goToPage(${totalPages})">${totalPages}</a></li>`;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="residentsManager.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredResidents.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderTable();
            this.renderPagination();
        }
    }

    showAddResidentModal() {
        this.currentEditId = null;
        document.getElementById('residentModalTitle').textContent = 'Thêm cư dân mới';
        this.clearForm();
        this.modal.show();
    }

    editResident(id) {
        const resident = tct8Manager.data.residents.find(r => r.id === id);
        if (!resident) return;

        this.currentEditId = id;
        document.getElementById('residentModalTitle').textContent = 'Chỉnh sửa cư dân';
        this.fillForm(resident);
        this.modal.show();
    }

    viewResident(id) {
        const resident = tct8Manager.data.residents.find(r => r.id === id);
        if (!resident) return;

        const apartment = tct8Manager.data.apartments.find(a => a.id === resident.apartmentId);
        const payments = tct8Manager.data.payments.filter(p => p.apartmentId === resident.apartmentId);
        
        const apartmentInfo = apartment ? `${apartment.number} - ${apartment.type} (${apartment.area}m²)` : 'Không tìm thấy';
        const age = resident.dateOfBirth ? this.calculateAge(resident.dateOfBirth).split('<br>')[0] : 'Chưa rõ';
        
        const recentPayments = payments.slice(-5).map(p => 
            `<li>${p.month}: ${tct8Manager.formatCurrency(p.total)} - ${p.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</li>`
        ).join('');

        // Use native alert if SweetAlert2 is not available
        if (typeof Swal === 'undefined') {
            alert(`Thông tin cư dân:\n\nHọ tên: ${resident.name}\nCăn hộ: ${apartmentInfo}\nQuan hệ: ${resident.relationship}\nTuổi: ${age}\nĐiện thoại: ${resident.phone}\nEmail: ${resident.email || 'Chưa có'}\nCCCD: ${resident.idNumber || 'Chưa có'}\nLiên hệ khẩn cấp: ${resident.emergencyContact || 'Chưa có'}\nTrạng thái: ${resident.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}`);
            return;
        }

        Swal.fire({
            title: `${resident.name}`,
            html: `
                <div class="text-start">
                    <h6>Thông tin cá nhân:</h6>
                    <ul class="list-unstyled">
                        <li><strong>Căn hộ:</strong> ${apartmentInfo}</li>
                        <li><strong>Quan hệ:</strong> ${resident.relationship}</li>
                        <li><strong>Tuổi:</strong> ${age}</li>
                        <li><strong>Giới tính:</strong> ${resident.gender || 'Chưa rõ'}</li>
                        <li><strong>CCCD/CMND:</strong> ${resident.idNumber || 'Chưa có'}</li>
                    </ul>
                    
                    <h6>Thông tin liên hệ:</h6>
                    <ul class="list-unstyled">
                        <li><strong>Điện thoại:</strong> ${resident.phone}</li>
                        <li><strong>Email:</strong> ${resident.email || 'Chưa có'}</li>
                        <li><strong>Liên hệ khẩn cấp:</strong> ${resident.emergencyContact || 'Chưa có'}</li>
                    </ul>
                    
                    <h6>Trạng thái:</h6>
                    <p>${resident.status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</p>
                    
                    ${resident.notes ? `<h6>Ghi chú:</h6><p>${resident.notes}</p>` : ''}
                    
                    ${recentPayments ? `<h6>Lịch sử thanh toán căn hộ:</h6><ul>${recentPayments}</ul>` : ''}
                </div>
            `,
            width: 600,
            confirmButtonText: 'Đóng'
        });
    }

    fillForm(resident) {
        document.getElementById('residentId').value = resident.id;
        document.getElementById('residentName').value = resident.name;
        document.getElementById('apartmentId').value = resident.apartmentId;
        document.getElementById('relationship').value = resident.relationship;
        document.getElementById('idNumber').value = resident.idNumber || '';
        document.getElementById('dateOfBirth').value = resident.dateOfBirth ? 
            new Date(resident.dateOfBirth).toISOString().split('T')[0] : '';
        document.getElementById('gender').value = resident.gender || '';
        document.getElementById('phone').value = resident.phone;
        document.getElementById('email').value = resident.email || '';
        document.getElementById('emergencyContact').value = resident.emergencyContact || '';
        document.getElementById('status').value = resident.status;
        document.getElementById('notes').value = resident.notes || '';
    }

    clearForm() {
        document.getElementById('residentForm').reset();
        document.getElementById('residentId').value = '';
        
        // Remove validation classes
        const inputs = document.querySelectorAll('#residentForm .form-control, #residentForm .form-select');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        // Remove error messages
        const errors = document.querySelectorAll('#residentForm .field-error');
        errors.forEach(error => error.remove());
    }

    validateForm() {
        let isValid = true;

        // Required fields validation
        const requiredFields = [
            { id: 'residentName', name: 'Họ và tên' },
            { id: 'apartmentId', name: 'Căn hộ' },
            { id: 'relationship', name: 'Quan hệ' },
            { id: 'phone', name: 'Số điện thoại' },
            { id: 'status', name: 'Trạng thái' }
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

        // Email validation
        const email = document.getElementById('email').value.trim();
        if (email) {
            const errors = validateInput(document.getElementById('email'), { email: true });
            showFieldError(document.getElementById('email'), errors);
            if (errors.length > 0) isValid = false;
        }

        // Phone validation
        const phone = document.getElementById('phone').value.trim();
        if (phone) {
            const errors = validateInput(document.getElementById('phone'), { phone: true });
            showFieldError(document.getElementById('phone'), errors);
            if (errors.length > 0) isValid = false;
        }

        // Emergency contact validation
        const emergencyContact = document.getElementById('emergencyContact').value.trim();
        if (emergencyContact) {
            const errors = validateInput(document.getElementById('emergencyContact'), { phone: true });
            showFieldError(document.getElementById('emergencyContact'), errors);
            if (errors.length > 0) isValid = false;
        }

        return isValid;
    }

    saveResident() {
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        
        if (this.currentEditId) {
            // Update existing resident
            const index = tct8Manager.data.residents.findIndex(r => r.id === this.currentEditId);
            if (index !== -1) {
                tct8Manager.data.residents[index] = { ...formData, id: this.currentEditId };
                tct8Manager.showSuccess('Thông tin cư dân đã được cập nhật thành công!');
            }
        } else {
            // Add new resident
            const newId = Math.max(...tct8Manager.data.residents.map(r => r.id), 0) + 1;
            tct8Manager.data.residents.push({ ...formData, id: newId });
            tct8Manager.showSuccess('Cư dân mới đã được thêm thành công!');
        }

        tct8Manager.saveData();
        this.modal.hide();
        this.updateStatistics();
        this.loadResidents();
    }

    getFormData() {
        const apartmentId = parseInt(document.getElementById('apartmentId').value);
        const apartment = tct8Manager.data.apartments.find(a => a.id === apartmentId);
        
        return {
            name: document.getElementById('residentName').value.trim(),
            apartmentId: apartmentId,
            apartmentNumber: apartment ? apartment.number : '',
            relationship: document.getElementById('relationship').value,
            idNumber: document.getElementById('idNumber').value.trim(),
            dateOfBirth: document.getElementById('dateOfBirth').value ? 
                new Date(document.getElementById('dateOfBirth').value) : null,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value.trim(),
            email: document.getElementById('email').value.trim(),
            emergencyContact: document.getElementById('emergencyContact').value.trim(),
            status: document.getElementById('status').value,
            notes: document.getElementById('notes').value.trim()
        };
    }

    deleteResident(id) {
        const resident = tct8Manager.data.residents.find(r => r.id === id);
        if (!resident) return;

        const confirmMessage = `Bạn có chắc chắn muốn xóa cư dân ${resident.name}?`;
        
        if (typeof tct8Manager.showConfirm === 'function') {
            tct8Manager.showConfirm(confirmMessage, () => {
                const index = tct8Manager.data.residents.findIndex(r => r.id === id);
                if (index !== -1) {
                    tct8Manager.data.residents.splice(index, 1);
                    tct8Manager.saveData();
                    tct8Manager.showSuccess('Cư dân đã được xóa thành công!');
                    this.updateStatistics();
                    this.loadResidents();
                }
            });
        } else {
            // Fallback to native confirm
            if (confirm(confirmMessage)) {
                const index = tct8Manager.data.residents.findIndex(r => r.id === id);
                if (index !== -1) {
                    tct8Manager.data.residents.splice(index, 1);
                    tct8Manager.saveData();
                    alert('Cư dân đã được xóa thành công!');
                    this.updateStatistics();
                    this.loadResidents();
                }
            }
        }
    }
}

// Global functions for modal
function showAddResidentModal() {
    residentsManager.showAddResidentModal();
}

function saveResident() {
    residentsManager.saveResident();
}

// Initialize residents manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tct8Manager) {
            window.residentsManager = new ResidentsManager();
        }
    }, 100);
});