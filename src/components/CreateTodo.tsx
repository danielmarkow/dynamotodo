import type { FieldValues } from "react-hook-form";
import { useForm } from "react-hook-form";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMutation } from "@tanstack/react-query";

import Button from "./common/Button";
import { toast } from "react-hot-toast";

const schema = z.object({
  todoText: z.string().min(1),
  due: z.string(),
});

type FormValues = {
  todoText: string;
  due: string;
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

  const createTodoMut = useMutation({
    mutationFn: (data: MutationValues) =>
      fetch("/api/todo", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onError: () => {
      toast.error("error creating todo");
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log({ ...data, done: false });
    createTodoMut.mutate({ ...data, done: false });
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-2">
          <input
            id="todoText"
            type="text"
            {...register("todoText")}
            className="block w-1/3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            placeholder="new todo"
          />
        </div>
        <div className="py-2">
          <label
            htmlFor="due"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Due
          </label>
          <input
            id="due"
            type="datetime-local"
            {...register("due")}
            className="block w-1/3 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          />
          {errors && (
            <p className="mt-2 text-sm text-red-600" id="link-url-error">
              {errors.due?.message as string}
            </p>
          )}
        </div>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
