// src/App.tsx
import { useState, type ChangeEvent } from 'react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import VistaCarga from './components/VistaCarga';
import VisorDocumento from './components/VisorDocumento';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

function fallbackTextExtraction(buffer: ArrayBuffer): string {
    try {
        const decoder16 = new TextDecoder('utf-16le');
        const text16 = decoder16.decode(buffer);
        const unreadableRegex = /[^\w\sñÑáéíóúÁÉÍÓÚüÜ,.;:\-?!"'()$€£%@+=/*&#<>{}|~\[\]^]/g;
        
        const blacklist = new Set([
            'normal', 'título 1', 'título 2', 'título 3', 'título 4', 'título 5',
            'fuente de párrafo predeter.', 'tabla normal', 'sin lista', 'texto de globo',
            'hipervínculo', 'encabezado', 'encabezado car', 'pie de página', 'pie de página car',
            'párrafo de lista', 'times new roman', 'symbol', 'arial', 'avantgarde md bt',
            'century gothic', 'tahoma', 'calibri light', 'calibri', 'courier new', 'wingdings',
            'cambria math', 'archivos de programa', 'microsoft office', 'plantillas',
            'root entry', 'data', '0table', '1table', 'worddocument', 'summaryinformation',
            'documentsummaryinformation', 'msodatastore', 'item', 'properties', 'compobj', 'unknown'
        ]);

        const filterParagraphs = (parts: string[]) => {
            return parts.filter(p => {
                const t = p.trim();
                // Eliminar basura de 1 o 2 letras que NO tenga números (ej. 'h', 'O', 'ÁG')
                if (t.length < 3 && !/[0-9]/.test(t)) return false;
                // Eliminar si es pura puntuación
                if (/^[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]+$/.test(t)) return false;
                // Eliminar metadatos internos de Word y estilos
                if (blacklist.has(t.toLowerCase())) return false;
                // Eliminar extensiones temporales o basura residual
                if (t.toLowerCase().includes('.tmp') || t === 'Q==' || t === '1RIR') return false;
                return true;
            });
        };

        let parts = text16.split(unreadableRegex);
        let paragraphs = filterParagraphs(parts);
        
        if (paragraphs.length > 2) {
            return paragraphs.map((m: string) => `<p>${m.trim()}</p>`).join('');
        }

        const decoder8 = new TextDecoder('utf-8');
        const text8 = decoder8.decode(buffer);
        parts = text8.split(unreadableRegex);
        paragraphs = filterParagraphs(parts);
        
        if (paragraphs.length > 0) {
            return paragraphs.map((m: string) => `<p>${m.trim()}</p>`).join('');
        }
    } catch (e) {
        console.error("Error en fallback", e);
    }
    return '<p><em>Aviso: Documento antiguo no soportado completamente. Guarde como .docx para ver el contenido completo.</em></p>';
}

export default function App() {
  const [docHtml, setDocHtml] = useState<string>('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('COTIZACIÓN');

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        if (isPDF) {
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          let fullHtml = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items.map((item: any) => item.str).join(' ');
            fullHtml += `<p>${text}</p>`;
          }
          setDocHtml(fullHtml);
        } else {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocHtml(result.value);
        }
      } catch (error) {
        console.warn('Mammoth falló, usando extracción de texto en bruto (archivos antiguos).');
        const fallbackHtml = fallbackTextExtraction(arrayBuffer);
        setDocHtml(fallbackHtml);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleVolver = () => setDocHtml('');

  return (
    <main className="min-h-screen bg-slate-200 font-sans flex flex-col">
      {!docHtml ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <VistaCarga 
            onFileUpload={handleFileUpload} 
            tipoDocumento={tipoDocumento}
            setTipoDocumento={setTipoDocumento}
          />
        </div>
      ) : (
        <VisorDocumento 
          contenidoWord={docHtml} 
          onVolver={handleVolver} 
          tipoDocumento={tipoDocumento} 
        />
      )}
    </main>
  );
}