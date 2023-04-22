import { useQuery } from "@tanstack/react-query";

export default function TodosLanding() {
  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await fetch("/api/todo");
      return res.json();
    },
  });

  return (
    <>
      <p>todos</p>
      {todosQuery.isSuccess && JSON.stringify(todosQuery.data)}
    </>
  );
}
