export const currencyFormatter = (currency) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
});

export function showToast(message = "Registro guardado") {
    const toast = document.getElementById('toast');
    toast.innerHTML = `<span class="text-emerald-400">✓</span> ${message}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 10px)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, 0)';
    }, 3000);
}