// Reports management functionality
class ReportsManager {
    constructor() {
        this.currentReport = null;
        this.currentReportData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
    }

    setupEventListeners() {
        // Period selection
        const periodSelect = document.getElementById('reportPeriod');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.handlePeriodChange(e.target.value);
            });
        }

        // Date inputs
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            startDate.addEventListener('change', () => this.refreshCurrentReport());
            endDate.addEventListener('change', () => this.refreshCurrentReport());
        }
    }

    setDefaultDates() {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (startDate) startDate.value = startOfMonth.toISOString().split('T')[0];
        if (endDate) endDate.value = endOfMonth.toISOString().split('T')[0];
    }

    handlePeriodChange(period) {
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        
        if (period === 'custom') {
            startDate.style.display = 'block';
            endDate.style.display = 'block';
        } else {
            startDate.style.display = 'none';
            endDate.style.display = 'none';
            this.setDatesByPeriod(period);
        }
        
        this.refreshCurrentReport();
    }

    setDatesByPeriod(period) {
        const now = new Date();
        let start, end;

        switch (period) {
            case 'current_month':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'last_month':
                start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                end = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'current_quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                start = new Date(now.getFullYear(), quarter * 3, 1);
                end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
                break;
            case 'current_year':
                start = new Date(now.getFullYear(), 0, 1);
                end = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                return;
        }

        document.getElementById('startDate').value = start.toISOString().split('T')[0];
        document.getElementById('endDate').value = end.toISOString().split('T')[0];
    }

    getDateRange() {
        const period = document.getElementById('reportPeriod').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        return {
            period,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        };
    }

    generateReport(type) {
        this.currentReport = type;
        const dateRange = this.getDateRange();

        switch (type) {
            case 'financial':
                this.generateFinancialReport(dateRange);
                break;
            case 'debt':
                this.generateDebtReport(dateRange);
                break;
            case 'residents':
                this.generateResidentsReport(dateRange);
                break;
            case 'apartments':
                this.generateApartmentsReport(dateRange);
                break;
        }
    }

    refreshCurrentReport() {
        if (this.currentReport) {
            this.generateReport(this.currentReport);
        }
    }

    generateFinancialReport(dateRange) {
        const payments = tct8Manager.data.payments.filter(p => {
            const paymentDate = new Date(p.month + '-01');
            return paymentDate >= dateRange.startDate && paymentDate <= dateRange.endDate;
        });

        // Calculate totals
        const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.total, 0);
        const totalPending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.total, 0);
        const collectionRate = payments.length > 0 ? 
            Math.round((payments.filter(p => p.status === 'paid').length / payments.length) * 100) : 0;

        // Group by month
        const monthlyData = {};
        payments.forEach(payment => {
            if (!monthlyData[payment.month]) {
                monthlyData[payment.month] = {
                    total: 0,
                    paid: 0,
                    pending: 0,
                    managementFee: 0,
                    serviceFee: 0,
                    electricBill: 0,
                    waterBill: 0,
                    parkingFee: 0
                };
            }
            
            const data = monthlyData[payment.month];
            data.total += payment.total;
            data.managementFee += payment.managementFee || 0;
            data.serviceFee += payment.serviceFee || 0;
            data.electricBill += payment.electricBill || 0;
            data.waterBill += payment.waterBill || 0;
            data.parkingFee += payment.parkingFee || 0;
            
            if (payment.status === 'paid') {
                data.paid += payment.total;
            } else {
                data.pending += payment.total;
            }
        });

        this.currentReportData = {
            type: 'financial',
            dateRange,
            summary: {
                totalRevenue,
                totalPending,
                collectionRate,
                totalPayments: payments.length
            },
            monthlyData
        };

        this.renderFinancialReport();
    }

    renderFinancialReport() {
        const data = this.currentReportData;
        const content = document.getElementById('reportContent');

        content.innerHTML = `
            <div class="data-table mb-4">
                <div class="table-header">
                    <h5 class="mb-0">Báo cáo tài chính</h5>
                    <span class="badge bg-info">${this.formatPeriod(data.dateRange.period)}</span>
                </div>
                
                <!-- Summary Cards -->
                <div class="row p-4">
                    <div class="col-md-3 mb-3">
                        <div class="text-center">
                            <div class="h4 text-success mb-1">${tct8Manager.formatCurrency(data.summary.totalRevenue)}</div>
                            <div class="small text-muted">Tổng thu</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="text-center">
                            <div class="h4 text-warning mb-1">${tct8Manager.formatCurrency(data.summary.totalPending)}</div>
                            <div class="small text-muted">Chưa thu</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="text-center">
                            <div class="h4 text-info mb-1">${data.summary.collectionRate}%</div>
                            <div class="small text-muted">Tỷ lệ thu</div>
                        </div>
                    </div>
                    <div class="col-md-3 mb-3">
                        <div class="text-center">
                            <div class="h4 text-primary mb-1">${data.summary.totalPayments}</div>
                            <div class="small text-muted">Hóa đơn</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Chart -->
            <div class="data-table mb-4">
                <div class="table-header">
                    <h6 class="mb-0">Biểu đồ doanh thu theo tháng</h6>
                </div>
                <div class="p-4">
                    <canvas id="financialChart" height="100"></canvas>
                </div>
            </div>

            <!-- Monthly Detail Table -->
            <div class="data-table">
                <div class="table-header">
                    <h6 class="mb-0">Chi tiết theo tháng</h6>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Tháng</th>
                                <th>Phí quản lý</th>
                                <th>Phí dịch vụ</th>
                                <th>Tiền điện</th>
                                <th>Tiền nước</th>
                                <th>Phí gửi xe</th>
                                <th>Tổng cộng</th>
                                <th>Đã thu</th>
                                <th>Chưa thu</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(data.monthlyData).map(([month, monthData]) => `
                                <tr>
                                    <td><strong>${this.formatMonth(month)}</strong></td>
                                    <td>${tct8Manager.formatCurrency(monthData.managementFee)}</td>
                                    <td>${tct8Manager.formatCurrency(monthData.serviceFee)}</td>
                                    <td>${tct8Manager.formatCurrency(monthData.electricBill)}</td>
                                    <td>${tct8Manager.formatCurrency(monthData.waterBill)}</td>
                                    <td>${tct8Manager.formatCurrency(monthData.parkingFee)}</td>
                                    <td><strong>${tct8Manager.formatCurrency(monthData.total)}</strong></td>
                                    <td class="text-success">${tct8Manager.formatCurrency(monthData.paid)}</td>
                                    <td class="text-warning">${tct8Manager.formatCurrency(monthData.pending)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Render chart
        this.renderFinancialChart(data.monthlyData);
    }

    renderFinancialChart(monthlyData) {
        const ctx = document.getElementById('financialChart');
        if (!ctx) return;

        const months = Object.keys(monthlyData).sort();
        const paidData = months.map(month => monthlyData[month].paid);
        const pendingData = months.map(month => monthlyData[month].pending);
        const labels = months.map(month => this.formatMonth(month));

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Đã thu',
                        data: paidData,
                        backgroundColor: '#28a745',
                        borderColor: '#28a745',
                        borderWidth: 1
                    },
                    {
                        label: 'Chưa thu',
                        data: pendingData,
                        backgroundColor: '#ffc107',
                        borderColor: '#ffc107',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + tct8Manager.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return tct8Manager.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    generateDebtReport(dateRange) {
        const pendingPayments = tct8Manager.data.payments.filter(p => 
            p.status === 'pending'
        );

        // Group by apartment
        const apartmentDebts = {};
        pendingPayments.forEach(payment => {
            if (!apartmentDebts[payment.apartmentId]) {
                const apartment = tct8Manager.data.apartments.find(a => a.id === payment.apartmentId);
                const resident = tct8Manager.data.residents.find(r => 
                    r.apartmentId === payment.apartmentId && r.relationship === 'Chủ hộ'
                );
                
                apartmentDebts[payment.apartmentId] = {
                    apartmentNumber: payment.apartmentNumber,
                    ownerName: apartment?.owner || (resident?.name) || 'Chưa cập nhật',
                    phone: apartment?.phone || (resident?.phone) || 'Chưa cập nhật',
                    payments: [],
                    totalDebt: 0,
                    oldestDebt: null
                };
            }
            
            apartmentDebts[payment.apartmentId].payments.push(payment);
            apartmentDebts[payment.apartmentId].totalDebt += payment.total;
            
            if (!apartmentDebts[payment.apartmentId].oldestDebt || 
                payment.month < apartmentDebts[payment.apartmentId].oldestDebt) {
                apartmentDebts[payment.apartmentId].oldestDebt = payment.month;
            }
        });

        this.currentReportData = {
            type: 'debt',
            dateRange,
            apartmentDebts,
            summary: {
                totalDebtors: Object.keys(apartmentDebts).length,
                totalDebtAmount: Object.values(apartmentDebts).reduce((sum, debt) => sum + debt.totalDebt, 0),
                totalPendingPayments: pendingPayments.length
            }
        };

        this.renderDebtReport();
    }

    renderDebtReport() {
        const data = this.currentReportData;
        const content = document.getElementById('reportContent');

        content.innerHTML = `
            <div class="data-table mb-4">
                <div class="table-header">
                    <h5 class="mb-0">Báo cáo công nợ</h5>
                    <span class="badge bg-warning">${Object.keys(data.apartmentDebts).length} căn hộ</span>
                </div>
                
                <!-- Summary -->
                <div class="row p-4">
                    <div class="col-md-4 mb-3">
                        <div class="text-center">
                            <div class="h4 text-danger mb-1">${data.summary.totalDebtors}</div>
                            <div class="small text-muted">Căn hộ nợ phí</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="text-center">
                            <div class="h4 text-warning mb-1">${tct8Manager.formatCurrency(data.summary.totalDebtAmount)}</div>
                            <div class="small text-muted">Tổng nợ</div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="text-center">
                            <div class="h4 text-info mb-1">${data.summary.totalPendingPayments}</div>
                            <div class="small text-muted">Hóa đơn chưa thanh toán</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="data-table">
                <div class="table-header">
                    <h6 class="mb-0">Danh sách căn hộ nợ phí</h6>
                </div>
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Căn hộ</th>
                                <th>Chủ hộ</th>
                                <th>Điện thoại</th>
                                <th>Số tháng nợ</th>
                                <th>Nợ từ tháng</th>
                                <th>Tổng nợ</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(data.apartmentDebts)
                                .sort((a, b) => b.totalDebt - a.totalDebt)
                                .map(debt => `
                                <tr>
                                    <td><strong>${debt.apartmentNumber}</strong></td>
                                    <td>${debt.ownerName}</td>
                                    <td>${debt.phone}</td>
                                    <td><span class="badge bg-warning">${debt.payments.length} tháng</span></td>
                                    <td>${this.formatMonth(debt.oldestDebt)}</td>
                                    <td><strong class="text-danger">${tct8Manager.formatCurrency(debt.totalDebt)}</strong></td>
                                    <td>
                                        <button class="btn btn-sm btn-outline-primary" onclick="reportsManager.viewDebtDetail('${debt.apartmentNumber}')">
                                            <i class="fas fa-eye"></i> Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateResidentsReport(dateRange) {
        const residents = tct8Manager.data.residents;
        
        // Statistics
        const totalResidents = residents.length;
        const activeResidents = residents.filter(r => r.status === 'active').length;
        const householdHeads = residents.filter(r => r.relationship === 'Chủ hộ').length;
        
        // Age groups
        const ageGroups = { under18: 0, from18to30: 0, from31to50: 0, from51to65: 0, over65: 0 };
        residents.forEach(resident => {
            if (resident.dateOfBirth) {
                const age = new Date().getFullYear() - new Date(resident.dateOfBirth).getFullYear();
                if (age < 18) ageGroups.under18++;
                else if (age <= 30) ageGroups.from18to30++;
                else if (age <= 50) ageGroups.from31to50++;
                else if (age <= 65) ageGroups.from51to65++;
                else ageGroups.over65++;
            }
        });

        this.currentReportData = {
            type: 'residents',
            dateRange,
            residents,
            summary: {
                totalResidents,
                activeResidents,
                householdHeads,
                ageGroups
            }
        };

        this.renderResidentsReport();
    }

    renderResidentsReport() {
        const data = this.currentReportData;
        const content = document.getElementById('reportContent');

        content.innerHTML = `
            <div class="data-table">
                <div class="table-header">
                    <h5 class="mb-0">Báo cáo cư dân</h5>
                </div>
                
                <div class="row p-4">
                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-primary mb-1">${data.summary.totalResidents}</div>
                                    <div class="small text-muted">Tổng cư dân</div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-success mb-1">${data.summary.activeResidents}</div>
                                    <div class="small text-muted">Đang hoạt động</div>
                                </div>
                            </div>
                            <div class="col-md-4 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-warning mb-1">${data.summary.householdHeads}</div>
                                    <div class="small text-muted">Chủ hộ</div>
                                </div>
                            </div>
                        </div>
                        
                        <h6 class="mt-4 mb-3">Phân bố độ tuổi</h6>
                        <div class="row">
                            <div class="col-md-6 mb-2">Dưới 18 tuổi: <strong>${data.summary.ageGroups.under18}</strong></div>
                            <div class="col-md-6 mb-2">18-30 tuổi: <strong>${data.summary.ageGroups.from18to30}</strong></div>
                            <div class="col-md-6 mb-2">31-50 tuổi: <strong>${data.summary.ageGroups.from31to50}</strong></div>
                            <div class="col-md-6 mb-2">51-65 tuổi: <strong>${data.summary.ageGroups.from51to65}</strong></div>
                            <div class="col-md-6 mb-2">Trên 65 tuổi: <strong>${data.summary.ageGroups.over65}</strong></div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <canvas id="ageChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Render age chart
        this.renderAgeChart(data.summary.ageGroups);
    }

    renderAgeChart(ageGroups) {
        const ctx = document.getElementById('ageChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Dưới 18', '18-30', '31-50', '51-65', 'Trên 65'],
                datasets: [{
                    data: [
                        ageGroups.under18,
                        ageGroups.from18to30,
                        ageGroups.from31to50,
                        ageGroups.from51to65,
                        ageGroups.over65
                    ],
                    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    generateApartmentsReport(dateRange) {
        const apartments = tct8Manager.data.apartments;
        
        // Statistics
        const totalApartments = apartments.length;
        const occupiedApartments = apartments.filter(a => a.status === 'occupied').length;
        const vacantApartments = apartments.filter(a => a.status === 'vacant').length;
        const maintenanceApartments = apartments.filter(a => a.status === 'maintenance').length;
        
        // Type distribution
        const typeDistribution = {};
        apartments.forEach(apartment => {
            typeDistribution[apartment.type] = (typeDistribution[apartment.type] || 0) + 1;
        });

        this.currentReportData = {
            type: 'apartments',
            dateRange,
            apartments,
            summary: {
                totalApartments,
                occupiedApartments,
                vacantApartments,
                maintenanceApartments,
                typeDistribution,
                occupancyRate: Math.round((occupiedApartments / totalApartments) * 100)
            }
        };

        this.renderApartmentsReport();
    }

    renderApartmentsReport() {
        const data = this.currentReportData;
        const content = document.getElementById('reportContent');

        content.innerHTML = `
            <div class="data-table">
                <div class="table-header">
                    <h5 class="mb-0">Báo cáo căn hộ</h5>
                </div>
                
                <div class="row p-4">
                    <div class="col-md-8">
                        <div class="row">
                            <div class="col-md-3 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-primary mb-1">${data.summary.totalApartments}</div>
                                    <div class="small text-muted">Tổng căn hộ</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-success mb-1">${data.summary.occupiedApartments}</div>
                                    <div class="small text-muted">Đang ở</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-warning mb-1">${data.summary.vacantApartments}</div>
                                    <div class="small text-muted">Trống</div>
                                </div>
                            </div>
                            <div class="col-md-3 mb-3">
                                <div class="text-center">
                                    <div class="h4 text-danger mb-1">${data.summary.maintenanceApartments}</div>
                                    <div class="small text-muted">Bảo trì</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="mb-3">Phân loại căn hộ</h6>
                                ${Object.entries(data.summary.typeDistribution).map(([type, count]) => `
                                    <div class="mb-2">${type}: <strong>${count} căn hộ</strong></div>
                                `).join('')}
                            </div>
                            <div class="col-md-6">
                                <h6 class="mb-3">Tỷ lệ lấp đầy</h6>
                                <div class="h2 text-info">${data.summary.occupancyRate}%</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <canvas id="statusChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        `;

        // Render status chart
        this.renderStatusChart(data.summary);
    }

    renderStatusChart(summary) {
        const ctx = document.getElementById('statusChart');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Đang ở', 'Trống', 'Bảo trì'],
                datasets: [{
                    data: [
                        summary.occupiedApartments,
                        summary.vacantApartments,
                        summary.maintenanceApartments
                    ],
                    backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    formatMonth(month) {
        const date = new Date(month + '-01');
        return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
    }

    formatPeriod(period) {
        const periods = {
            'current_month': 'Tháng hiện tại',
            'last_month': 'Tháng trước',
            'current_quarter': 'Quý hiện tại',
            'current_year': 'Năm hiện tại',
            'custom': 'Tùy chọn'
        };
        return periods[period] || period;
    }

    exportCurrentReport() {
        if (!this.currentReportData) {
            alert('Vui lòng chọn một báo cáo để xuất!');
            return;
        }

        // Simple CSV export
        let csvContent = '';
        const data = this.currentReportData;

        switch (data.type) {
            case 'financial':
                csvContent = this.generateFinancialCSV(data);
                break;
            case 'debt':
                csvContent = this.generateDebtCSV(data);
                break;
            default:
                alert('Loại báo cáo này chưa hỗ trợ xuất file!');
                return;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `bao_cao_${data.type}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    generateFinancialCSV(data) {
        const headers = ['Tháng', 'Phí quản lý', 'Phí dịch vụ', 'Tiền điện', 'Tiền nước', 'Phí gửi xe', 'Tổng cộng', 'Đã thu', 'Chưa thu'];
        const rows = Object.entries(data.monthlyData).map(([month, monthData]) => [
            this.formatMonth(month),
            monthData.managementFee,
            monthData.serviceFee,
            monthData.electricBill,
            monthData.waterBill,
            monthData.parkingFee,
            monthData.total,
            monthData.paid,
            monthData.pending
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    generateDebtCSV(data) {
        const headers = ['Căn hộ', 'Chủ hộ', 'Điện thoại', 'Số tháng nợ', 'Nợ từ tháng', 'Tổng nợ'];
        const rows = Object.values(data.apartmentDebts).map(debt => [
            debt.apartmentNumber,
            debt.ownerName,
            debt.phone,
            debt.payments.length,
            this.formatMonth(debt.oldestDebt),
            debt.totalDebt
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    exportPDF() {
        alert('Tính năng xuất PDF sẽ được cập nhật trong phiên bản tiếp theo!');
    }

    viewDebtDetail(apartmentNumber) {
        const data = this.currentReportData;
        if (!data || data.type !== 'debt') return;

        const debt = Object.values(data.apartmentDebts).find(d => d.apartmentNumber === apartmentNumber);
        if (!debt) return;

        alert(`Chi tiết nợ căn hộ ${apartmentNumber}:\n\n` +
              `Chủ hộ: ${debt.ownerName}\n` +
              `Số tháng nợ: ${debt.payments.length}\n` +
              `Tổng nợ: ${tct8Manager.formatCurrency(debt.totalDebt)}\n\n` +
              `Các tháng chưa thanh toán:\n` +
              debt.payments.map(p => `- ${this.formatMonth(p.month)}: ${tct8Manager.formatCurrency(p.total)}`).join('\n'));
    }
}

// Global functions
function generateReport(type) {
    reportsManager.generateReport(type);
}

function exportCurrentReport() {
    reportsManager.exportCurrentReport();
}

function exportPDF() {
    reportsManager.exportPDF();
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.tct8Manager) {
            window.reportsManager = new ReportsManager();
        }
    }, 100);
});