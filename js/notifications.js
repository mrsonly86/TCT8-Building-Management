// Notifications management functionality
class NotificationsManager {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.filteredNotifications = [];
        this.currentEditId = null;
        this.modal = null;
        this.previewModal = null;
        this.init();
    }

    init() {
        this.modal = new bootstrap.Modal(document.getElementById('notificationModal'));
        this.previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
        this.updateStatistics();
        this.loadNotifications();
        this.setupEventListeners();
        this.setDefaultDate();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchNotifications(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }

        // Type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterByType(e.target.value);
            });
        }

        // Form validation
        const form = document.getElementById('notificationForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveNotification();
            });
        }
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const dateInput = document.getElementById('notificationDate');
        if (dateInput) {
            dateInput.value = today;
        }
    }

    updateStatistics() {
        const notifications = tct8Manager.data.notifications;
        const total = notifications.length;
        const published = notifications.filter(n => n.status === 'published').length;
        const draft = notifications.filter(n => n.status === 'draft').length;
        const important = notifications.filter(n => n.isImportant).length;

        this.updateStat('totalNotifications', total);
        this.updateStat('publishedNotifications', published);
        this.updateStat('draftNotifications', draft);
        this.updateStat('importantNotifications', important);
    }

    updateStat(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.add('fade-in');
        }
    }

    loadNotifications() {
        this.filteredNotifications = [...tct8Manager.data.notifications];
        this.renderNotifications();
        this.renderPagination();
    }

    searchNotifications(query) {
        if (!query.trim()) {
            this.filteredNotifications = [...tct8Manager.data.notifications];
        } else {
            const searchTerm = query.toLowerCase();
            this.filteredNotifications = tct8Manager.data.notifications.filter(notification => 
                notification.title.toLowerCase().includes(searchTerm) ||
                notification.content.toLowerCase().includes(searchTerm)
            );
        }
        this.currentPage = 1;
        this.renderNotifications();
        this.renderPagination();
    }

    filterByStatus(status) {
        if (!status) {
            this.filteredNotifications = [...tct8Manager.data.notifications];
        } else {
            this.filteredNotifications = tct8Manager.data.notifications.filter(notification => 
                notification.status === status
            );
        }
        this.currentPage = 1;
        this.renderNotifications();
        this.renderPagination();
    }

    filterByType(type) {
        if (!type) {
            this.filteredNotifications = [...tct8Manager.data.notifications];
        } else {
            this.filteredNotifications = tct8Manager.data.notifications.filter(notification => 
                notification.type === type
            );
        }
        this.currentPage = 1;
        this.renderNotifications();
        this.renderPagination();
    }

    renderNotifications() {
        const container = document.getElementById('notificationsContainer');
        if (!container) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageNotifications = this.filteredNotifications
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(startIndex, endIndex);

        if (pageNotifications.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-4 text-muted">
                    <i class="fas fa-bell-slash fa-3x mb-3"></i>
                    <p>Không có thông báo nào</p>
                </div>
            `;
            return;
        }

        container.innerHTML = pageNotifications.map(notification => `
            <div class="col-lg-6 mb-4">
                <div class="stat-card h-100">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div class="d-flex align-items-center">
                            ${this.getTypeIcon(notification.type)}
                            <h6 class="mb-0 ms-2">${notification.title}</h6>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            ${notification.isImportant ? '<span class="badge bg-danger">Quan trọng</span>' : ''}
                            ${this.getStatusBadge(notification.status)}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <p class="text-muted mb-2" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                            ${notification.content}
                        </p>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center text-muted small mb-3">
                        <span><i class="fas fa-calendar"></i> ${tct8Manager.formatDate(notification.date)}</span>
                        <span><i class="fas fa-user"></i> Admin</span>
                    </div>
                    
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="notificationsManager.previewNotification(${notification.id})" title="Xem trước">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="notificationsManager.editNotification(${notification.id})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${notification.status === 'draft' ? `
                        <button class="btn btn-sm btn-outline-success" onclick="notificationsManager.publishNotification(${notification.id})" title="Đăng ngay">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                        ` : `
                        <button class="btn btn-sm btn-outline-warning" onclick="notificationsManager.unpublishNotification(${notification.id})" title="Thu hồi">
                            <i class="fas fa-undo"></i>
                        </button>
                        `}
                        <button class="btn btn-sm btn-outline-danger" onclick="notificationsManager.deleteNotification(${notification.id})" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Update showing info
        this.updateShowingInfo(startIndex, endIndex);
    }

    getTypeIcon(type) {
        const icons = {
            'info': '<i class="fas fa-info-circle text-info"></i>',
            'warning': '<i class="fas fa-exclamation-triangle text-warning"></i>',
            'success': '<i class="fas fa-check-circle text-success"></i>',
            'danger': '<i class="fas fa-times-circle text-danger"></i>'
        };
        return icons[type] || '<i class="fas fa-bell text-primary"></i>';
    }

    getStatusBadge(status) {
        const badges = {
            'published': '<span class="status-badge status-active"><i class="fas fa-check"></i> Đã đăng</span>',
            'draft': '<span class="status-badge status-pending"><i class="fas fa-edit"></i> Nháp</span>'
        };
        return badges[status] || status;
    }

    updateShowingInfo(startIndex, endIndex) {
        const total = this.filteredNotifications.length;
        const showingFrom = total > 0 ? startIndex + 1 : 0;
        const showingTo = Math.min(endIndex, total);

        document.getElementById('showingFrom').textContent = showingFrom;
        document.getElementById('showingTo').textContent = showingTo;
        document.getElementById('totalRecords').textContent = total;
    }

    renderPagination() {
        const totalPages = Math.ceil(this.filteredNotifications.length / this.itemsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (!pagination || totalPages <= 1) {
            if (pagination) pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="notificationsManager.goToPage(${this.currentPage - 1})">
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
                    <a class="page-link" href="#" onclick="notificationsManager.goToPage(${i})">${i}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="notificationsManager.goToPage(${this.currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredNotifications.length / this.itemsPerPage);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderNotifications();
            this.renderPagination();
        }
    }

    showAddNotificationModal() {
        this.currentEditId = null;
        document.getElementById('notificationModalTitle').textContent = 'Thêm thông báo mới';
        this.clearForm();
        this.modal.show();
    }

    editNotification(id) {
        const notification = tct8Manager.data.notifications.find(n => n.id === id);
        if (!notification) return;

        this.currentEditId = id;
        document.getElementById('notificationModalTitle').textContent = 'Chỉnh sửa thông báo';
        this.fillForm(notification);
        this.modal.show();
    }

    previewNotification(id) {
        const notification = tct8Manager.data.notifications.find(n => n.id === id);
        if (!notification) return;

        const previewContent = document.getElementById('previewContent');
        const typeClass = this.getTypeClass(notification.type);
        
        previewContent.innerHTML = `
            <div class="notification-preview">
                <div class="alert alert-${typeClass} d-flex align-items-start" role="alert">
                    ${this.getTypeIcon(notification.type)}
                    <div class="ms-3 flex-grow-1">
                        <h5 class="alert-heading d-flex justify-content-between align-items-center">
                            ${notification.title}
                            ${notification.isImportant ? '<span class="badge bg-danger">Quan trọng</span>' : ''}
                        </h5>
                        <div class="mb-3" style="white-space: pre-wrap;">${notification.content}</div>
                        <hr>
                        <div class="d-flex justify-content-between align-items-center">
                            <small class="mb-0">
                                <i class="fas fa-calendar"></i> ${tct8Manager.formatDate(notification.date)}
                            </small>
                            <small class="mb-0">
                                ${this.getStatusBadge(notification.status)}
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.currentPreviewId = id;
        this.previewModal.show();
    }

    getTypeClass(type) {
        const classes = {
            'info': 'info',
            'warning': 'warning',
            'success': 'success',
            'danger': 'danger'
        };
        return classes[type] || 'primary';
    }

    fillForm(notification) {
        document.getElementById('notificationId').value = notification.id;
        document.getElementById('notificationTitle').value = notification.title;
        document.getElementById('notificationType').value = notification.type;
        document.getElementById('notificationContent').value = notification.content;
        document.getElementById('notificationDate').value = new Date(notification.date).toISOString().split('T')[0];
        document.getElementById('notificationStatus').value = notification.status;
        document.getElementById('isImportant').checked = notification.isImportant || false;
        document.getElementById('sendToAll').checked = true;
        document.getElementById('sendEmail').checked = false;
    }

    clearForm() {
        document.getElementById('notificationForm').reset();
        document.getElementById('notificationId').value = '';
        this.setDefaultDate();
        
        // Remove validation classes
        const inputs = document.querySelectorAll('#notificationForm .form-control, #notificationForm .form-select');
        inputs.forEach(input => {
            input.classList.remove('is-valid', 'is-invalid');
        });
        
        // Remove error messages
        const errors = document.querySelectorAll('#notificationForm .field-error');
        errors.forEach(error => error.remove());
    }

    validateForm() {
        let isValid = true;

        // Required fields validation
        const requiredFields = [
            { id: 'notificationTitle', name: 'Tiêu đề' },
            { id: 'notificationType', name: 'Loại thông báo' },
            { id: 'notificationContent', name: 'Nội dung' },
            { id: 'notificationDate', name: 'Ngày đăng' },
            { id: 'notificationStatus', name: 'Trạng thái' }
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

        return isValid;
    }

    saveNotification(publish = false) {
        if (!this.validateForm()) {
            return;
        }

        const formData = this.getFormData();
        if (publish) {
            formData.status = 'published';
        }
        
        if (this.currentEditId) {
            // Update existing notification
            const index = tct8Manager.data.notifications.findIndex(n => n.id === this.currentEditId);
            if (index !== -1) {
                tct8Manager.data.notifications[index] = { ...formData, id: this.currentEditId };
                tct8Manager.showSuccess('Thông báo đã được cập nhật thành công!');
            }
        } else {
            // Add new notification
            const newId = Math.max(...tct8Manager.data.notifications.map(n => n.id), 0) + 1;
            tct8Manager.data.notifications.push({ ...formData, id: newId });
            tct8Manager.showSuccess(formData.status === 'published' ? 
                'Thông báo đã được đăng thành công!' : 
                'Thông báo đã được lưu nháp thành công!'
            );
        }

        tct8Manager.saveData();
        this.modal.hide();
        this.updateStatistics();
        this.loadNotifications();
    }

    saveDraft() {
        document.getElementById('notificationStatus').value = 'draft';
        this.saveNotification();
    }

    getFormData() {
        return {
            title: document.getElementById('notificationTitle').value.trim(),
            type: document.getElementById('notificationType').value,
            content: document.getElementById('notificationContent').value.trim(),
            date: new Date(document.getElementById('notificationDate').value),
            status: document.getElementById('notificationStatus').value,
            isImportant: document.getElementById('isImportant').checked,
            sendToAll: document.getElementById('sendToAll').checked,
            sendEmail: document.getElementById('sendEmail').checked
        };
    }

    publishNotification(id) {
        const notification = tct8Manager.data.notifications.find(n => n.id === id);
        if (!notification) return;

        const message = `Bạn có chắc chắn muốn đăng thông báo "${notification.title}"?`;
        
        if (typeof tct8Manager.showConfirm === 'function') {
            tct8Manager.showConfirm(message, () => {
                notification.status = 'published';
                tct8Manager.saveData();
                tct8Manager.showSuccess('Thông báo đã được đăng thành công!');
                this.updateStatistics();
                this.loadNotifications();
            });
        } else {
            if (confirm(message)) {
                notification.status = 'published';
                tct8Manager.saveData();
                alert('Thông báo đã được đăng thành công!');
                this.updateStatistics();
                this.loadNotifications();
            }
        }
    }

    unpublishNotification(id) {
        const notification = tct8Manager.data.notifications.find(n => n.id === id);
        if (!notification) return;

        const message = `Bạn có chắc chắn muốn thu hồi thông báo "${notification.title}"?`;
        
        if (typeof tct8Manager.showConfirm === 'function') {
            tct8Manager.showConfirm(message, () => {
                notification.status = 'draft';
                tct8Manager.saveData();
                tct8Manager.showSuccess('Thông báo đã được thu hồi!');
                this.updateStatistics();
                this.loadNotifications();
            });
        } else {
            if (confirm(message)) {
                notification.status = 'draft';
                tct8Manager.saveData();
                alert('Thông báo đã được thu hồi!');
                this.updateStatistics();
                this.loadNotifications();
            }
        }
    }

    deleteNotification(id) {
        const notification = tct8Manager.data.notifications.find(n => n.id === id);
        if (!notification) return;

        const message = `Bạn có chắc chắn muốn xóa thông báo "${notification.title}"?`;
        
        if (typeof tct8Manager.showConfirm === 'function') {
            tct8Manager.showConfirm(message, () => {
                const index = tct8Manager.data.notifications.findIndex(n => n.id === id);
                if (index !== -1) {
                    tct8Manager.data.notifications.splice(index, 1);
                    tct8Manager.saveData();
                    tct8Manager.showSuccess('Thông báo đã được xóa thành công!');
                    this.updateStatistics();
                    this.loadNotifications();
                }
            });
        } else {
            if (confirm(message)) {
                const index = tct8Manager.data.notifications.findIndex(n => n.id === id);
                if (index !== -1) {
                    tct8Manager.data.notifications.splice(index, 1);
                    tct8Manager.saveData();
                    alert('Thông báo đã được xóa thành công!');
                    this.updateStatistics();
                    this.loadNotifications();
                }
            }
        }
    }

    printNotification() {
        if (!this.currentPreviewId) return;

        const notification = tct8Manager.data.notifications.find(n => n.id === this.currentPreviewId);
        if (!notification) return;

        const typeClass = this.getTypeClass(notification.type);
        const printContent = `
            <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #007bff; padding-bottom: 20px;">
                    <h1 style="color: #007bff; margin: 0;">TCT8 BUILDING</h1>
                    <p style="margin: 5px 0; color: #666;">THÔNG BÁO</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h2 style="color: #333; text-align: center; margin-bottom: 20px;">${notification.title}</h2>
                    ${notification.isImportant ? '<div style="text-align: center; margin-bottom: 20px;"><span style="background: #dc3545; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold;">QUAN TRỌNG</span></div>' : ''}
                </div>
                
                <div style="margin-bottom: 30px; line-height: 1.6; white-space: pre-wrap;">
                    ${notification.content}
                </div>
                
                <div style="margin-top: 40px; text-align: right; color: #666;">
                    <p>Ngày: ${tct8Manager.formatDate(notification.date)}</p>
                    <p style="margin-top: 20px;">
                        <strong>BAN QUẢN LÝ TÒA NHÀ TCT8</strong>
                    </p>
                </div>
                
                <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px;">
                    <p>Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM | Điện thoại: 028-1234-5678</p>
                    <p>Email: contact@tct8building.com | Website: www.tct8building.com</p>
                </div>
            </div>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Thông báo - ${notification.title}</title>
                <style>
                    @media print {
                        body { margin: 0; }
                        @page { margin: 1.5cm; }
                    }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
}

// Global functions for modal
function showAddNotificationModal() {
    notificationsManager.showAddNotificationModal();
}

function saveNotification() {
    notificationsManager.saveNotification(true);
}

function saveDraft() {
    notificationsManager.saveDraft();
}

function printNotification() {
    notificationsManager.printNotification();
}

// Initialize notifications manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tct8Manager) {
            window.notificationsManager = new NotificationsManager();
        }
    }, 100);
});