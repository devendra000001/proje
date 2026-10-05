import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';

const blankReport = { overallRemark: '', whatWentWell: '', whatCouldBeImproved: '', suggestionsNextTime: '' };

const EventRemarkForm = ({ eventId, remark, onSaved }) => {
  const { addToast } = useToast();
  const [form, setForm] = useState(blankReport);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({
      overallRemark: remark?.overallRemark || '',
      whatWentWell: remark?.whatWentWell || '',
      whatCouldBeImproved: remark?.whatCouldBeImproved || '',
      suggestionsNextTime: remark?.suggestionsNextTime || '',
    });
  }, [remark]);

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.put(`/events/${eventId}/remark`, form);
      addToast('Event report saved.', 'success');
      await onSaved?.();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save the event report.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-3 rounded-lg border border-slate-200 bg-slate-100/50 p-4">
      <h4 className="text-sm font-bold text-stone-900">{remark ? 'Edit event report' : 'Write event report'}</h4>
      {error && <p role="alert" className="rounded border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</p>}
      {[
        ['overallRemark', 'Overall remark', true],
        ['whatWentWell', 'What went well', false],
        ['whatCouldBeImproved', 'What could be improved', false],
        ['suggestionsNextTime', 'Suggestions for next time', false],
      ].map(([name, label, required]) => (
        <div key={name} className="space-y-1">
          <label htmlFor={`report-${name}`} className="text-xs font-semibold text-stone-700">{label}{required ? ' *' : ''}</label>
          <textarea id={`report-${name}`} name={name} required={required} maxLength={5000} rows={name === 'overallRemark' ? 3 : 2} value={form[name]} onChange={change} className="w-full rounded-md border border-stone-300 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500" />
        </div>
      ))}
      <div className="flex justify-end"><Button type="submit" isLoading={saving}>Save report</Button></div>
    </form>
  );
};

export default EventRemarkForm;
