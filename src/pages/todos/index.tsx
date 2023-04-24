import CreateTodo from "@/components/CreateTodo";
import Loading from "@/components/common/Loading";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

type Todo = {
  userId: string;
  createdAt: string;
  todoText: string;
  // due: string;
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

  if (!userLoaded) return <div />;

  return (
    <>
      {isSignedIn && (
        <>
          <p>todos</p>
          {todosQuery.isLoading && <Loading />}
          <ul role="list" className="divide-y divide-gray-200">
            {todosQuery.isSuccess &&
              todosQuery.data.map((todo: Todo, i: number) => (
                <>
                  <li
                    key={i}
                    className="relative bg-white border-2 rounded-lg cursor-pointer shadow-sm px-4 py-5 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600 hover:bg-gray-50 md:w-1/3 w-full"
                  >
                    <div className="flex justify-between space-x-3">
                      <p className="truncate font-medium text-lg text-gray-900">
                        {todo.todoText}
                      </p>
                    </div>
                  </li>
                </>
              ))}
          </ul>

          <CreateTodo />
        </>
      )}
      {!isSignedIn && <SignInButton>Sign In</SignInButton>}
    </>
  );
}
