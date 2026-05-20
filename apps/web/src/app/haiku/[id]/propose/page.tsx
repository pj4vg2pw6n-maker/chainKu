import { ProposeClient } from "./ProposeClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function ProposePage() {
  return <ProposeClient />;
}
