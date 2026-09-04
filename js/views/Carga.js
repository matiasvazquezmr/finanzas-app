import { getFormGastoHTML, initFormGasto } from '../components/FormGasto.js';
import { getFormIngresoHTML, initFormIngreso } from '../components/FormIngreso.js';
import { getFormAhorroHTML, initFormAhorro } from '../components/FormAhorro.js';
import { currencyFormatter, showToast } from '../utils.js';
import { postData } from '../api.js';

export function renderCarga() {
    const container = document.getElementById('view-home');
    container.innerHTML = `
        <h2 class="text-base font-bold mb-3 text-slate-800 tracking-tight">Nuevo Registro</h2>
        <div class="flex justify-between bg-slate-200/70 rounded-xl p-1 mb-4 shadow-inner">
            <button id="btn-tipo-gasto" class="w-1/3 py-2 rounded-lg font-semibold text-rose-600 bg-white shadow-sm transition-all text-[11px]">Gasto</button>
            <button id="btn-tipo-ingreso" class="w-1/3 py-2 rounded-lg font-medium text-slate-500 hover:text-slate-700 transition-all text-[11px]">Ingreso</button>
            <button id="btn-tipo-ahorro" class="w-1/3 py-2 rounded-lg font-medium text-slate-500 hover:text-slate-700 transition-all text-[11px]">Ahorro</button>
        </div>
        
        <form id="mainForm" class="w-full">
            <input type="hidden" id="tipoRegistro" value="gasto">
            
            <!-- CORRECCIÓN: CSS Grid asegura que no se salga de la pantalla -->
            <div class="grid grid-cols-3 gap-3 mb-3 w-full">
                <div class="col-span-1">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Moneda</label>
                    <select id="moneda" required class="block w-full rounded-xl border-slate-200 shadow-sm py-2 px-2 border bg-white focus:ring-indigo-500 font-medium text-slate-700 text-sm outline-none">
                        <option value="ARS">ARS</option>
                        <option value="USD">USD</option>
                    </select>
                </div>
                <div class="col-span-2 min-w-0">
                    <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
                    <input type="date" id="fecha" required class="block w-full min-w-0 rounded-xl border-slate-200 shadow-sm py-2 px-2 border focus:ring-indigo-500 font-medium text-slate-700 text-sm outline-none">
                </div>
            </div>
            
            <div id="dynamicFields"></div>
            
            <div class="mb-3" id="montoContainer">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" id="montoLabel">Monto Total</label>
                <div class="relative w-full">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-medium text-base whitespace-nowrap" id="currencySymbol">$</div>
                    <input type="text" id="montoInput" inputmode="decimal" placeholder="0,00" required class="currency-input block w-full min-w-0 rounded-xl border border-slate-200 shadow-sm pr-3 py-2 focus:ring-2 focus:ring-indigo-500/20 bg-white outline-none">
                    <input type="hidden" id="montoReal" name="monto">
                </div>
            </div>
            <div class="mb-5">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notas</label>
                <input type="text" id="notas" placeholder="Opcional..." class="block w-full min-w-0 rounded-xl border-slate-200 shadow-sm py-2 px-3 border focus:ring-indigo-500 text-sm text-slate-700 outline-none">
            </div>
            <button type="submit" id="btnSubmit" class="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-200 active:scale-[0.98] transition-all text-sm">
                <span id="btnText">Guardar Registro</span>
                <svg id="spinner" class="animate-spin hidden h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </button>
        </form>
    `;
    initEvents();
}

function initEvents() {
    document.getElementById('fecha').valueAsDate = new Date();
    setTipo('gasto'); 
    
    ['gasto', 'ingreso', 'ahorro'].forEach(tipo => {
        document.getElementById(`btn-tipo-${tipo}`).addEventListener('click', () => setTipo(tipo));
    });

    setupCurrencyInput();
    
    document.getElementById('mainForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleFormSubmit();
    });
}

function setTipo(tipo) {
    document.getElementById('tipoRegistro').value = tipo;
    const dynamicFields = document.getElementById('dynamicFields');
    
    ['gasto', 'ingreso', 'ahorro'].forEach(b => {
        const btn = document.getElementById(`btn-tipo-${b}`);
        btn.className = 'w-1/3 py-2 rounded-lg font-medium text-slate-500 hover:text-slate-700 transition-all text-[11px]';
    });
    
    const activeBtn = document.getElementById(`btn-tipo-${tipo}`);
    activeBtn.classList.add('bg-white', 'shadow-sm', 'font-semibold');
    
    document.getElementById('montoInput').readOnly = false;
    document.getElementById('montoLabel').innerText = "Monto Total";
    
    if(tipo === 'gasto') {
        activeBtn.classList.add('text-rose-600');
        dynamicFields.innerHTML = getFormGastoHTML();
        initFormGasto();
    } else if(tipo === 'ingreso') {
        activeBtn.classList.add('text-emerald-600');
        dynamicFields.innerHTML = getFormIngresoHTML();
        initFormIngreso();
    } else if(tipo === 'ahorro') {
        activeBtn.classList.add('text-indigo-600');
        dynamicFields.innerHTML = getFormAhorroHTML();
        initFormAhorro();
    }
}

function setupCurrencyInput() {
    const input = document.getElementById('montoInput');
    const currencySelect = document.getElementById('moneda');
    const hiddenInput = document.getElementById('montoReal');
    const symbolSpan = document.getElementById('currencySymbol');

    const updateSymbol = () => {
        const isUSD = currencySelect.value === 'USD';
        symbolSpan.innerText = isUSD ? 'u$s' : '$';
        // Padding dinámico real: se mide el ancho que ocupa el símbolo ("$" vs "u$s")
        // en vez de usar un valor fijo, para que el monto nunca quede tapado.
        input.style.paddingLeft = `${symbolSpan.getBoundingClientRect().width + 12}px`;
        input.dispatchEvent(new Event('input'));
    };

    currencySelect.addEventListener('change', updateSymbol);

    input.addEventListener('input', (e) => {
        if(input.readOnly) return;
        let value = e.target.value.replace(/\D/g, "");
        let rawValue = parseFloat(value) / 100;
        
        if (isNaN(rawValue)) {
            input.value = "";
            hiddenInput.value = "";
            return;
        }

        hiddenInput.value = rawValue;
        input.value = currencyFormatter(currencySelect.value).format(rawValue).replace(/[a-zA-Z\$\s]/g, "");
    });
    
    updateSymbol();
}

async function handleFormSubmit() {
    const tipo = document.getElementById('tipoRegistro').value;
    const monto = parseFloat(document.getElementById('montoReal').value);
    
    if (!monto || monto <= 0) return alert('Por favor ingrese un monto válido.');

    let data = {
        tipo: tipo,
        moneda: document.getElementById('moneda').value,
        fecha: document.getElementById('fecha').value,
        notas: document.getElementById('notas').value || '',
        monto: monto
    };

    if (tipo === 'gasto') {
        data.categoriaPrincipal = document.getElementById('catPrincipal').value;
        const subcatEl = document.getElementById('subcategoria');
        data.subcategoria = subcatEl.options.length > 0 ? subcatEl.value : '-';
    } else if (tipo === 'ingreso') {
        data.mesReferencia = document.getElementById('mesRef').value;
        data.categoria = document.getElementById('catIngreso').value;
    } else if (tipo === 'ahorro') {
        data.tipoActivo = document.getElementById('tipoActivo').value;
        data.ticker = document.getElementById('ticker').value.toUpperCase();
        data.cantidad = parseFloat(document.getElementById('cantidad').value);
        data.precio = parseFloat(document.getElementById('precio').value);
        data.total = monto;
    }

    const btnSubmit = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const spinner = document.getElementById('spinner');
    
    btnSubmit.disabled = true;
    btnText.innerText = "Guardando...";
    spinner.classList.remove('hidden');

    try {
        await postData(data);
        showToast();
        document.getElementById('mainForm').reset();
        document.getElementById('fecha').valueAsDate = new Date();
        setTipo(tipo); 
    } catch (err) {
        alert('Error: ' + err);
    } finally {
        btnSubmit.disabled = false;
        btnText.innerText = "Guardar Registro";
        spinner.classList.add('hidden');
    }
}