import { Header } from "@/components/header/Header";
import { AccountPageContent } from "@/components/account/AccountPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function AccountPage({ params }: Props) {
  const { lang } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} />
      <AccountPageContent lang={lang} />
    </div>
  );
}
