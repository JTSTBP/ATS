import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Candidate = {
  id: string;
  full_name: string;
};

type Application = {
  id: string;
  candidate_id: string;
};

type FeedbackFormProps = {
  onClose: () => void;
  onSave: (data?: any) => void;
};

export const FeedbackForm = ({ onClose, onSave }: FeedbackFormProps) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [formData, setFormData] = useState({
    candidate_id: "",
    application_id: "",
    comment: "",
    rating: 3,
    feedback_type: "General",
    color_code: "blue",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Simulate fetching data (replace with your own backend logic)
    setCandidates([
      { id: "1", full_name: "John Doe" },
      { id: "2", full_name: "Jane Smith" },
    ]);
    setApplications([
      { id: "a1", candidate_id: "1" },
      { id: "a2", candidate_id: "2" },
    ]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const application = applications.find(
        (a) => a.candidate_id === formData.candidate_id
      );

      const feedbackData = {
        ...formData,
        application_id: application?.id || null,
      };

      onSave(feedbackData);
    } catch (err) {
      setError("Failed to save feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-800">Add Feedback</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Candidate
            </label>
            <select
              value={formData.candidate_id}
              onChange={(e) =>
                setFormData({ ...formData, candidate_id: e.target.value })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Select Candidate</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.feedback_type}
                onChange={(e) =>
                  setFormData({ ...formData, feedback_type: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="General">General</option>
                <option value="Screening">Screening</option>
                <option value="Interviewed">Interviewed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <select
                value={formData.color_code}
                onChange={(e) =>
                  setFormData({ ...formData, color_code: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="orange">Orange</option>
                <option value="red">Red</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) =>
                setFormData({ ...formData, rating: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) =>
                setFormData({ ...formData, comment: e.target.value })
              }
              required
              rows={5}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              placeholder="Your feedback..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition disabled:opacity-70 flex items-center justify-center gap-2 font-bold shadow-lg shadow-pink-100"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? "Saving..." : "Add Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
