import { RadioList } from '../OnboardingOptionGroup';

type Step2TaskProps = {
  onChange: (value: string) => void;
  options: string[];
  value: string | null;
};

export default function Step2Task({
  onChange,
  options,
  value,
}: Step2TaskProps) {
  return <RadioList options={options} value={value} onChange={onChange} />;
}
