// import { motion } from "framer-motion";
// import { Mail, Lock, User, Eye, EyeOff, Briefcase } from "lucide-react";
// import { useState, FormEvent } from "react";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthProvider";

// export default function Login() {
//   const navigate = useNavigate();

//   const { user, login } = useAuth();

//   const [formData, setFormData] = useState({
//     email: "",
//     password: "",
    
//   });

//   const [showPassword, setShowPassword] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});

//   const validateForm = () => {
//     const newErrors: Record<string, string> = {};

//     if (!formData.email) {
//       newErrors.email = "Email is required";
//     } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
//       newErrors.email = "Please enter a valid email";
//     }

//     if (!formData.password) {
//       newErrors.password = "Password is required";
//     } else if (formData.password.length < 6) {
//       newErrors.password = "Password must be at least 6 characters";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//  const handleSubmit = async (e: FormEvent) => {
//    e.preventDefault();

//    if (!validateForm()) return;

//    const success = await login(formData.email, formData.password);

//    if (success) {
//      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
//     //  if (savedUser?.designation) {
//     //    navigate(`/${savedUser.designation}`);
//     //  }
//     if (savedUser?.email === "manager@gmail.com") {
//   navigate("/Manager");
// } else if (savedUser?.designation) {
//   navigate(`/${savedUser.designation}`);
// }

//    } else {
//      setErrors({ general: "Invalid email or password" });
//    }
//  };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5 }}
//         className="w-full max-w-md"
//       >
//         <div className="text-center mb-8">
//           <motion.div
//             initial={{ scale: 0 }}
//             animate={{ scale: 1 }}
//             transition={{ delay: 0.2, type: "spring" }}
//             className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg"
//           >
//             <Briefcase size={40} className="text-white" />
//           </motion.div>
//           <h1 className="text-3xl font-bold text-slate-800 mb-2">ATS Portal</h1>
//           <p className="text-slate-600">Sign in to access your dashboard</p>
//         </div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.3 }}
//           className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
//         >
//           <form onSubmit={handleSubmit} className="space-y-6">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-2">
//                 Email Address
//               </label>
//               <div className="relative">
//                 <Mail
//                   size={18}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//                 />
//                 <input
//                   type="email"
//                   value={formData.email}
//                   onChange={(e) =>
//                     setFormData({ ...formData, email: e.target.value })
//                   }
//                   className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                     errors.email ? "border-red-500" : "border-slate-300"
//                   }`}
//                   placeholder="your.email@company.com"
//                 />
//               </div>
//               {errors.email && (
//                 <p className="mt-1 text-sm text-red-600">{errors.email}</p>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-2">
//                 Password
//               </label>
//               <div className="relative">
//                 <Lock
//                   size={18}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
//                 />
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   value={formData.password}
//                   onChange={(e) =>
//                     setFormData({ ...formData, password: e.target.value })
//                   }
//                   className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
//                     errors.password ? "border-red-500" : "border-slate-300"
//                   }`}
//                   placeholder="Enter your password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword(!showPassword)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
//                 >
//                   {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                 </button>
//               </div>
//               {errors.password && (
//                 <p className="mt-1 text-sm text-red-600">{errors.password}</p>
//               )}
//             </div>

//             {/* <div>
//               <label className="block text-sm font-medium text-slate-700 mb-2">
//                 Designation
//               </label>
//               <div className="relative">
//                 <User
//                   size={18}
//                   className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
//                 />
//                 <select
//                   value={formData.designation}
//                   onChange={(e) =>
//                     setFormData({
//                       ...formData,
//                       designation: e.target.value as
//                         | "Recruiter"
//                         | "Manager"
//                         | "Mentor",
//                     })
//                   }
//                   className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all appearance-none bg-white"
//                 >
//                   <option value="Admin">Admin</option>
//                   <option value="Recruiter">Recruiter</option>
//                   <option value="Manager">Manager</option>
//                   <option value="Mentor">Mentor</option>
//                 </select>
//               </div>
//             </div> */}

//             {errors.general && (
//               <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
//                 <p className="text-sm text-red-600">{errors.general}</p>
//               </div>
//             )}

//             <button
//               type="submit"
//               className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg"
//             >
//               Sign In
//             </button>

          
//           </form>
//         </motion.div>

      
//       </motion.div>
//     </div>
//   );
// }
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Briefcase } from "lucide-react";
import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const success = await login(formData.email, formData.password);

    if (success) {
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (savedUser?.designation) {
        const route = savedUser.designation.toLowerCase();
        navigate(`/${route}`);
      }
    } else {
      setErrors({ general: "Invalid email or password" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg"
          >
            <Briefcase size={40} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">ATS Portal</h1>
          <p className="text-slate-600">Sign in to access your dashboard</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.email ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="your.email@company.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${
                    errors.password ? "border-red-500" : "border-slate-300"
                  }`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              Sign In
            </button>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-900 mb-2">Demo Credentials:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div><strong>Manager:</strong> manager@company.com / manager123</div>
                <div><strong>Recruiter:</strong> recruiter@company.com / recruiter123</div>
                <div><strong>Admin:</strong> admin@company.com / admin123</div>
                <div><strong>Mentor:</strong> mentor@company.com / mentor123</div>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}
