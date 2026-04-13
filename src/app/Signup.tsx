import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import "./css/login.css";

const ROLE_OPTIONS = [
  { value: "asset_manager", label: "Asset Manager" },
  { value: "technician", label: "Technician" },
  { value: "department_head", label: "Department Head" },
  { value: "staff", label: "Staff" },
];

//main interface SignupData {
const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ full_name: fullName, username, email, password, role });
      navigate("/");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">

      {/* ── LEFT — branding panel */}
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
        <div className="login-rings">
          <div className="login-ring login-ring-1" />
          <div className="login-ring login-ring-2" />
          <div className="login-ring login-ring-3" />
        </div>

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

        <div className="login-brand">
          <div className="login-brand-icon">
            <Activity className="w-10 h-10" />
          </div>
          <h1 className="login-brand-title">MRRH Asset System</h1>
          <p className="login-brand-sub">
            Mbale Regional Referral Hospital<br />
            Asset Information<br />Management System
          </p>
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

      {/* ── RIGHT — form panel ─*/}
      <div className="login-panel-right">
        <div className="login-card">

          {/* Mobile logo */}
          <div className="login-mobile-logo">
            <div className="login-mobile-icon">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="login-mobile-name">MRRH</div>
              <div className="login-mobile-tagline">Asset Management</div>
            </div>
          </div>

          <h2 className="login-heading">Create account</h2>
          <p className="login-subheading">Register with a non-admin role to get started.</p>

          <form onSubmit={handleSubmit} className="login-form">

            {/* Full name */}
            <div className="login-field">
              <label className="login-label">Full name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>

            {/* Username */}
            <div className="login-field">
              <label className="login-label">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="janedoe"
              />
            </div>

            {/* Email */}
            <div className="login-field">
              <label className="login-label">Email address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@mrrh.local"
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
              />
            </div>

            {/* Role */}
            <div className="login-field">
              <label className="login-label">Role</label>
              <select
                className="users-form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
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
              {loading ? "Creating account…" : "Create account"}
            </Button>
          </form>

          {/* Sign-in link */}
          <p className="login-footer-link">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;