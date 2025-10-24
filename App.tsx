
import React, { useState, useCallback } from 'react';
import { FileUploader } from './components/FileUploader';
import { ResultsTable } from './components/ResultsTable';
import { extractInvoiceData } from './services/geminiService';
import type { InvoiceData } from './types';
import { DownloadIcon, SparklesIcon, XCircleIcon } from './components/Icons';

// Fix: Declare pdfjsLib to resolve TypeScript error 'Cannot find name 'pdfjsLib''.
// This assumes pdf.js is loaded globally, e.g., via a <script> tag in index.html.
declare const pdfjsLib: any;

type FileStatus = {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
};

const App: React.FC = () => {
  const [files, setFiles] = useState<FileStatus[]>([]);
  const [extractedData, setExtractedData] = useState<InvoiceData[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFileStatuses: FileStatus[] = selectedFiles.map(file => ({
      file,
      status: 'pending',
    }));
    setFiles(newFileStatuses);
    setExtractedData([]);
    setGlobalError(null);
  };

  const fileToImages = async (file: File): Promise<string[]> => {
    const images: string[] = [];
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
          }
          const typedarray = new Uint8Array(event.target.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            if (context) {
                await page.render({ canvasContext: context, viewport: viewport }).promise;
                images.push(canvas.toDataURL('image/jpeg').split(',')[1]);
            }
          }
          resolve(images);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setGlobalError(null);
    setExtractedData([]);

    const allExtractedData: InvoiceData[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileStatus = files[i];
      setFiles(prev => prev.map((fs, index) => index === i ? { ...fs, status: 'processing' } : fs));
      
      try {
        const imageB64Strings = await fileToImages(fileStatus.file);
        // Using only the first page for simplicity
        const data = await extractInvoiceData(imageB64Strings[0]); 
        allExtractedData.push({ ...data, fileName: fileStatus.file.name });
        setFiles(prev => prev.map((fs, index) => index === i ? { ...fs, status: 'success' } : fs));
      } catch (error) {
        console.error(`Error processing file ${fileStatus.file.name}:`, error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        setFiles(prev => prev.map((fs, index) => index === i ? { ...fs, status: 'error', message: errorMessage } : fs));
      }
    }

    setExtractedData(allExtractedData);
    setIsProcessing(false);
  }, [files]);

  const downloadCSV = () => {
    if (extractedData.length === 0) return;

    const headers = ['FileName', 'InvoiceNumber', 'VendorName', 'InvoiceDate', 'TotalAmount'];
    const csvContent = [
      headers.join(','),
      ...extractedData.map(item => [
        `"${item.fileName?.replace(/"/g, '""')}"`,
        `"${item.invoiceNumber?.replace(/"/g, '""')}"`,
        `"${item.vendorName?.replace(/"/g, '""')}"`,
        `"${item.invoiceDate?.replace(/"/g, '""')}"`,
        item.totalAmount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'invoice_data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };


  return (
    <div className="min-h-screen font-sans text-slate-800 flex items-center justify-center p-4">
      <main className="max-w-4xl w-full mx-auto bg-white rounded-2xl shadow-2xl shadow-slate-300/60 overflow-hidden">
        <div className="p-8 md:p-12">
          <header className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 pb-2">
              Invoice Data Extractor
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Upload your invoice PDFs, and let AI extract the key information for you.
            </p>
          </header>

          <section className="space-y-8">
            <FileUploader onFilesSelected={handleFilesSelected} isProcessing={isProcessing} files={files} />
            
            {files.length > 0 && (
                <div className="flex justify-center">
                    <button
                        onClick={processFiles}
                        disabled={isProcessing || files.length === 0}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                    >
                        <SparklesIcon className="w-6 h-6"/>
                        {isProcessing ? 'Extracting Data...' : `Extract Data from ${files.length} File(s)`}
                    </button>
                </div>
            )}
            
            {globalError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md flex items-start gap-3">
                <XCircleIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Error</p>
                  <p>{globalError}</p>
                </div>
              </div>
            )}
          </section>
        </div>

        {extractedData.length > 0 && (
          <section className="bg-slate-50 p-8 md:p-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-700">Extracted Data</h2>
              <button
                onClick={downloadCSV}
                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all duration-300"
              >
                <DownloadIcon className="w-5 h-5"/>
                Download CSV
              </button>
            </div>
            <ResultsTable data={extractedData} />
          </section>
        )}
      </main>
    </div>
  );
};

export default App;
