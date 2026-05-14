export type StepperProps = {
  steps: string[];
  currentStep: number;
};

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav className="flex flex-col gap-16">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-12">
            <span
              className={`inline-flex h-[3.2rem] w-[3.2rem] shrink-0 items-center justify-center rounded-full text-body4 font-bold ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : isDone
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-gray-200 text-gray-500'
              }`}
            >
              {String(stepNum).padStart(2, '0')}
            </span>
            <span
              className={`text-body2 ${
                isActive
                  ? 'font-bold text-gray-900'
                  : isDone
                    ? 'text-gray-600'
                    : 'text-gray-500'
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
