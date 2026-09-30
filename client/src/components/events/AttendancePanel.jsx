import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import ErrorState from '../common/ErrorState';
import ConfirmDialog from '../common/ConfirmDialog';

const AttendancePanel = ({ eventId, onUpdated }) => {
  const { addToast } = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingClear, setPendingClear] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/events/${eventId}/attendance`, { params: { page, limit: 50 } });
      setRows(response.data.members || []);
      setPages(response.data.pagination?.pages || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load the attendance roster.');
    } finally {
      setLoading(false);
    }
  }, [eventId, page]);

  useEffect(() => { load(); }, [load]);

  const mark = async (memberId, status) => {
    setSavingId(memberId);
    try {
      await api.put(`/events/${eventId}/attendance/${memberId}`, { status });
      addToast(`Attendance marked ${status}.`, 'success');
      await load();
      onUpdated?.();
    } catch (requestError) {
      addToast(requestError.response?.data?.message || 'Could not update attendance.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const clear = async () => {
    if (!pendingClear) return;
    const memberId = pendingClear.member._id;
    setSavingId(memberId);
    try {
      await api.delete(`/events/${eventId}/attendance/${memberId}`);
      addToast('Attendance mark removed.', 'success');
      setPendingClear(null);
      await load();
      onUpdated?.();
    } catch (requestError) {
      addToast(requestError.response?.data?.message || 'Could not remove attendance mark.', 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-stone-200 bg-white p-5" aria-labelledby="attendance-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 id="attendance-heading" className="text-base font-bold text-stone-900">Attendance roster</h3>
          <p className="text-xs text-stone-500">Marks are saved to this event as you make them.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={load}>Refresh roster</Button>
      </div>
      {loading ? <Loader text="Loading attendance roster..." /> : error ? <ErrorState message={error} onRetry={load} /> : rows.length === 0 ? (
        <EmptyState title="No active members" description="There are no active member profiles to mark for attendance." icon={Check} />
      ) : (
        <>
          <div className="divide-y divide-stone-100">
            {rows.map(({ member, attendance }) => (
              <div key={member._id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-stone-900">{member.fullName}</p>
                  <p className="text-xs text-stone-500">{member.branch} · {member.academicYear}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`min-w-16 text-xs font-semibold ${attendance?.status === 'present' ? 'text-emerald-700' : attendance?.status === 'absent' ? 'text-rose-700' : 'text-stone-400'}`}>
                    {attendance?.status ? attendance.status.toUpperCase() : 'UNMARKED'}
                  </span>
                  <Button size="sm" variant={attendance?.status === 'present' ? 'primary' : 'secondary'} isLoading={savingId === member._id} aria-label={`Mark ${member.fullName} present`} onClick={() => mark(member._id, 'present')} icon={Check}>Present</Button>
                  <Button size="sm" variant={attendance?.status === 'absent' ? 'danger' : 'secondary'} isLoading={savingId === member._id} aria-label={`Mark ${member.fullName} absent`} onClick={() => mark(member._id, 'absent')} icon={X}>Absent</Button>
                  {attendance && <Button size="sm" variant="ghost" isDisabled={savingId === member._id} aria-label={`Remove ${member.fullName} attendance mark`} onClick={() => setPendingClear({ member })} icon={RotateCcw}>Clear</Button>}
                </div>
              </div>
            ))}
          </div>
          {pages > 1 && <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-600">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)} icon={ChevronLeft}>Previous</Button>
              <Button size="sm" variant="secondary" isDisabled={page >= pages} onClick={() => setPage((value) => value + 1)} icon={ChevronRight}>Next</Button>
            </div>
          </div>}
        </>
      )}
      <ConfirmDialog isOpen={!!pendingClear} onClose={() => setPendingClear(null)} onConfirm={clear} title="Remove attendance mark" message={`Remove the attendance mark for ${pendingClear?.member.fullName || 'this member'}?`} confirmText="Remove mark" isDanger />
    </section>
  );
};

export default AttendancePanel;
