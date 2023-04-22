import CreateTodo from "@/components/CreateTodo";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export default function TodosLanding() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  const todosQuery = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await fetch("/api/todo");
      return res.json();
    },
  });

  return (
    <>
      {isSignedIn && (
        <>
          <p>todos</p>
          {todosQuery.isSuccess && JSON.stringify(todosQuery.data)}
          <CreateTodo />
        </>
      )}
      {!isSignedIn && <SignInButton>Sign In</SignInButton>}
    </>
  );
}
