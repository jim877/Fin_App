import { useState } from "react";
import { CircleDollarSign } from "lucide-react";
import { AppPageLayout } from "@/components/layout/AppPageLayout";
import CollectionsLedgerSection from "./CollectionsLedgerSection";
import CollectionsOrderDrawer from "./CollectionsOrderDrawer";

export default function CollectionsApp() {
  const [drawerOrderId, setDrawerOrderId] = useState<number | null>(null);

  return (
    <AppPageLayout icon={CircleDollarSign} title="Collections" maxWidth="max-w-7xl">
      <div className="space-y-4">
        <div className="max-w-6xl">
          <CollectionsLedgerSection
            onOrderNameClick={(order) => setDrawerOrderId(order.id)}
          />
        </div>
        <CollectionsOrderDrawer
          orderId={drawerOrderId}
          onClose={() => setDrawerOrderId(null)}
        />
      </div>
    </AppPageLayout>
  );
}
