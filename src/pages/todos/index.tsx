import CreateTodo from "@/components/CreateTodo";
import Loading from "@/components/common/Loading";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

type Todo = {
  userId: string;
  createdAt: string;
  todoText: string;
  due: string;
  done: boolean;
};

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
          {todosQuery.isLoading && <Loading />}
          <ul>
            {todosQuery.isSuccess &&
              todosQuery.data.map((todo: Todo) => (
                <li key={todo.userId + todo.createdAt}>{todo.todoText}</li>
              ))}
          </ul>

          <CreateTodo />
        </>
      )}
      {!isSignedIn && <SignInButton>Sign In</SignInButton>}
    </>
  );
}
