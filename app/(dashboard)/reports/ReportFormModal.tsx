import React, { useState, useEffect } from "react";

interface Report {
  id?: string;
  date: string;
  projectName: string;
  description: string;
  hoursWorked: number;
  issues: string;
}

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (report: Report) => void;
  report?: Report | null;
}

const ReportFormModal: React.FC<ReportFormModalProps> = ({ isOpen, onClose, onSave, report }) => {
  const [formData, setFormData] = useState<Report>({
    date: "",
    projectName: "",
    description: "",
    hoursWorked: 0,
    issues: "",
  });

  useEffect(() => {
    if (report) {
      setFormData(report);
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        projectName: "",
        description: "",
        hoursWorked: 0,
        issues: "",
      });
    }
  }, [report]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "hoursWorked" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.projectName || !formData.description) {
      alert("Please fill all required fields (Date, Project Name, Description)");
      return;
    }
    if (formData.hoursWorked < 0) {
      alert("Hours Worked cannot be negative");
      return;
    }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg p-6 sm:p-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">
          {report ? "Edit Report" : "Add Report"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={formData.projectName}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hours Worked</label>
            <input
              type="number"
              name="hoursWorked"
              value={formData.hoursWorked}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              min="0"
              step="0.5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Issues Encountered</label>
            <textarea
              name="issues"
              value={formData.issues}
              onChange={handleChange}
              className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              rows={2}
            />
          </div>
          <div className="flex justify-end space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-9 px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors h-9 px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportFormModal;