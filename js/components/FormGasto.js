import { getCategorias } from '../config.js';

export function getFormGastoHTML() {
    const catGastos = getCategorias().gastos;
    return `
        <div class="mb-3">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Categoría Principal</label>
            <select id="catPrincipal" required class="glass-input glass-select block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none">
                <option value="">Seleccione...</option>
                ${Object.keys(catGastos).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
            </select>
        </div>
        <div class="mb-3" id="divSubcat" style="display:none;">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Subcategoría</label>
            <select id="subcategoria" class="glass-input glass-select block w-full rounded-xl border py-2 px-3 font-medium text-sm outline-none"></select>
        </div>
    `;
}

export function initFormGasto() {
    const catPrincipal = document.getElementById('catPrincipal');
    if(catPrincipal) {
        catPrincipal.addEventListener('change', () => {
            const cat = catPrincipal.value;
            const subcatSelect = document.getElementById('subcategoria');
            const divSubcat = document.getElementById('divSubcat');
            const catGastos = getCategorias().gastos;
            
            if (cat && catGastos[cat] && catGastos[cat].length > 0) {
                subcatSelect.innerHTML = catGastos[cat].map(s => `<option value="${s}">${s}</option>`).join('');
                divSubcat.style.display = 'block';
                subcatSelect.required = true;
            } else {
                subcatSelect.innerHTML = '';
                divSubcat.style.display = 'none';
                subcatSelect.required = false;
            }
        });
    }
}