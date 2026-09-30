import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Calendar,
  CheckCircle,
  UserX,
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import ErrorState from '../components/common/ErrorState';
import { CardSkeleton } from '../components/common/Loader';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/dashboard/stats');
      setStats({
        ...response.data.stats,
        upcomingEventItems: response.data.upcomingEventItems || [],
        completedEventItems: response.data.completedEventItems || [],
        recentRemarks: response.data.recentRemarks || [],
      });
    } catch (err) {
      console.error('[Dashboard Fetch Error]', err);
      setError('Unable to load dashboard data. Please check connection to backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div aria-busy="true" aria-label="Loading dashboard" className="space-y-6">
      <CardSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <CardSkeleton key={index} />)}</div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <CardSkeleton key={index} />)}</div>
    </div>;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchDashboardData} />;
  }

  const upcomingList = stats?.upcomingEventItems || [];
  const latestRemark = stats?.recentRemarks?.[0];
  const attendanceTotal = (stats?.attendancePresent || 0) + (stats?.attendanceAbsent || 0);
  const presentWidth = attendanceTotal ? ((stats.attendancePresent / attendanceTotal) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#D84315] font-semibold text-xs tracking-wider uppercase">
              Shakha Bulletin
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D84315]" />
            <span className="text-stone-500 text-xs">VNIT Nagpur Campus</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">
            Namaste, {user?.memberProfile?.fullName || 'Swayamsevak'} Ji
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Welcome to the official internal portal for managing RSS VNIT Shakha members, events, and attendance.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="kesari" size="md">
            {user?.memberProfile?.branch || 'VNIT'} • {user?.memberProfile?.academicYear || 'Member'}
          </Badge>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Swayamsevaks
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {stats?.totalMembers || 0}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
              Registered in Directory
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#D84315] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Active Status
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {stats?.activeMembers || 0}
            </div>
            <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
              Active Shakha Members
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Upcoming Events
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {stats?.upcomingEvents ?? 0}
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-0.5 block">
              Scheduled Shakha Events
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Completed Events
            </span>
            <div className="text-2xl font-bold text-stone-900 mt-1">
              {stats?.completedEvents ?? 0}
            </div>
            <span className="text-[11px] text-stone-600 font-medium mt-0.5 block">
              Preserved in History
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Inactive Members</span>
            <div className="text-2xl font-bold text-stone-900 mt-1">{stats?.inactiveMembers ?? 0}</div>
            <span className="text-[11px] text-stone-600 font-medium mt-0.5 block">Deactivated accounts</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center shrink-0"><UserX className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Main Grid: Upcoming Events & Recent Remarks */}
      <section className="rounded-lg border border-stone-200 bg-white p-5" aria-labelledby="attendance-overview-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 id="attendance-overview-heading" className="text-base font-bold text-stone-900 font-serif">Recorded attendance</h3>
          <span className="text-xs text-stone-500">{attendanceTotal} marks across all events</span>
        </div>
        {attendanceTotal === 0 ? <p className="mt-3 text-sm text-stone-500">No attendance has been recorded yet.</p> : <>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-rose-100" role="img" aria-label={`${stats.attendancePresent} present, ${stats.attendanceAbsent} absent`}>
            <div className="h-full bg-emerald-600 transition-all" style={{ width: `${presentWidth}%` }} />
            <div className="h-full flex-1 bg-rose-500" />
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs">
            <span className="font-medium text-emerald-800">Present · {stats.attendancePresent} ({presentWidth.toFixed(1)}%)</span>
            <span className="font-medium text-rose-800">Absent · {stats.attendanceAbsent} ({(100 - presentWidth).toFixed(1)}%)</span>
          </div>
        </>}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Upcoming Events Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#D84315]" />
              Upcoming Shakha Events
            </h3>
            <Link to="/events" className="text-xs font-semibold text-[#D84315] hover:underline flex items-center gap-1">
              View All Events <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <EmptyState
              title="No upcoming events scheduled"
              description="There are currently no upcoming Shakha events scheduled."
              icon={Calendar}
            />
          ) : (
            <div className="space-y-3">
              {upcomingList.map((ev) => (
                <div
                  key={ev._id}
                  className="bg-white border border-stone-200 border-l-4 border-l-[#D84315] rounded-r-lg p-4 shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="upcoming">UPCOMING</Badge>
                      <span className="text-xs font-semibold text-stone-500">
                        {new Date(ev.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-stone-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {ev.startTime} - {ev.endTime}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-stone-900 mb-1">{ev.name}</h4>
                  <p className="text-xs text-stone-600 line-clamp-2 mb-3">{ev.description}</p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                    <span className="flex items-center gap-1 text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-[#D84315]" />
                      {ev.venue}
                    </span>
                    <Link
                      to={`/events/${ev._id}`}
                      className="font-semibold text-[#D84315] hover:underline flex items-center gap-1"
                    >
                      Details & Attendance <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Preserved Remarks Summary Widget */}
        <div className="space-y-4">
          <div className="border-b border-stone-200 pb-3">
            <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D84315]" />
              Recent Event Remarks
            </h3>
          </div>

          {latestRemark ? (
            <div className="bg-white border border-stone-200 rounded-lg p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <span className="text-xs font-bold text-stone-900 truncate">
                  {latestRemark.event?.name || 'Completed event'}
                </span>
                <Badge variant="completed" size="xs">COMPLETED</Badge>
              </div>
              <p className="text-xs text-stone-600 italic bg-stone-50 p-2.5 rounded border border-stone-100">
                "{latestRemark.overallRemark}"
              </p>
              <Link
                to={`/events/${latestRemark.event?._id}`}
                className="text-xs font-semibold text-[#D84315] hover:underline block text-right"
              >
                View Full Event Report & Remarks →
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-stone-200 rounded-lg p-6 text-center text-stone-500 text-xs">
              No post-event reports have been recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
