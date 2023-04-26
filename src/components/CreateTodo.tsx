import { useForm } from "react-hook-form";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import Button from "./common/Button";
import { toast } from "react-hot-toast";

const schema = z.object({
  todoText: z.string().min(1),
});

type FormValues = {
  todoText: string;
};

type MutationValues = FormValues & {
  done: boolean;
};

export default function CreateTodo() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const queryClient = useQueryClient();

  const createTodoMut = useMutation({
    mutationFn: (data: MutationValues) =>
      fetch("/api/todo", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onError: () => {
      toast.error("error creating todo");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      reset();
    },
  });

  const onSubmit = (data: FormValues) => {
    createTodoMut.mutate({ ...data, done: false });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-5 mb-2">
          <input
            id="todoText"
            type="text"
            {...register("todoText")}
            className="block md:w-1/3 w-full rounded-md border-2 border-gray-600 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="new todo"
          />
        </div>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
