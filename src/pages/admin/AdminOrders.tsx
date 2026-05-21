import { useState, useEffect, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, Filter, Clock } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getOrders, updateOrder } from '@/lib/storage';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';
import { toast } from 'sonner';

const WORKFLOW_STATUSES: { value: OrderStatus; labelAr: string }[] = [
  { value: 'pending', labelAr: 'قيد الانتظار' },
  { value: 'under-inquiry', labelAr: 'جاري الاستعلام' },
  { value: 'admin-review', labelAr: 'مراجعة المدير' },
  { value: 'approved', labelAr: 'موافقة نهائية' },
  { value: 'rejected', labelAr: 'مرفوض' },
];

export default function AdminOrders() {
  const { t } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setOrders(getOrders());
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesSearch = order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            order.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, selectedStatus, searchTerm]);

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrder(orderId, { status: newStatus });
    setOrders(getOrders());
    toast.success('تم تحديث حالة الطلب');
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <h2 className="text-2xl font-black text-[#0f2460]">إدارة الطلبات</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button onClick={() => setSelectedStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedStatus === 'all' ? 'bg-[#0f2460] text-white' : 'bg-white border'}`}>الكل</button>
          {WORKFLOW_STATUSES.map(s => (
            <button key={s.value} onClick={() => setSelectedStatus(s.value)} className={`px-4 py-2 rounded-lg text-sm font-bold ${selectedStatus === s.value ? 'bg-[#0f2460] text-white' : 'bg-white border'}`}>
              {s.labelAr}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">العميل</th>
              <th className="p-4">المنتج</th>
              <th className="p-4">التقسيط</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-4 font-bold">{order.customerName}</td>
                <td className="p-4">{order.productName}</td>
                <td className="p-4 font-bold text-[#d4a339]">{order.months} شهر</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status, t)}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  <select 
                    className="p-1 border rounded-lg text-xs" 
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                  >
                    {WORKFLOW_STATUSES.map(s => <option key={s.value} value={s.value}>{s.labelAr}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
