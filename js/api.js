import { SCRIPT_URL } from './config.js';

export async function fetchData() {
    if (!SCRIPT_URL || SCRIPT_URL.includes('TU_URL')) throw new Error("Falta configurar la URL");
    const res = await fetch(SCRIPT_URL);
    return await res.json();
}

export async function postData(data) {
    return fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(data)
    });
}