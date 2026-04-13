import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Activity, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@/lib/api";
import "./css/Login.css";

interface LoginProfile {
  id: string;
  label: string;
  icon: string;
  email: string;
  role: string;
  department: string;
  full_name: string;
}

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedProfile, setSelectedProfile] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch login profiles from database
  const { data: profiles = [], isLoading: profilesLoading, error: profilesError } = useQuery<LoginProfile[]>({
    queryKey: ["login-profiles"],
    queryFn: usersAPI.getProfiles,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const from = (location.state as any)?.from?.pathname || "/";

  const handleProfileClick = async (profile: LoginProfile) => {
    setSelectedProfile(profile.id);
    setEmail(profile.email);
    setPassword(""); // Password will be handled by the backend based on the email
    setError(null);
    setLoading(true);

    try {
      // For demo purposes, we'll use default passwords based on role
      const defaultPasswords = {
        'admin': 'admin123',
        'asset_manager': 'user123',
        'technician': 'user123',
        'department_head': 'user123',
        'staff': 'user123'
      };

      await login({ email: profile.email, password: defaultPasswords[profile.role] || 'user123' });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ── LEFT — brandin*/}
      <div className="login-panel-left">

        {/* Background Image */}
        <div className="login-panel-image">
          <img
            src="https://images.pexels.com/photos/3938022/pexels-photo-3938022.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1600"
            alt="Healthcare Management"
            className="login-image-asset"
          />
          <div className="login-image-overlay" />
        </div>

        {/* Decorative rings */}
        <div className="login-rings">
          <div className="login-ring login-ring-1" />
          <div className="login-ring login-ring-2" />
          <div className="login-ring login-ring-3" />
        </div>

        {/* Floating status chips */}
        <div className="login-chips">
          <div className="login-chip login-chip-1">
            <span className="login-chip-dot" />
            Assets tracked
          </div>
          <div className="login-chip login-chip-2">
            <span className="login-chip-dot amber" />
            Maintenance alerts
          </div>
          <div className="login-chip login-chip-3">
            <span className="login-chip-dot white" />
            Departments synced
          </div>
          <div className="login-chip login-chip-4">
            <span className="login-chip-dot" />
            Live dashboard
          </div>
        </div>

        {/* Brand content */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Activity className="w-10 h-10" />
          </div>

          <h1 className="login-brand-title">MRRH Asset System</h1>
          <p className="login-brand-sub">
            Mbale Regional Referral Hospital<br />
            Comprehensive Asset Information<br />Management System
          </p>

          {/* Stats row */}
          <div className="login-stats">
            <div className="login-stat">
              <div className="login-stat-val">500+</div>
              <div className="login-stat-label">Assets</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-val">18</div>
              <div className="login-stat-label">Depts</div>
            </div>
            <div className="login-stat">
              <div className="login-stat-val">99%</div>
              <div className="login-stat-label">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — for*/}
      <div className="login-panel-right">
        <div className="login-card">

          {/* Mobile logo (hidden on lg+) */}
          <div className="login-mobile-logo">
            <div className="login-mobile-icon">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="login-mobile-name">MRRH</div>
              <div className="login-mobile-tagline">Asset Management</div>
            </div>
          </div>

          <h2 className="login-heading">Your Welcome!</h2>
          <p className="login-subheading">Sign in to your account to continue</p>

          {/* Profile Selection */}
          <div className="login-profile-section">
            <label className="login-profile-label">Select your profile</label>
            {profilesLoading ? (
              <div className="login-profile-loading">
                <div className="login-profile-spinner">↻</div>
                <span>Loading profiles...</span>
              </div>
            ) : profilesError ? (
              <div className="login-profile-error">
                Failed to load profiles. Please refresh the page.
              </div>
            ) : (
              <div className="login-profile-grid">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleProfileClick(profile)}
                    disabled={loading}
                    className={`login-profile-button ${selectedProfile === profile.id ? "active" : ""} ${loading ? "disabled" : ""}`}
                  >
                    <span className="login-profile-icon">{profile.icon}</span>
                    <span className="login-profile-name">{profile.label}</span>
                    {selectedProfile === profile.id && loading && (
                      <span className="login-profile-spinner">↻</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="login-form">

            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email address</label>
              <Input
                type="email"
                placeholder="name@mrrh.go.ug"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <div className="login-password-wrap">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="login-error">{error}</div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="login-submit w-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>
          </form>

          {/* Sign-up link */}
          <p className="login-footer-link">
            Don&apos;t have an account?{" "}
            <Link to="/signup">Sign up</Link>
          </p>

          {/* Copyright */}
          <p className="login-copyright">
            © 2026 Mbale Regional Referral Hospital
          </p>
        </div>
      </div>
    </div>
  );
}
export default Login;;