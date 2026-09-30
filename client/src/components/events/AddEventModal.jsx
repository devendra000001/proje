import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';
import { Calendar, Clock, MapPin, FileText } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const localDateInput = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const AddEventModal = ({ isOpen, onClose, onEventAdded }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    date: localDateInput(),
    startTime: '07:00 AM',
    endTime: '08:00 AM',
    venue: 'VNIT Ground / Sports Complex',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await api.post('/events', formData);

      if (res.data.success) {
        addToast('New Shakha event scheduled successfully!', 'success');
        onEventAdded && onEventAdded(res.data.event);
        onClose();
        setFormData({
          name: '',
          date: localDateInput(),
          startTime: '07:00 AM',
          endTime: '08:00 AM',
          venue: 'VNIT Ground / Sports Complex',
          description: '',
        });
      }
    } catch (err) {
      console.error('[Add Event Error]', err);
      setErrorMsg(err.response?.data?.message || 'Failed to schedule Shakha event.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule New Shakha Event" maxWidth="max-w-xl">
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
          placeholder="e.g. Regular Morning Shakha / Vijayadashami Utsav"
          value={formData.name}
          onChange={handleChange}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Event Date"
            name="date"
            type="date"
            required
            min={localDateInput()}
            value={formData.date}
            onChange={handleChange}
          />

          <Input
            label="Start Time"
            name="startTime"
            required
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
            placeholder="07:00 AM"
            value={formData.startTime}
            onChange={handleChange}
          />

          <Input
            label="End Time"
            name="endTime"
            required
            pattern="^(0?[1-9]|1[0-2]):[0-5][0-9]\\s?(AM|PM)$"
            placeholder="08:00 AM"
            value={formData.endTime}
            onChange={handleChange}
          />
        </div>

        <Input
          label="Venue"
          name="venue"
          required
          placeholder="VNIT Ground / Sports Complex / Open Lawn"
          value={formData.venue}
          onChange={handleChange}
        />

        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-stone-700">
            Description & Program Schedule
          </label>
          <textarea
            name="description"
            rows="3"
            maxLength={5000}
            className="w-full text-sm bg-white border border-stone-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#D84315]"
            placeholder="Enter event agenda, activities, or instructions for Swayamsevaks..."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Schedule Event
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddEventModal;
