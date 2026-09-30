import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Plus,
  ArrowRight,
  Search,
  Edit,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import AddEventModal from '../components/events/AddEventModal';
import EditEventModal from '../components/events/EditEventModal';
import { CardSkeleton } from '../components/common/Loader';

export const EventsPage = ({ initialStatus = 'upcoming', attendanceView = false }) => {
  const { isAdmin } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { status: activeTab, page, limit: 20 };
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/events', { params });
      setEvents(res.data.events || []);
      setPagination(res.data.pagination || { page: 1, pages: 0, total: 0 });
    } catch (err) {
      console.error('[Fetch Events Error]', err);
      setError('Failed to load Shakha events calendar.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(fetchEvents, searchTerm ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchEvents, searchTerm]);

  useEffect(() => {
    setPage(1);
    setActiveTab(initialStatus);
  }, [initialStatus]);

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/events/${deletingEvent._id}`);
      if (res.data.success) {
        addToast('Event deleted successfully', 'success');
        setDeletingEvent(null);
        fetchEvents();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete event', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 font-serif">
            {attendanceView ? 'Attendance Management' : activeTab === 'completed' ? 'Event History & Reports' : 'Shakha Events & History'}
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Chronological calendar of upcoming Shakha events and preserved event history.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            Schedule Shakha Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => { setPage(1); setActiveTab('upcoming'); }}
          className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'upcoming'
              ? 'border-[#D84315] text-[#D84315]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Upcoming Events
        </button>
        <button
          onClick={() => { setPage(1); setActiveTab('completed'); }}
          className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'completed'
              ? 'border-[#D84315] text-[#D84315]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Event History & Reports
        </button>
        <button
          onClick={() => { setPage(1); setActiveTab('cancelled'); }}
          className={`pb-2.5 px-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === 'cancelled' ? 'border-[#D84315] text-[#D84315]' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
        >Cancelled</button>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs">
        <Input
          icon={Search}
          placeholder="Search events by name, venue, or description..."
          value={searchTerm}
          onChange={(e) => { setPage(1); setSearchTerm(e.target.value); }}
        />
      </div>

      {/* Events List */}
      {isLoading ? (
        <div aria-busy="true" aria-label="Loading events" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <CardSkeleton key={index} />)}</div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchEvents} />
      ) : events.length === 0 ? (
        <EmptyState
          title={activeTab === 'upcoming' ? 'No upcoming events scheduled' : activeTab === 'cancelled' ? 'No cancelled events' : 'No past event history'}
          description={
            activeTab === 'upcoming'
              ? 'There are currently no upcoming events scheduled on the calendar.'
              : activeTab === 'cancelled' ? 'No cancelled events are recorded.' : 'No completed events have been recorded in history yet.'
          }
          icon={Calendar}
          actionLabel={isAdmin ? 'Schedule Event' : undefined}
          onAction={isAdmin ? () => setIsAddModalOpen(true) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {events.map((ev) => (
            <div
              key={ev._id}
              className={`bg-white border border-stone-200 rounded-lg p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                ev.status === 'upcoming' ? 'border-l-4 border-l-[#D84315]' : ev.status === 'completed' ? 'border-l-4 border-l-emerald-600 bg-stone-50/50' : 'border-l-4 border-l-rose-500 bg-rose-50/30'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={ev.status}>
                    {ev.status.toUpperCase()}
                  </Badge>
                  <span className="text-xs font-semibold text-stone-500">
                    {new Date(ev.date).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-900">{ev.name}</h3>
                <p className="text-xs text-stone-600 line-clamp-2">{ev.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {ev.startTime} - {ev.endTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D84315]" />
                    {ev.venue}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isAdmin && (
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      onClick={() => setEditingEvent(ev)}
                      className="p-1.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                      title="Edit Event"
                      aria-label={`Edit ${ev.name}`}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingEvent(ev)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-100"
                      title="Delete Event"
                      aria-label={`Delete ${ev.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <Link to={`/events/${ev._id}`}>
                  <Button
                    size="sm"
                    variant={ev.status === 'upcoming' ? 'primary' : 'secondary'}
                    icon={ArrowRight}
                  >
                    {attendanceView ? 'Manage Attendance' : ev.status === 'completed' ? 'View History & Report' : 'View Event Details'}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && pagination.pages > 1 && <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white p-3 text-xs text-stone-600">
        <span>Showing page {pagination.page} of {pagination.pages} · {pagination.total} events</span>
        <div className="flex gap-2"><Button size="sm" variant="secondary" isDisabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><Button size="sm" variant="secondary" isDisabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button></div>
      </div>}

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEventAdded={() => { if (page === 1) fetchEvents(); else setPage(1); }}
      />

      {/* Edit Event Modal */}
      <EditEventModal
        isOpen={!!editingEvent}
        onClose={() => setEditingEvent(null)}
        event={editingEvent}
        onEventUpdated={fetchEvents}
      />

      {/* Confirm Delete Event Modal */}
      <ConfirmDialog
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDeleteEvent}
        title="Delete Shakha Event"
        message={`Are you sure you want to delete "${deletingEvent?.name}"? All associated attendance logs will also be permanently deleted.`}
        confirmText="Delete Event"
        isDanger={true}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventsPage;
