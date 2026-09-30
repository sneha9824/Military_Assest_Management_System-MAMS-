import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ScrollText } from 'lucide-react';

export default function AuditLogs() {
  const { api } = useContext(AuthContext);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit-logs');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <ScrollText size={32} className="text-military-navy" />
        <div>
          <h1 className="text-3xl font-bold text-military-navy">System Audit Logs</h1>
          <p className="text-sm text-military-slate/70 mt-1">Immutable record of all mutating actions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Timestamp</th>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Action</th>
                <th className="p-4 font-medium">Entity</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">IP Address</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100 font-mono">
              {loading ? (
                <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>
              ) : logs.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="p-4">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-4 text-military-blue">{l.user_email || 'SYSTEM'}</td>
                  <td className="p-4 font-bold">{l.action}</td>
                  <td className="p-4">{l.entity_type} {l.entity_id ? `#${l.entity_id}` : ''}</td>
                  <td className="p-4 text-green-600">{l.status}</td>
                  <td className="p-4 text-gray-400">{l.ip_address}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr><td colSpan="6" className="p-8 text-center text-gray-400">No audit logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
