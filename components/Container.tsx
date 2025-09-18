type Props = {
  children: React.ReactNode;
  className?: string;
};

export default function Container({ children, className }: Props) {
  return (
    <div className={`mx-10 md:mx-25 xl:mx-auto xl:w-250 ${className ?? ""}`}>
      {children}
    </div>
  );
}
