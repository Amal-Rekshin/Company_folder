import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { serviceReportApi } from '../../api/serviceReportApi';
import { ticketApi } from '../../api/ticketApi';
import { GlassCard, Button, Input } from '../../components/ui/Components';

import { LoadingPage } from '../../components/ui/Loading';

const ServiceReportPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    workDone: '',
    recommendations: '',
    materialsUsed: '',
    customerSignatureUrl: ''
  });

  const [imageForm, setImageForm] = useState({
    imageUrl: '',
    imageType: 'after', // 'before' or 'after'
    description: ''
  });

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketById(id).then(res => res.data)
  });

  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['serviceReport', id],
    queryFn: () => serviceReportApi.getReport(id).then(res => res.data),
    retry: false // If no report exists, it throws 404, which is expected before creation
  });

  const createMutation = useMutation({
    mutationFn: (data) => serviceReportApi.createReport(id, data),
    onSuccess: () => queryClient.invalidateQueries(['serviceReport', id])
  });

  const addImageMutation = useMutation({
    mutationFn: (data) => serviceReportApi.addImage(report?.id, data),
    onSuccess: () => {
      setImageForm({ imageUrl: '', imageType: 'after', description: '' });
      queryClient.invalidateQueries(['serviceReport', id]);
    }
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    addImageMutation.mutate(imageForm);
  };

  if (ticketLoading || (reportLoading && reportLoading !== null)) return <LoadingPage message="Loading service report..." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Service Report for {ticket?.ticketNumber}</h1>
        <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
      </div>

      {!report ? (
        <GlassCard>
          <h2 className="text-lg font-bold mb-4">Create New Report</h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Work Done</label>
              <textarea name="workDone" value={formData.workDone} onChange={handleChange} required rows={3} className="w-full p-2 border rounded-xl" placeholder="Describe the work completed..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Recommendations</label>
              <textarea name="recommendations" value={formData.recommendations} onChange={handleChange} rows={2} className="w-full p-2 border rounded-xl" placeholder="Any recommendations for the customer..."></textarea>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Materials Used</label>
              <textarea name="materialsUsed" value={formData.materialsUsed} onChange={handleChange} rows={2} className="w-full p-2 border rounded-xl" placeholder="List of materials or parts..."></textarea>
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
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Upload Images</h2>
            <form onSubmit={handleAddImage} className="space-y-4 mb-6">
              <Input label="Cloudinary Image URL" value={imageForm.imageUrl} onChange={(e) => setImageForm({...imageForm, imageUrl: e.target.value})} required placeholder="https://res.cloudinary.com/..." />
              <div className="flex gap-4">
                <select className="p-2 border rounded-xl flex-1" value={imageForm.imageType} onChange={(e) => setImageForm({...imageForm, imageType: e.target.value})}>
                  <option value="before">Before Fix</option>
                  <option value="after">After Fix</option>
                </select>
                <Input placeholder="Description" className="flex-1" value={imageForm.description} onChange={(e) => setImageForm({...imageForm, description: e.target.value})} />
              </div>
              <Button type="submit" disabled={addImageMutation.isPending}>Add Image</Button>
            </form>

            {report.images && report.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {report.images.map((img, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden border">
                    <img src={img.imageUrl} alt={img.description} className="w-full h-32 object-cover" />
                    <div className="absolute bottom-0 w-full bg-black/60 text-white text-xs p-1 text-center">
                      {img.imageType.toUpperCase()} - {img.description}
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
