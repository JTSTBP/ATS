
// import { useState } from "react";

// export default function SettingsTab() {
//   const [settings, setSettings] = useState({
//     companyName: "Streelancer ATS",
//     timezone: "Asia/Kolkata",
//     emailNotifications: true,
//   });

//   const handleSave = () => {
//     console.log("Saved settings:", settings);
//   };

//   return (
//     <div className="p-8 bg-slate-50 min-h-screen">
//       <h1 className="text-3xl font-bold text-slate-800 mb-8">Settings</h1>

//       <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 max-w-2xl">
//         <label className="block mb-4">
//           <span className="text-slate-700 font-medium">Company Name</span>
//           <input
//             type="text"
//             value={settings.companyName}
//             onChange={(e) =>
//               setSettings({ ...settings, companyName: e.target.value })
//             }
//             className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5"
//           />
//         </label>

//         <label className="block mb-4">
//           <span className="text-slate-700 font-medium">Timezone</span>
//           <select
//             value={settings.timezone}
//             onChange={(e) =>
//               setSettings({ ...settings, timezone: e.target.value })
//             }
//             className="mt-2 w-full border border-slate-300 rounded-lg px-4 py-2.5"
//           >
//             <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
//             <option value="UTC">UTC</option>
//             <option value="America/New_York">America/New_York (EST)</option>
//           </select>
//         </label>

//         <label className="flex items-center gap-3 mb-6">
//           <input
//             type="checkbox"
//             checked={settings.emailNotifications}
//             onChange={(e) =>
//               setSettings({ ...settings, emailNotifications: e.target.checked })
//             }
//           />
//           <span className="text-slate-700">Enable Email Notifications</span>
//         </label>

//         <button
//           onClick={handleSave}
//           className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700"
//         >
//           Save Changes
//         </button>
//       </div>
//     </div>
//   );
// }


import { User, Bell, Shield, Moon, Sun } from "lucide-react";
import { useState } from "react";

export default function SettingsTab() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  return (
    <div className="text-slate-800">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        <p className="text-sm md:text-base text-slate-500 mt-1">
          Manage your profile, system preferences, and security configurations.
        </p>
      </div>

      {/* Profile Settings */}
      <div className="bg-white shadow rounded-xl p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <User className="text-blue-600" size={20} />
          <h2 className="text-base md:text-lg font-semibold">Profile Settings</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 text-sm mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Agarwal Muskan"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm mb-1">Email</label>
            <input
              type="email"
              defaultValue="agarwalmuskan248@example.com"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-slate-600 text-sm mb-1">Role</label>
          <input
            type="text"
            value="Admin"
            disabled
            className="w-full border border-slate-200 bg-slate-50 text-slate-500 rounded-lg px-3 py-2"
          />
        </div>

        <div className="mt-6">
          <button className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
            Save Changes
          </button>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white shadow rounded-xl p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="text-orange-500" size={20} />
          <h2 className="text-base md:text-lg font-semibold">System Preferences</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 py-3">
          <div className="flex-1">
            <p className="font-medium">Dark Mode</p>
            <p className="text-slate-500 text-sm">
              Toggle between light and dark theme.
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center gap-2 px-3 py-1 border border-slate-300 rounded-lg hover:bg-slate-100"
          >
            {darkMode ? <Moon size={18} /> : <Sun size={18} />}
            <span>{darkMode ? "On" : "Off"}</span>
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-200 py-3">
          <div>
            <p className="font-medium">Email Notifications</p>
            <p className="text-slate-500 text-sm">
              Get alerts about new reports, user updates, and activities.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white shadow rounded-xl p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="text-red-500" size={20} />
          <h2 className="text-base md:text-lg font-semibold">Security Settings</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 py-3">
          <div className="flex-1">
            <p className="font-medium">Change Password</p>
            <p className="text-slate-500 text-sm">
              It’s recommended to update your password every 90 days.
            </p>
          </div>
          <button className="text-blue-600 hover:underline font-medium">
            Update
          </button>
        </div>

        <div className="flex items-center justify-between py-3">
          <div>
            <p className="font-medium">Two-Factor Authentication</p>
            <p className="text-slate-500 text-sm">
              Add an extra layer of security to your account.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={twoFactorAuth}
              onChange={() => setTwoFactorAuth(!twoFactorAuth)}
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
          </label>
        </div>
      </div>
    </div>
  );
}
