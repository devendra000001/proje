import React, { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import EventsPage from './EventsPage';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Loader';

const AttendancePage = () => {
  const { user, isAdmin } = useAuth();
  const [result, setResult] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const memberId = user?.memberProfile?._id;
    if (!memberId) {
      setError('This account has no linked member profile. Contact a portal administrator.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/members/${memberId}/attendance`, { params: { page, limit: 20 } });
      setResult(response.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load your attendance history.');
    } finally {
      setLoading(false);
    }
  }, [user?.memberProfile?._id, page]);

  useEffect(() => { if (!isAdmin) load(); }, [isAdmin, load]);

  if (isAdmin) return <EventsPage initialStatus="upcoming" attendanceView />;
  if (loading) return <div aria-busy="true" aria-label="Loading attendance history" className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState title="Attendance history unavailable" message={error} onRetry={load} />;

  const summary = result?.summary || { totalMarked: 0, presentCount: 0, absentCount: 0, attendancePercentage: 0 };
  const records = result?.records || [];
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-stone-200 pb-4">
        <h2 className="text-xl font-bold text-stone-900 font-serif">My Attendance</h2>
        <p className="mt-1 text-sm text-stone-600">Your attendance history across recorded Shakha events.</p>
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Attendance rate" value={`${summary.attendancePercentage}%`} />
        <Metric label="Present" value={summary.presentCount} />
        <Metric label="Absent" value={summary.absentCount} />
      </div>
      {records.length === 0 ? <EmptyState title="No attendance recorded" description="Your event attendance will appear here after an administrator records it." icon={CalendarDays} /> : (
        <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
          <ul className="divide-y divide-stone-100">
            {records.map((record) => <li key={record._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {record.status === 'present' ? <CheckCircle className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
                <div>
                  <p className="text-sm font-semibold text-stone-900">{record.event?.name || 'Event record'}</p>
                  <p className="text-xs text-stone-500">{record.event?.date ? new Date(record.event.date).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'Date unavailable'}{record.event?.venue ? ` · ${record.event.venue}` : ''}</p>
                </div>
              </div>
              <Badge variant={record.status === 'present' ? 'completed' : 'cancelled'}>{record.status.toUpperCase()}</Badge>
            </li>)}
          </ul>
          {result?.pagination?.pages > 1 && <div className="flex items-center justify-between border-t border-stone-200 p-3 text-xs text-stone-600">
            <span>Page {result.pagination.page} of {result.pagination.pages}</span>
            <div className="flex gap-2"><Button size="sm" variant="secondary" isDisabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button size="sm" variant="secondary" isDisabled={page >= result.pagination.pages} onClick={() => setPage((current) => current + 1)}>Next</Button></div>
          </div>}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }) => <div className="rounded-lg border border-stone-200 bg-white p-4"><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-2xl font-bold text-stone-900">{value}</p></div>;

export default AttendancePage;
