document.addEventListener('DOMContentLoaded', () => {
    // 1. Configuration & Data Generation
    const config = {
        total: 100,
        good: 75,
        pending: 10,
        damaged: 15
    };

    const deviceTypes = [
        "High-Voltage Transformer", "Smart Circuit Breaker", "Phase Monitor", 
        "Power Factor Controller", "Digital Multimeter", "Isolating Switch",
        "Busbar System", "Surge Protection Device", "Current Relay"
    ];

    const technicians = [
        "A. Volt", "W. Tech", "S. Power", "N. Spark", "K. Energy"
    ];

    const generateDevices = () => {
        const devices = [];
        let id = 1;

        const addItems = (count, status) => {
            for (let i = 0; i < count; i++) {
                devices.push({
                    id: `ELC-${String(id++).padStart(3, '0')}`,
                    name: `${deviceTypes[Math.floor(Math.random() * deviceTypes.types?.length || deviceTypes.length)]} Gen ${Math.floor(Math.random() * 5) + 1}`,
                    status: status,
                    technician: technicians[Math.floor(Math.random() * technicians.length)]
                });
            }
        };

        addItems(config.good, 'good');
        addItems(config.pending, 'pending');
        addItems(config.damaged, 'damaged');

        return devices.sort(() => Math.random() - 0.5);
    };

    const allDevices = generateDevices();

    // 2. Chart.js Initialization (only if element exists)
    const chartCanvas = document.getElementById('statusChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['สภาพดี', 'รอตรวจสอบ', 'ชำรุด'],
                datasets: [{
                    data: [config.good, config.pending, config.damaged],
                    backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Outfit', size: 12 },
                            padding: 20
                        }
                    }
                },
                cutout: '75%'
            }
        });
    }

    // 3. Table Rendering & Search Logic
    const renderTable = (data) => {
        const tbody = document.getElementById('device-list-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        data.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-family: monospace; color: var(--accent); font-weight: 600;">${item.id}</td>
                <td style="font-weight: 500;">${item.name}</td>
                <td><span class="badge badge-${item.status}">${getStatusText(item.status)}</span></td>
                <td style="color: var(--text-muted);">${item.technician}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'good': return 'สภาพดี';
            case 'pending': return 'รอตรวจ';
            case 'damaged': return 'ชำรุด';
            default: return status;
        }
    };

    const searchInput = document.getElementById('device-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allDevices.filter(d => 
                d.name.toLowerCase().includes(term) || 
                d.id.toLowerCase().includes(term) ||
                d.technician.toLowerCase().includes(term)
            );
            renderTable(filtered);
        });
    }

    // Initial Table Render
    renderTable(allDevices);
});
