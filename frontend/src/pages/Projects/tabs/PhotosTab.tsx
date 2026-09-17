import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Camera, X, Upload, MapPin } from 'lucide-react';
import api from '../../../lib/api';

export function PhotosTab() {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ['photos', projectId],
    queryFn: async () => {
      const res = await api.get(`/site-photos?projectId=${projectId}`);
      return res.data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post('/site-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['photos', projectId] });
      setIsUploading(false);
      setFile(null);
      setDescription('');
      setLocation('');
    }
  });

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
    if (description) formData.append('description', description);
    if (location) formData.append('location', location);

    uploadMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Site Photos</h3>
        <button 
          onClick={() => setIsUploading(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Camera size={16} /> Upload Photo
        </button>
      </div>

      {isUploading && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
            <h4 className="text-md font-semibold text-slate-800">Upload Site Photo</h4>
            <button onClick={() => setIsUploading(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Photo</label>
              <div 
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Location / Zone</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Zone A, Floor 3"
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add context about this photo..."
                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                rows={2}
              />
            </div>
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="submit"
                disabled={!file || uploadMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center p-8 text-slate-500">Loading photos...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos?.map((photo: any) => (
            <div 
              key={photo.id} 
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                <img 
                  src={`http://localhost:5000${photo.url}`} 
                  alt={photo.description || 'Site photo'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/400x400?text=Image+Not+Found';
                  }}
                />
              </div>
              <div className="p-3">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-slate-900 truncate flex-1">{photo.uploader?.firstName} {photo.uploader?.lastName}</span>
                  <span className="text-[10px] text-slate-500">{new Date(photo.createdAt).toLocaleDateString()}</span>
                </div>
                {photo.location && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                    <MapPin size={10} /> {photo.location}
                  </p>
                )}
                {photo.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{photo.description}</p>
                )}
              </div>
            </div>
          ))}
          
          {(!photos || photos.length === 0) && (
            <div className="col-span-full p-12 text-center bg-white rounded-xl border border-slate-200 border-dashed">
              <Camera size={32} className="mx-auto text-slate-300 mb-3" />
              <h4 className="text-slate-700 font-medium mb-1">No photos yet</h4>
              <p className="text-sm text-slate-500 mb-4">Upload photos to document site progress and issues.</p>
              <button 
                onClick={() => setIsUploading(true)}
                className="text-sm text-blue-600 font-medium hover:text-blue-700"
              >
                Upload first photo
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lightbox / Modal for selected photo */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden">
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
              <img 
                src={`http://localhost:5000${selectedPhoto.url}`} 
                alt="Selected" 
                className="max-w-full max-h-[80vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                }}
              />
            </div>
            <div className="w-full md:w-80 bg-white flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <h4 className="font-semibold text-slate-800">Photo Details</h4>
                <button onClick={() => setSelectedPhoto(null)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4 flex-1 overflow-y-auto text-sm">
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Uploaded By</p>
                  <p className="text-slate-800">{selectedPhoto.uploader?.firstName} {selectedPhoto.uploader?.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Date</p>
                  <p className="text-slate-800">{new Date(selectedPhoto.createdAt).toLocaleString()}</p>
                </div>
                {selectedPhoto.location && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Location</p>
                    <p className="text-slate-800 flex items-center gap-1"><MapPin size={14} className="text-slate-400"/> {selectedPhoto.location}</p>
                  </div>
                )}
                {selectedPhoto.description && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Description</p>
                    <p className="text-slate-800 whitespace-pre-wrap">{selectedPhoto.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
