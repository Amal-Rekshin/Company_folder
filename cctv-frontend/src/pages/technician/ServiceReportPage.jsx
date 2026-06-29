import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceReportApi } from '../../api/serviceReportApi';
import { ticketApi } from '../../api/ticketApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

import { LoadingPage } from '../../components/ui/Loading';

const ServiceReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    workDone: '',
    recommendations: '',
    materialsUsed: '',
  });

  const [imageForm, setImageForm] = useState({
    imageType: 'after',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(res => res.data)
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['serviceReport', id],
    queryFn: () => serviceReportApi.getReport(id).then(res => res.data),
    retry: false
  });

  const createMutation = useMutation({
    mutationFn: (data) => serviceReportApi.createReport(id, data),
    onSuccess: () => queryClient.invalidateQueries(['serviceReport', id])
  });

  const addImageMutation = useMutation({
    mutationFn: (data) => serviceReportApi.addImage(report?.id, data),
    onSuccess: () => {
      setImageForm({ imageType: 'after', description: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      queryClient.invalidateQueries(['serviceReport', id]);
    }
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearSelectedFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!previewUrl) return;
    
    addImageMutation.mutate({
      url: previewUrl,
      imageType: imageForm.imageType,
      description: imageForm.description
    });
  };

  if (ticketLoading || (reportLoading && reportLoading !== null)) return <LoadingPage message="Loading service report..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Service Report</h1>
          <p className="text-slate-500 mt-1">Ticket {ticket?.ticketNumber}</p>
        </div>
        <Button variant="secondary" onClick={() => navigate(`/technician/jobs/${id}`)}>Back to Job</Button>
      </div>

      {!report ? (
        <GlassCard>
          <h2 className="text-lg font-bold mb-4">Create New Report</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Work Done</label>
              <textarea name="workDone" value={formData.workDone} onChange={handleChange} required rows={3} className="w-full p-2 border border-slate-200 rounded-xl" placeholder="Describe the work completed..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Recommendations</label>
              <textarea name="recommendations" value={formData.recommendations} onChange={handleChange} rows={2} className="w-full p-2 border border-slate-200 rounded-xl" placeholder="Any recommendations for the customer..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Materials Used</label>
              <textarea name="materialsUsed" value={formData.materialsUsed} onChange={handleChange} rows={2} className="w-full p-2 border border-slate-200 rounded-xl" placeholder="List of materials or parts..."></textarea>
            </div>
            <Button type="submit" disabled={createMutation.isPending}>Save Report</Button>
          </form>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Report Details</h2>
            <div className="space-y-4 text-sm text-slate-700">
              <p><strong>Work Done:</strong><br/>{report.workDone}</p>
              <p><strong>Recommendations:</strong><br/>{report.recommendations}</p>
              <p><strong>Materials:</strong><br/>{report.materialsUsed}</p>
            </div>
          </GlassCard>

          <GlassCard>
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Upload Site Photos</h2>
            <form onSubmit={handleAddImage} className="space-y-4 mb-6">
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-500 cursor-pointer hover:bg-slate-50 hover:border-primary-400 transition-colors"
              >
                {previewUrl ? (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={handleClearSelectedFile}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-md flex items-center justify-center z-10"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm font-medium">Click to select photo</p>
                    <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange}
                />
              </div>

              <div className="flex gap-4">
                <select className="p-2 border border-slate-200 rounded-xl flex-1 bg-white" value={imageForm.imageType} onChange={(e) => setImageForm({...imageForm, imageType: e.target.value})}>
                  <option value="before">Before Fix</option>
                  <option value="after">After Fix</option>
                </select>
                <Input placeholder="Description (optional)" className="flex-1" value={imageForm.description} onChange={(e) => setImageForm({...imageForm, description: e.target.value})} />
              </div>
              <Button type="submit" disabled={!selectedFile || addImageMutation.isPending} className="w-full">
                {addImageMutation.isPending ? 'Uploading...' : 'Upload Image'}
              </Button>
            </form>

            {report.images && report.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {report.images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border">
                    <img src={img.url || img.imageUrl} alt={img.description} className="w-full h-32 object-cover" />
                    <div className="absolute bottom-0 w-full bg-black/60 text-white text-xs p-1.5 text-center truncate">
                      {img.imageType.toUpperCase()} {img.description ? `- ${img.description}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ServiceReportPage;
