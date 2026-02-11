import React from "react";
import { Download } from "lucide-react";
import { Button } from "./Button";

interface PayrollProcessingProps {
  onGeneratePayslips: () => void;
  onExportCSV: () => void;
}

const PayrollProcessing: React.FC<PayrollProcessingProps> = ({
  onGeneratePayslips,
  onExportCSV,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Payroll Processing</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={onGeneratePayslips} variant="default" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Generate Payslips
        </Button>
        <Button onClick={onExportCSV} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Payroll CSV
        </Button>
      </div>
    </div>
  );
};

export default PayrollProcessing;