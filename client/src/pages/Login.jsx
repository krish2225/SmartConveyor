import React, { useState } from 'react';
import { loginAsRole, loginWithCredentials, DEMO_USERS } from '../firebase/auth.js';
import { USER_ROLES } from '../../../shared/constants.js';
import {
  Cpu,
  Shield,
  Wrench,
  UserCheck,
  Lock,
  Mail,
  ArrowRight,
  Zap,
  Building2
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(USER_ROLES.OPERATOR);
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async (roleKey) => {
    setLoading(true);
    try {
      const user = await loginAsRole(roleKey);
      if (onLoginSuccess) onLoginSuccess(user);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const user = await loginWithCredentials(email, password, role);
      if (onLoginSuccess) onLoginSuccess(user);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d14] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      
      {/* Background glow accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25 mb-2">
            <Cpu className="w-8 h-8 text-slate-950 font-black" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Smart<span className="text-cyan-400">Conveyor</span>
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#111726] border border-[#1f293d] text-[11px] font-mono text-cyan-300">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            NMDC BAILADILA IRON ORE MINES | SIH 26008
          </div>

          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Intelligent Conveyor Belt Joint Rupture Monitoring &amp; Predictive Maintenance System
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111726] border border-[#1f293d] rounded-2xl p-6 shadow-2xl space-y-5 glow-border-cyan">
          
          {/* Quick Demo Access (1-Click) */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider font-semibold">
              Instant 1-Click Role Login
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                disabled={loading}
                className="p-3 bg-[#0a0d14] hover:bg-slate-800 border border-[#1f293d] hover:border-cyan-500/50 rounded-xl transition-all flex flex-col items-center gap-1 text-center group"
              >
                <span className="text-xl">👷‍♂️</span>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-400">Operator</span>
                <span className="text-[9px] font-mono text-slate-500">Live Control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('engineer')}
                disabled={loading}
                className="p-3 bg-[#0a0d14] hover:bg-slate-800 border border-[#1f293d] hover:border-cyan-500/50 rounded-xl transition-all flex flex-col items-center gap-1 text-center group"
              >
                <span className="text-xl">👩‍🔧</span>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-400">Engineer</span>
                <span className="text-[9px] font-mono text-slate-500">RUL &amp; Splice</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="p-3 bg-[#0a0d14] hover:bg-slate-800 border border-[#1f293d] hover:border-cyan-500/50 rounded-xl transition-all flex flex-col items-center gap-1 text-center group"
              >
                <span className="text-xl">🛡️</span>
                <span className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-400">Admin</span>
                <span className="text-[9px] font-mono text-slate-500">E-Stop Reset</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-[#1f293d]" />
            <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">
              Or Custom Credentials
            </span>
            <div className="flex-grow border-t border-[#1f293d]" />
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                NMDC Staff Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@nmdc.co.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Password:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl pl-9 pr-3 py-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Role Authority:
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#0a0d14] border border-[#1f293d] rounded-xl px-3 py-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value={USER_ROLES.OPERATOR}>Control Shift Operator</option>
                <option value={USER_ROLES.ENGINEER}>Maintenance Engineer</option>
                <option value={USER_ROLES.ADMIN}>Site Plant Admin (Full Control)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Plant Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] font-mono text-slate-500">
          NMDC Bailadila Complex • Conveyor Health Interlocking v1.0.0
        </div>

      </div>
    </div>
  );
}
