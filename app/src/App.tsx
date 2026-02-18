import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BillingApp from "./BillingApp";
import BillingPrepApp from "./BillingPrepApp";
import CollectionsApp from "./CollectionsApp";
import CommissionsApp from "./CommissionsApp";
import SideNavLayout from "./components/layout/SideNavLayout";
import DashboardApp from "./DashboardApp";
import EstimatesApp from "./EstimatesApp";
import InvoiceReviewApp from "./InvoiceReviewApp";
import PayablesApp from "./PayablesApp";
import ReferralFeesApp from "./ReferralFeesApp";
import SettingsPage from "./pages/SettingsPage";
import ServicesApp from "./ServicesApp";
import StorageApp from "./StorageApp";
import TransactionsApp from "./TransactionsApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route element={<SideNavLayout />}>
          <Route index element={<DashboardApp />} />
          <Route path="transactions" element={<TransactionsApp />} />
          <Route path="estimates" element={<EstimatesApp />} />
          <Route path="services" element={<ServicesApp />} />
          <Route path="billing-prep" element={<BillingPrepApp />} />
          <Route path="billing" element={<BillingApp />} />
          <Route path="invoice-review" element={<InvoiceReviewApp />} />
          <Route path="storage" element={<StorageApp />} />
          <Route path="collections" element={<CollectionsApp />} />
          <Route path="commissions" element={<CommissionsApp />} />
          <Route path="referral-fees" element={<ReferralFeesApp />} />
          <Route path="payables" element={<PayablesApp />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
