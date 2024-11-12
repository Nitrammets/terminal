interface StatItemProps {
  label: string;
  value: string | number;
  isUnderlined?: boolean;
  suffix?: string;
}

export const StatItem = ({
  label,
  value,
  isUnderlined,
  suffix,
}: StatItemProps) => (
  <div className="text-disabledText text-[12px] flex-shrink-0 min-w-max text-left">
    <div className={`text-nowrap ${isUnderlined ? "underline" : ""}`}>
      {label}
      {suffix && <span>({suffix})</span>}
    </div>
    <div className="text-primaryText text-[12px]">{value}</div>
  </div>
);
