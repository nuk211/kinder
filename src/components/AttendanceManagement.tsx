'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChildAttendance {
  id: string;
  name: string;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  parentName: string;
}

interface AttendanceRecord {
  date: string;
  present: number;
  absent: number;
  total: number;
  checkIns: number;
  pickUps: number;
  children: ChildAttendance[];
}

interface AttendanceStats {
  dailyStats: AttendanceRecord[];
  weeklyAverage: number;
  monthlyAverage: number;
  totalStudents: number;
  presentChildren: ChildAttendance[];
}

const AttendanceManagement = () => {
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats>({
    dailyStats: [],
    weeklyAverage: 0,
    monthlyAverage: 0,
    totalStudents: 0,
    presentChildren: []
  });

  useEffect(() => {
    fetchAttendanceData();
    const interval = setInterval(fetchAttendanceData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/children/attendance?range=${dateRange}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }
      const data = await response.json();

      // Ensure all expected fields exist in the API response
      setStats({
        dailyStats: data.dailyStats || [],
        weeklyAverage: data.weeklyAverage || 0,
        monthlyAverage: data.monthlyAverage || 0,
        totalStudents: data.totalStudents || 0,
        presentChildren: data.presentChildren || []
      });
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Fallback to defaults in case of an error
      setStats({
        dailyStats: [],
        weeklyAverage: 0,
        monthlyAverage: 0,
        totalStudents: 0,
        presentChildren: []
      });
    } finally {
      setLoading(false);
    }
  };

  const today = stats.dailyStats.length > 0 ? stats.dailyStats[0] : {
    date: new Date().toISOString().split('T')[0],
    present: 0,
    absent: 0,
    total: 0,
    checkIns: 0,
    pickUps: 0,
    children: []
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Date Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Attendance Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded ${
              dateRange === 'week' ? 'bg-purple-600 text-white' : 'bg-gray-100'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded ${
              dateRange === 'month' ? 'bg-purple-600 text-white' : 'bg-gray-100'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Weekly Average</p>
          <p className="text-2xl font-bold">{stats.weeklyAverage}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Monthly Average</p>
          <p className="text-2xl font-bold">{stats.monthlyAverage}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow text-center">
          <p className="text-sm text-gray-500">Today</p>
          <p className="text-2xl font-bold">{today.present} Present</p>
        </div>
      </div>

      {/* Attendance Graph */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Attendance Trends</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value,
                  name.charAt(0).toUpperCase() + name.slice(1),
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#10B981" name="Present" strokeWidth={2} />
              <Line type="monotone" dataKey="absent" stroke="#EF4444" name="Absent" strokeWidth={2} />
              <Line type="monotone" dataKey="checkIns" stroke="#3B82F6" name="Check-ins" strokeWidth={2} />
              <Line type="monotone" dataKey="pickUps" stroke="#8B5CF6" name="Pick-ups" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Present Children List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Currently Present Children</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-in Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(stats.presentChildren || []).map((child) => (
                <tr key={child.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{child.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{child.parentName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {child.checkInTime ? new Date(child.checkInTime).toLocaleTimeString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        child.status === 'PRESENT'
                          ? 'bg-green-100 text-green-800'
                          : child.status === 'PICKUP_REQUESTED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {child.status ? child.status.replace('_', ' ') : 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
              {stats.presentChildren.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No children present at the moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManagement;
