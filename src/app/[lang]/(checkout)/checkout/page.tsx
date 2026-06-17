import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutPageContent } from "@/components/checkout/CheckoutPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params;
  return (
    <div className="min-h-screen bg-gray-50">
      <CheckoutHeader lang={lang} />
      <CheckoutPageContent lang={lang} />
    </div>
  );
}
