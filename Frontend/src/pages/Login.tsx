
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Briefcase, X } from "lucide-react";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";
import logo from "../images/logo.png";

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
        navigate(`/${savedUser.designation}`);
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
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Side - Visuals */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 opacity-90" />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            rotate: [0, -90, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-purple-400/20 to-transparent rounded-full blur-3xl"
        />

        {/* Content */}
        <div className="relative z-10 p-12 text-white max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-white/10 backdrop-blur-lg rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl"
          >
            <img src={logo} className="w-20 h-20 object-contain" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-6 leading-tight"
          >
            Recruit Top Talent <br />
            <span className="text-blue-200">Faster & Smarter.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-blue-100 leading-relaxed"
          >
            Streamline your hiring process with our advanced Applicant Tracking
            System. Manage candidates, schedule interviews, and build your dream
            team.
          </motion.p>

          {/* Glass Card Stats */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-12 flex gap-4"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex-1">
              <h3 className="text-2xl font-bold">10k+</h3>
              <p className="text-sm text-blue-200">Candidates Hired</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-4 flex-1">
              <h3 className="text-2xl font-bold">98%</h3>
              <p className="text-sm text-blue-200">Satisfaction Rate</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-slate-50">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-block p-3 rounded-2xl text-blue-600"
            >
              <img src={logo} className="w-20 h-20 object-contain" />
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-bold text-slate-900 mb-2 flex items-center justify-center gap-2"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                Welcome Back
              </span>
              <motion.span
                animate={{ rotate: [0, 20, 0, 20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </motion.h2>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-slate-500"
            >
              Please enter your details to sign in
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full pl-12 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                    errors.email
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200"
                  }`}
                  placeholder="name@company.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 ml-1">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 ml-1">
                Password
              </label>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full pl-12 pr-12 py-3.5 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                    errors.password
                      ? "border-red-500 bg-red-50"
                      : "border-slate-200"
                  }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 ml-1">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errors.general}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-blue-500/30 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
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
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
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
    </div>
  );
}
