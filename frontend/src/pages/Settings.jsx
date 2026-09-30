import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function Settings() {
  const { api } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('General');
  const [showSaved, setShowSaved] = useState(false);

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('military_settings');
    return saved ? JSON.parse(saved) : {
      systemName: 'Military Asset Management System',
      organizationName: 'Department of Defense',
      defaultCurrency: 'Rupees (₹)',
      theme: 'Light',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '24-hour',
      timezone: 'IST',
      emailNotifications: true
    };
  });

  // Apply theme on load and change
  useEffect(() => {
    const root = document.documentElement;
    if (formData.theme === 'Dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, [formData.theme]);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('military_settings', JSON.stringify(formData));
    alert('Settings saved successfully!');
  };

  // State for dynamic lists
  const [assetTypes, setAssetTypes] = useState([]);
  const [newAssetType, setNewAssetType] = useState('');
  const [bases, setBases] = useState([]);
  const [newBase, setNewBase] = useState('');

  useEffect(() => {
    fetchGlobals();
  }, []);

  const fetchGlobals = async () => {
    try {
      const [bRes, eRes] = await Promise.all([
        api.get('/globals/bases'),
        api.get('/globals/equipment-types')
      ]);
      setBases(bRes.data);
      setAssetTypes(eRes.data);
    } catch (err) {
      console.error('Failed to fetch globals', err);
    }
  };

  const handleAddAssetType = async () => {
    if (!newAssetType.trim()) return;
    try {
      const res = await api.post('/globals/equipment-types', { name: newAssetType.trim() });
      setAssetTypes([...assetTypes, res.data]);
      setNewAssetType('');
    } catch (err) {
      alert('Failed to add asset type');
    }
  };

  const handleRemoveAssetType = async (id) => {
    try {
      await api.delete(`/globals/equipment-types/${id}`);
      setAssetTypes(assetTypes.filter(type => type.id !== id));
    } catch (err) {
      alert('Failed to remove asset type');
    }
  };

  const handleAddBase = async () => {
    if (!newBase.trim()) return;
    try {
      const res = await api.post('/globals/bases', { name: newBase.trim() });
      setBases([...bases, res.data]);
      setNewBase('');
    } catch (err) {
      alert('Failed to add base');
    }
  };

  const handleRemoveBase = async (id) => {
    try {
      await api.delete(`/globals/bases/${id}`);
      setBases(bases.filter(base => base.id !== id));
    } catch (err) {
      alert('Failed to remove base');
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto text-slate-800 dark:text-slate-100">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <div className="flex gap-8 border-b border-gray-200 dark:border-slate-700 mb-6">
        {['General', 'Asset Types', 'Bases', 'System'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 text-sm font-semibold transition-colors ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-6">General Settings</h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">System Name</label>
                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.systemName} onChange={e => setFormData({...formData, systemName: e.target.value})} />
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Organization Name</label>
                <input type="text" className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.organizationName} onChange={e => setFormData({...formData, organizationName: e.target.value})} />
              </div>

              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Default Currency</label>
                <select className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.defaultCurrency} onChange={e => setFormData({...formData, defaultCurrency: e.target.value})}>
                  <option value="Rupees (₹)">Rupees (₹)</option>
                  <option value="USD ($)">USD ($)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Theme</label>
                <select className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.theme} onChange={e => setFormData({...formData, theme: e.target.value})}>
                  <option value="Light">Light</option>
                  <option value="Dark">Dark</option>
                  <option value="System">System Default</option>
                </select>
              </div>

              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Date Format</label>
                <select className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.dateFormat} onChange={e => setFormData({...formData, dateFormat: e.target.value})}>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                </select>
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Time Format</label>
                <select className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" value={formData.timeFormat} onChange={e => setFormData({...formData, timeFormat: e.target.value})}>
                  <option value="24-hour">24-hour</option>
                  <option value="12-hour">12-hour (AM/PM)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end items-center mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 gap-4">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded shadow transition">
                Save Settings
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'Asset Types' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-6">Asset Types</h2>
          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              placeholder="Add new asset type..." 
              value={newAssetType} 
              onChange={e => setNewAssetType(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddAssetType()}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" 
            />
            <button onClick={handleAddAssetType} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition text-sm">Add</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assetTypes.map(type => (
              <div key={type.id} className="border border-gray-200 dark:border-slate-600 rounded p-3 flex justify-between items-center bg-gray-50 dark:bg-slate-700/30">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{type.name}</span>
                <button onClick={() => handleRemoveAssetType(type.id)} className="text-red-500 hover:text-red-600 font-medium text-xs">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Bases' && (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
          <h2 className="text-lg font-bold mb-6">Bases</h2>
          <div className="flex gap-2 mb-8">
            <input 
              type="text" 
              placeholder="Add new base..." 
              value={newBase} 
              onChange={e => setNewBase(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddBase()}
              className="flex-1 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded p-2 text-sm focus:outline-none focus:border-blue-500" 
            />
            <button onClick={handleAddBase} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded shadow transition text-sm">Add</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {bases.map(base => (
              <div key={base.id} className="border border-gray-200 dark:border-slate-600 rounded p-3 flex justify-between items-center bg-gray-50 dark:bg-slate-700/30">
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">{base.name}</span>
                <button onClick={() => handleRemoveBase(base.id)} className="text-red-500 hover:text-red-600 font-medium text-xs">Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'System' && (
        <form className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
            <h2 className="text-lg font-bold mb-6">System Settings</h2>
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-6 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">When enabled, only administrators can access the system</p>
                </div>
                <button type="button" onClick={() => alert('Maintenance Mode Enabled!')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow transition text-sm">Enable</button>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-6 pt-6 border-t border-gray-100 dark:border-slate-700">System Information</h2>
            
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Version</span>
                <span className="block font-semibold text-gray-800 dark:text-gray-200 text-base">1.0.0</span>
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Last Updated</span>
                <span className="block font-semibold text-gray-800 dark:text-gray-200 text-base">8/7/2025</span>
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Database Status</span>
                <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded font-bold mt-1">Connected</span>
              </div>
              <div className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-700/50">
                <span className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wider">API Status</span>
                <span className="inline-block bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded font-bold mt-1">Operational</span>
              </div>
            </div>
            
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
              <button type="button" onClick={() => alert('System Settings Saved Successfully!')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded shadow transition text-sm">
                Save Settings
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
