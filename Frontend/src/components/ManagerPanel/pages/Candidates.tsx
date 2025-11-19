import { useState } from 'react';
import { Mail, Share2, Trash2, Grid, List, ChevronLeft, ChevronRight, ChevronsRight, MessageSquare, Phone, X, MapPin, Calendar, Briefcase, GraduationCap, Download, Star, Search, Filter } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  status: string;
  tags: string[];
  education: string;
  location: string;
  prevLocation: string;
  keySkills: string[];
  experience: string;
  appliedDate: string;
  shortlisted: boolean;
}

export default function Candidates() {
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState('Relevance');
  const [showCount, setShowCount] = useState('40');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const candidates: Candidate[] = [
    {
      id: '1',
      name: 'Dr Chaithra Shankar',
      status: 'Recommended',
      tags: ['Women'],
      education: 'Ph.D/Doctorate RGUHS (JJM college) 2023\nMedical: MS/MD JJM Medical College, Davanagere 2...',
      location: 'Bengaluru',
      prevLocation: 'Bengaluru',
      keySkills: ['trichology', 'chemical peels', 'laser', 'skin', 'dermatology'],
      experience: '2y 🎂 12 Lac(s)',
      appliedDate: 'y29 Oct 25',
      shortlisted: true
    }
  ];

  const handleSelectAll = () => {
    if (selectedCandidates.length === candidates.length) {
      setSelectedCandidates([]);
    } else {
      setSelectedCandidates(candidates.map(c => c.id));
    }
  };

  const toggleCandidate = (id: string) => {
    setSelectedCandidates(prev =>
      prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-600 mt-1">Manage and review all candidate applications</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex items-center gap-8 px-6">
            <button className="px-1 py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
              All responses <span className="ml-1">51</span>
            </button>
            <button className="px-1 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
              Shortlisted <span className="ml-1">8</span>
            </button>
            <button className="px-1 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
              Maybe <span className="ml-1">1</span>
            </button>
            <button className="px-1 py-4 text-sm font-medium text-gray-600 hover:text-gray-900">
              Rejected <span className="ml-1">22</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <button className="px-1 text-sm font-medium text-gray-900">
                All <span className="ml-1">51</span>
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-full border border-blue-200">
                New responses <span className="ml-1">51</span>
              </button>
              <button className="px-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                Not viewed <span className="ml-1">20</span>
              </button>
              <button className="px-1 text-sm font-medium text-gray-600 hover:text-gray-900">
                Action pending <span className="ml-1">20</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">51</span> responses
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Relevance</option>
                  <option>Date</option>
                  <option>Name</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Show</span>
                <select
                  value={showCount}
                  onChange={(e) => setShowCount(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>20</option>
                  <option>40</option>
                  <option>60</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-400 hover:text-gray-600">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">Page 1 of 2</span>
                <button className="p-1.5 text-gray-400 hover:text-gray-600">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button className="p-1.5 text-gray-400 hover:text-gray-600">
                  <ChevronsRight className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-1 border border-gray-300 rounded">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg mb-4 px-4 py-3">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCandidates.length === candidates.length && candidates.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Select all</span>
              </label>

              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <Share2 className="w-4 h-4" />
                Shortlist
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <span className="text-red-500">⊘</span>
                Reject
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <Mail className="w-4 h-4" />
                Email
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <span>👤</span>
                Download
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {candidates.map((candidate) => (
              <div
                key={candidate.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-1 h-12 bg-blue-500 rounded-full"></div>
                    <input
                      type="checkbox"
                      checked={selectedCandidates.includes(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer"
                            onClick={() => setSelectedCandidate(candidate)}
                          >
                            {candidate.name}
                          </h3>
                          <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                            {candidate.status}
                          </span>
                          <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                            {candidate.tags[0]}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                          <span className="flex items-center gap-1">
                            📅 {candidate.experience}
                          </span>
                          <span className="flex items-center gap-1">
                            📍 {candidate.location}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold">
                          DC
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                          <Mail className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-12 gap-y-3 mb-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Education</div>
                        <div className="text-sm text-gray-900">
                          {candidate.education.split('\n')[0]}
                          <br />
                          <span className="text-gray-600">{candidate.education.split('\n')[1]}</span>
                          <button className="ml-1 text-blue-600 hover:underline text-xs">+1 more</button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Job seeker with Ph.D/Doctorate</div>
                        <div className="text-sm text-gray-600">currently living in Bengaluru</div>
                        <div className="flex items-center gap-2 mt-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                            <Phone className="w-4 h-4" />
                            Contact
                          </button>
                          <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                            Status
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Pref. location</div>
                        <div className="text-sm text-gray-900">{candidate.prevLocation}</div>
                      </div>

                      <div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100">
                          <Phone className="w-4 h-4" />
                          Call from app →
                        </button>
                      </div>

                      <div>
                        <div className="text-xs text-gray-500 mb-1">Key skills</div>
                        <div className="text-sm text-gray-900">
                          {candidate.keySkills.join(' | ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <MessageSquare className="w-4 h-4" />
                        Add comment
                      </button>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400">Applied on {candidate.appliedDate}</span>
                        <button className="px-4 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100">
                          Shortlisted
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 pt-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded">
                      <Share2 className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-50 rounded">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-4xl my-8 rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-semibold text-xl">
                  DC
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{selectedCandidate.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded border border-green-200">
                      {selectedCandidate.status}
                    </span>
                    {selectedCandidate.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-xs font-medium">Experience</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">2 years</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <span className="text-xs font-medium">💰 Expected Salary</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">12 Lac(s)</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">Location</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">{selectedCandidate.location}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Applied</span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">Oct 29, 2025</div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Phone className="w-4 h-4" />
                  Contact Candidate
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  <Download className="w-4 h-4" />
                  Download Resume
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 border border-green-300 text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                  <Star className="w-4 h-4" />
                  Shortlist
                </button>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Ph.D/Doctorate RGUHS (JJM college)</div>
                    <div className="text-sm text-gray-600 mt-1">2023</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Medical: MS/MD</div>
                    <div className="text-sm text-gray-600 mt-1">JJM Medical College, Davanagere</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.keySkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">Dermatologist</div>
                    <div className="text-sm text-gray-600 mt-1">Skin Care Clinic, Bengaluru</div>
                    <div className="text-sm text-gray-500 mt-1">2023 - Present • 2 years</div>
                    <p className="text-sm text-gray-600 mt-2">
                      Specialized in trichology, chemical peels, and laser treatments. Provided comprehensive dermatological care to patients.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preferences</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Preferred Location</div>
                    <div className="text-sm font-medium text-gray-900">{selectedCandidate.prevLocation}</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-500 mb-1">Expected Salary</div>
                    <div className="text-sm font-medium text-gray-900">12 Lac(s) per annum</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes & Comments</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <button className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                    <MessageSquare className="w-4 h-4" />
                    Add a note or comment
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t bg-gray-50">
              <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                Reject Candidate
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
                >
                  Close
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Move to Next Stage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
