import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { QuoteRequestFlow } from "@/components/quote/QuoteRequestFlow";

type Props = { params: Promise<{ lang: string }> };

export default async function QuoteRequestPage({ params }: Props) {
  const { lang } = await params;
  return (
    <>
      <CheckoutHeader lang={lang} />
      <QuoteRequestFlow lang={lang} />
    </>
  );
}
