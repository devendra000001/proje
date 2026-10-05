import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  Sparkles,
  AlertCircle,
  Lightbulb,
  Users,
  Edit,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import EditEventModal from '../components/events/EditEventModal';
import AttendancePanel from '../components/events/AttendancePanel';
import EventRemarkForm from '../components/events/EventRemarkForm';

export const EventDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();

  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchEventDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        setEventData(res.data);
      } else {
        setError('Event details not found');
      }
    } catch (err) {
      console.error('[Fetch Event Detail Error]', err);
      setError('Error fetching event details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetail();
  }, [id]);

  if (isLoading) return <Loader text="Loading Event Details & Preserved Remarks..." />;
  if (error) return <ErrorState message={error} onRetry={fetchEventDetail} />;

  const { event, remark, attendanceStats } = eventData || {};

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link
        to="/events"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events Calendar
      </Link>

      {/* Main Event Header Card */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={event?.status || 'neutral'}>
                {event?.status?.toUpperCase()}
              </Badge>
              <span className="text-xs font-semibold text-stone-500">
                {new Date(event?.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 font-serif">{event?.name}</h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                icon={Edit}
                onClick={() => setIsEditModalOpen(true)}
              >
                Edit Event
              </Button>
            </div>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50 p-4 rounded-lg border border-stone-200">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Time: {event?.startTime} - {event?.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
            <span>Venue: {event?.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Attendance: {attendanceStats?.totalPresent || 0} Present / {attendanceStats?.totalMarked || 0} Marked
            </span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
            Description & Agenda
          </h3>
          <p className="text-sm text-stone-700 leading-relaxed bg-white border border-stone-200 p-4 rounded-lg">
            {event?.description || 'No description provided.'}
          </p>
        </div>

        {/* Preserved Post-Event Remarks Section */}
        <div className="pt-4 border-t border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-700" />
              Preserved Post-Event Report & Remarks
            </h3>
          </div>

          {!remark ? (
            <div className="bg-stone-50 border border-stone-200 rounded p-6 text-center text-xs text-stone-500">
              {event?.status === 'completed'
                ? 'No post-event report has been submitted for this completed event yet.'
                : 'Post-event remarks can be recorded after the event is completed.'}
            </div>
          ) : (
            <div className="bg-stone-50/70 border border-stone-200 rounded-lg p-5 space-y-4">
              {/* Overall Summary */}
              {remark.overallRemark && (
                <div>
                  <span className="text-xs font-bold text-stone-500 uppercase tracking-wider block mb-1">
                    Overall Event Summary
                  </span>
                  <p className="text-sm font-medium text-stone-800 bg-white p-3 rounded border border-stone-200">
                    "{remark.overallRemark}"
                  </p>
                </div>
              )}

              {/* 3 Structured Point Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    What Went Well
                  </div>
                  <p className="text-emerald-800 leading-relaxed">
                    {remark.whatWentWell || 'No specific notes'}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                    What Could Be Improved
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {remark.whatCouldBeImproved || 'No specific notes'}
                  </p>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                    <Lightbulb className="w-4 h-4 text-blue-600 shrink-0" />
                    Suggestions for Next Time
                  </div>
                  <p className="text-blue-800 leading-relaxed">
                    {remark.suggestionsNextTime || 'No specific notes'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-3 text-xs text-stone-600">
                <span>Present: {attendanceStats?.totalPresent ?? 0} · Absent: {attendanceStats?.totalAbsent ?? 0}</span>
                <span>Recorded by: {remark.recordedBy?.memberProfile?.fullName || (remark.recordedBy?.role === 'admin' ? 'Administrator' : 'Member')} · {remark.createdAt ? new Date(remark.createdAt).toLocaleDateString('en-IN') : 'Date unavailable'}</span>
              </div>
            </div>
          )}
          {isAdmin && event?.status === 'completed' && (
            <EventRemarkForm eventId={event._id} remark={remark} onSaved={fetchEventDetail} />
          )}
        </div>
      </div>

      {isAdmin && <AttendancePanel eventId={event?._id} onUpdated={fetchEventDetail} />}

      {/* Edit Event Modal */}
      {isAdmin && (
        <EditEventModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          event={event}
          onEventUpdated={fetchEventDetail}
        />
      )}
    </div>
  );
};

export default EventDetailPage;
