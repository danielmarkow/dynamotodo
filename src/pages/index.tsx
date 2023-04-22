import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await fetch("/api/todo");
      return res.json();
    },
  });

  return <main>{todosQuery.isSuccess && JSON.stringify(todosQuery.data)}</main>;
}
