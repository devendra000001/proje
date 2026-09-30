import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { User, Lock, Phone, BookOpen, Award, Shield } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const BRANCH_OPTIONS = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'METALLURGY', 'CHEMICAL', 'ARCHITECTURE', 'MINING', 'OTHER'
];

const YEAR_OPTIONS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech', 'PhD', 'Alumni'
];

export const AddMemberModal = ({ isOpen, onClose, onMemberAdded }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'member',
    branch: 'CSE',
    academicYear: '1st Year',
    joiningYear: new Date().getFullYear(),
    interests: '',
    hobbies: '',
    skills: '',
    contactNumber: '',
    emergencyContact: '',
    additionalRemarks: '',
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
      const payload = {
        ...formData,
        joiningYear: Number(formData.joiningYear),
          interests: formData.interests ? formData.interests.split(',').map((s) => s.trim()).filter(Boolean) : [],
          hobbies: formData.hobbies ? formData.hobbies.split(',').map((s) => s.trim()).filter(Boolean) : [],
          skills: formData.skills ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      const res = await api.post('/members', payload);

      if (res.data.success) {
        addToast('New Swayamsevak member profile registered successfully!', 'success');
        onMemberAdded && onMemberAdded(res.data.member);
        onClose();
        // Reset form
        setFormData({
          fullName: '',
          username: '',
          password: '',
          role: 'member',
          branch: 'CSE',
          academicYear: '1st Year',
          joiningYear: new Date().getFullYear(),
          interests: '',
          hobbies: '',
          skills: '',
          contactNumber: '',
          emergencyContact: '',
          additionalRemarks: '',
        });
      }
    } catch (err) {
      console.error('[Add Member Error]', err);
      setErrorMsg(err.response?.data?.message || 'Failed to add member profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register New Swayamsevak Member" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full Name"
            name="fullName"
            required
            placeholder="e.g. Rahul Sharma"
            value={formData.fullName}
            onChange={handleChange}
          />

          <Input
            label="Username"
            name="username"
            type="text"
            required
            placeholder="e.g. rahulsharma"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Initial Password"
            name="password"
            type="password"
            required
            minLength={12}
            autoComplete="new-password"
            helperText="Use at least 12 characters. Share it with the member through a secure channel."
            placeholder="At least 12 characters"
            value={formData.password}
            onChange={handleChange}
          />

          <Select
            label="Access Role"
            name="role"
            options={[
              { value: 'member', label: 'Swayamsevak (Member)' },
              { value: 'admin', label: 'Shakha Adhikari (Admin)' },
            ]}
            value={formData.role}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Branch"
            name="branch"
            required
            options={BRANCH_OPTIONS}
            value={formData.branch}
            onChange={handleChange}
          />

          <Select
            label="Academic Year"
            name="academicYear"
            required
            options={YEAR_OPTIONS}
            value={formData.academicYear}
            onChange={handleChange}
          />

          <Input
            label="Joining Year"
            name="joiningYear"
            type="number"
            required
            min={1900}
            max={new Date().getFullYear() + 1}
            step={1}
            placeholder="2024"
            value={formData.joiningYear}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Number"
            name="contactNumber"
            placeholder="+91 9876543210"
            value={formData.contactNumber}
            onChange={handleChange}
          />

          <Input
            label="Emergency Contact"
            name="emergencyContact"
            placeholder="Parent/Guardian Contact"
            value={formData.emergencyContact}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Input
            label="Interests (Comma separated)"
            name="interests"
            placeholder="e.g. Yoga, Niyuddha, Music, Quiz"
            value={formData.interests}
            onChange={handleChange}
          />

          <Input
            label="Skills & Capabilities (Comma separated)"
            name="skills"
            placeholder="e.g. Web Dev, Public Speaking, Event Mgmt"
            value={formData.skills}
            onChange={handleChange}
          />

          <Input
            label="Hobbies (Comma separated)"
            name="hobbies"
            placeholder="e.g. Reading, Football, Chess"
            value={formData.hobbies}
            onChange={handleChange}
          />

          <Input
            label="Admin Internal Remarks (Protected)"
            name="additionalRemarks"
            placeholder="Internal shakha notes visible only to admins..."
            value={formData.additionalRemarks}
            onChange={handleChange}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <Button variant="ghost" onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Register Swayamsevak
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddMemberModal;
