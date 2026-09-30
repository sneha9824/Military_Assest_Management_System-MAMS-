import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Box } from 'lucide-react';

export default function Inventory() {
  const { api } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Box size={32} className="text-military-navy" />
        <div>
          <h1 className="text-3xl font-bold text-military-navy">Base Inventory</h1>
          <p className="text-sm text-military-slate/70 mt-1">Real-time asset availability</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Base</th>
                <th className="p-4 font-medium">Equipment</th>
                <th className="p-4 font-medium">Opening Balance</th>
                <th className="p-4 font-medium">Current Balance</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>
              ) : inventory.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{i.base_name}</td>
                  <td className="p-4 text-military-blue font-bold">{i.equipment_name}</td>
                  <td className="p-4 text-gray-500">{i.opening_balance}</td>
                  <td className="p-4 font-bold text-green-600">{i.current_balance}</td>
                  <td className="p-4">
                    {i.current_balance > 0 ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">AVAILABLE</span>
                    ) : (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">DEPLETED</span>
                    )}
                  </td>
                </tr>
              ))}
              {inventory.length === 0 && !loading && (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400">No inventory found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
