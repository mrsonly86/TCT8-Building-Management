// Dashboard specific functionality
class DashboardManager {
    constructor() {
        this.charts = {};
        this.init();
    }

    init() {
        this.updateStatistics();
        this.initCharts();
        this.loadRecentActivities();
    }

    updateStatistics() {
        const totalApartments = tct8Manager.data.apartments.length;
        const totalResidents = tct8Manager.data.residents.filter(r => r.status === 'active').length;
        
        // Calculate monthly revenue (current month)
        const currentMonth = new Date().toISOString().substr(0, 7);
        const monthlyPayments = tct8Manager.data.payments.filter(p => 
            p.month === currentMonth && p.status === 'paid'
        );
        const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.total, 0);
        
        // Count pending payments
        const pendingPayments = tct8Manager.data.payments.filter(p => p.status === 'pending').length;

        // Update DOM elements
        this.updateElement('totalApartments', totalApartments);
        this.updateElement('totalResidents', totalResidents);
        this.updateElement('monthlyRevenue', tct8Manager.formatCurrency(monthlyRevenue));
        this.updateElement('pendingPayments', pendingPayments);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.classList.add('fade-in');
        }
    }

    initCharts() {
        this.initRevenueChart();
        this.initFeeChart();
    }

    initRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Get last 6 months data
        const months = this.getLast6Months();
        const revenueData = months.map(month => {
            const payments = tct8Manager.data.payments.filter(p => 
                p.month === month && p.status === 'paid'
            );
            return payments.reduce((sum, p) => sum + p.total, 0);
        });

        const monthLabels = months.map(month => {
            const date = new Date(month + '-01');
            return date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' });
        });

        this.charts.revenue = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Doanh thu (VNĐ)',
                    data: revenueData,
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#007bff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Doanh thu: ' + new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND',
                                    notation: 'compact'
                                }).format(value);
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                }
            }
        });
    }

    initFeeChart() {
        const ctx = document.getElementById('feeChart');
        if (!ctx) return;

        // Calculate fee distribution from current month
        const currentMonth = new Date().toISOString().substr(0, 7);
        const currentPayments = tct8Manager.data.payments.filter(p => 
            p.month === currentMonth && p.status === 'paid'
        );

        const feeDistribution = {
            'Phí quản lý': 0,
            'Phí dịch vụ': 0,
            'Tiền điện': 0,
            'Tiền nước': 0,
            'Phí gửi xe': 0
        };

        currentPayments.forEach(payment => {
            feeDistribution['Phí quản lý'] += payment.managementFee || 0;
            feeDistribution['Phí dịch vụ'] += payment.serviceFee || 0;
            feeDistribution['Tiền điện'] += payment.electricBill || 0;
            feeDistribution['Tiền nước'] += payment.waterBill || 0;
            feeDistribution['Phí gửi xe'] += payment.parkingFee || 0;
        });

        const labels = Object.keys(feeDistribution);
        const data = Object.values(feeDistribution);
        const colors = ['#007bff', '#28a745', '#ffc107', '#17a2b8', '#6f42c1'];

        this.charts.fee = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: 'VND'
                                }).format(context.parsed);
                                return label + ': ' + value;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    getLast6Months() {
        const months = [];
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toISOString().substr(0, 7));
        }
        
        return months;
    }

    loadRecentActivities() {
        this.loadRecentNotifications();
        this.loadRecentPayments();
    }

    loadRecentNotifications() {
        const container = document.getElementById('recentNotifications');
        if (!container) return;

        const recentNotifications = tct8Manager.data.notifications
            .filter(n => n.status === 'published')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recentNotifications.length === 0) {
            container.innerHTML = `
                <tr>
                    <td class="text-center py-4 text-muted">
                        <i class="fas fa-bell-slash"></i>
                        Chưa có thông báo nào
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = recentNotifications.map(notification => {
            const typeIcon = this.getNotificationIcon(notification.type);
            const typeClass = this.getNotificationClass(notification.type);
            
            return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="me-3">
                                <i class="${typeIcon} ${typeClass}"></i>
                            </div>
                            <div>
                                <div class="fw-bold">${notification.title}</div>
                                <div class="small text-muted">${tct8Manager.formatDate(notification.date)}</div>
                            </div>
                            ${notification.isImportant ? '<span class="badge bg-danger ms-auto">Quan trọng</span>' : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadRecentPayments() {
        const container = document.getElementById('recentPayments');
        if (!container) return;

        const recentPayments = tct8Manager.data.payments
            .filter(p => p.status === 'paid' && p.paidDate)
            .sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate))
            .slice(0, 10);

        if (recentPayments.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        <i class="fas fa-money-bill-slash"></i>
                        Chưa có thanh toán nào
                    </td>
                </tr>
            `;
            return;
        }

        container.innerHTML = recentPayments.map(payment => `
            <tr>
                <td>
                    <span class="fw-bold">${payment.apartmentNumber}</span>
                </td>
                <td>
                    <span class="text-success fw-bold">${tct8Manager.formatCurrency(payment.total)}</span>
                </td>
                <td>
                    <span class="small">${tct8Manager.formatDate(payment.paidDate)}</span>
                </td>
                <td>
                    <span class="status-badge status-active">
                        <i class="fas fa-check"></i> Đã thanh toán
                    </span>
                </td>
            </tr>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'fas fa-info-circle',
            'warning': 'fas fa-exclamation-triangle',
            'success': 'fas fa-check-circle',
            'danger': 'fas fa-times-circle'
        };
        return icons[type] || 'fas fa-bell';
    }

    getNotificationClass(type) {
        const classes = {
            'info': 'text-info',
            'warning': 'text-warning',
            'success': 'text-success',
            'danger': 'text-danger'
        };
        return classes[type] || 'text-primary';
    }

    refreshDashboard() {
        this.updateStatistics();
        
        // Update charts
        if (this.charts.revenue) {
            this.charts.revenue.destroy();
        }
        if (this.charts.fee) {
            this.charts.fee.destroy();
        }
        
        this.initCharts();
        this.loadRecentActivities();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for tct8Manager to be initialized
    setTimeout(() => {
        if (window.tct8Manager) {
            window.dashboardManager = new DashboardManager();
        }
    }, 100);
});

// Auto-refresh dashboard every 5 minutes
setInterval(() => {
    if (window.dashboardManager) {
        dashboardManager.refreshDashboard();
    }
}, 5 * 60 * 1000);