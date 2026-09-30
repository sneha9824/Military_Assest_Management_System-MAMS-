import { X } from 'lucide-react';

export default function DetailsModal({ title, data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-slate-50 border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition flex items-center gap-1 font-medium text-sm">
              &larr; Back
            </button>
            <h2 className="text-xl font-bold text-slate-800">{title} Details</h2>
            {data.status && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                {data.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="bg-gray-50 border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-gray-200">
                {Object.entries(data).map(([key, value]) => {
                  if (key === 'id' || key === 'status' || value === null) return null;
                  
                  // Format keys
                  const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                  
                  // Format values
                  let formattedValue = value;
                  if (key.includes('date') || key.includes('created_at')) {
                    formattedValue = new Date(value).toLocaleString();
                  }

                  return (
                    <tr key={key}>
                      <td className="p-4 font-medium text-gray-500 w-1/3 bg-white">{formattedKey}</td>
                      <td className="p-4 text-gray-800 font-medium bg-white">{String(formattedValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action / Print Footer */}
        <div className="p-5 border-t border-slate-200 bg-gray-50 flex justify-end">
          <button 
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded shadow transition flex items-center gap-2 font-semibold text-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Generate PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
