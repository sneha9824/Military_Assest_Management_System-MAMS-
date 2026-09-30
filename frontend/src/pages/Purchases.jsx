import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import DetailsModal from '../components/DetailsModal';

export default function Purchases() {
  const { api, user } = useContext(AuthContext);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    base_id: user.base_id || '',
    equipment_type_id: '',
    quantity: '',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier: '',
    reference_number: '',
    remarks: ''
  });

  useEffect(() => {
    fetchPurchases();
    fetchGlobals();
  }, []);

  const fetchPurchases = async () => {
    try {
      const res = await api.get('/purchases');
      setPurchases(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobals = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        api.get('/globals/bases'),
        api.get('/globals/equipment-types')
      ]);
      setBases(bRes.data);
      setEquipmentTypes(eRes.data);
      if (!user.base_id && bRes.data.length > 0) {
        setFormData(prev => ({ ...prev, base_id: bRes.data[0].id }));
      }
      if (eRes.data.length > 0) {
        setFormData(prev => ({ ...prev, equipment_type_id: eRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases', formData);
      setShowModal(false);
      fetchPurchases();
      // Reset reference number for next use
      setFormData(prev => ({ ...prev, reference_number: '', quantity: '' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create purchase');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-military-navy">Purchases</h1>
          <p className="text-sm text-military-slate/70 mt-1">Manage inbound asset procurement</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-military-blue hover:bg-military-blue/90 text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold"
        >
          <Plus size={18} /> New Purchase
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4 bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search reference number..." className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-military-accent" />
          </div>
          <button className="flex items-center gap-2 border px-4 py-2 rounded-lg text-sm bg-white hover:bg-gray-50">
            <Filter size={16} /> Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Equipment</th>
                <th className="p-4 font-medium">Base</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Supplier</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="8" className="p-4 text-center">Loading...</td></tr>
              ) : purchases.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">{new Date(p.purchase_date).toLocaleDateString()}</td>
                  <td className="p-4 font-mono font-medium">{p.reference_number}</td>
                  <td className="p-4">{p.equipment_name}</td>
                  <td className="p-4">{p.base_name}</td>
                  <td className="p-4 font-bold text-military-blue">+{p.quantity}</td>
                  <td className="p-4">{p.supplier || '-'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">RECEIVED</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedDetails(p)}
                      className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded inline-flex items-center gap-1 transition text-xs font-bold border border-blue-100"
                    >
                      <Eye size={14} /> VIEW
                    </button>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && !loading && (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No purchases found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-military-navy p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">Record Procurement</h2>
              <button onClick={() => setShowModal(false)} className="hover:text-military-accent">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Base</label>
                  <select 
                    required 
                    className="w-full border rounded p-2 text-sm"
                    value={formData.base_id}
                    onChange={e => setFormData({...formData, base_id: e.target.value})}
                    disabled={user.role !== 'ADMIN'}
                  >
                    {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Equipment</label>
                  <select 
                    required 
                    className="w-full border rounded p-2 text-sm"
                    value={formData.equipment_type_id}
                    onChange={e => setFormData({...formData, equipment_type_id: e.target.value})}
                  >
                    {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                  <input required type="number" min="1" className="w-full border rounded p-2 text-sm" 
                    value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                  <input required type="date" className="w-full border rounded p-2 text-sm" 
                    value={formData.purchase_date} onChange={e => setFormData({...formData, purchase_date: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Reference No.</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" 
                    value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Supplier</label>
                  <input type="text" className="w-full border rounded p-2 text-sm" 
                    value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-military-blue text-white rounded text-sm hover:bg-military-blue/90 font-bold">Submit Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDetails && (
        <DetailsModal 
          title="Purchase" 
          data={{...selectedDetails, status: 'RECEIVED'}} 
          onClose={() => setSelectedDetails(null)} 
        />
      )}
    </div>
  );
}
