import { motion } from 'framer-motion';
import { X, ChevronDown, ChevronUp, Plus, Trash2, Upload } from 'lucide-react';
import { useState, useRef } from 'react';
import { Candidate, JobOpening, Skill, Experience, Education, Certification } from '../pages/UploadCV';

interface CandidateModalProps {
  job: JobOpening;
  candidate: Candidate | null;
  onClose: () => void;
  onSave: (candidate: Omit<Candidate, 'id' | 'appliedDate'>) => void;
}

export default function CandidateModal({ job, candidate, onClose, onSave }: CandidateModalProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    skills: false,
    experience: false,
    education: false,
    certifications: false,
    additional: false,
  });

  const [formData, setFormData] = useState<Omit<Candidate, 'id' | 'appliedDate'>>({
    firstName: candidate?.firstName || '',
    lastName: candidate?.lastName || '',
    email: candidate?.email || '',
    phone: candidate?.phone || '',
    location: candidate?.location || '',
    currentTitle: candidate?.currentTitle || '',
    currentCompany: candidate?.currentCompany || '',
    totalExperience: candidate?.totalExperience || 0,
    skills: candidate?.skills || [],
    experience: candidate?.experience || [],
    education: candidate?.education || [],
    certifications: candidate?.certifications || [],
    resumeUrl: candidate?.resumeUrl || '',
    linkedinUrl: candidate?.linkedinUrl || '',
    portfolioUrl: candidate?.portfolioUrl || '',
    source: candidate?.source || '',
    status: candidate?.status || 'New',
    notes: candidate?.notes || '',
    recruiterAssigned: candidate?.recruiterAssigned || '',
    jobId: candidate?.jobId || job.id,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFormData({ ...formData, resumeUrl: url });
    }
  };

  const addSkill = () => {
    setFormData({
      ...formData,
      skills: [...formData.skills, { name: '', yearsOfExperience: 0, proficiencyLevel: 'Beginner' }],
    });
  };

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setFormData({ ...formData, skills: updatedSkills });
  };

  const removeSkill = (index: number) => {
    setFormData({ ...formData, skills: formData.skills.filter((_, i) => i !== index) });
  };

  const addExperience = () => {
    setFormData({
      ...formData,
      experience: [...formData.experience, {
        title: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        description: '',
      }],
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: string | boolean) => {
    const updatedExperience = [...formData.experience];
    updatedExperience[index] = { ...updatedExperience[index], [field]: value };
    setFormData({ ...formData, experience: updatedExperience });
  };

  const removeExperience = (index: number) => {
    setFormData({ ...formData, experience: formData.experience.filter((_, i) => i !== index) });
  };

  const addEducation = () => {
    setFormData({
      ...formData,
      education: [...formData.education, { degree: '', institution: '', field: '', graduationYear: new Date().getFullYear() }],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: string | number) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setFormData({ ...formData, education: updatedEducation });
  };

  const removeEducation = (index: number) => {
    setFormData({ ...formData, education: formData.education.filter((_, i) => i !== index) });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, {
        name: '',
        issuingOrganization: '',
        issueDate: '',
        expirationDate: '',
      }],
    });
  };

  const updateCertification = (index: number, field: keyof Certification, value: string) => {
    const updatedCertifications = [...formData.certifications];
    updatedCertifications[index] = { ...updatedCertifications[index], [field]: value };
    setFormData({ ...formData, certifications: updatedCertifications });
  };

  const removeCertification = (index: number) => {
    setFormData({ ...formData, certifications: formData.certifications.filter((_, i) => i !== index) });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {candidate ? 'Edit Candidate' : 'Add New Candidate'}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Position: <span className="font-semibold">{job.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            <Section
              title="Personal Information"
              expanded={expandedSections.personal}
              onToggle={() => toggleSection('personal')}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
                <Input
                  label="Last Name"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <Input
                  label="Current Title"
                  value={formData.currentTitle}
                  onChange={(e) => setFormData({ ...formData, currentTitle: e.target.value })}
                />
                <Input
                  label="Current Company"
                  value={formData.currentCompany}
                  onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                />
                <Input
                  label="Total Experience (Years)"
                  type="number"
                  min="0"
                  value={formData.totalExperience}
                  onChange={(e) => setFormData({ ...formData, totalExperience: Number(e.target.value) })}
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Resume / CV
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Upload size={18} />
                    Upload Resume
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {formData.resumeUrl && (
                    <span className="text-sm text-green-600 font-medium">Resume uploaded</span>
                  )}
                </div>
              </div>
            </Section>

            <Section
              title="Skills"
              expanded={expandedSections.skills}
              onToggle={() => toggleSection('skills')}
            >
              <div className="space-y-4">
                {formData.skills.map((skill, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Skill Name"
                        value={skill.name}
                        onChange={(e) => updateSkill(index, 'name', e.target.value)}
                      />
                      <Input
                        label="Years of Experience"
                        type="number"
                        min="0"
                        step="0.5"
                        value={skill.yearsOfExperience}
                        onChange={(e) => updateSkill(index, 'yearsOfExperience', Number(e.target.value))}
                      />
                      <Select
                        label="Proficiency Level"
                        value={skill.proficiencyLevel}
                        onChange={(e) => updateSkill(index, 'proficiencyLevel', e.target.value)}
                        options={['Beginner', 'Intermediate', 'Advanced', 'Expert']}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="mt-7 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addSkill}
                  className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Skill
                </button>
              </div>
            </Section>

            <Section
              title="Work Experience"
              expanded={expandedSections.experience}
              onToggle={() => toggleSection('experience')}
            >
              <div className="space-y-4">
                {formData.experience.map((exp, index) => (
                  <div key={index} className="p-4 bg-slate-50 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-slate-700">Experience #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Job Title"
                        value={exp.title}
                        onChange={(e) => updateExperience(index, 'title', e.target.value)}
                      />
                      <Input
                        label="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(index, 'company', e.target.value)}
                      />
                      <Input
                        label="Location"
                        value={exp.location}
                        onChange={(e) => updateExperience(index, 'location', e.target.value)}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          label="Start Date"
                          type="month"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                        />
                        {!exp.current && (
                          <Input
                            label="End Date"
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={exp.current}
                        onChange={(e) => updateExperience(index, 'current', e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      Currently working here
                    </label>
                    <Textarea
                      label="Description"
                      value={exp.description}
                      onChange={(e) => updateExperience(index, 'description', e.target.value)}
                      rows={3}
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addExperience}
                  className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Experience
                </button>
              </div>
            </Section>

            <Section
              title="Education"
              expanded={expandedSections.education}
              onToggle={() => toggleSection('education')}
            >
              <div className="space-y-4">
                {formData.education.map((edu, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                      />
                      <Input
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      />
                      <Input
                        label="Field of Study"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      />
                      <Input
                        label="Graduation Year"
                        type="number"
                        min="1950"
                        max="2050"
                        value={edu.graduationYear}
                        onChange={(e) => updateEducation(index, 'graduationYear', Number(e.target.value))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEducation(index)}
                      className="mt-7 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEducation}
                  className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Education
                </button>
              </div>
            </Section>

            <Section
              title="Certifications"
              expanded={expandedSections.certifications}
              onToggle={() => toggleSection('certifications')}
            >
              <div className="space-y-4">
                {formData.certifications.map((cert, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Certification Name"
                        value={cert.name}
                        onChange={(e) => updateCertification(index, 'name', e.target.value)}
                      />
                      <Input
                        label="Issuing Organization"
                        value={cert.issuingOrganization}
                        onChange={(e) => updateCertification(index, 'issuingOrganization', e.target.value)}
                      />
                      <Input
                        label="Issue Date"
                        type="month"
                        value={cert.issueDate}
                        onChange={(e) => updateCertification(index, 'issueDate', e.target.value)}
                      />
                      <Input
                        label="Expiration Date (Optional)"
                        type="month"
                        value={cert.expirationDate || ''}
                        onChange={(e) => updateCertification(index, 'expirationDate', e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertification(index)}
                      className="mt-7 text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCertification}
                  className="w-full py-2 px-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Certification
                </button>
              </div>
            </Section>

            <Section
              title="Additional Information"
              expanded={expandedSections.additional}
              onToggle={() => toggleSection('additional')}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="LinkedIn URL"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  />
                  <Input
                    label="Portfolio URL"
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                  />
                  <Input
                    label="Source"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g., LinkedIn, Referral, Indeed"
                  />
                  <Select
                    label="Status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Candidate['status'] })}
                    options={['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']}
                  />
                  <Input
                    label="Recruiter Assigned"
                    value={formData.recruiterAssigned}
                    onChange={(e) => setFormData({ ...formData, recruiterAssigned: e.target.value })}
                  />
                </div>
                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Add any additional notes about this candidate..."
                />
              </div>
            </Section>
          </div>

          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {candidate ? 'Update Candidate' : 'Save Candidate'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function Section({
  title,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between"
      >
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
}

function Input({
  label,
  required,
  ...props
}: {
  label: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        {...props}
        required={required}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      />
    </div>
  );
}

function Select({
  label,
  options,
  ...props
}: {
  label: string;
  options: string[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function Textarea({
  label,
  ...props
}: {
  label: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <textarea
        {...props}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
      />
    </div>
  );
}
