// src/App.tsx
import { useState, type ChangeEvent } from 'react';
import * as mammoth from 'mammoth';
import VistaCarga from './components/VistaCarga';
import VisorDocumento from './components/VisorDocumento';

export default function App() {
  const [docHtml, setDocHtml] = useState<string>('');
  const [tipoDocumento, setTipoDocumento] = useState<string>('COTIZACIÓN');

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocHtml(result.value);
      } catch (error) {
        console.error('Error al procesar el archivo Word:', error);
        alert('Error crítico: No se pudo procesar el archivo .docx.');
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