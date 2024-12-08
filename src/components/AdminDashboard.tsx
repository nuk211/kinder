// src/components/AdminDashboard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Bell, Users, Calendar, Clock } from 'lucide-react';
import QRGenerator from '@/components/QRGenerator';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Child {
  id: string;
  name: string;
  parent: { 
    name: string;
    email: string;
    phoneNumber: string | null;
  } | null;
  status: string;
  checkInTime?: string;
  checkOutTime?: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  type: 'CHECK_IN' | 'PICK_UP';
  childName: string;
  parentName: string;
  timestamp: string;
}

interface AttendanceTrend {
  date: string;
  present: number;
  absent: number;
}

export interface Notification {
  id: string;
  message: string;
  type: 'CHECK_IN' | 'PICK_UP';
  read: boolean;
  timestamp: string;
}

interface DashboardStats {
  totalChildren: number;
  presentToday: number;
  pickupRequests: number;
  children: Child[];
  recentActivities: Activity[];
  attendanceTrend: AttendanceTrend[];
  presentChildren: {
    id: string;
    name: string;
    parentName: string;
    checkInTime: string | null;
  }[];
}

interface AdminDashboardProps {
  notifications: Notification[];
  onNotificationUpdate: (notifications: Notification[]) => void;
}

const initialStats: DashboardStats = {
  totalChildren: 0,
  presentToday: 0,
  pickupRequests: 0,
  children: [],
  recentActivities: [],
  attendanceTrend: [],
  presentChildren: [],
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  notifications,
  onNotificationUpdate
}) => {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();

      setStats({
        totalChildren: data.totalChildren ?? 0,
        presentToday: data.presentToday ?? 0,
        pickupRequests: data.pickupRequests ?? 0,
        children: data.children ?? [],
        recentActivities: data.recentActivities ?? [],
        attendanceTrend: data.attendanceTrend ?? [],
        presentChildren: data.presentChildren ?? [],
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-600 bg-red-50 rounded-lg">
        {error}
        <button 
          onClick={fetchDashboardData}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Total Children</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalChildren}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Present Today</p>
              <p className="text-2xl font-semibold text-green-600">{stats.presentToday}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-2">
            <Clock className="h-6 w-6 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-500">Pickup Requests</p>
              <p className="text-2xl font-semibold text-purple-600">{stats.pickupRequests}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div>
            <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
            <p className="text-2xl font-semibold text-yellow-600">
              {stats.totalChildren > 0 
                ? ((stats.presentToday / stats.totalChildren) * 100).toFixed(1)
                : '0'}%
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Attendance Trends</h3>
          {stats.attendanceTrend.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.attendanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()} 
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#10B981" name="Present" />
                  <Line type="monotone" dataKey="absent" stroke="#EF4444" name="Absent" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No attendance data available</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Activities</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">{activity.childName}</p>
                    <p className="text-sm text-gray-500">
                      {activity.type === 'CHECK_IN' ? 'Checked in' : 'Picked up'} by {activity.parentName}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent activities</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Present Children</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {stats.presentChildren.length > 0 ? (
            stats.presentChildren.map((child) => (
              <div
                key={child.id}
                className="flex items-center justify-between border-b pb-2"
              >
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-sm text-gray-500">Parent: {child.parentName}</p>
                  <p className="text-xs text-gray-400">
                    Check-in: {new Date(child.checkInTime ?? '').toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No children present</p>
          )}
        </div>
      </Card>

        <Card className="p-6">
          <QRGenerator schoolId="sunway" size={300} />
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
