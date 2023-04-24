import CreateTodo from "@/components/CreateTodo";
import Loading from "@/components/common/Loading";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

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
          <ul role="list">
            {todosQuery.isSuccess &&
              todosQuery.data.map((todo: Todo, i: number) => (
                <li
                  key={i}
                  className="relative bg-white border-2 rounded-lg cursor-pointer px-4 py-2 hover:bg-gray-50 border-gray-600 md:w-1/3 w-full mt-1"
                >
                  <div className="flex justify-between space-x-3">
                    <div className="truncate font-medium text-lg text-gray-900">
                      <div className="flex gap-3 items-center">
                        <CheckCircleIcon className="h-5 w-5" />
                        {todo.todoText}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
          </ul>

          <CreateTodo />
        </>
      )}
      {!isSignedIn && <SignInButton>Sign In</SignInButton>}
    </>
  );
}
