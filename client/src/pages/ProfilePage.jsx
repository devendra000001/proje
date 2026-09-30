import React, { useState } from 'react';
import { User, Lock, Shield, BookOpen, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';

export const ProfilePage = () => {
  const { user, updateToken } = useAuth();
  const { addToast } = useToast();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const profile = user?.memberProfile;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (res.data.success) {
        if (res.data.token) updateToken(res.data.token);
        addToast('Password changed successfully!', 'success');
        setIsPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <img
              src={profile?.profilePhotoUrl || 'https://avatar.iran.liara.run/public'}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatar-default.svg'; }}
              alt={profile?.fullName || user?.name || user?.username}
              className="w-16 h-16 rounded-full border-2 border-[#D84315] object-cover shrink-0"
            />
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                {profile?.fullName || user?.name || user?.username}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                <Badge variant="kesari">{profile?.branch || 'VNIT'}</Badge>
                <Badge variant="neutral">{profile?.academicYear || 'Member'}</Badge>
                <Badge variant={user?.role === 'admin' ? 'admin' : 'member'}>
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Key}
            onClick={() => setIsPasswordModalOpen(true)}
          >
            Change Password
          </Button>
        </div>

        {/* Profile Attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Account
              </span>
              <div className="text-sm font-medium text-stone-800 flex items-center gap-2">
                <User className="w-4 h-4 text-stone-400" />
                {user?.username}
              </div>
              {user?.email && <div className="text-sm text-stone-500 mt-1">{user.email}</div>}
            </div>

            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Contact Number
              </span>
              <div className="text-sm font-medium text-stone-800">
                {profile?.contactNumber || 'Not provided'}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Emergency Contact
              </span>
              <div className="text-sm font-medium text-stone-800">
                {profile?.emergencyContact || 'Not provided'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Interests & Hobbies
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.interests?.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-orange-50 text-[#D84315] text-xs font-medium px-2.5 py-0.5 rounded border border-orange-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
                Skills & Technical Capabilities
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile?.skills?.map((item, idx) => (
                  <span
                    key={idx}
                    className="bg-stone-100 text-stone-800 text-xs font-medium px-2.5 py-0.5 rounded border border-stone-200"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            required
            icon={Lock}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />

          <Input
            label="New Password"
            type="password"
            required
            minLength={12}
            maxLength={72}
            autoComplete="new-password"
            icon={Lock}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <Button
              variant="ghost"
              onClick={() => setIsPasswordModalOpen(false)}
              isDisabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
