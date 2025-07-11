# WorkBeat API Documentation - New Features

## Overview
This document outlines the new business features APIs for Leave Management, Shift Scheduling, and Notification System in WorkBeat.

**Base URL:** `http://localhost:5000/api`

**Authentication:** All endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📋 Leave Management APIs

### Leave Types

#### GET /leave-types
Get all leave types for the organization.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vacation",
      "annualAllocation": 15,
      "requiresApproval": true,
      "adviceNoticeDays": 7,
      "isActive": true,
      "_count": {
        "leaveRequests": 5,
        "leaveBalances": 10
      }
    }
  ]
}
```

#### POST /leave-types
Create a new leave type.

**Request Body:**
```json
{
  "name": "Sick Leave",
  "annualAllocation": 10,
  "requiresApproval": false,
  "adviceNoticeDays": 1
}
```

#### PUT /leave-types/:id
Update an existing leave type.

#### DELETE /leave-types/:id
Soft delete a leave type (sets isActive to false).

### Leave Requests

#### GET /leave-requests
Get leave requests with optional filters.

**Query Parameters:**
- `status` - Filter by status (pending, approved, rejected, cancelled)
- `employeeId` - Filter by employee
- `startDate` & `endDate` - Filter by date range
- `page` & `limit` - Pagination

#### POST /leave-requests
Create a new leave request.

**Request Body:**
```json
{
  "employeeId": 1,
  "leaveTypeId": 1,
  "startDate": "2025-07-10",
  "endDate": "2025-07-14",
  "reason": "Family vacation"
}
```

#### PUT /leave-requests/:id/status
Approve or reject a leave request.

**Request Body:**
```json
{
  "status": "approved",
  "approverId": 2,
  "rejectionReason": "Insufficient coverage" // Only for rejected status
}
```

#### PUT /leave-requests/:id/cancel
Cancel a leave request.

### Leave Balances

#### GET /leave-balances
Get leave balances for all employees.

**Query Parameters:**
- `employeeId` - Filter by employee
- `year` - Filter by year (default: current year)

#### GET /leave-balances/employee/:employeeId
Get leave balances for a specific employee with summary.

#### POST /leave-balances/initialize
Initialize leave balances for all employees for a new year.

**Request Body:**
```json
{
  "year": 2025
}
```

#### PUT /leave-balances/:id
Update a specific leave balance.

#### PUT /leave-balances/bulk
Bulk update multiple leave balances.

#### GET /leave-balances/report/utilization
Get leave utilization report by department and leave type.

## 🕐 Shift Scheduling APIs

### Shift Templates

#### GET /shift-templates
Get all shift templates.

#### POST /shift-templates
Create a new shift template.

**Request Body:**
```json
{
  "name": "Morning Shift",
  "startTime": "09:00",
  "endTime": "17:00",
  "breakDuration": 60,
  "daysOfWeek": ["monday", "tuesday", "wednesday", "thursday", "friday"]
}
```

### Scheduled Shifts

#### GET /scheduled-shifts
Get scheduled shifts with filtering and pagination.

**Query Parameters:**
- `employeeId` - Filter by employee
- `startDate` & `endDate` - Date range
- `status` - Filter by status
- `page` & `limit` - Pagination

#### POST /scheduled-shifts
Create a single scheduled shift.

#### POST /scheduled-shifts/bulk
Create multiple scheduled shifts.

#### POST /scheduled-shifts/generate
Generate shifts from a template for multiple employees.

**Request Body:**
```json
{
  "shiftTemplateId": 1,
  "employeeIds": [1, 2, 3],
  "startDate": "2025-07-01",
  "endDate": "2025-07-31",
  "skipWeekends": true,
  "skipExisting": true
}
```

## 🔔 Notification System APIs

### Notification Templates

#### GET /notification-templates
Get all notification templates.

#### GET /notification-templates/variables
Get available template variables for each notification type.

#### POST /notification-templates
Create a new notification template.

**Request Body:**
```json
{
  "type": "leave_request",
  "subject": "New Leave Request from {{employeeName}}",
  "bodyTemplate": "{{employeeName}} from {{department}} has requested {{leaveType}} leave from {{startDate}} to {{endDate}}."
}
```

#### POST /notification-templates/:id/preview
Preview a notification template with sample data.

### Notification Preferences

#### GET /notification-preferences
Get notification preferences for all users.

#### GET /notification-preferences/user/:userId
Get notification preferences for a specific user.

#### PUT /notification-preferences/user/:userId
Update notification preferences for a user.

**Request Body:**
```json
{
  "emailEnabled": true,
  "lateArrivalAlerts": true,
  "leaveRequestNotifications": true,
  "weeklySummary": false,
  "notificationTime": "09:00"
}
```

### Notification Queue

#### GET /notification-queue
Get queued notifications.

#### GET /notification-queue/stats
Get notification queue statistics.

#### POST /notification-queue
Queue a single notification.

**Request Body:**
```json
{
  "recipientEmail": "user@example.com",
  "subject": "Test Notification",
  "body": "This is a test notification.",
  "type": "custom",
  "scheduledAt": "2025-07-02T10:00:00Z"
}
```

#### POST /notification-queue/process
Process pending notifications (send emails).

#### POST /notification-queue/retry
Retry failed notifications.

## 🔧 Business Logic Features

### Automatic Leave Balance Updates
- When leave requests are approved/rejected, leave balances are automatically updated
- Pending days are moved to used days on approval
- Balances are restored on cancellation

### Working Days Calculation
- Leave requests automatically calculate working days (excluding weekends)
- Configurable business rules for holiday exclusions

### Shift Conflict Detection
- Prevents double-booking employees for the same date
- Validates shift times and templates

### Template Variable System
- Dynamic notification templates with variable substitution
- Type-specific variables for different notification scenarios

### Queue-Based Email System
- Resilient email delivery with retry mechanism
- Bulk processing capabilities
- Failed notification tracking and retry

## 📊 Reporting Endpoints

### Leave Utilization Report
`GET /leave-balances/report/utilization`

Provides department-wise leave utilization statistics including:
- Total allocated vs used days
- Utilization percentages
- Employee-level breakdowns

### Notification Statistics
`GET /notification-queue/stats`

Provides notification system health metrics:
- Success rates
- Pending/failed counts
- Daily/weekly delivery statistics

## 🚀 Next Steps for Frontend Integration

1. **Leave Management UI**: Build React components for leave request forms, approval panels, and balance displays
2. **Shift Scheduling Interface**: Create drag-and-drop shift calendar and template management
3. **Notification Settings**: Develop user preference panels and template editors
4. **Dashboard Integration**: Add leave and shift widgets to existing admin dashboard
5. **Mobile Responsiveness**: Ensure all new features work on mobile devices

## 🔐 Security & Permissions

All endpoints are protected by authentication middleware. Future enhancements should include:
- Role-based access control (RBAC)
- Department-specific permissions
- Manager approval workflows
- Audit logging for sensitive operations

This completes the backend API implementation for the high-value business features. The APIs are production-ready with proper error handling, validation, and business logic.
