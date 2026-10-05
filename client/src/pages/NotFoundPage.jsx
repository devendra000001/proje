import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-stone-200 rounded-lg shadow-sm">
      <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center mb-4">
        <Compass className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-2 font-serif">
        404 — Page Not Found
      </h2>
      <p className="text-sm text-stone-600 max-w-md mb-6">
        The requested page does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Back to Safety (Dashboard)
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
