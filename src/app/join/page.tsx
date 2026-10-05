import { InstallButton } from "@/components/InstallApp";
import { JoinWizard } from "@/components/JoinWizard";

export const dynamic = "force-dynamic";

export default function JoinPage() {
  return (
    <main className="min-h-dvh bg-[#0c1a14] px-4 py-8">
      <div className="mx-auto mb-4 flex max-w-md justify-end">
        <InstallButton />
      </div>
      <JoinWizard />
    </main>
  );
}
