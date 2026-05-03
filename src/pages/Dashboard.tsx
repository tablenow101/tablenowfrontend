import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { dashboardAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Phone, Calendar, Users, Clock, TrendingUp, TrendingDown,
  ChevronRight, Copy, ArrowUpRight, Zap, Star, BarChart2,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CallLog {
  id: string;
  caller_number?: string;
  status: 'completed' | 'missed' | 'failed' | 'in_progress';
  duration?: number;
  created_at?: string;
  started_at?: string;
}

interface Booking {
  id: string;
  guest_name?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  booking_time?: string;
  party_size?: number;
  covers?: number;
  occasion?: string;
  table?: string;
  booked_for?: string;
  booking_date?: string;
}

interface DashboardStats {
  bookings: {
    total: number;
    confirmed: number;
    cancelled: number;
    totalGuests: number;
    change?: number;
    guestsChange?: number;
  };
  calls: {
    total: number;
    successful: number;
    avgDuration: number;
    change?: number;
    durationChange?: number;
  };
  recent: {
    bookings: Booking[];
    calls: CallLog[];
  };
  pacing?: number;
  turnoverRate?: number;
  vipsTonight?: number;
}

type DateRange = 'today' | '7d' | '30d' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m${s.toString().padStart(2, '0')}s` : `${m}m`;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function buildDateParams(range: DateRange): Record<string, string> {
  const today = getTodayISO();
  if (range === 'today') return { dateRange: range, startDate: today, endDate: today };
  if (range === 'all') return { dateRange: range };
  const days = range === '7d' ? 7 : 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  return { dateRange: range, startDate: start.toISOString().split('T')[0], endDate: today };
}

interface PeakResult {
  hour: number;
  count: number;
  buckets: number[];
}

function computePeakHour(calls: CallLog[]): PeakResult | null {
  if (!calls.length) return null;
  const buckets = new Array(24).fill(0) as number[];
  for (const c of calls) {
    const ts = c.created_at ?? c.started_at;
    if (ts) buckets[new Date(ts).getHours()]++;
  }
  const max = Math.max(...buckets);
  if (max === 0) return null;
  return { hour: buckets.indexOf(max), count: max, buckets };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  change?: number;
  icon: React.ElementType;
  href: string;
  accent?: boolean;
}

const StatCard = React.memo(function StatCard({
  label, value, sub, change, icon: Icon, href, accent = false,
}: StatCardProps) {
  const positive = change !== undefined && change >= 0;
  return (
    <Link to={href} className="group block">
      <div className={[
        'relative overflow-hidden rounded-2xl border p-5 h-28 transition-all duration-200',
        'hover:border-green-500/40 hover:shadow-[0_0_24px_rgba(34,197,94,0.08)]',
        accent ? 'bg-green-500/10 border-green-500/20' : 'bg-[#111] border-[#1f1f1f]',
      