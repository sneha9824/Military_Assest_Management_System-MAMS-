import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { ShieldAlert, KeyRound, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-military-navy flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-military-blue opacity-20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-military-accent opacity-10 rounded-full blur-3xl"></div>

      <div className="bg-military-slate/40 backdrop-blur-md border border-military-slate/50 p-8 rounded-3xl shadow-2xl w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-military-blue/20 p-4 rounded-full mb-4">
            <ShieldAlert size={48} className="text-military-accent" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-widest" style={{ fontFamily: "'Outfit', sans-serif" }}>M.A.M.S.</h1>
          <p className="text-military-light/70 text-sm mt-2 font-medium tracking-wide">Military Asset Management System</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-military-light/50" size={20} />
            <input
              type="email"
              required
              className="w-full bg-military-navy/60 border border-military-slate/80 text-white pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-military-accent focus:border-transparent transition-all"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-military-light/50" size={20} />
            <input
              type="password"
              required
              className="w-full bg-military-navy/60 border border-military-slate/80 text-white pl-12 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-military-accent focus:border-transparent transition-all"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-military-blue hover:bg-military-blue/90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 flex items-center justify-center gap-2 text-sm tracking-widest mt-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            AUTHORIZE ACCESS
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-military-light/40">
          <p className="mb-1">Demo accounts (password123):</p>
          <p>admin@military.gov | commander@military.gov</p>
        </div>
      </div>
    </div>
  );
}
