import React, { useState } from 'react';
import { loginAsRole, loginWithCredentials, DEMO_USERS } from '../firebase/auth.js';
import { USER_ROLES } from '../../../shared/constants.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Badge } from '../components/ui/badge.jsx';
import {
  Cpu,
  Lock,
  Mail,
  ArrowRight,
  Building2,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { cn } from '../lib/utils.js';

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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden bg-grid-pattern select-none">
      
      {/* Background glow accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full space-y-4 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-primary/20 border border-primary/40 text-primary shadow-lg mb-1">
            <Cpu className="w-6 h-6 text-primary" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            Smart<span className="text-primary">Conveyor</span>
          </h1>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-sunken border border-border text-[10px] font-mono text-cyan-300">
            <Building2 className="w-3 h-3 text-primary" />
            NMDC BAILADILA IRON ORE MINES • SIH 26008
          </div>

          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Intelligent Conveyor Joint Rupture Monitoring &amp; Predictive Maintenance Console
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-5 shadow-2xl space-y-4 bg-surface border-border">
          
          {/* Quick Demo Access (1-Click) */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider font-bold">
              Instant 1-Click Role Login
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('operator')}
                disabled={loading}
                className="p-2.5 bg-surface-sunken hover:bg-muted border border-border hover:border-primary/50 rounded transition-all flex flex-col items-center gap-1 text-center group cursor-pointer"
              >
                <span className="text-lg">👷‍♂️</span>
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary">Operator</span>
                <span className="text-[9px] font-mono text-muted-foreground">Live Control</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('engineer')}
                disabled={loading}
                className="p-2.5 bg-surface-sunken hover:bg-muted border border-border hover:border-primary/50 rounded transition-all flex flex-col items-center gap-1 text-center group cursor-pointer"
              >
                <span className="text-lg">👩‍🔧</span>
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary">Engineer</span>
                <span className="text-[9px] font-mono text-muted-foreground">RUL &amp; Splice</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={loading}
                className="p-2.5 bg-surface-sunken hover:bg-muted border border-border hover:border-primary/50 rounded transition-all flex flex-col items-center gap-1 text-center group cursor-pointer"
              >
                <span className="text-lg">🛡️</span>
                <span className="text-[11px] font-bold text-foreground group-hover:text-primary">Admin</span>
                <span className="text-[9px] font-mono text-muted-foreground">E-Stop Reset</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-border" />
            <span className="flex-shrink mx-2 text-[9px] font-mono text-muted-foreground uppercase">
              Or Custom Authority
            </span>
            <div className="flex-grow border-t border-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleCustomLogin} className="space-y-3 text-xs">
            <div className="space-y-1">
              <Label className="text-muted-foreground font-semibold text-xs">
                NMDC Staff Email:
              </Label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="email"
                  required
                  placeholder="name@nmdc.co.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground font-semibold text-xs">
                Password:
              </Label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-muted-foreground font-semibold text-xs">
                Role Authority:
              </Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-sunken border border-border rounded-md px-2.5 py-1.5 text-foreground focus:border-primary focus:outline-none font-mono text-xs"
              >
                <option value={USER_ROLES.OPERATOR}>Control Shift Operator</option>
                <option value={USER_ROLES.ENGINEER}>Maintenance Engineer</option>
                <option value={USER_ROLES.ADMIN}>Site Plant Admin (Full Control)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={loading}
              className="w-full gap-2 font-bold font-mono text-xs mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In to Plant Console'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

        </Card>

        {/* Footer info */}
        <div className="text-center text-[10px] font-mono text-muted-foreground">
          NMDC Bailadila Complex • Conveyor Health Interlocking v1.0.0
        </div>

      </div>
    </div>
  );
}
