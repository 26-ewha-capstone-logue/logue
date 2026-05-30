import { DomainGrid } from '../OnboardingOptionGroup';

type Step1DomainProps = {
  onChange: (value: string) => void;
  options: string[];
  value: string | null;
};

export default function Step1Domain({
  onChange,
  options,
  value,
}: Step1DomainProps) {
  return <DomainGrid options={options} value={value} onChange={onChange} />;
}
