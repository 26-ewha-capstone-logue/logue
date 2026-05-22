export type StepperProps = {
  steps: string[];
  currentStep: number;
};

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav className="flex flex-col gap-12">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-12">
            <span
              className={`inline-flex h-[3.2rem] w-[3.2rem] shrink-0 items-center justify-center rounded-full text-head3 ${
                isActive ? 'bg-orange-500 text-white' : 'bg-white text-gray-600'
              }`}
            >
              {String(stepNum).padStart(2, '0')}
            </span>
            <span
              className={`text-head3 ${
                isActive ? 'text-gray-900' : 'text-gray-600'
              }`}
            >
              {label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
