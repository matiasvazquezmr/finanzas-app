import { loadData } from '../store.js';
import { currencyFormatter } from '../utils.js';
import { meses } from '../config.js';

const PALETTE = ['#8b5cf6', '#22d3ee', '#2dd4bf', '#fb923c', '#f472b6', '#a3e635', '#60a5fa', '#fbbf24', '#f87171', '#34d399'];

let chartCategorias = null;
let chartEvolucion = null;
let lastData = null; // Última data traída de Sheets, para recalcular filtros sin re-pedirla

// Estado de los filtros del dashboard
let periodMode = 'month'; // 'month' | '3m' | '6m' | 'year' | 'custom'
let customPeriod = { month: new Date().getMonth(), year: new Date().getFullYear() };
let evoYear = new Date().getFullYear();

export function renderDashboard() {
    const container = document.getElementById('view-dash');
    const now = new Date();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Resumen
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

        <div class="glass-card p-3 rounded-xl mb-4">
            <div class="flex items-center gap-2">
                <div id="period-chips" class="flex gap-1.5 flex-1 overflow-x-auto no-scrollbar">
                    <button data-period="month" class="period-chip px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all">Mes</button>
                    <button data-period="3m" class="period-chip px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all">3M</button>
                    <button data-period="6m" class="period-chip px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all">6M</button>
                    <button data-period="year" class="period-chip px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all">Año</button>
                </div>
                <button id="btn-toggle-custom-period" class="glass-pill text-slate-300 text-xs px-2.5 py-1.5 rounded-lg shrink-0 active:scale-95 transition-all">📅</button>
            </div>
            <div id="custom-period-picker" class="hidden grid grid-cols-2 gap-2 mt-2">
                <select id="period-mes" class="glass-input glass-select block w-full rounded-lg py-1.5 px-2 border text-xs outline-none"></select>
                <select id="period-anio" class="glass-input glass-select block w-full rounded-lg py-1.5 px-2 border text-xs outline-none"></select>
            </div>
            <p id="period-label" class="text-[10px] text-slate-500 font-semibold mt-2 text-center uppercase tracking-wider"></p>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Ingresos</p>
                <p class="text-lg font-black text-teal-400 tracking-tight" id="dash-ingresos">$0</p>
            </div>
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Gastos</p>
                <p class="text-lg font-black text-orange-400 tracking-tight" id="dash-gastos">$0</p>
            </div>
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Total Ahorrado</p>
                <p class="text-lg font-black text-cyan-400 tracking-tight" id="dash-ahorrado">$0</p>
            </div>
            <div class="glass-card p-3 rounded-xl relative overflow-hidden">
                <p class="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Vs Período Ant.</p>
                <p class="text-base font-black text-slate-200 tracking-tight mt-0.5" id="dash-sueldo">-</p>
            </div>
            <div class="glass-card bg-gradient-to-br from-violet-600/70 to-cyan-600/50 p-3 rounded-xl shadow-lg shadow-violet-950/40 relative overflow-hidden col-span-2">
                <p class="text-[9px] text-violet-100/80 font-bold uppercase tracking-wider mb-0.5">Saldo Total</p>
                <p class="text-lg font-black text-white tracking-tight" id="dash-saldo">$0</p>
            </div>
        </div>

        <div class="glass-card p-4 rounded-xl mb-4">
            <h3 class="text-[10px] font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">Gastos por Categoría</h3>
            <div class="relative w-full" id="categoriasChartWrap"><canvas id="categoriasChart"></canvas></div>
        </div>
        <div class="glass-card p-4 rounded-xl">
            <div class="flex items-center justify-center gap-2 mb-2">
                <h3 class="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Evolución</h3>
                <select id="evo-anio" class="glass-pill glass-select text-slate-200 text-[9px] font-bold rounded-md pl-1.5 py-0.5 outline-none"></select>
            </div>
            <div class="relative h-36 w-full"><canvas id="evolucionChart"></canvas></div>
        </div>
    `;

    // Poblar el picker de mes (nombres fijos, no dependen de la data)
    const mesSelect = document.getElementById('period-mes');
    mesSelect.innerHTML = meses.map((m, i) => `<option value="${i}">${m}</option>`).join('');
    mesSelect.value = customPeriod.month;

    document.getElementById('btn-update-dash').addEventListener('click', () => loadDashboardData(true));
    document.getElementById('dash-moneda').addEventListener('change', () => computeAndRender());

    document.querySelectorAll('.period-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            periodMode = btn.dataset.period;
            document.getElementById('custom-period-picker').classList.add('hidden');
            updatePeriodChipStyles();
            computeAndRender();
        });
    });

    document.getElementById('btn-toggle-custom-period').addEventListener('click', () => {
        document.getElementById('custom-period-picker').classList.toggle('hidden');
    });

    mesSelect.addEventListener('change', () => {
        customPeriod.month = parseInt(mesSelect.value, 10);
        periodMode = 'custom';
        updatePeriodChipStyles();
        computeAndRender();
    });

    document.getElementById('period-anio').addEventListener('change', (e) => {
        customPeriod.year = parseInt(e.target.value, 10);
        periodMode = 'custom';
        updatePeriodChipStyles();
        computeAndRender();
    });

    document.getElementById('evo-anio').addEventListener('change', (e) => {
        evoYear = parseInt(e.target.value, 10);
        computeAndRender();
    });

    updatePeriodChipStyles();
}

function updatePeriodChipStyles() {
    document.querySelectorAll('.period-chip').forEach(btn => {
        const isActive = btn.dataset.period === periodMode;
        btn.classList.toggle('bg-white/10', isActive);
        btn.classList.toggle('text-violet-300', isActive);
        btn.classList.toggle('text-slate-400', !isActive);
    });
}

// --- Helpers de rango de fechas ---

function daysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

function monthRange(year, month) {
    return {
        start: new Date(year, month, 1, 0, 0, 0, 0),
        end: new Date(year, month, daysInMonth(year, month), 23, 59, 59, 999)
    };
}

function shiftMonth(year, month, delta) {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
}

function getPeriodBounds() {
    const now = new Date();
    const curY = now.getFullYear(), curM = now.getMonth();

    if (periodMode === 'month') return monthRange(curY, curM);
    if (periodMode === 'custom') return monthRange(customPeriod.year, customPeriod.month);
    if (periodMode === 'year') return { start: new Date(curY, 0, 1), end: new Date(curY, 11, 31, 23, 59, 59, 999) };

    const span = periodMode === '3m' ? 3 : 6;
    const from = shiftMonth(curY, curM, -(span - 1));
    return { start: monthRange(from.year, from.month).start, end: monthRange(curY, curM).end };
}

function getPreviousBounds(current) {
    if (periodMode === 'year') {
        const y = current.start.getFullYear() - 1;
        return { start: new Date(y, 0, 1), end: new Date(y, 11, 31, 23, 59, 59, 999) };
    }
    if (periodMode === 'month' || periodMode === 'custom') {
        const d = new Date(current.start);
        d.setMonth(d.getMonth() - 1);
        return monthRange(d.getFullYear(), d.getMonth());
    }
    const span = periodMode === '3m' ? 3 : 6;
    const start = new Date(current.start);
    start.setMonth(start.getMonth() - span);
    const end = new Date(current.start);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function periodLabel() {
    if (periodMode === 'month') return 'Este mes';
    if (periodMode === '3m') return 'Últimos 3 meses';
    if (periodMode === '6m') return 'Últimos 6 meses';
    if (periodMode === 'year') return 'Este año';
    return `${meses[customPeriod.month]} ${customPeriod.year}`;
}

function getAvailableYears(data) {
    const years = new Set([new Date().getFullYear()]);
    [...data.ingresos, ...data.gastos, ...data.ahorros].forEach(r => {
        const y = new Date(r.Fecha).getFullYear();
        if (!isNaN(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b - a);
}

// --- Carga y render ---

export async function loadDashboardData(forceRefresh = false) {
    const statusEl = document.getElementById('dash-status');

    try {
        if (!lastData || forceRefresh) {
            statusEl.className = "mb-3 text-center py-2 px-3 rounded-lg text-xs font-bold bg-violet-500/10 text-violet-300 border border-violet-400/20 block";
            statusEl.innerText = "Sincronizando...";
            lastData = await loadData({ force: forceRefresh });
            statusEl.classList.replace('block', 'hidden');
        }
        computeAndRender();
    } catch (err) {
        console.error("Error crítico cargando datos:", err);
        statusEl.className = "mb-3 text-center py-2 px-3 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-400/20 block";
        statusEl.innerText = "Error cargando la info.";
    }
}

function computeAndRender() {
    if (!lastData) return;
    const data = lastData;
    const selectedMoneda = document.getElementById('dash-moneda').value;
    const Formatter = currencyFormatter(selectedMoneda);

    // Años disponibles para los selects de año (custom picker + evolución)
    const years = getAvailableYears(data);
    const anioSelect = document.getElementById('period-anio');
    const prevAnioValue = anioSelect.value ? parseInt(anioSelect.value, 10) : customPeriod.year;
    anioSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    customPeriod.year = years.includes(prevAnioValue) ? prevAnioValue : years[0];
    anioSelect.value = customPeriod.year;

    const evoSelect = document.getElementById('evo-anio');
    evoSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    if (!years.includes(evoYear)) evoYear = years[0];
    evoSelect.value = evoYear;

    document.getElementById('period-label').innerText = periodLabel();

    const current = getPeriodBounds();
    const previous = getPreviousBounds(current);

    let sumIngresos = 0, sumGastos = 0, sumAhorros = 0, sueldoActual = 0, sueldoAnterior = 0;
    let gastosPorCat = {};

    data.ingresos.forEach(i => {
        if (i['Moneda'] !== selectedMoneda) return;
        const d = new Date(i.Fecha);
        const monto = parseFloat(i.Monto || 0);
        if (d >= current.start && d <= current.end) {
            sumIngresos += monto;
            if (i['Categoría'] === 'Sueldo') sueldoActual += monto;
        }
        if (d >= previous.start && d <= previous.end && i['Categoría'] === 'Sueldo') {
            sueldoAnterior += monto;
        }
    });

    data.gastos.forEach(g => {
        if (g['Moneda'] !== selectedMoneda) return;
        const d = new Date(g.Fecha);
        if (d >= current.start && d <= current.end) {
            const val = parseFloat(g.Monto || 0);
            sumGastos += val;
            const cat = g['Categoría Principal'];
            gastosPorCat[cat] = (gastosPorCat[cat] || 0) + val;
        }
    });

    data.ahorros.forEach(a => {
        if (a['Moneda'] !== selectedMoneda) return;
        const d = new Date(a.Fecha);
        if (d >= current.start && d <= current.end) {
            sumAhorros += parseFloat(a['Total Invertido'] || 0);
        }
    });

    document.getElementById('dash-ingresos').innerText = Formatter.format(sumIngresos).replace(/[a-zA-Z\s]/g, "");
    document.getElementById('dash-gastos').innerText = Formatter.format(sumGastos).replace(/[a-zA-Z\s]/g, "");
    document.getElementById('dash-ahorrado').innerText = Formatter.format(sumAhorros).replace(/[a-zA-Z\s]/g, "");
    document.getElementById('dash-saldo').innerText = Formatter.format(sumIngresos - sumGastos - sumAhorros).replace(/[a-zA-Z\s]/g, "");

    let variacionSueldo = "-";
    const elSueldo = document.getElementById('dash-sueldo');
    if (sueldoAnterior > 0) {
        const varPct = ((sueldoActual - sueldoAnterior) / sueldoAnterior) * 100;
        variacionSueldo = `${varPct >= 0 ? '↗' : '↘'} ${Math.abs(varPct).toFixed(1)}%`;
        elSueldo.className = `text-base font-black tracking-tight mt-0.5 ${varPct >= 0 ? 'text-teal-400' : 'text-orange-400'}`;
    } else {
        elSueldo.className = 'text-base font-black tracking-tight mt-0.5 text-slate-200';
    }
    elSueldo.innerText = variacionSueldo;

    renderCategoriasChart(gastosPorCat);
    renderEvolucionChart(data, selectedMoneda);
}

function renderCategoriasChart(gastosPorCat) {
    const categorias = Object.entries(gastosPorCat).sort((a, b) => b[1] - a[1]);
    const wrap = document.getElementById('categoriasChartWrap');
    wrap.style.height = `${Math.max(144, categorias.length * 34)}px`;

    if (chartCategorias) chartCategorias.destroy();
    chartCategorias = new Chart(document.getElementById('categoriasChart'), {
        type: 'bar',
        data: {
            labels: categorias.length > 0 ? categorias.map(g => g[0]) : ['Sin datos'],
            datasets: [{
                data: categorias.length > 0 ? categorias.map(g => g[1]) : [0],
                backgroundColor: categorias.length > 0 ? categorias.map((_, i) => PALETTE[i % PALETTE.length]) : ['#334155'],
                borderRadius: 4,
                barPercentage: 0.7
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { font: { size: 8 }, callback: v => '$' + (v >= 1000 ? (v / 1000) + 'k' : v) } },
                y: { grid: { display: false }, ticks: { font: { size: 9 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderEvolucionChart(data, selectedMoneda) {
    let evoMeses = Array(12).fill(0).map(() => ({ ing: 0, gas: 0, aho: 0 }));
    data.ingresos.forEach(i => { const d = new Date(i.Fecha); if (d.getFullYear() === evoYear && i['Moneda'] === selectedMoneda) evoMeses[d.getMonth()].ing += parseFloat(i.Monto || 0); });
    data.gastos.forEach(g => { const d = new Date(g.Fecha); if (d.getFullYear() === evoYear && g['Moneda'] === selectedMoneda) evoMeses[d.getMonth()].gas += parseFloat(g.Monto || 0); });
    data.ahorros.forEach(a => { const d = new Date(a.Fecha); if (d.getFullYear() === evoYear && a['Moneda'] === selectedMoneda) evoMeses[d.getMonth()].aho += parseFloat(a['Total Invertido'] || 0); });

    if (chartEvolucion) chartEvolucion.destroy();
    chartEvolucion = new Chart(document.getElementById('evolucionChart'), {
        type: 'line',
        data: {
            labels: meses.map(m => m.substring(0, 3)),
            datasets: [
                { label: 'Ing', data: evoMeses.map(e => e.ing), borderColor: '#2dd4bf', backgroundColor: '#2dd4bf', tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4 },
                { label: 'Gas', data: evoMeses.map(e => e.gas), borderColor: '#fb923c', backgroundColor: '#fb923c', tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4 },
                { label: 'Aho', data: evoMeses.map(e => e.aho), borderColor: '#22d3ee', backgroundColor: '#22d3ee', tension: 0.35, borderWidth: 2, pointRadius: 2, pointHoverRadius: 4 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                y: { border: { display: false }, ticks: { font: { size: 8 }, callback: v => '$' + (v / 1000) + 'k' } }
            },
            plugins: { legend: { position: 'top', align: 'end', labels: { boxWidth: 6, usePointStyle: true, font: { size: 9 } } } }
        }
    });
}
