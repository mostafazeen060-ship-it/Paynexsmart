export interface AuditEntry {
  id: string;
  supervisorId: string;
  action: string;
  details: string;
  createdAt: string;
}

export function logLogin(supervisorId: string) {
  console.log('Login logged:', supervisorId);
}

export function logAudit(supervisorId: string, action: string, details: string) {
  console.log('Audit:', supervisorId, action, details);
}

export function logOrderStatusChange(supervisorId: string, orderId: string, oldStatus: string, newStatus: string) {
  logAudit(supervisorId, 'ORDER_STATUS_CHANGE', `${orderId}: ${oldStatus} -> ${newStatus}`);
}

export function logWalletSettlement(supervisorId: string, amount: number) {
  logAudit(supervisorId, 'WALLET_SETTLEMENT', `Amount: ${amount}`);
}
