import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { FileText, Plus, X, Upload, Download, History } from 'lucide-react';
import api from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';

export function DocumentsTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('Contracts');
  const [comments, setComments] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', projectId],
    queryFn: async () => {
      const res = await api.get(`/documents?projectId=${projectId}`);
      return res.data;
    }
  });

  const { data: documentHistory } = useQuery({
    queryKey: ['documentHistory', selectedDocument?.id],
    queryFn: async () => {
      if (!selectedDocument) return null;
      const res = await api.get(`/documents/${selectedDocument.id}/history`);
      return res.data;
    },
    enabled: !!selectedDocument
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      setIsUploading(false);
      resetForm();
    }
  });

  const uploadVersionMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post(`/documents/${selectedDocument.id}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['documentHistory', selectedDocument.id] });
      setIsUploadingVersion(false);
      resetForm();
    }
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const res = await api.patch(`/documents/${id}/approve`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      queryClient.invalidateQueries({ queryKey: ['documentHistory', selectedDocument?.id] });
    }
  });

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDocumentType('Contracts');
    setComments('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', projectId as string);
    formData.append('title', title);
    formData.append('documentType', documentType);
    if (comments) formData.append('comments', comments);

    uploadMutation.mutate(formData);
  };

  const handleUploadVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedDocument) return;

    const formData = new FormData();
    formData.append('file', file);
    if (comments) formData.append('comments', comments);

    uploadVersionMutation.mutate(formData);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canApprove = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'].includes(user?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Project Documents</h3>
        <button 
          onClick={() => setIsUploading(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} /> Upload Document
        </button>
      </div>

      {isUploading && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-md font-semibold text-slate-800">Upload New Document</h4>
            <button onClick={() => { setIsUploading(false); resetForm(); }} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-md text-sm"
                >
                  <option>Contracts</option>
                  <option>Drawings</option>
                  <option>BOQ</option>
                  <option>Reports</option>
                  <option>Invoices</option>
                  <option>Approvals</option>
                  <option>Safety</option>
                  <option>Quality</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select File</label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
                <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                {file ? (
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                ) : (
                  <p className="text-sm text-slate-500">Click to browse or drag and drop</p>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Version Comments / Change Description</label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Initial upload notes..."
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                rows={2}
              />
            </div>
            
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={!file || !title || uploadMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex">
        <div className={`flex-1 transition-all ${selectedDocument ? 'hidden lg:block lg:w-1/2 border-r border-slate-200' : 'w-full'}`}>
          <div className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading documents...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Latest Version</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents?.map((doc: any) => (
                      <tr 
                        key={doc.id} 
                        onClick={() => { setSelectedDocument(doc); setIsUploadingVersion(false); resetForm(); }}
                        className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${selectedDocument?.id === doc.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="truncate max-w-[200px]">{doc.title}</p>
                              <p className="text-xs text-slate-500 font-normal">{doc.versions[0]?.fileName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{doc.category || doc.documentType}</td>
                        <td className="px-4 py-3 text-slate-600">
                          v{doc.versions[0]?.versionNumber} <span className="text-slate-400 text-xs">({new Date(doc.versions[0]?.createdAt).toLocaleDateString()})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 
                            doc.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 
                            doc.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {doc.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!documents?.length && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No documents found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Document Details & History Drawer */}
        {selectedDocument && (
          <div className="w-full lg:w-1/2 flex flex-col bg-slate-50 h-[700px] max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-start shrink-0">
              <div className="flex-1 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${
                    selectedDocument.status === 'APPROVED' ? 'bg-emerald-500' : 
                    selectedDocument.status === 'REJECTED' ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    {selectedDocument.status}
                  </span>
                  <span className="text-xs text-slate-500">{selectedDocument.category || selectedDocument.documentType}</span>
                </div>
                <h4 className="font-bold text-slate-800 text-lg">{selectedDocument.title}</h4>
              </div>
              <button onClick={() => setSelectedDocument(null)} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              
              {/* Actions */}
              <div className="flex gap-2">
                <a 
                  href={`http://localhost:5000${selectedDocument.versions[0]?.fileUrl}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-50"
                >
                  <Download size={16} /> Download Latest
                </a>
                <button 
                  onClick={() => setIsUploadingVersion(!isUploadingVersion)}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100"
                >
                  <Upload size={16} /> Update Version
                </button>
              </div>

              {/* Approval workflow if not approved */}
              {canApprove && selectedDocument.status !== 'APPROVED' && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h5 className="text-sm font-bold text-amber-800 mb-1">Pending Approval</h5>
                    <p className="text-xs text-amber-700">Review the latest version and approve or reject.</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => approveMutation.mutate({ id: selectedDocument.id, status: 'APPROVED' })}
                      disabled={approveMutation.isPending}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => approveMutation.mutate({ id: selectedDocument.id, status: 'REJECTED' })}
                      disabled={approveMutation.isPending}
                      className="bg-red-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Upload New Version Form */}
              {isUploadingVersion && (
                <form onSubmit={handleUploadVersion} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-4">
                  <h5 className="text-sm font-semibold text-slate-800 border-b border-slate-100 pb-2">Upload Version {selectedDocument.versions[0]?.versionNumber + 1}</h5>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Select File</label>
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Change Description</label>
                    <textarea
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="What changed in this version?"
                      className="w-full p-2 border border-slate-300 rounded-md text-sm"
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={!file || uploadVersionMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
                    >
                      {uploadVersionMutation.isPending ? 'Uploading...' : 'Upload New Version'}
                    </button>
                  </div>
                </form>
              )}

              {/* Version History */}
              <div>
                <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <History size={16} /> Version History
                </h5>
                <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                  {documentHistory?.map((version: any) => (
                    <div key={version.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-200 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <span className="text-xs font-bold">v{version.versionNumber}</span>
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 text-sm truncate">{version.fileName}</span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2 flex items-center gap-2 flex-wrap">
                          <span>{new Date(version.createdAt).toLocaleString()}</span>
                          <span>•</span>
                          <span>{version.uploadedBy?.firstName} {version.uploadedBy?.lastName}</span>
                          <span>•</span>
                          <span>{formatFileSize(version.fileSize)}</span>
                        </div>
                        {version.changeDesc && (
                          <div className="bg-slate-50 p-2 rounded text-xs text-slate-600 mb-2">
                            {version.changeDesc}
                          </div>
                        )}
                        <a 
                          href={`http://localhost:5000${version.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium inline-flex items-center gap-1 mt-1"
                        >
                          <Download size={12} /> Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
