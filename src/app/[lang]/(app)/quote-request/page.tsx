import { Header } from "@/components/header/Header";
import { QuoteRequestFlow } from "@/components/quote/QuoteRequestFlow";

type Props = { params: Promise<{ lang: string }> };

export default async function QuoteRequestPage({ params }: Props) {
  const { lang } = await params;
  return <QuoteRequestFlow lang={lang} />;
}
