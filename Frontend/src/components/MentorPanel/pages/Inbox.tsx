import { useState } from "react";
import { MessageSquare, Search, Archive, Trash2 } from "lucide-react";

export default function Inbox() {
  const [selected, setSelected] = useState<number | null>(null);

  const emails = [
    { id: 1, title: "New Application Received", sender: "John Doe", time: "10:30 AM" },
    { id: 2, title: "Interview Scheduled", sender: "HR Team", time: "09:10 AM" },
    { id: 3, title: "Job Offer – Please Review", sender: "Manager", time: "Yesterday" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* LEFT SIDEBAR */}
      <div className="w-72 bg-white border-r p-4">
        <h2 className="text-xl font-bold mb-4">Inbox</h2>

        <button className="w-full bg-blue-600 text-white py-2 rounded-lg mb-4">
          + New Message
        </button>

        <nav className="space-y-2">
          <p className="font-semibold text-gray-700">Menu</p>

          <SidebarItem label="All Messages" icon={<MessageSquare />} active />
          <SidebarItem label="Archived" icon={<Archive />} />
          <SidebarItem label="Trash" icon={<Trash2 />} />
        </nav>
      </div>

      {/* MIDDLE LIST */}
      <div className="w-96 border-r bg-white p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>

        <div className="space-y-2">
          {emails.map((email) => (
            <div
              key={email.id}
              onClick={() => setSelected(email.id)}
              className={`p-3 rounded-lg cursor-pointer ${
                selected === email.id ? "bg-blue-50 border border-blue-300" : "hover:bg-gray-100"
              }`}
            >
              <p className="font-semibold">{email.title}</p>
              <p className="text-sm text-gray-600">{email.sender}</p>
              <p className="text-xs text-gray-400">{email.time}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT VIEWER */}
      <div className="flex-1 bg-white p-6">
        {selected ? (
          <>
            <h2 className="text-2xl font-bold mb-2">{emails.find((x) => x.id === selected)?.title}</h2>
            <p className="text-gray-500 mb-4">
              From: {emails.find((x) => x.id === selected)?.sender}
            </p>

            <div className="bg-gray-50 border p-4 rounded-lg">
              <p className="leading-relaxed text-gray-700">
                This is a placeholder message content.  
                Replace this with actual mail or application data.
              </p>
            </div>
          </>
        ) : (
          <p className="text-gray-400 text-center mt-20">Select a message to view details</p>
        )}
      </div>
    </div>
  );
}

function SidebarItem({
  label,
  icon,
  active = false,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer ${
        active ? "bg-blue-100 text-blue-700 font-semibold" : "hover:bg-gray-200"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
}
