import { redirect } from "next/navigation";
import { submitPassword } from "./actions";
import { PasswordInput } from "./PasswordInput";
import { Button } from "@/components/ui/Button/Button";

type Props = {
  searchParams: Promise<{ from?: string; error?: string }>;
};

export const metadata = { title: "Password Protected" };

export default async function GatePage({ searchParams }: Props) {
  if (!process.env.GATEKEEPER_PASSWORD?.trim()) {
    redirect("/");
  }

  const { from = "/", error } = await searchParams;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand mark */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{
              backgroundColor: `#${process.env.NEXT_PUBLIC_BRAND_PRIMARY ?? "EB0A52"}`,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              className="w-7 h-7 text-white fill-current"
            >
              <path d="M12 1a5 5 0 0 1 5 5v2h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h1V6a5 5 0 0 1 5-5zm0 11a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0-9a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">
            This site is password protected
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enter the password to continue
          </p>
        </div>

        <form
          action={submitPassword}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4"
        >
          <input type="hidden" name="from" value={from} />

          <PasswordInput
            brandColor={process.env.NEXT_PUBLIC_BRAND_PRIMARY ?? "000000"}
            error={error ? "Incorrect password. Please try again." : undefined}
          />

          <Button type="submit" fullWidth>
            Enter site
          </Button>
        </form>
      </div>
    </div>
  );
}
