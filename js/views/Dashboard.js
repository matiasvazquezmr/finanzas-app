import { fetchData } from '../api.js';
import { currencyFormatter } from '../utils.js';
import { meses } from '../config.js';

let chartDona = null;
let chartBarras = null;
let cachedData = null; // Guardamos la data en memoria para no pegarle a Sheets al cambiar la moneda

export function renderDashboard() {
    const container = document.getElementById('view-dash');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Resumen
                <!-- NUEVO SELECTOR DE MONEDA -->
                <select id="dash-moneda" class="glass-pill glass-select text-slate-200 text-[10px] font-bold rounded-lg pl-2 py-1 outline-none">
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                </select>
            </h2>
            <button id="btn-update-dash" class="glass-pill text-violet-300 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all">
                🔄 Actualizar
            </button>
        </div>

        <div id="dash-status" class="hidden mb-3 text-center py-2 px-3 rounded-lg text-xs font-bold"></div>

        <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ingresos</p>
                <p class="text-lg font-black text-teal-400 tracking-tight" id="dash-ingresos">$0</p>
            </div>
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Gastos</p>
                <p class="text-lg font-black text-orange-400 tracking-tight" id="dash-gastos">$0</p>
            </div>
            <div class="glass-card bg-gradient-to-br from-violet-600/70 to-cyan-600/50 p-3 rounded-xl shadow-lg shadow-violet-950/40 relative overflow-hidden">
                <p class="text-[9px] text-violet-100/80 font-bold uppercase tracking-wider mb-0.5">Saldo Total</p>
                <p class="text-lg font-black text-white tracking-tight" id="dash-saldo">$0</p>
            </div>
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vs Mes Ant.</p>
                <p class="text-base font-black text-slate-200 tracking-tight mt-0.5" id="dash-sueldo">-</p>
            </div>
        </div>

        <div class="glass-card p-4 rounded-xl mb-4">
            <h3 class="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Top 5 Gastos</h3>
            <div class="relative h-36 w-full"><canvas id="donutChart"></canvas></div>
        </div>
        <div class="glass-card p-4 rounded-xl">
            <h3 class="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Evolución Anual</h3>
            <div class="relative h-36 w-full"><canvas id="barChart"></canvas></div>
        </div>
    `;

    document.getElementById('btn-update-dash').addEventListener('click', () => loadDashboardData(true));
    document.getElementById('dash-moneda').addEventListener('change', () => loadDashboardData(false));
}

export async function loadDashboardData(forceRefresh = false) {
    const statusEl = document.getElementById('dash-status');
    const selectedMoneda = document.getElementById('dash-moneda').value;
    
    try {
        if (!cachedData || forceRefresh) {
            statusEl.className = "mb-3 text-center py-2 px-3 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-400/20 block";
            statusEl.innerText = "Sincronizando...";
            cachedData = await fetchData();
            statusEl.classList.replace('block', 'hidden');
        }

        const data = cachedData;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const Formatter = currencyFormatter(selectedMoneda);
        
        let sumIngresos = 0, sumGastos = 0, sueldoActual = 0, sueldoAnterior = 0;
        let gastosPorCat = {};

        data.ingresos.forEach(i => {
            if(i['Moneda'] !== selectedMoneda) return; 
            let d = new Date(i.Fecha);
            if(d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                sumIngresos += parseFloat(i.Monto || 0);
                if(i['Categoría'] === 'Sueldo') sueldoActual += parseFloat(i.Monto || 0);
            }
            if(d.getMonth() === (currentMonth - 1 >= 0 ? currentMonth - 1 : 11) && d.getFullYear() === (currentMonth - 1 >= 0 ? currentYear : currentYear - 1)) {
                if(i['Categoría'] === 'Sueldo') sueldoAnterior += parseFloat(i.Monto || 0);
            }
        });

        data.gastos.forEach(g => {
            if(g['Moneda'] !== selectedMoneda) return; 
            let d = new Date(g.Fecha);
            if(d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                let val = parseFloat(g.Monto || 0);
                sumGastos += val;
                let cat = g['Categoría Principal'];
                gastosPorCat[cat] = (gastosPorCat[cat] || 0) + val;
            }
        });

        document.getElementById('dash-ingresos').innerText = Formatter.format(sumIngresos).replace(/[a-zA-Z\s]/g, "");
        document.getElementById('dash-gastos').innerText = Formatter.format(sumGastos).replace(/[a-zA-Z\s]/g, "");
        document.getElementById('dash-saldo').innerText = Formatter.format(sumIngresos - sumGastos).replace(/[a-zA-Z\s]/g, "");
        
        let variacionSueldo = "-";
        if(sueldoAnterior > 0) {
            let varPct = ((sueldoActual - sueldoAnterior) / sueldoAnterior) * 100;
            variacionSueldo = `${varPct >= 0 ? '↗' : '↘'} ${Math.abs(varPct).toFixed(1)}%`;
            const el = document.getElementById('dash-sueldo');
            el.className = `text-base font-black tracking-tight mt-0.5 ${varPct >= 0 ? 'text-teal-400' : 'text-orange-400'}`;
        }
        document.getElementById('dash-sueldo').innerText = variacionSueldo;

        let topGastos = Object.entries(gastosPorCat).sort((a,b) => b[1] - a[1]).slice(0,5);
        if(chartDona) chartDona.destroy();
        chartDona = new Chart(document.getElementById('donutChart'), {
            type: 'doughnut',
            data: {
                labels: topGastos.length > 0 ? topGastos.map(g => g[0]) : ['Sin datos'],
                datasets: [{ 
                    data: topGastos.length > 0 ? topGastos.map(g => g[1]) : [1], 
                    backgroundColor: topGastos.length > 0 ? ['#8b5cf6','#22d3ee','#2dd4bf','#fb923c','#f472b6'] : ['#334155'],
                    borderWidth: 0, hoverOffset: 4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels:{padding:8, boxWidth: 6, usePointStyle: true, font:{size:9}} } } }
        });

        let evoMeses = Array(12).fill(0).map(()=>({ing:0, gas:0, aho:0}));
        data.ingresos.forEach(i => { let m=new Date(i.Fecha).getMonth(); if(new Date(i.Fecha).getFullYear()===currentYear && i['Moneda']===selectedMoneda) evoMeses[m].ing += parseFloat(i.Monto||0);});
        data.gastos.forEach(g => { let m=new Date(g.Fecha).getMonth(); if(new Date(g.Fecha).getFullYear()===currentYear && g['Moneda']===selectedMoneda) evoMeses[m].gas += parseFloat(g.Monto||0);});
        data.ahorros.forEach(a => { let m=new Date(a.Fecha).getMonth(); if(new Date(a.Fecha).getFullYear()===currentYear && a['Moneda']===selectedMoneda) evoMeses[m].aho += parseFloat(a['Total Invertido']||0);});

        if(chartBarras) chartBarras.destroy();
        chartBarras = new Chart(document.getElementById('barChart'), {
            type: 'bar',
            data: {
                labels: meses.map(m => m.substring(0,3)),
                datasets: [
                    { label: 'Ing', data: evoMeses.map(e=>e.ing), backgroundColor: '#2dd4bf', borderRadius: 4, barPercentage: 0.7 },
                    { label: 'Gas', data: evoMeses.map(e=>e.gas), backgroundColor: '#fb923c', borderRadius: 4, barPercentage: 0.7 },
                    { label: 'Aho', data: evoMeses.map(e=>e.aho), backgroundColor: '#22d3ee', borderRadius: 4, barPercentage: 0.7 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: {display: false}, ticks: {font: {size: 8}} }, y: { border: {display: false}, ticks: {font: {size: 8}, callback: v=>'$'+(v/1000)+'k'} } }, plugins: { legend: { position: 'top', align: 'end', labels: {boxWidth: 6, usePointStyle: true, font: {size: 9}} } } }
        });

    } catch (err) {
        console.error("Error crítico cargando datos:", err);
        statusEl.className = "mb-3 text-center py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-400/20 block";
        statusEl.innerText = "Error cargando la info.";
    }
}