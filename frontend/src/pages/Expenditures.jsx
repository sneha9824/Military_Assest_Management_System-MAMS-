import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Target, Plus, Eye } from 'lucide-react';
import DetailsModal from '../components/DetailsModal';

export default function Expenditures() {
  const { api, user } = useContext(AuthContext);
  const [data, setData] = useState([]);
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
    reason: '',
    date: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  useEffect(() => {
    fetchData();
    fetchGlobals();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenditures');
      setData(res.data || []);
    } catch (err) {
      setData([]); 
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
      if (!user.base_id && bRes.data.length > 0) setFormData(prev => ({ ...prev, base_id: bRes.data[0].id }));
      if (eRes.data.length > 0) setFormData(prev => ({ ...prev, equipment_type_id: eRes.data[0].id }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/expenditures', {
        base_id: formData.base_id,
        equipment_type_id: formData.equipment_type_id,
        quantity: formData.quantity,
        remarks: formData.remarks,
        reason: formData.reason,
        expenditure_date: formData.date,
        reference_number: formData.reference_number || `EXP-${Date.now()}`
      });
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Operation failed');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-military-navy">Expenditures</h1>
          <p className="text-sm text-military-slate/70 mt-1">Track asset consumption and loss</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold"
        >
          <Plus size={18} /> New Expenditure
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Equipment</th>
                <th className="p-4 font-medium">Base</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Reason</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="p-4 text-center">Loading...</td></tr>
              ) : data.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="p-4">{new Date(d.expenditure_date).toLocaleDateString()}</td>
                  <td className="p-4">{d.equipment_name}</td>
                  <td className="p-4">{d.base_name}</td>
                  <td className="p-4 font-bold text-red-600">-{d.quantity}</td>
                  <td className="p-4">{d.reason}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">EXPENDED</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedDetails(d)}
                      className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded inline-flex items-center gap-1 transition text-xs font-bold border border-blue-100"
                    >
                      <Eye size={14} /> VIEW
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && !loading && (
                <tr><td colSpan="7" className="p-8 text-center text-gray-400">No expenditures recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-red-600 p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">Record Expenditure</h2>
              <button onClick={() => setShowModal(false)} className="hover:opacity-70">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Base</label>
                  <select required className="w-full border rounded p-2 text-sm" value={formData.base_id} onChange={e => setFormData({...formData, base_id: e.target.value})} disabled={user.role !== 'ADMIN'}>
                    {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Equipment</label>
                  <select required className="w-full border rounded p-2 text-sm" value={formData.equipment_type_id} onChange={e => setFormData({...formData, equipment_type_id: e.target.value})}>
                    {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                  <input required type="number" min="1" className="w-full border rounded p-2 text-sm" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Date</label>
                  <input required type="date" className="w-full border rounded p-2 text-sm" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Reason / Operation</label>
                <input required type="text" className="w-full border rounded p-2 text-sm" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDetails && (
        <DetailsModal 
          title="Expenditure" 
          data={{...selectedDetails, status: 'EXPENDED'}} 
          onClose={() => setSelectedDetails(null)} 
        />
      )}
    </div>
  );
}
