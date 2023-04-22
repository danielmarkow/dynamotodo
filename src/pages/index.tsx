import Button from "@/components/common/Button";
import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1 className="text-xl">Bottich</h1>
      <h2>Efficient ToDos</h2>
      <Link href="/todos">
        <Button>Your ToDos</Button>
      </Link>
    </main>
  );
}
