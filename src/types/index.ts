// export interface User {
//     id: string;
//     name: string;
//     email: string;
//     phone: string;
//     role: 'ADMIN' | 'PARENT';
//   }
  
//   export interface Child {
//     id: string;
//     name: string;
//     parentId: string;
//     qrCode: string;
//     status: 'PRESENT' | 'ABSENT' | 'PICKUP_REQUESTED' | 'PICKED_UP';
//     attendanceRecords: AttendanceRecord[];
//   }
  
//   export interface AttendanceRecord {
//     id: string;
//     childId: string;
//     date: Date;
//     status: 'PRESENT' | 'ABSENT';
//     timestamp: Date;
//   }
  
//   export interface Notification {
//     id: string;
//     type: 'PICKUP' | 'ATTENDANCE' | 'PAYMENT';
//     childId: string;
//     message: string;
//     timestamp: Date;
//   }
export interface Child {
    id: string;
    name: string;
    parentName: string;
    status: 'PRESENT' | 'ABSENT' | 'PICKUP_REQUESTED' | 'PICKED_UP';
  }
  