export type TextFieldSize = 'lg' | 'md';
export type TextFieldVariant = 'default' | 'compact';

type TextFieldVariantClassParams = {
  className?: string;
  focused: boolean;
  fullWidth: boolean;
  hasValue: boolean;
  showFileAttach: boolean;
  variant: TextFieldVariant;
};

type SubmitButtonClassParams = {
  focused: boolean;
  hasValue: boolean;
  variant: TextFieldVariant;
};

export function getTextFieldVariant({
  size,
  variant,
}: {
  size?: TextFieldSize;
  variant?: TextFieldVariant;
}) {
  if (variant) return variant;

  return size === 'md' ? 'compact' : 'default';
}

export function getTextFieldContainerClass({
  className = '',
  fullWidth,
  variant,
}: Pick<TextFieldVariantClassParams, 'className' | 'fullWidth' | 'variant'>) {
  const variantClass =
    variant === 'compact'
      ? 'min-w-[41.8rem] flex-row items-center rounded-16 px-24 py-12'
      : 'w-[115.5rem] max-w-full flex-col items-start gap-[5.9rem] rounded-20 px-[2.6rem] py-[2.9rem]';

  return `inline-flex cursor-text bg-white shadow-[0_0.2rem_1.2rem_rgba(0,0,0,0.06)] ${variantClass} ${
    fullWidth ? 'w-full' : ''
  } ${className}`.trim();
}

export function getTextFieldTextareaClass({
  focused,
  hasValue,
  variant,
}: Pick<TextFieldVariantClassParams, 'focused' | 'hasValue' | 'variant'>) {
  const sizeClass = variant === 'compact' ? 'text-body2' : 'text-body1';
  const toneClass = hasValue
    ? 'text-gray-900'
    : focused
      ? 'text-gray-800'
      : 'text-gray-700 placeholder:text-gray-700';

  return `scrollbar-hide min-w-0 w-full flex-1 resize-none bg-transparent outline-none ${sizeClass} ${toneClass}`;
}

export function getTextFieldToolbarClass({
  showFileAttach,
  variant,
}: Pick<TextFieldVariantClassParams, 'showFileAttach' | 'variant'>) {
  if (variant === 'compact') return 'flex shrink-0 items-center gap-[1rem]';

  return `flex shrink-0 items-center ${
    showFileAttach ? 'w-full justify-between' : 'w-full justify-end'
  }`;
}

export function getFileAttachButtonClass(variant: TextFieldVariant) {
  if (variant === 'compact') {
    return 'inline-flex h-[3.8rem] w-[3.8rem] items-center justify-center rounded-12 text-gray-900 transition-colors hover:bg-gray-300';
  }

  return 'inline-flex items-center gap-2 rounded-222 border border-gray-500 bg-white px-16 py-8 text-body1 text-gray-900 transition-colors hover:bg-gray-100';
}

export function getSubmitButtonClass({
  focused,
  hasValue,
  variant,
}: SubmitButtonClassParams) {
  const toneClass =
    variant === 'compact'
      ? 'bg-orange-500 text-white hover:bg-orange-600'
      : hasValue
        ? 'bg-orange-400 text-white hover:bg-orange-500'
        : focused
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-gray-300 text-gray-900 hover:bg-gray-400';

  return `inline-flex h-[3.8rem] w-[3.8rem] shrink-0 items-center justify-center rounded-12 transition-colors disabled:cursor-not-allowed disabled:bg-gray-400 disabled:text-gray-600 ${toneClass}`;
}
