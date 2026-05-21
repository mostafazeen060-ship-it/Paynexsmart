/**
 * Audit Log System - Tracks administrative actions for accountability.
 */

export interface AuditEntry {
  id: string;
  supervisorId: string;
  action: string;
  details: string;
  createdAt: string;
}

export function logAudit(supervisorId: string, action: string, details: string) {
  const logs = getAuditLogs();
  const newLog: AuditEntry = {
    id: Math.random().toString(36).substring(2, 11),
    supervisorId,
    action,
    details,
    createdAt: new Date().toISOString(),
  };
  
  logs.unshift(newLog); // إضافة السجل الجديد في البداية
  localStorage.setItem('qastly_audit_logs', JSON.stringify(logs.slice(0, 500))); // الاحتفاظ بآخر 500 سجل
}

export function getAuditLogs(): AuditEntry[] {
  try {
    return JSON.parse(localStorage.getItem('qastly_audit_logs') || '[]');
  } catch {
    return [];
  }
}

// دالة مخصصة لتسجيل تغيير حالة الطلبات
export function logOrderStatusChange(supervisorId: string, orderId: string, oldStatus: string, newStatus: string) {
  logAudit(
    supervisorId, 
    'ORDER_STATUS_CHANGE', 
    `تغيير حالة الطلب ${orderId} من ${oldStatus} إلى ${newStatus}`
  );
}

// دالة مخصصة لتسجيل العمليات المالية
export function logWalletSettlement(supervisorId: string, amount: number) {
  logAudit(
    supervisorId, 
    'WALLET_SETTLEMENT', 
    `تسوية عهدة مالية بمبلغ ${amount} ج.م`
  );
}
