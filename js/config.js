export const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbytyu1U_gj9-C8dewnEb_IGqggmmKOcnVXIQmSkGZdoAOg70N2J48LNnLdG6l-IBsSg/exec'; 
export const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// Objeto vacío que se llenará con lo que venga de Google Sheets
let categorias = { ingresos: [], ahorros: [], gastos: {} };

export const getCategorias = () => categorias;
export const setCategorias = (data) => { categorias = data; };