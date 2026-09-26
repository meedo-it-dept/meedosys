'use client';

import React, { useState, useMemo } from 'react';
import { useMeedo } from '@/lib/store';
import {
  MarketCalendarEvent,
  MarketEventCategory,
  EventPriority,
  EventStatus,
} from '@/lib/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Search,
  Clock,
  MapPin,
  Shield,
  User,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  List,
  Columns,
  Grid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreateEventModal } from './CreateEventModal';
import { EventDetailModal } from './EventDetailModal';

export const MarketCalendarView: React.FC = () => {
  const { marketCalendarEvents, guards } = useMeedo();

  // Calendar State
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-09-26T00:00:00'));
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'agenda'>('month');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGuard, setSelectedGuard] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createInitialDate, setCreateInitialDate] = useState<string>('2026-09-26');
  const [selectedEvent, setSelectedEvent] = useState<MarketCalendarEvent | null>(null);

  // Month navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 1);
    }
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 1);
    }
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date('2026-09-26T00:00:00'));
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return marketCalendarEvents.filter((evt) => {
      if (selectedCategory !== 'All' && evt.category !== selectedCategory) return false;
      if (selectedGuard !== 'All' && evt.assigned_guard_id !== selectedGuard) return false;
      if (selectedPriority !== 'All' && evt.priority !== selectedPriority) return false;
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = evt.title.toLowerCase().includes(query);
        const matchesPersonnel = (evt.assigned_personnel || '').toLowerCase().includes(query);
        const matchesLocation = evt.location.toLowerCase().includes(query);
        if (!matchesTitle && !matchesPersonnel && !matchesLocation) return false;
      }
      return true;
    });
  }, [marketCalendarEvents, selectedCategory, selectedGuard, selectedPriority, searchTerm]);

  // Color helper for badges
  const getCategoryTheme = (cat: MarketEventCategory) => {
    switch (cat) {
      case 'Guard Duty':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          dot: 'bg-blue-600',
        };
      case 'Market Inspection':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
          dot: 'bg-purple-600',
        };
      case 'Cleaning':
        return {
          bg: 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
          dot: 'bg-teal-600',
        };
      case 'Maintenance':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
          dot: 'bg-amber-600',
        };
      case 'Meeting':
        return {
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
          dot: 'bg-indigo-600',
        };
      case 'Market Event':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          dot: 'bg-emerald-600',
        };
      case 'Security Activity':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          dot: 'bg-rose-600',
        };
      case 'Administrative Deadline':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
          dot: 'bg-red-600',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
          dot: 'bg-slate-600',
        };
    }
  };

  // Month days generation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: true,
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        dateStr,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Week days generation
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday start
    const startOfWeek = new Date(d.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      const dateStr = dayDate.toISOString().split('T')[0];
      days.push({
        date: dayDate,
        dateStr,
        dayName: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: dayDate.getDate(),
      });
    }
    return days;
  }, [currentDate]);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Calendar Control Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {monthYearLabel}
                </h1>
                <Badge variant="outline" className="text-xs font-semibold text-blue-700 bg-blue-50 border-blue-200">
                  Peace & Order Operations
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Centralized Market Operations, Guard Shifts & Multi-Sector Maintenance Calendar
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'month'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Grid className="h-3.5 w-3.5" /> Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'week'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Columns className="h-3.5 w-3.5" /> Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'day'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="h-3.5 w-3.5" /> Day
              </button>
              <button
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  viewMode === 'agenda'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="h-3.5 w-3.5" /> Agenda
              </button>
            </div>

            {/* Date Nav Buttons */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="h-9 w-9 p-0 rounded-xl"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-9 rounded-xl px-3 text-xs font-bold"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                className="h-9 w-9 p-0 rounded-xl"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Create Event Trigger */}
            <Button
              onClick={() => {
                setCreateInitialDate('2026-09-26');
                setIsCreateModalOpen(true);
              }}
              className="h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-blue-600/20 px-4"
            >
              <Plus className="h-4 w-4" /> Schedule Operation
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, guard, sector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="All">All Categories ({marketCalendarEvents.length})</option>
            <option value="Guard Duty">👮 Guard Duty</option>
            <option value="Market Inspection">🔍 Market Inspection</option>
            <option value="Cleaning">🧹 Cleaning / Flushing</option>
            <option value="Maintenance">🔧 Maintenance</option>
            <option value="Meeting">👥 Meetings</option>
            <option value="Market Event">🎪 Market Events</option>
            <option value="Security Activity">🚨 Security Activities</option>
            <option value="Administrative Deadline">⏰ Admin Deadlines</option>
          </select>

          {/* Guard Filter */}
          <select
            value={selectedGuard}
            onChange={(e) => setSelectedGuard(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="All">All Market Guards</option>
            {guards.map((g) => (
              <option key={g.guard_id} value={g.guard_id}>
                {g.guard_name} ({g.radio_call_sign || g.guard_id})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white"
          >
            <option value="All">All Priorities</option>
            <option value="Normal">🟢 Normal Priority</option>
            <option value="Important">🟡 Important Priority</option>
            <option value="Urgent">🔴 Urgent Priority</option>
          </select>
        </div>
      </div>

      {/* VIEW MODES */}

      {/* 1. MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
              <div key={d} className="py-2.5 text-xs font-bold uppercase tracking-wider text-slate-600">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {monthDays.map((item, idx) => {
              const dayEvents = filteredEvents.filter((e) => e.date === item.dateStr);
              const isToday = item.dateStr === '2026-09-26';

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCreateInitialDate(item.dateStr);
                  }}
                  className={`min-h-[120px] p-2 transition group flex flex-col justify-between ${
                    item.isCurrentMonth ? 'bg-white hover:bg-slate-50/70' : 'bg-slate-50/40 text-slate-400'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''}`}
                >
                  <div>
                    {/* Date Number Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isToday
                            ? 'bg-blue-600 text-white shadow-sm'
                            : item.isCurrentMonth
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {item.dayNumber}
                      </span>

                      {/* Hover Quick Add */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCreateInitialDate(item.dateStr);
                          setIsCreateModalOpen(true);
                        }}
                        className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
                        title="Add activity on this date"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Event Chips */}
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const theme = getCategoryTheme(evt.category);
                        return (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold cursor-pointer truncate shadow-xs transition ${theme.bg}`}
                            title={`${evt.title} (${evt.start_time}-${evt.end_time})`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${theme.dot}`} />
                            <span className="truncate">
                              {evt.start_time} {evt.title}
                            </span>
                          </div>
                        );
                      })}

                      {dayEvents.length > 3 && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentDate(new Date(item.dateStr));
                            setViewMode('day');
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline px-1 cursor-pointer"
                        >
                          +{dayEvents.length - 3} more activities
                        </div>
                      )}
                    </div>
                  </div>

                  {isToday && (
                    <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider text-right pt-1">
                      Today
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center divide-x divide-slate-200">
            {weekDays.map((wd) => {
              const isToday = wd.dateStr === '2026-09-26';
              return (
                <div
                  key={wd.dateStr}
                  className={`py-3 ${isToday ? 'bg-blue-50/60 font-bold text-blue-900' : 'text-slate-700'}`}
                >
                  <p className="text-xs uppercase tracking-wider text-slate-500">{wd.dayName}</p>
                  <p className="text-lg font-bold mt-0.5">{wd.dayNumber}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px]">
            {weekDays.map((wd) => {
              const dayEvents = filteredEvents.filter((e) => e.date === wd.dateStr);
              return (
                <div key={wd.dateStr} className="p-2 space-y-2 bg-slate-50/20">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-4 text-center text-xs text-slate-400 italic">
                      No events
                    </div>
                  ) : (
                    dayEvents.map((evt) => {
                      const theme = getCategoryTheme(evt.category);
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`rounded-xl border p-2.5 text-xs cursor-pointer shadow-xs transition hover:shadow-md ${theme.bg}`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="font-mono text-[10px] font-bold text-slate-600">
                              {evt.start_time} - {evt.end_time}
                            </span>
                            <span className={`h-2 w-2 rounded-full ${theme.dot}`} />
                          </div>
                          <p className="font-bold text-slate-900 line-clamp-2 leading-tight">
                            {evt.title}
                          </p>
                          {evt.assigned_personnel && (
                            <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1 truncate">
                              <User className="h-3 w-3" /> {evt.assigned_personnel}
                            </p>
                          )}
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {evt.location}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DAY VIEW */}
      {viewMode === 'day' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Daily Operations Agenda</span>
              <h2 className="text-xl font-bold text-slate-900">
                {currentDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h2>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setCreateInitialDate(currentDate.toISOString().split('T')[0]);
                setIsCreateModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add Task for This Day
            </Button>
          </div>

          {filteredEvents.filter((e) => e.date === currentDate.toISOString().split('T')[0]).length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600">No scheduled activities for this date.</p>
              <p className="text-xs text-slate-400 mt-1">Click "Schedule Operation" to assign a shift or inspection.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEvents
                .filter((e) => e.date === currentDate.toISOString().split('T')[0])
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((evt) => {
                  const theme = getCategoryTheme(evt.category);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 cursor-pointer transition hover:shadow-md ${theme.bg}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-xl bg-white border border-slate-200 p-2.5 text-center min-w-[85px] shadow-xs">
                          <span className="block text-xs font-bold font-mono text-slate-900">
                            {evt.start_time}
                          </span>
                          <span className="block text-[10px] text-slate-500 font-mono">
                            to {evt.end_time}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{evt.title}</span>
                            <Badge variant="outline" className="text-[10px] font-bold bg-white">
                              {evt.category}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="h-3.5 w-3.5 text-emerald-600" /> {evt.location}
                            </span>
                            {evt.assigned_personnel && (
                              <span className="flex items-center gap-1 font-semibold text-slate-800">
                                <Shield className="h-3.5 w-3.5 text-blue-600" /> {evt.assigned_personnel}
                                {evt.call_sign && ` (${evt.call_sign})`}
                              </span>
                            )}
                          </div>
                          {evt.special_instructions && (
                            <p className="text-xs text-slate-500 italic pt-0.5">
                              "{evt.special_instructions}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {evt.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* 4. AGENDA VIEW */}
      {viewMode === 'agenda' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upcoming Market Operations Schedule</h2>
              <p className="text-xs text-slate-500">
                Sorted chronological list of all scheduled events and roster shifts
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600">
              Total {filteredEvents.length} events
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredEvents
              .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
              .map((evt) => {
                const theme = getCategoryTheme(evt.category);
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-xl cursor-pointer transition"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="text-center min-w-[70px] rounded-lg bg-slate-100 py-1.5 px-2">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase">
                          {new Date(evt.date).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="block text-base font-extrabold text-slate-900 leading-none">
                          {new Date(evt.date).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{evt.title}</span>
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold border ${theme.bg}`}>
                            {evt.category}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {evt.start_time} - {evt.end_time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {evt.location}
                          </span>
                          {evt.assigned_personnel && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              <Shield className="h-3 w-3 text-blue-500" />
                              {evt.assigned_personnel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2.5 py-1">
                        {evt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Category Color Legend */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Operations Color Legend
        </span>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" /> Guard Duty
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Market Inspection
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-teal-600" /> Cleaning & Flushing
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-600" /> Maintenance
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" /> Meetings
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Market Events
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span className="h-2.5 w-2.5 rounded-full bg-red-600" /> Admin Deadlines
          </span>
        </div>
      </div>

      {/* Modals */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialDate={createInitialDate}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
