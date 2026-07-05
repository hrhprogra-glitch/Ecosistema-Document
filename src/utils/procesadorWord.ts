// src/utils/procesadorWord.ts
export const procesarFacturacion = (html: string): { html: string; cliente: string; cuentaBancaria: string } => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let fecha = "No especificada";
  let cliente = "CLIENTE NO ESPECIFICADO";
  let totalTexto = "S/ 0.00";
  let subtotalTexto = "---";
  let igvTexto = "---";
  
  const tieneIgv = /IGV/i.test(html);
  let nextIsClient = false;
  const nodesToRemove: HTMLElement[] = [];

  Array.from(tempDiv.children).forEach(child => {
    const text = child.textContent?.trim() || '';
    const upperText = text.toUpperCase();

    if (!text) {
      nodesToRemove.push(child as HTMLElement);
      return;
    }

    if (
      upperText.includes('ECO SISTEMAS URH') ||
      upperText.includes('MZ A LT') ||
      upperText.includes('998270102') ||
      upperText.includes('985832096') ||
      upperText.includes('HOTMAIL.COM') ||
      upperText.includes('A SU GENTIL SOLICITUD')
    ) {
      nodesToRemove.push(child as HTMLElement);
      return;
    }

    const dateMatch = upperText.match(/(?:LIMA,?\s*)?(\d{1,2}\s+DE\s+[A-Z]+\s+(?:DEL?\s+)?\d{4}|\d{2}\/\d{2}\/\d{4})/);
    if (dateMatch && fecha === "No especificada") {
      fecha = text; 
      nodesToRemove.push(child as HTMLElement);
      return;
    }

    if (upperText.match(/^SE[ÑN]OR(?:ES)?\s*:?$/) || upperText.match(/^CLIENTE\s*:?$/) || upperText.match(/^ATENCI[ÓO]N\s*:?$/)) {
      nextIsClient = true;
      nodesToRemove.push(child as HTMLElement);
      return;
    }
    
    if (nextIsClient) {
      cliente = text.toUpperCase(); 
      nextIsClient = false;
      nodesToRemove.push(child as HTMLElement);
      return;
    }

    const inlineClient = text.match(/^(?:SE[ÑN]OR(?:ES)?|CLIENTE|ATENCI[ÓO]N)\s*:\s*(.+)$/i);
    if (inlineClient && cliente === "CLIENTE NO ESPECIFICADO") {
      cliente = inlineClient[1].trim().toUpperCase(); 
      nodesToRemove.push(child as HTMLElement);
      return;
    }
    
    if (upperText.includes('DANIEL REYNAFARJE') && cliente === "CLIENTE NO ESPECIFICADO") {
      cliente = text.toUpperCase(); 
      nodesToRemove.push(child as HTMLElement);
      return;
    }

    const priceMatch = upperText.match(/(?:PRECIO\s*TOTAL|TOTAL|MONTO|COSTO).*?(?:S\/|\$|SOLES)?\s*([\d,]+(?:\.\d{2})?)/);
    if (priceMatch) {
      const numericTotal = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (!isNaN(numericTotal)) {
        totalTexto = `S/ ${numericTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        if (tieneIgv) {
          const sub = numericTotal / 1.18;
          const igv = numericTotal - sub;
          subtotalTexto = `S/ ${sub.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          igvTexto = `S/ ${igv.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }
      nodesToRemove.push(child as HTMLElement);
      return;
    }
  });

  nodesToRemove.forEach(node => {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
  });

  const descripcionLimpia = tempDiv.innerHTML || '<p>SERVICIO GENERAL</p>';

  const filasMontos = tieneIgv ? `
    <tr class="border-b border-slate-300 bg-slate-50">
      <td class="p-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-300 tracking-wider">Subtotal</td>
      <td class="p-2 text-sm font-bold text-slate-900 w-32">${subtotalTexto}</td>
    </tr>
    <tr class="border-b border-slate-300 bg-slate-50">
      <td class="p-2 text-xs font-bold text-slate-600 uppercase border-r border-slate-300 tracking-wider">I.G.V. (18%)</td>
      <td class="p-2 text-sm font-bold text-slate-900">${igvTexto}</td>
    </tr>` : '';

  // ---------- Bloque bancario, ahora SEPARADO del resto del contenido ----------
  const cuentaBancaria = `
    <div class="inline-block border-[2px] border-red-600 p-3 bg-white text-red-600 text-xs font-medium uppercase tracking-wider shadow-sm">
      <p class="mb-1">CUENTA DE AHORRO SOLES BCP</p>
      <p class="mb-1">BCP SOLES: <span class="font-bold">193-27543218-0-31</span></p>
      <p class="mb-1">CCI: <span class="font-bold">002-193-127543218031-10</span></p>
      <p class="mb-0">Nombre: <span class="font-bold">ULICES RODRIGUEZ H.</span></p>
    </div>
  `;

  // ---------- Contenido principal, SIN el bloque bancario ----------
  const htmlFinal = `
    <div class="grid grid-cols-[130px_1fr] border border-slate-300 overflow-hidden mb-5">
      <div class="bg-slate-100 p-2.5 text-xs font-bold uppercase text-slate-700 border-r border-slate-300 flex items-center">Señor(es):</div>
      <div class="p-2.5 text-sm font-bold text-slate-900">${cliente}</div>
      <div class="bg-slate-100 p-2.5 text-xs font-bold uppercase text-slate-700 border-r border-t border-slate-300 flex items-center">Fecha:</div>
      <div class="p-2.5 text-sm font-bold uppercase text-slate-900 border-t border-slate-300">${fecha}</div>
    </div>
    
    <table class="w-full text-left border-collapse border border-slate-300 mb-0">
      <thead class="bg-brand-dark text-white text-xs uppercase tracking-wider">
        <tr>
          <th class="p-3 border border-slate-700 w-16 text-center">Cant.</th>
          <th class="p-3 border border-slate-700">Descripción / Justificación del Costo</th>
          <th class="p-3 border border-slate-700 w-32 text-center">Precio Total</th>
        </tr>
      </thead>
      <tbody class="text-slate-800 bg-white">
        <tr class="border-b border-slate-300 print-avoid-break">
          <td class="p-4 text-center font-bold text-sm border-r border-slate-300 align-top">01</td>
          <td class="p-4 text-xs uppercase border-r border-slate-300 align-top leading-relaxed">
            ${descripcionLimpia}
          </td>
          <td class="p-4 text-center font-bold text-sm text-slate-900 align-top">${totalTexto}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="flex justify-end mt-4 mb-4 print-avoid-break">
      <table class="w-72 text-right border-collapse border border-slate-300 shadow-sm overflow-hidden">
        ${filasMontos}
        <tr class="bg-brand-dark text-white">
          <td class="p-3 text-xs font-bold uppercase border-r border-slate-700 tracking-widest">Total</td>
          <td class="p-3 text-sm font-bold">${totalTexto}</td>
        </tr>
      </table>
    </div>
  `;

  return { html: htmlFinal, cliente, cuentaBancaria };
};