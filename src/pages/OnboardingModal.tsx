import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { SPLIT_TEMPLATES } from '../lib/constants';
import { Layers, ArrowRight, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const { createSplitFromTemplate } = useWorkout();
  const [loadingTemplate, setLoadingTemplate] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectTemplate = async (templateName: string) => {
    try {
      setLoadingTemplate(templateName);
      await createSplitFromTemplate(templateName);
      onClose();
      navigate('/');
    } catch (err) {
      console.error('Failed to create split from template:', err);
    } finally {
      setLoadingTemplate(null);
    }
  };

  const handleCreateCustom = () => {
    onClose();
    navigate('/splits');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#fafafa] dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Welcome to FORM
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Choose a proven training split template to begin, or create your own custom routine.
          </p>
        </div>

        {/* Template choices */}
        <div className="space-y-3 mb-6">
          {SPLIT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.name}
              disabled={loadingTemplate !== null}
              onClick={() => handleSelectTemplate(tmpl.name)}
              className="w-full text-left p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-900 dark:hover:border-neutral-100 transition-all group flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-black dark:group-hover:text-white">
                  {tmpl.name}
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                  {tmpl.description}
                </div>
                <div className="text-[10px] font-mono text-neutral-400 mt-1">
                  {tmpl.days.length} days • {tmpl.days.map((d) => d.name).join(', ')}
                </div>
              </div>

              <div className="ml-3 shrink-0 text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Custom Split alternative */}
        <button
          onClick={handleCreateCustom}
          className="w-full py-2.5 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:border-neutral-900 dark:hover:border-neutral-100 flex items-center justify-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Build Custom Split From Scratch</span>
        </button>
      </div>
    </div>
  );
};
