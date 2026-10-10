import React, { useState } from "react";

interface FilterPanelProps {
  search: string;
  setSearch: (value: string) => void;
  location: string[];
  setLocation: (value: string[]) => void;
  minExp: string;
  setMinExp: (value: string) => void;
  maxExp: string;
  setMaxExp: (value: string) => void;
  skills: string[];
  setSkills: (value: string[]) => void;
  company: string;
  setCompany: (value: string) => void;
  designation: string;
  setDesignation: (value: string) => void;
  noticePeriod: string;
  setNoticePeriod: (value: string) => void;
  sourceType: string;
  setSourceType: (value: string) => void;
  fromDate: string;
  setFromDate: (value: string) => void;
  toDate: string;
  setToDate: (value: string) => void;
}

export default function FilterPanel({
  search,
  setSearch,
  location,
  setLocation,
  minExp,
  setMinExp,
  maxExp,
  setMaxExp,
  skills,
  setSkills,
  company,
  setCompany,
  designation,
  setDesignation,
  noticePeriod,
  setNoticePeriod,
  sourceType,
  setSourceType,
  fromDate,
  setFromDate,
  toDate,
  setToDate
}: FilterPanelProps) {
  const [skillInput, setSkillInput] = useState("");

  const addSkillTag = () => {
    const tag = skillInput.trim();
    if (tag && !skills.includes(tag)) {
      setSkills([...skills, tag]);
    }
    setSkillInput("");
  };

  const removeSkillTag = (tag: string) => {
    setSkills(skills.filter(t => t !== tag));
  };

  // Simple location handling: treat as comma‑separated values
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vals = e.target.value.split(',').map(v => v.trim()).filter(v => v);
    setLocation(vals);
  };

  return (
    <div>
      {/* Search */}
      <input
        type="text"
        placeholder="Search name, email, skills..."
        className="w-full mb-3 px-3 py-2 border rounded"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Location */}
      <input
        type="text"
        placeholder="Location (comma separated)"
        className="w-full mb-3 px-3 py-2 border rounded"
        value={location.join(", ")}
        onChange={handleLocationChange}
      />

      {/* Experience range */}
      <div className="flex space-x-2 mb-3">
        <input
          type="number"
          placeholder="Min Exp (years)"
          className="flex-1 px-3 py-2 border rounded"
          value={minExp}
          onChange={e => setMinExp(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Exp (years)"
          className="flex-1 px-3 py-2 border rounded"
          value={maxExp}
          onChange={e => setMaxExp(e.target.value)}
        />
      </div>

      {/* Skills multiselect */}
      <div className="mb-3">
        <div className="flex mb-1">
          <input
            type="text"
            placeholder="Add skill"
            className="flex-1 px-3 py-2 border rounded"
            value={skillInput}
            onChange={e => setSkillInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addSkillTag()}
          />
          <button
            className="ml-1 px-3 py-2 bg-blue-600 text-white rounded"
            onClick={addSkillTag}
          >Add</button>
        </div>
        <div className="flex flex-wrap gap-1">
          {skills.map(tag => (
            <span
              key={tag}
              className="bg-gray-200 px-2 py-1 rounded text-sm flex items-center"
            >
              {tag}
              <button
                className="ml-1 text-xs"
                onClick={() => removeSkillTag(tag)}
              >✕</button>
            </span>
          ))}
        </div>
      </div>

      {/* Current Company */}
      <input
        type="text"
        placeholder="Current Company"
        className="w-full mb-3 px-3 py-2 border rounded"
        value={company}
        onChange={e => setCompany(e.target.value)}
      />

      {/* Designation */}
      <input
        type="text"
        placeholder="Designation"
        className="w-full mb-3 px-3 py-2 border rounded"
        value={designation}
        onChange={e => setDesignation(e.target.value)}
      />

      {/* Notice Period */}
      <select
        className="w-full mb-3 px-3 py-2 border rounded"
        value={noticePeriod}
        onChange={e => setNoticePeriod(e.target.value)}
      >
        <option value="">Notice Period</option>
        <option value="Immediate">Immediate</option>
        <option value="15 days">15 days</option>
        <option value="30 days">30 days</option>
        <option value="60 days">60 days</option>
        <option value="90 days">90 days</option>
      </select>

      {/* Source Type */}
      <select
        className="w-full mb-3 px-3 py-2 border rounded"
        value={sourceType}
        onChange={e => setSourceType(e.target.value)}
      >
        <option value="">Source Type</option>
        <option value="Resume Upload">Resume Upload</option>
        <option value="Manual Entry">Manual Entry</option>
      </select>

      {/* Date Added */}
      <div className="flex space-x-2 mb-3">
        <input
          type="date"
          className="flex-1 px-3 py-2 border rounded"
          value={fromDate}
          onChange={e => setFromDate(e.target.value)}
        />
        <input
          type="date"
          className="flex-1 px-3 py-2 border rounded"
          value={toDate}
          onChange={e => setToDate(e.target.value)}
        />
      </div>
    </div>
  );
}
