'use client';

import { useEffect, useState } from 'react';
import { 
  Bell, 
  Users, 
  Calendar, 
  Clock, 
  Loader2, 
  ArrowUpCircle, 
  ArrowDownCircle,
  CheckCircle,
  Info,
  Filter,
  RefreshCw 
} from 'lucide-react';
import QRGenerator from '@/components/QRGenerator';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';


interface AdminDashboardProps {
  language?: 'en' | 'ar';
}

const translations = {
  en: {
    dashboard: "Dashboard",
    children: "Children",
    attendance: "Attendance",
    parents: "Parents",
    switchLanguage: "العربية",
    notificationTitle: "Notifications",
    clearAll: "Clear All",
    markAllAsRead: "Mark all as read",
    noNotifications: "No notifications",
    checkedIn: "checked in",
    parentqr: "Parents can scan this QR code to check in/out their children",
    pickedUp: "picked up",
    by: "by",
    present: "Present Children",
    recent: "Recent Activities",
    // Added missing translations
    dashboardOverview: "Dashboard Overview",
    recentActivities: "Recent Activities",
    pickedUpBy: "Picked up by",
    presentChildren: "Present Children",
    checkInQRCode: "Check-in QR Code",
    totalChildren: "Total Children",
    activeChildren: "Active Children",
    totalParents: "Total Parents",
    todayAttendance: "Today's Attendance",
    generateQR: "Generate QR Code",
    scanQR: "Scan QR Code",
    pickupRequests: "Pickup Requests",
    attendanceHistory: "Attendance History",
    viewAll: "View All",
    status: "Status",
    unread: "Unread Notifications",
    time: "Time",
    date: "Date",
    refresh: "Refresh",
    actions: "Actions"
  },
  ar: {
    dashboard: "لوحة التحكم",
    children: "الأطفال",
    attendance: "الحضور والانصراف",
    parents: "أولياء الأمور",
    switchLanguage: "English",
    notificationTitle: "الإشعارات",
    clearAll: "مسح الكل",
    refresh: "تحديث",
    markAllAsRead: "تعليم الكل كمقروء",
    parentqr: "يمكن للوالدين مسح رمز الاستجابة السريعة هذا لتسجيل دخول/خروج أطفالهم",
    noNotifications: "لا توجد إشعارات",
    checkedIn: "تم تسجيل حضور",
    pickedUp: "تم استلام",
    unread: "اشعارات غير مقروئة",
    pickupRequests: "طلبات استلام الاطفال",
    by: "بواسطة",
    present: "الأطفال الحاضرون",
    recent: "النشاطات الأخيرة",
    // Added missing translations
    dashboardOverview: "نظرة عامة على لوحة التحكم",
    recentActivities: "النشاطات الأخيرة",
    pickedUpBy: "تم الاستلام بواسطة",
    presentChildren: "الأطفال الحاضرون",
    checkInQRCode: "رمز QR للحضور",
    totalChildren: "إجمالي الأطفال",
    activeChildren: "الأطفال النشطون",
    totalParents: "إجمالي أولياء الأمور",
    todayAttendance: "الحضور اليوم",
    generateQR: "إنشاء رمز QR",
    scanQR: "مسح رمز QR",
    attendanceHistory: "سجل الحضور",
    viewAll: "عرض الكل",
    status: "الحالة",
    time: "الوقت",
    date: "التاريخ",
    actions: "الإجراءات"
  }
};
interface Child {
  id: string;
  name: string;
  parent: { 
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  status: 'ABSENT' | 'PRESENT' | 'PICKUP_REQUESTED' | 'PICKED_UP';
  qrCode: string;
  updatedAt: string;
}

interface Activity {
  id: string;
  childId: string;
  childName: string;
  parentName: string;
  status: 'PRESENT' | 'ABSENT';
  checkInTime: string | null;
  checkOutTime: string | null;
  timestamp: string;
}

interface Notification {
  id: string;
  message: string;
  type: 'CHECK_IN' | 'PICK_UP';
  read: boolean;
  childId: string;
  child: {
    name: string;
  };
  parentId: string;
  parent: {
    name: string;
  };
  timestamp: string;
}

interface DashboardStats {
  totalChildren: number;
  presentToday: number;
  pickupRequests: number;
  children: Child[];
  recentActivities: Activity[];
  presentChildren: {
    id: string;
    name: string;
    parentName: string;
    checkInTime: string | null;
  }[];
}

const AdminDashboard = ({ language = 'en' }: AdminDashboardProps) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalChildren: 0,
    presentToday: 0,
    pickupRequests: 0,
    children: [],
    recentActivities: [],
    presentChildren: [],
  });

  const t = translations[language];

  

  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'CHECK_IN' | 'PICK_UP'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      
      const data = await response.json();
      setLastUpdate(new Date());
      setStats(data);
      setError(null);
    } catch (error) {
      console.error('Dashboard error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Notifications error:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      
      if (response.ok) {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => 
    notificationFilter === 'all' ? true : n.type === notificationFilter
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center">
            <Info className="h-5 w-5 mr-2" />
            {error}
          </div>
          <Button 
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className="ml-4"
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
        <h1 className="text-3xl font-bold text-gray-900">{t.dashboardOverview}</h1>
          <p className="text-gray-500 mt-1">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            size="sm"
            className={`transition-all duration-300 ${isRefreshing ? 'opacity-50' : ''}`}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            {t.refresh}
          </Button>

          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Notifications</h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all read
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearNotifications}
                      className="text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </Button>
                  </div>
                </div>

                <div className="flex space-x-2 mb-2">
                  <Button
                    variant={notificationFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={notificationFilter === 'CHECK_IN' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationFilter('CHECK_IN')}
                  >
                    Check-ins
                  </Button>
                  <Button
                    variant={notificationFilter === 'PICK_UP' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotificationFilter('PICK_UP')}
                  >
                    Pick-ups
                  </Button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${
                              notification.type === 'CHECK_IN' 
                                ? 'text-green-600' 
                                : 'text-purple-600'
                            }`}>
                              {notification.type === 'CHECK_IN' ? 'Check-in' : 'Pick-up'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="ml-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    No notifications found
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">{t.totalChildren}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalChildren}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">{t.present}</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-green-600">
                  {stats.presentToday}
                </p>
                <p className="ml-2 text-sm text-gray-500">
                  ({((stats.presentToday / stats.totalChildren) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">{t.pickupRequests}</p>
              <p className="text-2xl font-semibold text-purple-600">
                {stats.pickupRequests}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Bell className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
            <p className="text-sm font-medium text-gray-500">{t.unread}</p>
              <p className="text-2xl font-semibold text-yellow-600">
                {unreadCount}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities and Present Children */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
        <h3 className="text-lg font-medium">{t.recentActivities}</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {activity.checkInTime ? (
                      <ArrowDownCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowUpCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{activity.childName}</p>
                      <p className="text-sm text-gray-500">
                        {activity.checkInTime ? 'Checked in' : 'Picked up' } by {activity.parentName}
                      </p>
                    </div>
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
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No recent activities</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t.presentChildren}</h3>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              {stats.presentChildren.length} present
            </span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {stats.presentChildren.length > 0 ? (
              stats.presentChildren.map((child) => (
                <div
                  key={child.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{child.name}</p>
                      <p className="text-sm text-gray-500">Parent: {child.parentName}</p>
                      {child.checkInTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Checked in: {new Date(child.checkInTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Present
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No children present</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* QR Code Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">{t.checkInQRCode}</h3>
          <p className="text-sm text-gray-500">
            Valid for a week: {new Date().toLocaleDateString()}
          </p>
        </div>
        <div className="flex justify-center bg-white p-6 rounded-lg border-2 border-dashed">
          <QRGenerator schoolId="sunway" size={300} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-4">
        {t.parentqr}
        </p>
      </Card>
    </div>
  );
};

export default AdminDashboard;