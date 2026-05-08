import { mockData } from './mockData.js';

let currentData = [...mockData];
let materialChart, warehouseChart;

// Helper to get value case-insensitively and ignoring dots/spaces
function getRobustValue(item, targetKey) {
    const keys = Object.keys(item);
    const normalizedTarget = targetKey.toLowerCase().replace(/[\s.]/g, '');
    
    const matchedKey = keys.find(k => {
        const normalizedK = k.toLowerCase().replace(/[\s.]/g, '');
        return normalizedK === normalizedTarget;
    });
    
    return matchedKey ? item[matchedKey] : null;
}

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadPersistedData();
    updateDashboard(currentData);
    setupEventListeners();
});

function loadPersistedData() {
    const savedData = localStorage.getItem('assetDashboardData');
    if (savedData) {
        try {
            currentData = JSON.parse(savedData);
            console.log('Loaded persisted data:', currentData.length, 'rows');
        } catch (e) {
            console.error('Failed to parse saved data:', e);
            currentData = [...mockData];
        }
    }
}

function setupEventListeners() {
    // Search Filters
    document.getElementById('filter-inspector').addEventListener('change', filterData);
    document.getElementById('filter-type').addEventListener('change', filterData);
    document.getElementById('filter-pea').addEventListener('input', filterData);
    document.getElementById('filter-serial').addEventListener('input', filterData);
    document.getElementById('reset-filters').addEventListener('click', resetFilters);

    // Excel Upload
    const uploadEl = document.getElementById('excel-upload');
    if (uploadEl) {
        uploadEl.addEventListener('change', handleExcelUpload);
    }
}

function updateDashboard(data) {
    updateKPIs(data);
    renderTable(data);
    renderCharts(data);
    updateDropdowns(currentData); // Populate based on full data
    document.getElementById('data-count').textContent = `Showing ${data.length} entries`;
}

function updateDropdowns(data) {
    // Inspector Dropdown
    const inspectorSelect = document.getElementById('filter-inspector');
    const currentInspector = inspectorSelect.value;
    const inspectors = [...new Set(data.map(item => getRobustValue(item, 'InspectorID')).filter(Boolean))].sort();
    
    inspectorSelect.innerHTML = '<option value="">All Inspectors</option>';
    inspectors.forEach(id => {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = id;
        inspectorSelect.appendChild(option);
    });
    if (inspectors.includes(currentInspector)) inspectorSelect.value = currentInspector;

    // Type Dropdown
    const typeSelect = document.getElementById('filter-type');
    const currentType = typeSelect.value;
    const types = [...new Set(data.map(item => getRobustValue(item, 'MaterialType')).filter(Boolean))].sort();
    
    typeSelect.innerHTML = '<option value="">All Types</option>';
    types.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        typeSelect.appendChild(option);
    });
    if (types.includes(currentType)) typeSelect.value = currentType;
}

function updateKPIs(data) {
    const totalMaterials = data.length;
    const totalBatches = new Set(data.map(item => getRobustValue(item, 'Batch'))).size;
    const totalInspectors = new Set(data.map(item => getRobustValue(item, 'InspectorID'))).size;

    document.getElementById('kpi-total-materials').textContent = totalMaterials;
    document.getElementById('kpi-total-batches').textContent = totalBatches;
    document.getElementById('kpi-total-inspectors').textContent = totalInspectors;
}

function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${getRobustValue(item, 'InspectorID') || '-'}</td>
            <td>${getRobustValue(item, 'WarehouseCode') || '-'}</td>
            <td><span class="status-badge" style="background: rgba(0, 210, 255, 0.1); color: var(--accent-primary);">${getRobustValue(item, 'MaterialType') || '-'}</span></td>
            <td>${getRobustValue(item, 'Batch') || '-'}</td>
            <td>${getRobustValue(item, 'SerialNo') || '-'}</td>
            <td>${getRobustValue(item, 'NEW PEA No.') || '-'}</td>
            <td>${getRobustValue(item, 'ADS') || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function renderCharts(data) {
    // Material Distribution Chart
    const materialCounts = {};
    data.forEach(item => {
        const type = getRobustValue(item, 'MaterialType') || 'Unknown';
        materialCounts[type] = (materialCounts[type] || 0) + 1;
    });

    if (materialChart) materialChart.destroy();
    const matCtx = document.getElementById('materialChart').getContext('2d');
    materialChart = new Chart(matCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(materialCounts),
            datasets: [{
                data: Object.values(materialCounts),
                backgroundColor: ['#00d2ff', '#3a7bd5', '#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
            },
            cutout: '70%'
        }
    });

    // Warehouse Overview Chart
    const warehouseCounts = {};
    data.forEach(item => {
        const wh = getRobustValue(item, 'WarehouseCode') || 'Unknown';
        warehouseCounts[wh] = (warehouseCounts[wh] || 0) + 1;
    });

    if (warehouseChart) warehouseChart.destroy();
    const whCtx = document.getElementById('warehouseChart').getContext('2d');
    warehouseChart = new Chart(whCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(warehouseCounts),
            datasets: [{
                label: 'Item Count',
                data: Object.values(warehouseCounts),
                backgroundColor: 'rgba(0, 210, 255, 0.5)',
                borderColor: '#00d2ff',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function filterData() {
    const inspectorQuery = document.getElementById('filter-inspector').value.toLowerCase();
    const typeQuery = document.getElementById('filter-type').value.toLowerCase();
    const peaQuery = document.getElementById('filter-pea').value.toLowerCase();
    const serialQuery = document.getElementById('filter-serial').value.toLowerCase();

    const filtered = currentData.filter(item => {
        const inspector = (getRobustValue(item, 'InspectorID') || '').toString().toLowerCase();
        const type = (getRobustValue(item, 'MaterialType') || '').toString().toLowerCase();
        const pea = (getRobustValue(item, 'NEW PEA No.') || '').toString().toLowerCase();
        const serial = (getRobustValue(item, 'SerialNo') || '').toString().toLowerCase();

        return (inspectorQuery === '' || inspector === inspectorQuery) &&
               (typeQuery === '' || type === typeQuery) &&
               pea.includes(peaQuery) &&
               serial.includes(serialQuery);
    });

    updateKPIs(filtered);
    renderTable(filtered);
    renderCharts(filtered);
    document.getElementById('data-count').textContent = `Showing ${filtered.length} entries`;
}

function resetFilters() {
    document.getElementById('filter-inspector').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-pea').value = '';
    document.getElementById('filter-serial').value = '';
    updateDashboard(currentData);
}

window.sortTable = function(column) {
    const sorted = [...currentData].sort((a, b) => {
        const valA = getRobustValue(a, column) || '';
        const valB = getRobustValue(b, column) || '';
        return valA.toString().localeCompare(valB.toString());
    });
    updateDashboard(sorted);
}

function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length > 0) {
            currentData = json;
            // Persist data
            try {
                localStorage.setItem('assetDashboardData', JSON.stringify(json));
            } catch (e) {
                console.warn('LocalStorage limit exceeded. Data will not persist after refresh.');
            }
            
            updateDashboard(currentData);
            alert(`Successfully loaded ${json.length} rows from Excel! Data is now saved locally.`);
            console.log('Sample Row:', json[0]);
        }
    };
    reader.readAsArrayBuffer(file);
}
