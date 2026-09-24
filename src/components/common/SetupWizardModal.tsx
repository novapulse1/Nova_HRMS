import React, { useState } from 'react';
import {
  CheckCircle2,
  Building2,
  MapPin,
  Users,
  Shield,
  Calendar,
  Clock,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  X
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useAuth } from '../../context/AuthContext';
import { TenantService } from '../../services/tenantService';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({ isOpen, onClose }) => {
  const { activeTenant } = useAuth();
  const [currentStep, setCurrentStep] = useState(activeTenant.setupStep || 1);

  const steps = [
    { num: 1, title: 'Company Info', desc: 'Verify legal company profile, GSTIN & registered address' },
    { num: 2, title: 'Office Branches', desc: 'Define HQ and multi-location branch physical addresses' },
    { num: 3, title: 'Departments', desc: 'Configure engineering, HR, sales, operations teams' },
    { num: 4, title: 'Designations', desc: 'Establish job hierarchy, levels, and reporting trees' },
    { num: 5, title: 'Leave Policies', desc: 'Set paid leave, sick leave, maternity & carry-forward rules' },
    { num: 6, title: 'Attendance Rules', desc: 'Configure grace periods, half-day hours, and regularization' },
    { num: 7, title: 'Shift Setup', desc: 'Create general, rotational, night shift templates' },
    { num: 8, title: 'Workforce Onboard', desc: 'Import staff directory or invite employees digitally' },
    { num: 9, title: 'Role Permissions', desc: 'Assign HR Admin, Manager, and Employee access levels' },
    { num: 10, title: 'Launch HRMS', desc: 'Final review and launch company live HRMS instance' },
  ];

  const progressPercent = Math.round((currentStep / 10) * 100);

  const handleNext = () => {
    if (currentStep < 10) {
      const next = currentStep + 1;
      setCurrentStep(next);
      TenantService.update(activeTenant.id, { setupStep: next });
    } else {
      TenantService.update(activeTenant.id, { setupCompleted: true, setupStep: 10 });
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              NovaPulse HRMS Setup Wizard
            </h3>
            <span className="text-xs text-slate-500 font-medium font-mono">
              {activeTenant.companyName} • Step {currentStep} of 10
            </span>
          </div>
        </div>
      }
      size="2xl"
    >
      <div className="space-y-6">
        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Setup Progress</span>
            <span className="text-brand-700 font-extrabold">{progressPercent}% Completed</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-700 to-purple-600 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Progression Badges */}
        <div className="grid grid-cols-5 gap-2 pb-2">
          {steps.map(s => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num)}
                className={`p-2 rounded-xl text-left border transition-all text-[11px] font-bold ${
                  isCurrent
                    ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-xs'
                    : isDone
                    ? 'bg-slate-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDone ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-700 text-[9px] flex items-center justify-center font-bold">
                      {s.num}
                    </span>
                  )}
                  <span className="truncate">{s.title}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Step Dynamic Content */}
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-extrabold text-brand-700 uppercase tracking-wider">
                Step {currentStep} of 10
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                {steps[currentStep - 1].title}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {steps[currentStep - 1].desc}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-brand-700 font-extrabold text-sm">
              #{currentStep}
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Standard Defaults Applied</span>
            </div>
            <p className="text-slate-500 text-[11px]">
              You can fine-tune these parameters at any time from the <strong>Settings & Policies</strong> module.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 1}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose}>
              Complete Later
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {currentStep === 10 ? 'Finish & Launch' : 'Save & Next'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
