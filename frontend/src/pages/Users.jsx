import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Users as UsersIcon } from 'lucide-react';

export default function Users() {
  const { api } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <UsersIcon size={32} className="text-military-navy" />
        <div>
          <h1 className="text-3xl font-bold text-military-navy">Personnel Directory</h1>
          <p className="text-sm text-military-slate/70 mt-1">Manage system access and roles</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Assigned Base</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-military-navy">{u.name}</td>
                  <td className="p-4">{u.email}</td>
                  <td className="p-4">
                    <span className="bg-military-blue/10 text-military-blue px-2 py-1 rounded text-xs font-bold uppercase">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">{u.base_name || 'Global'}</td>
                  <td className="p-4">
                    {u.active ? (
                      <span className="text-green-600 font-bold text-xs">ACTIVE</span>
                    ) : (
                      <span className="text-red-600 font-bold text-xs">INACTIVE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
