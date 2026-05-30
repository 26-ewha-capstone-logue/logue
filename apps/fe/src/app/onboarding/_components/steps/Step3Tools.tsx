import { CheckboxList } from '../OnboardingOptionGroup';

type Step3ToolsProps = {
  onToggle: (value: string) => void;
  options: string[];
  values: Set<string>;
};

export default function Step3Tools({
  onToggle,
  options,
  values,
}: Step3ToolsProps) {
  return <CheckboxList options={options} values={values} onToggle={onToggle} />;
}
