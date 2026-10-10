import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Calendar, Briefcase, MapPin, User, Phone, PhoneOff, Save, MessageSquare, Check } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

type Candidate = {
  _id: string;
  name: string;
  experience?: string;
  currentSalary?: string;
  location?: string;
  previousCompany?: string;
  education?: string;
  preferredLocation?: string;
  keySkills?: string[];
  profilePic?: string;
  lastModified?: string;
};
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSourceCandidates = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/source-candidates`);
        if (res.data.success) {
          setCandidates(res.data.candidates);
        } else {
          toast.error('Failed to load source candidates');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error fetching source candidates');
      } finally {
        setLoading(false);
      }
    };
    fetchSourceCandidates();
  }, []);


const CandidateSearchDashboard: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState({
    keywords: true,
    company: true,
    location: true,
    experience: true,
  });
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(candidates.map((c) => c._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleAddTo = (action: string) => {
    toast.info(`${action} applied to ${selectedIds.size} candidates`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow-sm mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={selectedIds.size === candidates.length && candidates.length > 0}
            onChange={toggleSelectAll}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="font-medium">Select All</span>
        </div>
        <div className="flex items-center space-x-2">
          <select
            onChange={(e) => handleAddTo(e.target.value)}
            className="border rounded p-1"
          >
            <option value="">Add To …</option>
            <option value="Shortlist">Shortlist</option>
            <option value="Saved Searches">Saved Searches</option>
          </select>
          <button
            onClick={() => toast.info('Reminder set')}
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-1 rounded"
          >
            <Calendar size={16} />
            <span>Set Reminder</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar Filters */}
        <aside className="lg:col-span-1 bg-white p-4 rounded shadow-sm h-fit">
          {/* Keywords */}
          <section className="mb-4">
            <button
              onClick={() => setShowFilters({ ...showFilters, keywords: !showFilters.keywords })}
              className="flex items-center justify-between w-full text-left font-semibold"
            >
              Keywords
              <span>{showFilters.keywords ? '▾' : '▸'}</span>
            </button>
            {showFilters.keywords && (
              <input
                type="text"
                placeholder="Enter keywords"
                className="mt-2 w-full border rounded p-2"
              />
            )}
          </section>

          {/* Current Company */}
          <section className="mb-4">
            <button
              onClick={() => setShowFilters({ ...showFilters, company: !showFilters.company })}
              className="flex items-center justify-between w-full text-left font-semibold"
            >
              Current Company
              <span>{showFilters.company ? '▾' : '▸'}</span>
            </button>
            {showFilters.company && (
              <input
                type="text"
                placeholder="Company name"
                className="mt-2 w-full border rounded p-2"
              />
            )}
          </section>

          {/* Location */}
          <section className="mb-4">
            <button
              onClick={() => setShowFilters({ ...showFilters, location: !showFilters.location })}
              className="flex items-center justify-between w-full text-left font-semibold"
            >
              Location
              <span>{showFilters.location ? '▾' : '▸'}</span>
            </button>
            {showFilters.location && (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Search location"
                  className="w-full border rounded p-2 mb-2"
                />
                {['Bengaluru (44)', 'Pune (9)', 'Mumbai (6)', 'Hyderabad (4)'].map((loc) => (
                  <div key={loc} className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label className="ml-2 text-sm">{loc}</label>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Experience */}
          <section className="mb-4">
            <button
              onClick={() => setShowFilters({ ...showFilters, experience: !showFilters.experience })}
              className="flex items-center justify-between w-full text-left font-semibold"
            >
              Experience (Years)
              <span>{showFilters.experience ? '▾' : '▸'}</span>
            </button>
            {showFilters.experience && (
              <div className="mt-2 flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-1/2 border rounded p-2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-1/2 border rounded p-2"
                />
              </div>
            )}
          </section>
        </aside>

        {/* Main Content */}
        <section className="lg:col-span-3 space-y-4">
          {candidates.map((c) => (
            <div
              key={c._id}
              className="bg-white rounded shadow-sm p-4 flex flex-col md:flex-row items-start md:items-center"
            >
              {/* Left part */}
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(c._id)}
                    onChange={() => toggleSelect(c._id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                  />
                  <h3 className="text-lg font-semibold">{c.name}</h3>
                </div>
                <p className="text-sm text-gray-600">Experience: {c.experience}</p>
                <p className="text-sm text-gray-600">Current Salary: {c.currentSalary}</p>
                <p className="text-sm text-gray-600">Location: {c.location}</p>
                <p className="text-sm text-gray-600">Previous Company: {c.previousCompany}</p>
                <p className="text-sm text-gray-600">Education: {c.education}</p>
                <p className="text-sm text-gray-600">Preferred Location: {c.preferredLocation}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {c.keySkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              {/* Right side actions */}
              <div className="mt-4 md:mt-0 md:ml-4 flex flex-col items-end space-y-2">
                <img src={c.profilePic} alt={c.name} className="w-20 h-20 rounded-full object-cover" />
                <button
                  className="flex items-center space-x-1 bg-gray-200 text-gray-800 px-3 py-1 rounded"
                  onClick={() => toast.info('Phone number revealed')}
                >
                  <Phone size={16} />
                  <span>View Phone Number</span>
                </button>
                <button
                  className="flex items-center space-x-1 bg-green-600 text-white px-3 py-1 rounded"
                  onClick={() => toast.success('Calling candidate…')}
                >
                  <PhoneOff size={16} />
                  <span>Call Candidate</span>
                </button>
                <div className="flex space-x-2">
                  <button
                    className="flex items-center space-x-1 bg-yellow-500 text-white px-2 py-1 rounded"
                    onClick={() => toast.info('Saved')}
                  >
                    <Save size={14} />
                  </button>
                  <button
                    className="flex items-center space-x-1 bg-indigo-500 text-white px-2 py-1 rounded"
                    onClick={() => toast.info('Comment added')}
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Last Modified: {c.lastModified}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CandidateSearchDashboard;
