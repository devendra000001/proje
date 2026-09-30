import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/common/Button';

export const UnauthorizedPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white border border-stone-200 rounded-lg shadow-sm">
      <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-stone-900 mb-2 font-serif">
        403 — Access Restricted
      </h2>
      <p className="text-sm text-stone-600 max-w-md mb-6">
        You do not have administrative permissions to view or modify this section of the RSS VNIT Shakha Portal.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={ArrowLeft}>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
};

export default UnauthorizedPage;
