// src/App.tsx
import { useState, type ChangeEvent } from 'react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import VistaCarga from './components/VistaCarga';
import VisorDocumento from './components/VisorDocumento';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

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
        console.error('Error al procesar el archivo:', error);
        alert('Error: No se pudo leer el archivo. Si es un archivo de Word antiguo (.doc), el navegador no puede leerlo. Por favor guárdalo como .docx en Microsoft Word.');
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