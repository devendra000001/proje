import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Award,
  BookOpen,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EditMemberModal from '../components/members/EditMemberModal';

export const MemberDetailPage = () => {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();

  const [member, setMember] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [attendancePage, setAttendancePage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendanceError, setAttendanceError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchMemberData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [memberRes, attendanceResult] = await Promise.all([
        api.get(`/members/${id}`),
        api.get(`/members/${id}/attendance`, { params: { page: attendancePage, limit: 20 } }).then((response) => ({ response })).catch((error) => ({ error })),
      ]);

      if (memberRes.data.success) {
        setMember(memberRes.data.member);
        if (attendanceResult.response) {
          setAttendanceData(attendanceResult.response.data);
          setAttendanceError(null);
        } else {
          setAttendanceData(null);
          setAttendanceError(attendanceResult.error.response?.status === 403
            ? 'Attendance history is visible only to the member and administrators.'
            : 'Attendance history could not be loaded.');
        }
      } else {
        setError('Member profile not found');
      }
    } catch (err) {
      console.error('[Fetch Member Detail Error]', err);
      setError('Error fetching member profile detail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemberData();
  }, [id, attendancePage]);

  if (isLoading) return <Loader text="Fetching Swayamsevak Profile & History..." />;
  if (error) return <ErrorState message={error} onRetry={fetchMemberData} />;

  const isOwner = user?.memberProfile?._id === id;
  const canEdit = isAdmin || isOwner;

  const summary = attendanceData?.summary;
  const records = attendanceData?.records || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
          <Link
        to="/members"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D84315] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Swayamsevak Directory
      </Link>

      {/* Main Profile Card */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-stone-200 pb-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <img
              src={member?.profilePhotoUrl || 'https://avatar.iran.liara.run/public'}
              onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/avatar-default.svg'; }}
              alt={member?.fullName}
              className="w-20 h-20 rounded-full border-2 border-[#D84315] object-cover shrink-0"
            />
            <div>
              <h2 className="text-2xl font-bold text-stone-900 font-serif">
                {member?.fullName}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="kesari">{member?.branch}</Badge>
                <Badge variant="neutral">{member?.academicYear}</Badge>
                <Badge variant={member?.status === 'active' ? 'active' : 'inactive'}>
                  {member?.status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              icon={Edit}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Attendance Summary Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Attendance Rate
            </span>
            <div className="text-2xl font-bold text-[#D84315] mt-1">
              {summary ? `${summary.attendancePercentage}%` : '—'}
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Events Attended
            </span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">
              {summary ? `${summary.presentCount} / ${summary.totalMarked}` : '—'}
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 text-center">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
              Joining Year
            </span>
            <div className="text-2xl font-bold text-stone-800 mt-1">
              {member?.joiningYear}
            </div>
          </div>
        </div>

        {/* Profile Attributes & Privacy Alert */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Interests & Hobbies
              </h3>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {member?.interests?.length > 0 ? (
                  member.interests.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-orange-50 text-[#D84315] text-xs font-medium px-2.5 py-1 rounded border border-orange-100"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">None specified</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                Skills & Capabilities
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {member?.skills?.length > 0 ? (
                  member.skills.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-stone-100 text-stone-800 text-xs font-medium px-2.5 py-1 rounded border border-stone-200"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-stone-400">None specified</span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200 text-xs space-y-3">
            <div className="font-bold text-stone-800 border-b border-stone-200 pb-1.5 flex items-center justify-between">
              <span>Shakha Record Details</span>
              {!canEdit && (
                <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  <Lock className="w-3 h-3" /> Contact Masked (Privacy Protected)
                </span>
              )}
            </div>

            {member?.contactNumber ? (
              <div>
                <span className="text-stone-500 block">Contact Number:</span>
                <span className="font-medium text-stone-900">{member.contactNumber}</span>
              </div>
            ) : null}

            {member?.emergencyContact ? (
              <div>
                <span className="text-stone-500 block">Emergency Contact:</span>
                <span className="font-medium text-stone-900">{member.emergencyContact}</span>
              </div>
            ) : null}

            {member?.additionalRemarks ? (
              <div>
                <span className="text-stone-500 block">Admin Internal Remarks:</span>
                <p className="font-medium text-stone-900 bg-white p-2 rounded border border-stone-200 mt-1">
                  {member.additionalRemarks}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Event Attendance History Timeline */}
        <div className="pt-4 border-t border-stone-200 space-y-3">
          <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#D84315]" />
            Personal Event Attendance Record
          </h3>

          {attendanceError ? (
            <p className="text-sm text-stone-500">{attendanceError}</p>
          ) : records.length === 0 ? (
            <div className="bg-stone-50 border border-stone-200 rounded p-6 text-center text-xs text-stone-500">
              No recorded event attendance history for this Swayamsevak yet.
            </div>
          ) : (
            <div className="space-y-2">
              {records.map((rec) => (
                <div
                  key={rec._id}
                  className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded text-xs"
                >
                  <div className="flex items-center gap-3">
                    {rec.status === 'present' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-bold text-stone-900">
                        {rec.event?.name || 'Shakha Event'}
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {new Date(rec.event?.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  <Badge variant={rec.status === 'present' ? 'completed' : 'cancelled'} size="xs">
                    {rec.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {attendanceData?.pagination?.pages > 1 && <div className="flex items-center justify-between pt-3 text-xs text-stone-600">
            <span>Page {attendanceData.pagination.page} of {attendanceData.pagination.pages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" isDisabled={attendancePage <= 1} onClick={() => setAttendancePage((value) => value - 1)}>Previous</Button>
              <Button size="sm" variant="secondary" isDisabled={attendancePage >= attendanceData.pagination.pages} onClick={() => setAttendancePage((value) => value + 1)}>Next</Button>
            </div>
          </div>}
        </div>
      </div>

      {/* Edit Modal */}
      {canEdit && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          member={member}
          onMemberUpdated={fetchMemberData}
        />
      )}
    </div>
  );
};

export default MemberDetailPage;
