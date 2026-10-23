import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDatabase } from '../../context/DatabaseContext';
import { CalendarEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Check,
  X,
  HelpCircle,
  Users,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Compass,
  Gamepad2,
  Utensils,
  Sparkles,
  Trash2,
} from 'lucide-react';

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  trip: {
    label: 'Road Trip & Stays',
    icon: <Compass className="w-3.5 h-3.5 text-cyan-400" />,
    color: 'bg-cyan-950/60 text-cyan-300 border-cyan-500/30',
  },
  celebration: {
    label: 'Celebration & Party',
    icon: <PartyPopper className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30',
  },
  gaming: {
    label: 'Gaming & Sports',
    icon: <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />,
    color: 'bg-purple-950/60 text-purple-300 border-purple-500/30',
  },
  dining: {
    label: 'Dinner & Social',
    icon: <Utensils className="w-3.5 h-3.5 text-amber-400" />,
    color: 'bg-amber-950/60 text-amber-300 border-amber-500/30',
  },
  hangout: {
    label: 'Boys Hangout',
    icon: <Sparkles className="w-3.5 h-3.5 text-blue-400" />,
    color: 'bg-blue-950/60 text-blue-300 border-blue-500/30',
  },
};

export const CircleCalendar: React.FC = () => {
  const { currentUser, users, getUserById } = useAuth();
  const { events, addCalendarEvent, updateEventRsvp, clearAllEvents } = useDatabase();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [showAddModal, setShowAddModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-10-28');
  const [time, setTime] = useState('19:30');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CalendarEvent['category']>('celebration');

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Days in month calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Submit event
  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;

    addCalendarEvent({
      title: title.trim(),
      date,
      time,
      location: location.trim() || 'Undisclosed Location',
      description: description.trim(),
      category,
      createdById: currentUser?.id || 'pranshul',
      rsvps: currentUser ? { [currentUser.id]: 'attending' } : {},
    });

    setTitle('');
    setLocation('');
    setDescription('');
    setShowAddModal(false);
  };

  // Sort upcoming events
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const filteredEvents = selectedDateFilter
    ? sortedEvents.filter((e) => e.date === selectedDateFilter)
    : sortedEvents;

  return (
    <div className="flex-1 bg-[#0b0f14] overflow-y-auto p-4 sm:p-6 text-neutral-200">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111920] border border-neutral-800 p-6 rounded-2xl">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-emerald-400" />
              <span>Master Boys Group Calendar</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Sync upcoming road trips, gaming nights, and RSVP votes across all 6 members.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {events.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="py-2.5 px-3.5 bg-neutral-800 hover:bg-rose-950/80 hover:text-rose-400 text-neutral-400 border border-neutral-700/80 hover:border-rose-500/40 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear all events"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Plan Event</span>
            </button>
          </div>
        </div>

        {/* 2-Column Split: Visual Month Grid & Events List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Calendar Grid (5 cols) */}
          <div className="lg:col-span-5 bg-[#111920] border border-neutral-800 rounded-2xl p-5 shadow-lg">
            {/* Month Navigator */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white font-mono">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg bg-[#142028] hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg bg-[#142028] hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-mono text-neutral-500 mb-2">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-xs">
              {/* Blank days before month start */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`blank-${i}`} className="h-10 rounded-lg bg-transparent" />
              ))}

              {/* Days of month */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                  dayNum
                ).padStart(2, '0')}`;
                const dayEvents = events.filter((e) => e.date === formattedDateStr);
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDateFilter === formattedDateStr;

                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      if (selectedDateFilter === formattedDateStr) {
                        setSelectedDateFilter(null);
                      } else {
                        setSelectedDateFilter(formattedDateStr);
                      }
                    }}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600/30 border-emerald-500 text-white shadow-sm'
                        : hasEvents
                        ? 'bg-[#18262f] border-emerald-500/40 text-emerald-200 hover:bg-[#1f313d]'
                        : 'bg-[#0d1419] border-transparent text-neutral-400 hover:bg-[#141e26] hover:text-neutral-200'
                    }`}
                  >
                    <span className="font-mono text-[11px] font-medium">{dayNum}</span>
                    {hasEvents && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDateFilter && (
              <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
                <span className="text-neutral-400">
                  Filtered by date:{' '}
                  <strong className="text-emerald-400 font-mono">{selectedDateFilter}</strong>
                </span>
                <button
                  onClick={() => setSelectedDateFilter(null)}
                  className="text-neutral-500 hover:text-white underline text-[11px]"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Events Timeline & Interactive RSVPs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Master Boys Events ({filteredEvents.length})
              </h2>
              <span className="text-[11px] text-neutral-400">
                Click RSVP to register your attendance
              </span>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-[#111920] border border-neutral-800 rounded-2xl p-8 text-center">
                <CalendarIcon className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                <div className="text-sm font-semibold text-white">No Events Scheduled</div>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  The Master Boys calendar is currently clean. Click &ldquo;Plan Event&rdquo; to add a new trip, match, or hangout.
                </p>
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const creator = getUserById(evt.createdById);
                const currentVote = currentUser ? evt.rsvps[currentUser.id] : undefined;
                const meta = CATEGORY_META[evt.category] || CATEGORY_META.celebration;

                // Member attendance summary
                const attendingCount = Object.values(evt.rsvps).filter(
                  (v) => v === 'attending'
                ).length;
                const declinedCount = Object.values(evt.rsvps).filter(
                  (v) => v === 'declined'
                ).length;

                return (
                  <div
                    key={evt.id}
                    className="bg-[#111920] border border-neutral-800 rounded-2xl p-5 space-y-4 shadow-md transition-all hover:border-neutral-700"
                  >
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border font-mono ${meta.color}`}
                          >
                            {meta.icon}
                            <span>{meta.label}</span>
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            By {creator?.name}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {evt.title}
                        </h3>
                      </div>

                      {/* Date Badge */}
                      <div className="p-2 rounded-xl bg-[#142028] border border-neutral-800 text-center shrink-0">
                        <div className="text-[10px] text-emerald-400 font-mono uppercase">
                          {new Date(evt.date).toLocaleDateString([], { month: 'short' })}
                        </div>
                        <div className="text-base font-bold font-mono text-white">
                          {new Date(evt.date).getDate()}
                        </div>
                      </div>
                    </div>

                    {/* Meta: Time & Location */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{evt.location}</span>
                      </div>
                    </div>

                    {/* Description */}
                    {evt.description && (
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans bg-[#0c1217] p-3 rounded-xl border border-neutral-800/80">
                        {evt.description}
                      </p>
                    )}

                    {/* Interactive RSVP Action Toggle for Logged-In User */}
                    <div className="pt-2 border-t border-neutral-800/80">
                      <div className="text-[11px] font-medium text-neutral-400 mb-2">
                        Your RSVP Vote ({currentUser?.name}):
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateEventRsvp(evt.id, 'attending')}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            currentVote === 'attending'
                              ? 'bg-emerald-600 text-white shadow-md'
                              : 'bg-[#142028] text-neutral-300 hover:bg-[#1a2b36]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>I&apos;m Attending</span>
                        </button>

                        <button
                          onClick={() => updateEventRsvp(evt.id, 'tentative')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            currentVote === 'tentative'
                              ? 'bg-amber-600 text-white shadow-md'
                              : 'bg-[#142028] text-neutral-300 hover:bg-[#1a2b36]'
                          }`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Maybe</span>
                        </button>

                        <button
                          onClick={() => updateEventRsvp(evt.id, 'declined')}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            currentVote === 'declined'
                              ? 'bg-rose-600 text-white shadow-md'
                              : 'bg-[#142028] text-neutral-300 hover:bg-[#1a2b36]'
                          }`}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>I&apos;m Out</span>
                        </button>
                      </div>
                    </div>

                    {/* 6 Friends Roster Attendance Breakdown */}
                    <div className="bg-[#0c1217] p-3 rounded-xl border border-neutral-800/80 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-neutral-400 font-medium">Circle Responses</span>
                        <span className="font-mono text-emerald-400">
                          {attendingCount} Attending · {declinedCount} Out
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {users.map((u) => {
                          const vote = evt.rsvps[u.id];
                          return (
                            <div
                              key={u.id}
                              className="p-1.5 rounded-lg bg-[#111920] border border-neutral-800 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <div
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                                  style={{ backgroundColor: u.avatarColor }}
                                >
                                  {u.initials}
                                </div>
                                <span className="truncate text-neutral-200 text-[11px]">
                                  {u.name}
                                </span>
                              </div>

                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                                  vote === 'attending'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : vote === 'declined'
                                    ? 'bg-rose-950 text-rose-400'
                                    : vote === 'tentative'
                                    ? 'bg-amber-950 text-amber-400'
                                    : 'text-neutral-500'
                                }`}
                              >
                                {vote ? vote.slice(0, 3).toUpperCase() : 'WAIT'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Plan Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#111920] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#16212a]">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                <span>Plan Circle Event</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Goa Coastal Road Trip, Diwali Poker"
                  className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 font-medium mb-1.5">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Location / Venue
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pranshul's Terrace, North Goa Airbnb"
                  className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CalendarEvent['category'])}
                  className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="celebration">Celebration &amp; Party</option>
                  <option value="trip">Road Trip &amp; Travel</option>
                  <option value="gaming">Gaming &amp; Sports</option>
                  <option value="dining">Dinner &amp; Social</option>
                  <option value="hangout">Circle Hangout</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-300 font-medium mb-1.5">
                  Description &amp; Circle Agenda
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, car pooling, equipment, or instructions..."
                  className="w-full bg-[#0a0f14] border border-neutral-700 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear All Events Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#111920] border border-neutral-800 rounded-2xl shadow-2xl p-6 text-xs text-neutral-200">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear All Calendar Events?</span>
            </h3>
            <p className="text-neutral-400 mb-4 leading-relaxed">
              This will permanently delete all scheduled events from the Master Boys calendar.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-medium flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearAllEvents();
                  setShowClearConfirm(false);
                }}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex-1 transition-colors cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
