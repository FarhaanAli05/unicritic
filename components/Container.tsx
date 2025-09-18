export default function Container({ children }) {
  return (
    <div className="mx-10 md:mx-25 xl:w-250 xl:mx-auto">
      {children}
    </div>
  );
}