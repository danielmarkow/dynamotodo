export default function Button({
  children,
  type,
}: {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset" | undefined;
}) {
  return (
    <button
      type={type === undefined ? "button" : type}
      className="rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      {children}
    </button>
  );
}
