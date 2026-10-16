import { NetworkCenter } from "@/components/network-center";

export const metadata = {
  title: "SunnahOS Universal Network Center",
  description: "Network diagnostics dashboard, DNS lookup, addressing tools and protocol reference.",
};

export default function NetworkCenterPage() {
  return <NetworkCenter />;
}
