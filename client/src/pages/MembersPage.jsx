import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, Power, UserX, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { CardSkeleton } from '../components/common/Loader';
import AddMemberModal from '../components/members/AddMemberModal';
import EditMemberModal from '../components/members/EditMemberModal';

const BRANCH_OPTIONS = [
  'CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'METALLURGY', 'CHEMICAL', 'ARCHITECTURE', 'MINING', 'OTHER'
];

const YEAR_OPTIONS = [
  '1st Year', '2nd Year', '3rd Year', '4th Year', 'M.Tech', 'PhD', 'Alumni'
];

export const MembersPage = () => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deactivatingMember, setDeactivatingMember] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  const fetchMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        status: activeTab,
        page,
        limit: 20,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedBranch) params.branch = selectedBranch;
      if (selectedYear) params.academicYear = selectedYear;

      const res = await api.get('/members', { params });
      setMembers(res.data.members || []);
      setPagination(res.data.pagination || { page: 1, pages: 0, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load the member directory.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchTerm, selectedBranch, selectedYear]);

  useEffect(() => {
    const timer = setTimeout(fetchMembers, searchTerm ? 250 : 0);
    return () => clearTimeout(timer);
  }, [fetchMembers, searchTerm]);

  const handleStatusToggle = async () => {
    if (!deactivatingMember) return;
    const targetStatus = deactivatingMember.status === 'active' ? 'inactive' : 'active';
    setIsUpdatingStatus(true);
    try {
      const res = await api.patch(`/members/${deactivatingMember._id}/status`, {
        status: targetStatus,
      });

      if (res.data.success) {
        addToast(`Member status changed to ${targetStatus}`, 'success');
        setDeactivatingMember(null);
        fetchMembers();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update member status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setIsDeletingMember(true);
    try {
      await api.delete(`/members/${deletingMember._id}`);
      addToast('Member profile and attendance history deleted.', 'success');
      setDeletingMember(null);
      if (page > 1 && members.length === 1) setPage((value) => value - 1);
      else fetchMembers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete member profile.', 'error');
    } finally {
      setIsDeletingMember(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">
            Member Directory
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Directory of campus members, departments, skills, and interests.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Register Member
          </Button>
        )}
      </div>

      {/* Tabs (Active vs Inactive) */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => { setPage(1); setActiveTab('active'); }}
          className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-[#475569] text-slate-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Active Members
        </button>
        {isAdmin && (
          <button
          onClick={() => { setPage(1); setActiveTab('inactive'); }}
            className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'inactive'
                ? 'border-[#475569] text-slate-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Deactivated Members
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <div className="flex-1">
          <Input
            icon={Search}
            placeholder="Search by name, branch, skills, or interests..."
            value={searchTerm}
            onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            placeholder="All Branches"
            options={BRANCH_OPTIONS}
            value={selectedBranch}
            onChange={(e) => { setPage(1); setSelectedBranch(e.target.value); }}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            placeholder="All Years"
            options={YEAR_OPTIONS}
            value={selectedYear}
            onChange={(e) => { setPage(1); setSelectedYear(e.target.value); }}
          />
        </div>
      </div>

      {/* Directory Grid */}
      {isLoading ? (
        <div aria-busy="true" aria-label="Loading member directory" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <CardSkeleton key={index} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchMembers} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No Members found"
          description="No members match your current search and filter criteria."
          icon={UserX}
          actionLabel={isAdmin ? 'Add New Member' : undefined}
          onAction={isAdmin ? () => setIsAddModalOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m) => (
            <div
              key={m._id}
              className="bg-white border border-stone-200 rounded-lg p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <img
                      src={m.profilePhotoUrl || 'https://avatar.iran.liara.run/public'}
                      onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatar-default.svg'; }}
                      alt={m.fullName}
                      className="w-12 h-12 rounded-full border border-stone-200 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-stone-900 truncate">
                        {m.fullName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <Badge variant="neutral" size="xs">
                          {m.branch}
                        </Badge>
                        <span className="text-xs text-stone-500 font-medium">
                          {m.academicYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Quick Action Buttons */}
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingMember(m)}
                        className="p-1.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                        title="Edit Member"
                        aria-label={`Edit ${m.fullName}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeactivatingMember(m)}
                        className={`p-1.5 rounded hover:bg-stone-100 ${
                          m.status === 'active' ? 'text-stone-400 hover:text-rose-600' : 'text-emerald-600'
                        }`}
                        title={m.status === 'active' ? 'Deactivate Member' : 'Reactivate Member'}
                        aria-label={m.status === 'active' ? `Deactivate ${m.fullName}` : `Reactivate ${m.fullName}`}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingMember(m)}
                        className="rounded p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-700"
                        title="Permanently delete member"
                        aria-label={`Permanently delete ${m.fullName}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Skills / Interests Chips */}
                {m.interests && m.interests.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-1">
                      Interests
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {m.interests.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Joined {m.joiningYear}</span>
                <Link
                  to={`/members/${m._id}`}
                  className="font-semibold text-slate-700 hover:underline"
                >
                  View Profile & Record →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && pagination.pages > 1 && <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-600">
        <span>Showing page {pagination.page} of {pagination.pages} · {pagination.total} members</span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button size="sm" variant="secondary" isDisabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>}

      {/* Add Member Modal */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMemberAdded={() => { if (page === 1) fetchMembers(); else setPage(1); }}
      />

      {/* Edit Member Modal */}
      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        onMemberUpdated={fetchMembers}
      />

      {/* Confirm Deactivation Modal */}
      <ConfirmDialog
        isOpen={!!deactivatingMember}
        onClose={() => setDeactivatingMember(null)}
        onConfirm={handleStatusToggle}
        title={deactivatingMember?.status === 'active' ? 'Deactivate Member' : 'Reactivate Member'}
        message={
          deactivatingMember?.status === 'active'
            ? `Are you sure you want to deactivate ${deactivatingMember?.fullName}? Deactivated members will not be listed in standard directories.`
            : `Are you sure you want to reactivate ${deactivatingMember?.fullName}?`
        }
        confirmText={deactivatingMember?.status === 'active' ? 'Deactivate' : 'Reactivate'}
        isDanger={deactivatingMember?.status === 'active'}
        isLoading={isUpdatingStatus}
      />

      <ConfirmDialog
        isOpen={!!deletingMember}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteMember}
        title="Permanently delete member"
        message={`Delete ${deletingMember?.fullName || 'this member'} and their login account? This permanently removes their attendance history and cannot be undone.`}
        confirmText="Delete member and history"
        isDanger
        isLoading={isDeletingMember}
      />
    </div>
  );
};

export default MembersPage;
