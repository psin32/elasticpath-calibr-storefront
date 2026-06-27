import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";

type Props = {
  params: Promise<{ lang: string }>;
};

export default async function CheckoutPage({ params }: Props) {
  const { lang } = await params;
  return <CheckoutFlow lang={lang} />;
}
