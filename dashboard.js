const CONFIG = {
    API_BASE_URL: 'http://localhost:5000/api',
    REFRESH_INTERVAL: 10000,
    DEVICE_ID: 'android_device_001'
};

let appState = {
    stepData: [],
    currentPage: 1,
    pageSize: 10,
    filteredData: [],
    searchTerm: '',
    charts: {
        timeline: null,
        distribution: null
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Step Counter Dashboard Initializing...');
    initializeApp();
});

async function initializeApp() {
    await checkBackendStatus();
    await loadAllData();
    
    setInterval(() => {
        loadAllData();
    }, CONFIG.REFRESH_INTERVAL);
    
    setInterval(() => {
        checkBackendStatus();
    }, 30000);
}

async function checkBackendStatus() {
    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}/health`);
        const statusElement = document.getElementById('connectionStatus');
        const backendStatusElement = document.getElementById('backendStatus');
        
        if (response.ok) {
            statusElement.className = 'badge bg-success';
            statusElement.textContent = 'Connected';
            backendStatusElement.className = 'badge bg-success';
            backendStatusElement.textContent = 'Online';
        } else {
            throw new Error('Backend not healthy');
        }
    } catch (error) {
        console.error('Backend connection failed:', error);
        document.getElementById('connectionStatus').className = 'badge bg-danger';
        document.getElementById('connectionStatus').textContent = 'Disconnected';
        document.getElementById('backendStatus').className = 'badge bg-danger';
        document.getElementById('backendStatus').textContent = 'Offline';
    }
}

async function loadAllData() {
    try {
        updateDataStatus('loading');
        
        const [stats, steps] = await Promise.all([
            fetchStats(),
            fetchStepData()
        ]);
        
        appState.stepData = steps;
        appState.filteredData = [...steps];
        
        updateStatistics(stats);
        updateCharts();
        updateRecentActivity();
        updateDataTable();
        updateDataStatus('success');
        
        updateLastUpdated();
        
    } catch (error) {
        console.error('Error loading data:', error);
        updateDataStatus('error');
        showError('Failed to load data. Please check backend connection.');
    }
}

async function fetchStats() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/stats?device_id=${CONFIG.DEVICE_ID}`);
    if (!response.ok) throw new Error('Failed to fetch statistics');
    return await response.json();
}

async function fetchStepData() {
    const response = await fetch(`${CONFIG.API_BASE_URL}/steps?device_id=${CONFIG.DEVICE_ID}`);
    if (!response.ok) throw new Error('Failed to fetch step data');
    const data = await response.json();
    return data.data || [];
}

function updateStatistics(stats) {
    document.getElementById('totalSteps').textContent = formatNumber(stats.total_steps);
    document.getElementById('totalRecords').textContent = formatNumber(stats.records_count);
    
    const avgSteps = stats.records_count > 0 ? Math.round(stats.total_steps / stats.records_count) : 0;
    document.getElementById('avgSteps').textContent = formatNumber(avgSteps);
    
    document.getElementById('deviceId').textContent = stats.device_id;
    
    const todaySteps = calculateTodaySteps(appState.stepData);
    document.getElementById('stepsTrend').textContent = formatNumber(todaySteps);
}

function updateCharts() {
    updateTimelineChart();
    updateDistributionChart();
}

function updateTimelineChart() {
    const ctx = document.getElementById('timelineChart').getContext('2d');
    const timeRange = document.getElementById('timeRange').value;
    
    const filteredData = filterDataByTimeRange(appState.stepData, timeRange);
    
    if (appState.charts.timeline) {
        appState.charts.timeline.destroy();
    }
    
    const labels = filteredData.map(record => 
        new Date(record.client_timestamp).toLocaleDateString()
    );
    
    const data = filteredData.map(record => record.step_count);
    
    appState.charts.timeline = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Step Count',
                data: data,
                borderColor: '#4361ee',
                backgroundColor: 'rgba(67, 97, 238, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4361ee',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4
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
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

function updateDistributionChart() {
    const ctx = document.getElementById('distributionChart').getContext('2d');
    
    const dailyData = {};
    appState.stepData.forEach(record => {
        const date = new Date(record.client_timestamp).toDateString();
        if (!dailyData[date]) {
            dailyData[date] = 0;
        }
        dailyData[date] += record.step_count;
    });
    
    const labels = Object.keys(dailyData).slice(-7);
    const data = labels.map(date => dailyData[date]);
    
    if (appState.charts.distribution) {
        appState.charts.distribution.destroy();
    }
    
    appState.charts.distribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#4361ee', '#3a0ca3', '#4cc9f0', '#f72585',
                    '#7209b7', '#4895ef', '#560bad'
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '60%'
        }
    });
}

function updateRecentActivity() {
    const container = document.getElementById('recentActivity');
    const recentData = appState.stepData.slice(-8).reverse();
    
    if (recentData.length === 0) {
        container.innerHTML = '<div class="text-center py-4 text-muted">No activity data available</div>';
        return;
    }
    
    container.innerHTML = recentData.map(record => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-walking"></i>
            </div>
            <div class="activity-content">
                <div class="activity-steps">${record.step_count} steps</div>
                <div class="activity-time">
                    ${new Date(record.client_timestamp).toLocaleString()}
                </div>
            </div>
        </div>
    `).join('');
}

function updateDataTable() {
    renderTable();
}

function renderTable() {
    const tableBody = document.getElementById('dataTable');
    const startIndex = (appState.currentPage - 1) * appState.pageSize;
    const endIndex = startIndex + appState.pageSize;
    const pageData = appState.filteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-4 text-muted">
                    ${appState.searchTerm ? 'No matching records found' : 'No data available'}
                </td>
            </tr>
        `;
        updatePaginationInfo(0, 0, 0);
        return;
    }
    
    tableBody.innerHTML = pageData.map((record, index) => `
        <tr class="data-update">
            <td><strong>${record.step_count}</strong></td>
            <td>${new Date(record.client_timestamp).toLocaleTimeString()}</td>
            <td>${new Date(record.client_timestamp).toLocaleDateString()}</td>
        </tr>
    `).join('');
    
    updatePaginationInfo(
        startIndex + 1,
        Math.min(endIndex, appState.filteredData.length),
        appState.filteredData.length
    );
    
    renderPagination();
}

function updatePaginationInfo(from, to, total) {
    document.getElementById('showingFrom').textContent = from;
    document.getElementById('showingTo').textContent = to;
    document.getElementById('totalEntries').textContent = total;
}

function renderPagination() {
    const totalPages = Math.ceil(appState.filteredData.length / appState.pageSize);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    const prevDisabled = appState.currentPage === 1 ? 'disabled' : '';
    paginationHTML += `
        <li class="page-item ${prevDisabled}">
            <a class="page-link" href="#" onclick="changePage(${appState.currentPage - 1})">Previous</a>
        </li>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        const active = i === appState.currentPage ? 'active' : '';
        paginationHTML += `
            <li class="page-item ${active}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }
    
    const nextDisabled = appState.currentPage === totalPages ? 'disabled' : '';
    paginationHTML += `
        <li class="page-item ${nextDisabled}">
            <a class="page-link" href="#" onclick="changePage(${appState.currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(appState.filteredData.length / appState.pageSize);
    if (page >= 1 && page <= totalPages) {
        appState.currentPage = page;
        renderTable();
    }
}

function changePageSize() {
    appState.pageSize = parseInt(document.getElementById('pageSize').value);
    appState.currentPage = 1;
    renderTable();
}

function filterTable() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    appState.searchTerm = searchTerm;
    appState.currentPage = 1;
    
    if (searchTerm) {
        appState.filteredData = appState.stepData.filter(record =>
            record.step_count.toString().includes(searchTerm) ||
            record.client_timestamp.toLowerCase().includes(searchTerm) ||
            record.server_timestamp.toLowerCase().includes(searchTerm)
        );
    } else {
        appState.filteredData = [...appState.stepData];
    }
    
    renderTable();
}

function filterDataByTimeRange(data, range) {
    const now = new Date();
    let cutoffDate;
    
    switch (range) {
        case '1':
            cutoffDate = new Date(now.setDate(now.getDate() - 1));
            break;
        case '7':
            cutoffDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case '30':
            cutoffDate = new Date(now.setDate(now.getDate() - 30));
            break;
        case 'all':
        default:
            return data;
    }
    
    return data.filter(record => {
        const recordDate = new Date(record.client_timestamp);
        return recordDate >= cutoffDate;
    });
}

function calculateTodaySteps(data) {
    const today = new Date().toDateString();
    return data
        .filter(record => new Date(record.client_timestamp).toDateString() === today)
        .reduce((sum, record) => sum + record.step_count, 0);
}

function updateDataStatus(status) {
    const element = document.getElementById('dataStatus');
    switch (status) {
        case 'loading':
            element.className = 'badge bg-warning';
            element.textContent = 'Loading';
            break;
        case 'success':
            element.className = 'badge bg-success';
            element.textContent = 'Live';
            break;
        case 'error':
            element.className = 'badge bg-danger';
            element.textContent = 'Error';
            break;
        default:
            element.className = 'badge bg-secondary';
            element.textContent = 'Unknown';
    }
}

function updateLastUpdated() {
    document.getElementById('lastUpdated').textContent = new Date().toLocaleString();
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function showError(message) {
    console.error('Error:', message);
    alert('Error: ' + message);
}

function exportData() {
    const dataStr = JSON.stringify(appState.stepData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `stepcounter-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

window.loadAllData = loadAllData;
window.exportData = exportData;
window.filterTable = filterTable;
window.changePage = changePage;
window.changePageSize = changePageSize;
window.updateCharts = updateCharts;