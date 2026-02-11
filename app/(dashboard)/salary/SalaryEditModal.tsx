import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "./Button"; // Import Button and buttonVariants from Button.tsx
import { cn } from "@/lib/utils";

interface Bonus {
  name: string;
  amount: number;
}

interface Deduction {
  name: string;
  amount: number;
  isStatutory: boolean;
}

interface SalaryEditModalProps {
  user: { name: string; uid: string };
  salary: {
    baseSalary: string;
    overtimeHours: string;
    overtimePay: string;
    allowances: Bonus[];
    deductions: Deduction[];
    paymentStatus: "pending" | "paid" | "disputed";
  };
  onChange: (field: string, value: any) => void;
  onAddBonus: () => void;
  onRemoveBonus: (index: number) => void;
  onAddDeduction: () => void;
  onRemoveDeduction: (index: number) => void;
  onSave: () => void;
  onClose: () => void;
}

// Input Component (defined locally for SalaryEditModal)
const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, type, ...props }) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all duration-200",
      className
    )}
    {...props}
  />
);

const SalaryEditModal: React.FC<SalaryEditModalProps> = ({
  user,
  salary,
  onChange,
  onAddBonus,
  onRemoveBonus,
  onAddDeduction,
  onRemoveDeduction,
  onSave,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
          Edit Salary: {user.name}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Base Salary (₹)</label>
            <Input
              type="number"
              value={salary.baseSalary}
              onChange={(e) => onChange("baseSalary", e.target.value)}
              placeholder="Enter base salary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Overtime Hours</label>
            <Input
              type="number"
              value={salary.overtimeHours}
              onChange={(e) => onChange("overtimeHours", e.target.value)}
              placeholder="Enter overtime hours"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Overtime Pay (₹)</label>
            <Input
              type="number"
              value={salary.overtimePay}
              onChange={(e) => onChange("overtimePay", e.target.value)}
              placeholder="Enter overtime pay"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Allowances</label>
            {salary.allowances.map((allowance, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={allowance.name}
                  onChange={(e) => onChange(`allowances[${index}].name`, e.target.value)}
                  placeholder="Allowance name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={allowance.amount}
                  onChange={(e) => onChange(`allowances[${index}].amount`, parseFloat(e.target.value) || 0)}
                  placeholder="Amount"
                  className="w-24"
                />
                <Button variant="destructive" size="icon" onClick={() => onRemoveBonus(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={onAddBonus}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allowance
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deductions</label>
            {salary.deductions.map((deduction, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  type="text"
                  value={deduction.name}
                  onChange={(e) => onChange(`deductions[${index}].name`, e.target.value)}
                  placeholder="Deduction name"
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={deduction.amount}
                  onChange={(e) => onChange(`deductions[${index}].amount`, parseFloat(e.target.value) || 0)}
                  placeholder="Amount"
                  className="w-24"
                />
                <Button variant="destructive" size="icon" onClick={() => onRemoveDeduction(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={onAddDeduction}>
              <Plus className="mr-2 h-4 w-4" />
              Add Deduction
            </Button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Status</label>
            <select
              value={salary.paymentStatus}
              onChange={(e) => onChange("paymentStatus", e.target.value as "pending" | "paid" | "disputed")}
              className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button onClick={onClose} variant="outline" size="sm">
            Cancel
          </Button>
          <Button onClick={onSave} variant="default" size="sm">
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SalaryEditModal;