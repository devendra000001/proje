import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import Select from '../common/Select';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const dateInput = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? '' : date.toISOString().slice(0, 10);
};

export const EditEventModal = ({ isOpen, onClose, event, onEventUpdated }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    description: '',
    status: 'upcoming',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        date: event.date ? dateInput(event.date) : '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        venue: event.venue || '',
        description: event.description || '',
        status: event.status || 'upcoming',
      });
    }
  }, [event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event) return;
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (Number.isNaN(new Date(`${formData.date}T00:00:00`).valueOf())) {
        setErrorMsg('Enter a valid event date.');
        return;
      }
      const res = await api.put(`/events/${event._id}`, formData);

      if (res.data.success) {
        addToast('Event details updated successfully!', 'success');
        onEventUpdated && onEventUpdated(res.data.event);
        onClose();
      }
    } catch (err) {
      console.error('[Edit Event Error]', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update event details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Shakha Event Details" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <Input
          label="Event Name"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Event Date"
            name="date"
            type="date"
            required
            value={formData.date}
            onChange={handleChange}
          />

          <Input
            label="Start Time"
            name="startTime"
            required
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
            value={formData.startTime}
            onChange={handleChange}
          />

          <Input
            label="End Time"
            name="endTime"
            required
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Venue"
            name="venue"
            required
            value={formData.venue}
            onChange={handleChange}
          />

          <Select
            label="Status"
            name="status"
            options={[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            value={formData.status}
            onChange={handleChange}
          />
        </div>

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-stone-700">
            Description & Program Agenda
          </label>
          <textarea
            name="description"
            rows="3"
            maxLength={5000}
            className="w-full text-sm bg-white border border-stone-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#D84315]"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEventModal;
