import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (session) {
    redirect("/feed");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      {children}
    </div>
  );
}
