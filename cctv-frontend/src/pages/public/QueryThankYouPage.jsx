import React from 'react';
import { Link } from 'react-router-dom';
import { GlassCard, Button } from '../../components/ui/Components';
import { CheckCircle } from 'lucide-react';

const QueryThankYouPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <GlassCard className="py-12">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Request Received!</h1>
          <p className="text-slate-500 mb-8">
            Thank you for reaching out. Our team will review your query and contact you within 24 hours with a quotation.
          </p>
          <Link to="/">
            <Button variant="secondary">Return Home</Button>
          </Link>
        </GlassCard>
      </div>
    </div>
  );
};

export default QueryThankYouPage;
