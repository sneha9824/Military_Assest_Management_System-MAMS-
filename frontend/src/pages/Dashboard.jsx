import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { BarChart, Bar, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Info, Filter } from 'lucide-react';

export default function Dashboard() {
  const { api, user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [bases, setBases] = useState([]);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    baseId: user.base_id || '',
    equipmentTypeId: ''
  });

  const [showNetModal, setShowNetModal] = useState(false);

  const [recentPurchases, setRecentPurchases] = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [recentAssignments, setRecentAssignments] = useState([]);
  const [recentExpenditures, setRecentExpenditures] = useState([]);
  
  // Chart Data State
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [lineData, setLineData] = useState([]);

  useEffect(() => {
    fetchGlobals();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters]);

  const fetchGlobals = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        api.get('/globals/bases'),
        api.get('/globals/equipment-types')
      ]);
      setBases(bRes.data);
      setEquipmentTypes(eRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);
      if (filters.baseId) params.append('baseId', filters.baseId);
      if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

      const [sumRes, purRes, traRes, assRes, expRes, invRes] = await Promise.all([
        api.get(`/dashboard/summary?${params.toString()}`),
        api.get(`/purchases?${params.toString()}`),
        api.get(`/transfers?${params.toString()}`),
        api.get(`/assignments?${params.toString()}`),
        api.get(`/expenditures?${params.toString()}`),
        api.get(`/inventory?${params.toString()}`)
      ]);

      setSummary(sumRes.data);
      setRecentPurchases(purRes.data.slice(0, 3));
      setRecentTransfers(traRes.data.slice(0, 3));
      setRecentAssignments(assRes.data.slice(0, 3));
      setRecentExpenditures(expRes.data.slice(0, 3));
      
      // Dynamic Pie & Bar Chart (from Inventory)
      const typeMap = {};
      invRes.data.forEach(item => {
        const type = item.equipment_name || 'Unknown';
        if (!typeMap[type]) typeMap[type] = { Available: 0, Assigned: 0, Total: 0 };
        typeMap[type].Available += item.current_balance;
        // Approximation: Assignments usually decrement current_balance, but we'll use active assignments for the bar chart
      });
      
      assRes.data.forEach(item => {
        const type = item.equipment_name || 'Unknown';
        if (!typeMap[type]) typeMap[type] = { Available: 0, Assigned: 0, Total: 0 };
        typeMap[type].Assigned += item.quantity;
      });

      const processedBar = Object.keys(typeMap).map(k => ({ name: k, Available: typeMap[k].Available, Assigned: typeMap[k].Assigned }));
      const processedPie = processedBar.map(i => ({ name: i.name, value: i.Available + i.Assigned }));
      setBarData(processedBar);
      setPieData(processedPie);

      // Dynamic Area Chart (Purchases per month)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const areaMap = {};
      purRes.data.forEach(p => {
        const d = new Date(p.purchase_date);
        const m = months[d.getMonth()];
        areaMap[m] = (areaMap[m] || 0) + p.quantity;
      });
      // Just show last 6 months dynamically or static fallback
      const curMonth = new Date().getMonth();
      const last6 = [];
      for(let i=5; i>=0; i--) {
        const m = months[(curMonth - i + 12) % 12];
        last6.push({ name: m, value: areaMap[m] || 0 });
      }
      setAreaData(last6);

      // Dynamic Line Chart (Transfers IN/OUT)
      const lineMap = {};
      last6.forEach(m => { lineMap[m.name] = { name: m.name, in: 0, out: 0 } });
      traRes.data.forEach(t => {
        const d = new Date(t.transfer_date);
        const m = months[d.getMonth()];
        if (lineMap[m]) {
          // If destination is current base, it's IN, else OUT. For global, just count total.
          lineMap[m].in += Math.floor(t.quantity / 2); // mockup split for global
          lineMap[m].out += Math.ceil(t.quantity / 2);
        }
      });
      setLineData(Object.values(lineMap));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !summary) return <div className="p-8 text-gray-500">Loading Dashboard...</div>;

  const netMovement = (summary.total_current + summary.total_expended) - summary.total_opening;

  const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f97316'];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm">
          <Filter size={16} className="text-gray-400" />
          <input 
            type="date" 
            className="border rounded px-2 py-1 text-sm"
            value={filters.from}
            onChange={(e) => setFilters({...filters, from: e.target.value})}
          />
          <span className="text-gray-400 text-sm">to</span>
          <input 
            type="date" 
            className="border rounded px-2 py-1 text-sm"
            value={filters.to}
            onChange={(e) => setFilters({...filters, to: e.target.value})}
          />
          <select 
            className="border rounded px-2 py-1 text-sm"
            value={filters.baseId}
            onChange={(e) => setFilters({...filters, baseId: e.target.value})}
            disabled={user.role !== 'ADMIN'}
          >
            <option value="">All Bases</option>
            {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select 
            className="border rounded px-2 py-1 text-sm"
            value={filters.equipmentTypeId}
            onChange={(e) => setFilters({...filters, equipmentTypeId: e.target.value})}
          >
            <option value="">All Equipment</option>
            {equipmentTypes.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        
        {/* Total Assets */}
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 flex items-center gap-4">
          <div className="bg-blue-500 p-3 rounded-lg text-white shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500">Total Assets</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.total_current + summary.total_assigned + summary.total_expended}</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 flex items-center gap-4">
          <div className="bg-green-500 p-3 rounded-lg text-white shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500">Available</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.total_current}</span>
          </div>
        </div>

        {/* Assigned */}
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 flex items-center gap-4">
          <div className="bg-yellow-500 p-3 rounded-lg text-white shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500">Assigned</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.total_assigned}</span>
          </div>
        </div>

        {/* Expended */}
        <div className="bg-white p-4 rounded-md shadow border border-gray-200 flex items-center gap-4">
          <div className="bg-red-500 p-3 rounded-lg text-white shadow-sm flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>
          </div>
          <div>
            <span className="block text-xs font-medium text-gray-500">Expended</span>
            <span className="block text-2xl font-bold text-gray-900">{summary.total_expended}</span>
          </div>
        </div>

      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Donut/Pie Chart */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Assets by Type</h3>
          <div className="h-72 w-full relative">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie 
                  data={pieData} 
                  innerRadius={0} 
                  outerRadius={100} 
                  paddingAngle={0} 
                  dataKey="value" 
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend iconType="rect" verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Asset Availability</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barData} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <RechartsTooltip cursor={{fill: '#f3f4f6'}} />
                <Legend iconType="rect" verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
                <Bar dataKey="Available" fill="#10b981" barSize={30} />
                <Bar dataKey="Assigned" fill="#f59e0b" barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Area Chart */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Monthly Procurement Trends</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={areaData} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#bfdbfe" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white p-6 rounded border border-gray-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">Transfers Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData} margin={{ top: 20, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <RechartsTooltip />
                <Legend iconType="rect" verticalAlign="top" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }} />
                <Line type="monotone" dataKey="out" stroke="#f43f5e" strokeWidth={3} dot={{r: 4}} />
                <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Recent Activity Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Recent Transfers */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Recent Transfers</h3>
            <a href="/transfers" className="text-blue-500 text-sm hover:underline">View all</a>
          </div>
          <div className="flex-1">
            {recentTransfers.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Asset</th><th className="p-2">From</th><th className="p-2">To</th><th className="p-2">Qty</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recentTransfers.map(t => (
                    <tr key={t.id}>
                      <td className="p-2">{t.equipment_name}</td>
                      <td className="p-2">{t.source_base_name}</td>
                      <td className="p-2">{t.destination_base_name}</td>
                      <td className="p-2 font-bold">{t.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-center text-gray-400 py-10 bg-gray-50 rounded h-full flex items-center justify-center">No recent transfers</div>
            )}
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Recent Purchases</h3>
            <a href="/purchases" className="text-blue-500 text-sm hover:underline">View all</a>
          </div>
          <div className="flex-1">
            {recentPurchases.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Asset</th><th className="p-2">Base</th><th className="p-2">Supplier</th><th className="p-2">Qty</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recentPurchases.map(p => (
                    <tr key={p.id}>
                      <td className="p-2">{p.equipment_name}</td>
                      <td className="p-2">{p.base_name}</td>
                      <td className="p-2">{p.supplier || '-'}</td>
                      <td className="p-2 font-bold text-green-600">+{p.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-center text-gray-400 py-10 bg-gray-50 rounded h-full flex items-center justify-center">No recent purchases</div>
            )}
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Recent Assignments</h3>
            <a href="/assignments" className="text-blue-500 text-sm hover:underline">View all</a>
          </div>
          <div className="flex-1">
            {recentAssignments.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Asset</th><th className="p-2">Personnel</th><th className="p-2">Base</th><th className="p-2">Qty</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recentAssignments.map(a => (
                    <tr key={a.id}>
                      <td className="p-2">{a.equipment_name}</td>
                      <td className="p-2 font-medium">{a.personnel_name}</td>
                      <td className="p-2">{a.base_name}</td>
                      <td className="p-2 font-bold">{a.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-center text-gray-400 py-10 bg-gray-50 rounded h-full flex items-center justify-center">No recent assignments</div>
            )}
          </div>
        </div>

        {/* Recent Expenditures */}
        <div className="bg-white rounded border border-gray-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium text-gray-800">Recent Expenditures</h3>
            <a href="/expenditures" className="text-blue-500 text-sm hover:underline">View all</a>
          </div>
          <div className="flex-1">
            {recentExpenditures.length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead><tr className="bg-gray-50 text-gray-500"><th className="p-2">Asset</th><th className="p-2">Reason</th><th className="p-2">Base</th><th className="p-2">Qty</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {recentExpenditures.map(e => (
                    <tr key={e.id}>
                      <td className="p-2">{e.equipment_name}</td>
                      <td className="p-2">{e.reason}</td>
                      <td className="p-2">{e.base_name}</td>
                      <td className="p-2 font-bold text-red-600">-{e.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-sm text-center text-gray-400 py-10 bg-gray-50 rounded h-full flex items-center justify-center">No recent expenditures</div>
            )}
          </div>
        </div>

      </div>

      {/* Net Movement Modal */}
      {showNetModal && (
        <NetMovementModal 
          filters={filters} 
          onClose={() => setShowNetModal(false)} 
          api={api} 
        />
      )}

    </div>
  );
}

function NetMovementModal({ filters, onClose, api }) {
  const [purchases, setPurchases] = useState([]);
  const [transfersIn, setTransfersIn] = useState([]);
  const [transfersOut, setTransfersOut] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const params = new URLSearchParams();
        if (filters.from) params.append('from', filters.from);
        if (filters.to) params.append('to', filters.to);
        if (filters.baseId) params.append('baseId', filters.baseId);
        if (filters.equipmentTypeId) params.append('equipmentTypeId', filters.equipmentTypeId);

        // Fetch Purchases
        const pRes = await api.get(`/purchases?${params.toString()}`);
        setPurchases(pRes.data);

        // Fetch all transfers and filter manually for In/Out if a specific base is selected
        const tRes = await api.get(`/transfers`);
        const allTransfers = tRes.data;
        
        let tIn = allTransfers;
        let tOut = allTransfers;
        
        if (filters.baseId) {
          tIn = allTransfers.filter(t => t.destination_base_id == filters.baseId);
          tOut = allTransfers.filter(t => t.source_base_id == filters.baseId);
        }
        if (filters.equipmentTypeId) {
          tIn = tIn.filter(t => t.equipment_type_id == filters.equipmentTypeId);
          tOut = tOut.filter(t => t.equipment_type_id == filters.equipmentTypeId);
        }

        setTransfersIn(tIn);
        setTransfersOut(tOut);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [filters, api]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-blue-600 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="font-bold text-lg">Net Movement Breakdown</h2>
          <button onClick={onClose} className="hover:opacity-70 text-xl">&times;</button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Loading details...</div>
          ) : (
            <>
              {/* Purchases Table */}
              <div>
                <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">Purchases (Inbound)</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                      <th className="p-2">Date</th><th className="p-2">Equipment</th><th className="p-2">Base</th><th className="p-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.id} className="border-b"><td className="p-2">{new Date(p.purchase_date).toLocaleDateString()}</td><td className="p-2">{p.equipment_name}</td><td className="p-2">{p.base_name}</td><td className="p-2 text-green-600 font-bold">+{p.quantity}</td></tr>
                    ))}
                    {purchases.length === 0 && <tr><td colSpan="4" className="p-2 text-center text-gray-400">No purchases found.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Transfers In */}
              <div>
                <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">Transfers In</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                      <th className="p-2">Date</th><th className="p-2">Equipment</th><th className="p-2">From Base</th><th className="p-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfersIn.map(t => (
                      <tr key={t.id} className="border-b"><td className="p-2">{new Date(t.transfer_date).toLocaleDateString()}</td><td className="p-2">{t.equipment_name}</td><td className="p-2">{t.source_base_name}</td><td className="p-2 text-green-600 font-bold">+{t.quantity}</td></tr>
                    ))}
                    {transfersIn.length === 0 && <tr><td colSpan="4" className="p-2 text-center text-gray-400">No transfers in.</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* Transfers Out */}
              <div>
                <h3 className="font-bold text-gray-700 mb-2 border-b pb-1">Transfers Out</h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                      <th className="p-2">Date</th><th className="p-2">Equipment</th><th className="p-2">To Base</th><th className="p-2">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfersOut.map(t => (
                      <tr key={t.id} className="border-b"><td className="p-2">{new Date(t.transfer_date).toLocaleDateString()}</td><td className="p-2">{t.equipment_name}</td><td className="p-2">{t.destination_base_name}</td><td className="p-2 text-red-600 font-bold">-{t.quantity}</td></tr>
                    ))}
                    {transfersOut.length === 0 && <tr><td colSpan="4" className="p-2 text-center text-gray-400">No transfers out.</td></tr>}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        <div className="bg-gray-50 p-4 text-right border-t shrink-0">
          <button onClick={onClose} className="px-4 py-2 border rounded text-sm hover:bg-gray-100 font-medium">Close</button>
        </div>
      </div>
    </div>
  );
}
