import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ArrowLeftRight, Search, Plus, Eye } from 'lucide-react';
import DetailsModal from '../components/DetailsModal';

export default function Transfers() {
  const { api, user } = useContext(AuthContext);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);

  const [formData, setFormData] = useState({
    source_base_id: user.base_id || '',
    destination_base_id: '',
    equipment_type_id: '',
    quantity: '',
    reference_number: '',
    remarks: ''
  });

  useEffect(() => {
    fetchTransfers();
    fetchGlobals();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await api.get('/transfers');
      setTransfers(res.data);
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
        setFormData(prev => ({ ...prev, source_base_id: bRes.data[0].id }));
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
      await api.post('/transfers', formData);
      setShowModal(false);
      fetchTransfers();
      setFormData(prev => ({ ...prev, reference_number: '', quantity: '' }));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to transfer');
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-military-navy">Transfers</h1>
          <p className="text-sm text-military-slate/70 mt-1">Base-to-base asset reallocation</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-military-navy hover:bg-military-slate text-white px-4 py-2 rounded shadow transition flex items-center gap-2 font-semibold"
        >
          <ArrowLeftRight size={18} /> New Transfer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-gray-100 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Reference</th>
                <th className="p-4 font-medium">Equipment</th>
                <th className="p-4 font-medium">From Base</th>
                <th className="p-4 font-medium">To Base</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="8" className="p-4 text-center">Loading...</td></tr>
              ) : transfers.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="p-4">{new Date(t.transfer_date).toLocaleDateString()}</td>
                  <td className="p-4 font-mono text-xs">{t.reference_number}</td>
                  <td className="p-4 font-medium text-military-navy">{t.equipment_name}</td>
                  <td className="p-4">{t.source_base_name}</td>
                  <td className="p-4 font-medium text-military-blue">{t.destination_base_name}</td>
                  <td className="p-4 font-bold">{t.quantity}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">COMPLETED</span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => setSelectedDetails(t)}
                      className="text-blue-500 hover:bg-blue-50 px-3 py-1.5 rounded inline-flex items-center gap-1 transition text-xs font-bold border border-blue-100"
                    >
                      <Eye size={14} /> VIEW
                    </button>
                  </td>
                </tr>
              ))}
              {transfers.length === 0 && !loading && (
                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No transfers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
            <div className="bg-military-navy p-4 flex justify-between items-center text-white">
              <h2 className="font-bold text-lg">Initiate Transfer</h2>
              <button onClick={() => setShowModal(false)} className="hover:text-military-accent">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Source Base</label>
                  <select 
                    required className="w-full border rounded p-2 text-sm bg-gray-100"
                    value={formData.source_base_id} disabled={user.role !== 'ADMIN'}
                    onChange={e => setFormData({...formData, source_base_id: e.target.value})}
                  >
                    {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Destination Base</label>
                  <select required className="w-full border rounded p-2 text-sm"
                    value={formData.destination_base_id}
                    onChange={e => setFormData({...formData, destination_base_id: e.target.value})}
                  >
                    <option value="">Select Destination...</option>
                    {bases.filter(b => b.id != formData.source_base_id).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Equipment Type</label>
                <select required className="w-full border rounded p-2 text-sm"
                  value={formData.equipment_type_id} onChange={e => setFormData({...formData, equipment_type_id: e.target.value})}
                >
                  {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Quantity</label>
                  <input required type="number" min="1" className="w-full border rounded p-2 text-sm" 
                    value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Reference No.</label>
                  <input required type="text" className="w-full border rounded p-2 text-sm" 
                    value={formData.reference_number} onChange={e => setFormData({...formData, reference_number: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-military-navy text-white rounded text-sm font-bold">Transfer Assets</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDetails && (
        <DetailsModal 
          title="Transfer" 
          data={{...selectedDetails, status: 'COMPLETED'}} 
          onClose={() => setSelectedDetails(null)} 
        />
      )}
    </div>
  );
}
