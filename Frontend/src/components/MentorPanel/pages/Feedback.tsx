// import { MessageSquare, Plus } from 'lucide-react';

// export const FeedbackManager = () => {
//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">Feedback</h2>
//           <p className="text-gray-600">Manage candidate feedback</p>
//         </div>
//         <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg hover:from-pink-600 hover:to-pink-700 transition">
//           <Plus className="w-5 h-5" />
//           <span>Add Feedback</span>
//         </button>
//       </div>

//       <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
//         <div className="flex flex-col items-center justify-center space-y-4 py-12">
//           <MessageSquare className="w-16 h-16 text-gray-400" />
//           <p className="text-gray-600 text-lg">No feedback yet</p>
//           <p className="text-gray-500 text-sm">Start providing feedback to candidates</p>
//         </div>
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from "react";
import { MessageSquare, Star } from "lucide-react";
import { FeedbackForm } from "./FeedbackForm";

// Local type definitions (no Supabase dependency)
type Feedback = {
  id: string;
  feedback_type: string;
  comment: string;
  rating?: number;
  color_code?: string;
  created_at: string;
  candidate: Candidate;
  user: Profile;
};

type Candidate = {
  id: string;
  full_name: string;
  email: string;
};

type Profile = {
  id: string;
  full_name: string;
  role: string;
};

export const FeedbackManager = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Simulate a user (can replace with your own auth logic)
  const profile = { role: "Admin", full_name: "John Doe" };

  const canAddFeedback =
    profile.role === "Admin" ||
    profile.role === "Team Lead" ||
    profile.role === "Mentor";

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    // Simulated local data
    setLoading(true);
    setTimeout(() => {
      setFeedbacks([
        {
          id: "1",
          feedback_type: "Technical",
          comment: "Strong communication and problem-solving skills.",
          rating: 4,
          color_code: "green",
          created_at: new Date().toISOString(),
          candidate: {
            id: "c1",
            full_name: "Alice Johnson",
            email: "alice@example.com",
          },
          user: { id: "u1", full_name: "John Doe", role: "Admin" },
        },
      ]);
      setLoading(false);
    }, 500);
  };

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    yellow: "bg-yellow-50 border-yellow-200",
    red: "bg-red-50 border-red-200",
    orange: "bg-orange-50 border-orange-200",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Feedback & Comments
          </h2>
          <p className="text-gray-600">
            Collaboration and feedback on candidates
          </p>
        </div>
        {canAddFeedback && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition shadow-md"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Add Feedback</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {feedbacks.map((feedback) => (
          <div
            key={feedback.id}
            className={`${
              colorClasses[feedback.color_code || "blue"]
            } rounded-xl p-6 border shadow-sm`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-full">
                  <MessageSquare className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {feedback.candidate.full_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feedback.candidate.email}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs px-3 py-1 bg-white rounded-full font-medium text-gray-700">
                  {feedback.feedback_type}
                </span>
                {feedback.rating && (
                  <div className="flex items-center space-x-1 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < feedback.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <p className="text-gray-700 mb-4">{feedback.comment}</p>

            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>
                By: {feedback.user.full_name} ({feedback.user.role})
              </span>
              <span>{new Date(feedback.created_at).toLocaleString()}</span>
            </div>
          </div>
        ))}

        {feedbacks.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center shadow-md border border-gray-200">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No feedback yet
            </h3>
            <p className="text-gray-500">
              Start collaborating by adding feedback
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <FeedbackForm
          onClose={() => setShowForm(false)}
          onSave={() => {
            fetchFeedbacks();
            setShowForm(false);
          }}
        />
      )}
    </div>
  );
};
