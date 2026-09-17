import { useState, useRef } from 'react';
import api from '../../lib/api';
import { UploadCloud, File, AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';

export function ImportWizard({ onClose, onComplete }: { onClose: () => void, onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [importType, setImportType] = useState('VENDOR');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('importType', importType);
    
    try {
      await api.post('/imports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      // Skip straight to complete since backend handles validation asynchronously right now
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">New Import Job</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-8 max-w-lg mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10 -translate-y-1/2"></div>
          
          <div className={`flex flex-col items-center bg-white px-2 ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
              1
            </div>
            <span className="text-xs font-medium mt-1">Select Type</span>
          </div>
          
          <div className={`flex flex-col items-center bg-white px-2 ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-slate-300 bg-white'}`}>
              2
            </div>
            <span className="text-xs font-medium mt-1">Upload Data</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3 text-red-700">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Upload Failed</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="max-w-xl mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">What do you want to import?</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'VENDOR', title: 'Vendors', desc: 'Import your supplier list' },
                  { id: 'MATERIAL', title: 'Materials', desc: 'Import material master catalog' },
                  { id: 'PROJECT', title: 'Projects', desc: 'Import active projects' },
                  { id: 'BOQ', title: 'BOQ Items', desc: 'Import Bill of Quantities' },
                ].map((type) => (
                  <div 
                    key={type.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${importType === type.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}
                    onClick={() => setImportType(type.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-medium text-slate-900">{type.title}</h4>
                      {importType === type.id && <CheckCircle size={18} className="text-blue-500" />}
                    </div>
                    <p className="text-sm text-slate-500">{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setStep(2)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                Next Step <ArrowRight size={16} className="ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-xl mx-auto space-y-6">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Upload {importType} Data</h3>
            <p className="text-slate-500 text-sm mb-4">Upload a .csv or .xlsx file containing your records.</p>
            
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-10 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} className="text-slate-400 mb-4" />
              <h4 className="text-slate-900 font-medium mb-1">Click to upload file</h4>
              <p className="text-slate-500 text-sm">CSV or Excel format</p>
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".csv,.xlsx,.xls"
              />
            </div>

            {file && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <File className="text-blue-500" size={24} />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} disabled={isUploading} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-50">
                Back
              </button>
              <button onClick={handleUpload} disabled={!file || isUploading} className="min-w-[120px] px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:bg-blue-400">
                {isUploading ? 'Uploading...' : 'Upload & Validate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
