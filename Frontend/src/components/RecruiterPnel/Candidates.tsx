import { motion } from 'framer-motion';
import { Search, Mail, Phone, MapPin, MoreVertical } from 'lucide-react';

const candidates = [
  {
    id: 1,
    name: 'John Smith',
    position: 'Frontend Developer',
    email: 'john.smith@email.com',
    phone: '+1 234 567 8900',
    location: 'New York, NY',
    status: 'Shortlisted',
    statusColor: 'bg-green-100 text-green-700',
  },
  {
    id: 2,
    name: 'Emily Davis',
    position: 'UI/UX Designer',
    email: 'emily.davis@email.com',
    phone: '+1 234 567 8901',
    location: 'San Francisco, CA',
    status: 'Interview',
    statusColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 3,
    name: 'Michael Brown',
    position: 'Backend Engineer',
    email: 'michael.b@email.com',
    phone: '+1 234 567 8902',
    location: 'Austin, TX',
    status: 'Under Review',
    statusColor: 'bg-amber-100 text-amber-700',
  },
  {
    id: 4,
    name: 'Sarah Wilson',
    position: 'Product Manager',
    email: 'sarah.w@email.com',
    phone: '+1 234 567 8903',
    location: 'Seattle, WA',
    status: 'Shortlisted',
    statusColor: 'bg-green-100 text-green-700',
  },
];

export default function Candidates() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold text-slate-800 mb-2">List of All Candidates</h1>
      <p className="text-slate-600 mb-8">Manage and track your candidate pipeline</p>

      <div className="bg-white rounded-xl shadow-md border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <select className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
              <option>All Status</option>
              <option>Shortlisted</option>
              <option>Interview</option>
              <option>Under Review</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Position</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Contact</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate, index) => (
                <motion.tr
                  key={candidate.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {candidate.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-800">{candidate.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{candidate.position}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail size={14} />
                        <span>{candidate.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone size={14} />
                        <span>{candidate.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={16} />
                      <span className="text-sm">{candidate.location}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${candidate.statusColor}`}>
                      {candidate.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
