import { getCategorias } from '../config.js';
import { currencyFormatter } from '../utils.js';

export function getFormAhorroHTML() {
    const catAhorros = getCategorias().ahorros;
    return `
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Activo</label>
            <select id="tipoActivo" required class="glass-input glass-select block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
                ${catAhorros.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ticker / Nombre</label>
            <input type="text" id="ticker" placeholder="Ej: AL30, AAPL" required class="glass-input block w-full rounded-xl border py-2 px-3 uppercase font-medium text-sm outline-none">
        </div>
        <div class="flex gap-4 mb-3">
            <div class="w-1/2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cantidad</label>
                <input type="number" step="0.0001" id="cantidad" placeholder="0" required class="glass-input block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
            </div>
            <div class="w-1/2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Precio Unitario</label>
                <input type="number" step="0.01" id="precio" placeholder="0.00" required class="glass-input block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
            </div>
        </div>
    `;
}

export function initFormAhorro() {
    const calcTotal = () => {
        const cant = parseFloat(document.getElementById('cantidad').value) || 0;
        const precio = parseFloat(document.getElementById('precio').value) || 0;
        const total = cant * precio;
        
        if (total > 0) {
            const currency = document.getElementById('moneda').value;
            document.getElementById('montoReal').value = total;
            document.getElementById('montoInput').value = currencyFormatter(currency)
                .format(total).replace(/[a-zA-Z\$\s]/g, "");
        }
    };

    document.getElementById('cantidad').addEventListener('input', calcTotal);
    document.getElementById('precio').addEventListener('input', calcTotal);
    document.getElementById('montoInput').readOnly = true;
    document.getElementById('montoLabel').innerText = "Total Invertido (Auto)";
}