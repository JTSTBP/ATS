
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Star, Zap, X } from "lucide-react";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import logo from "../images/logo.png";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    setIsLoading(false);

    if (success) {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (savedUser?.designation) {
        // Finance users should go to Admin panel
        const route = savedUser.designation === 'Finance' ? 'Admin' : savedUser.designation;
        navigate(`/${route}`);
      }
    } else {
      setErrors({ general: "Invalid email or password" });
    }
  };

  const handleForgotPassword = (e: FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    // Simulate sending reset email
    setResetSent(true);
    setTimeout(() => {
      setShowForgotPassword(false);
      setResetSent(false);
      setForgotEmail("");
    }, 3000);
  };

  return (
    <main className="login-page">
      <section className="login-hero" aria-labelledby="login-headline">
        <div className="login-brand"><img src={logo} alt="Jobs Territory" /></div>
        <div className="login-hero-content">
          <div className="login-badge"><span aria-hidden="true" />Next-gen applicant tracking system</div>
          <h1 id="login-headline">Recruit Top Talent<br /><span className="login-animated-headline" aria-label="Faster & Smarter.">{Array.from("Faster & Smarter.").map((letter, index) => <span key={index} aria-hidden="true" style={{ animationDelay: `${(index + 1) * 0.05}s` }}>{letter === " " ? "\u00a0" : letter}</span>)}</span></h1>
          <p className="login-description">Streamline your hiring workflow with our advanced ATS. Manage candidate pipelines, schedule intelligent interviews, and build your dream team effortlessly.</p>
          <div className="login-stats">
            <div><strong>10k+</strong><span>Candidates hired</span></div>
            <div><strong>98%</strong><span>Satisfaction rate</span></div>
            <div className="login-highlight"><b><Zap size={16} aria-hidden="true" /> AI powered</b><span>Automated resume parsing &amp; matching</span></div>
          </div>
        </div>
        <footer className="login-hero-footer"><p><Star size={18} fill="currentColor" aria-hidden="true" /><span>“Every connection brings you closer to your next superstar hire.”</span></p></footer>
      </section>
      <section className="login-form-side" aria-labelledby="login-title">
        <div className="login-card">
          <header className="login-card-header">
            <div className="login-brand login-brand-card"><img src={logo} alt="Jobs Territory" /></div>
            <h2 id="login-title">Welcome Back <span aria-hidden="true">👋</span></h2>
            <p>Please enter your credentials to access your dashboard</p>
          </header>
          <form onSubmit={handleSubmit} className="login-form" aria-busy={isLoading}>
            <div className="login-field">
              <label htmlFor="login-email">Email address</label>
              <div className="login-input-wrap">
                <Mail size={20} aria-hidden="true" />
                <input id="login-email" name="email" type="email" autoComplete="username" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="recruiter@company.com" aria-invalid={!!errors.email} aria-describedby={errors.email ? "login-email-error" : undefined} />
              </div>
              {errors.email && <p id="login-email-error" className="login-error" role="alert">{errors.email}</p>}
            </div>
            <div className="login-field">
              <label htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={20} aria-hidden="true" />
                <input id="login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" aria-invalid={!!errors.password} aria-describedby={errors.password ? "login-password-error" : undefined} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button>
              </div>
              {errors.password && <p id="login-password-error" className="login-error" role="alert">{errors.password}</p>}
            </div>
            <div className="login-form-options"><button type="button" onClick={() => setShowForgotPassword(true)}>Forgot password?</button></div>
            {errors.general && <p className="login-error login-error-general" role="alert">{errors.general}</p>}
            <button type="submit" disabled={isLoading} className="login-submit">{isLoading ? "Signing in…" : <>Sign in <ArrowRight size={21} aria-hidden="true" /></>}</button>
          </form>
          <footer className="login-card-footer">Need recruiter access?<br /><span>Contact your system admin</span></footer>
        </div>
      </section>
      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-md p-6 md:p-8 relative"
            >
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setForgotEmail("");
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center mb-6">
                <div className="inline-block mb-4 p-3 rounded-2xl bg-blue-50 text-blue-600">
                  <Mail size={32} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                  Forgot Password?
                </h3>
                <p className="text-slate-500 text-sm">
                  {resetSent
                    ? "Check your email for reset instructions"
                    : "Enter your email and we'll send you a reset link"}
                </p>
              </div>

              {!resetSent ? (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative group">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                      size={20}
                    />
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-blue-500/30"
                  >
                    Send Reset Link
                  </button>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-slate-600 font-medium">
                    Password reset link sent to
                    <br />
                    <span className="text-blue-600">{forgotEmail}</span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}



