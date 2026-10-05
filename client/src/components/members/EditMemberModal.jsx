import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const BRANCH_OPTIONS = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'METALLURGY', 'CHEMICAL', 'ARCHITECTURE', 'MINING', 'OTHER'
];

const YEAR_OPTIONS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech', 'PhD', 'Alumni'
];

export const EditMemberModal = ({ isOpen, onClose, member, onMemberUpdated }) => {
  const { addToast } = useToast();
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    branch: 'CSE',
    academicYear: '1st Year',
    joiningYear: 2024,
    interests: '',
    hobbies: '',
    skills: '',
    contactNumber: '',
    emergencyContact: '',
    additionalRemarks: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName || '',
        branch: member.branch || 'CSE',
        academicYear: member.academicYear || '1st Year',
        joiningYear: member.joiningYear || 2024,
        interests: Array.isArray(member.interests) ? member.interests.join(', ') : '',
        hobbies: Array.isArray(member.hobbies) ? member.hobbies.join(', ') : '',
        skills: Array.isArray(member.skills) ? member.skills.join(', ') : '',
        contactNumber: member.contactNumber || '',
        emergencyContact: member.emergencyContact || '',
        additionalRemarks: member.additionalRemarks || '',
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!member) return;
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

      const res = await api.put(`/members/${member._id}`, payload);

      if (res.data.success) {
        addToast('Member profile updated successfully!', 'success');
        onMemberUpdated && onMemberUpdated(res.data.member);
        onClose();
      }
    } catch (err) {
      console.error('[Edit Member Error]', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update member profile.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Member Profile" maxWidth="max-w-2xl">
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
            value={formData.fullName}
            onChange={handleChange}
          />

          <Select
            label="Branch"
            name="branch"
            required
            options={BRANCH_OPTIONS}
            value={formData.branch}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            value={formData.joiningYear}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Number"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
          />

          <Input
            label="Emergency Contact"
            name="emergencyContact"
            value={formData.emergencyContact}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-3 pt-2">
          <Input
            label="Interests (Comma separated)"
            name="interests"
            value={formData.interests}
            onChange={handleChange}
          />

          <Input
            label="Skills & Capabilities (Comma separated)"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
          />

          <Input
            label="Hobbies (Comma separated)"
            name="hobbies"
            value={formData.hobbies}
            onChange={handleChange}
          />

          {isAdmin && (
            <Input
              label="Admin Internal Remarks (Protected)"
              name="additionalRemarks"
              value={formData.additionalRemarks}
              onChange={handleChange}
            />
          )}
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

export default EditMemberModal;
