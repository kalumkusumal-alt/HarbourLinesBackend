// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DashboardContent from './pages/DashboardContent.jsx';
import { useAuth } from './context/AuthContext.jsx';

import UserMaintenance from './pages/UserMaintenance.jsx'

// === MASTER FILES ===
import CustomerSupplierMaintenance from './pages/masters/CustomerSupplierMaintenance.jsx';
import CurrencyMaintenance from './pages/masters/CurrencyMaintenance.jsx';
import UnitOfMeasurementMaintenance from './pages/masters/UnitOfMeasurementMaintenance.jsx';
import BankMaintenance from './pages/masters/BankMaintenance.jsx';
import TaxMaintenance from './pages/masters/TaxMaintenance.jsx';
import ChargesMaintenance from './pages/masters/ChargesMaintenance.jsx';

// === FREIGHT MASTER ===
import VesselMaintenance from './pages/Freight/VesselMaintenance.jsx';
import FlightMaintenance from './pages/Freight/FlightMaintenance.jsx';
import SeaDestinationMaintenance from './pages/Freight/SeaDestinationMaintenance.jsx';
import AirDestinationMaintenance from './pages/Freight/AirDestinationMaintenance.jsx';

// === SEA FREIGHT IMPORT JOBS ===
import JobMasterImport from './pages/sea-freight/import/JobMasterImport.jsx';
import DeliveryOrder from './pages/sea-freight/import/delivery-order/DeliveryOrder.jsx';
import SalesInvoice from './pages/sea-freight/import/sales-invoice/SalesInvoice.jsx';

// === REPORTS ===
import Reports from './pages/reports/Reports.jsx';
import DeliveryOrderReports from './pages/reports/delivery-orders/DeliveryOrderReports.jsx';
import SalesInvoiceReports from './pages/reports/sales-invoices/SalesInvoiceReports.jsx';
import ManifestReports from './pages/sea-freight/import/manifest-import/ManifestReportsImport.jsx';
import EManifestReport from './pages/sea-freight/import/manifest-import/EManifest.jsx';

// === EXPORT ===
import Export from './pages/Export/Export.jsx';

import CanadaHBL from './pages/Canada_Client/HL-Manifest.jsx';
import CanadaManifestList from './pages/Canada_Client/CanadaManifestList.jsx';
import CanadaDashboard from './pages/Canada_Client/CanadaDashboard.jsx';

import Loading from './components/common/Loading.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) return <Navigate to="/" replace />;

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        }>
          <Route index element={<DashboardContent />} />
        </Route>

        {/* === MASTER FILES === */}
        <Route path="/masters/customers" element={
          <ProtectedRoute><CustomerSupplierMaintenance /></ProtectedRoute>
        } />
        <Route path="/masters/currency" element={
          <ProtectedRoute><CurrencyMaintenance /></ProtectedRoute>
        } />
        <Route path="/masters/uom" element={
          <ProtectedRoute><UnitOfMeasurementMaintenance /></ProtectedRoute>
        } />
        <Route path="/masters/bank" element={
          <ProtectedRoute><BankMaintenance /></ProtectedRoute>
        } />
        <Route path="/masters/tax" element={
          <ProtectedRoute><TaxMaintenance /></ProtectedRoute>
        } />
        <Route path="/masters/charges" element={
          <ProtectedRoute><ChargesMaintenance /></ProtectedRoute>
        } />

        {/* === FREIGHT MASTER === */}
        <Route path="/freight/vessel" element={
          <ProtectedRoute><VesselMaintenance /></ProtectedRoute>
        } />
        <Route path="/freight/flight" element={
          <ProtectedRoute><FlightMaintenance /></ProtectedRoute>
        } />
        <Route path="/freight/sea-destination" element={
          <ProtectedRoute><SeaDestinationMaintenance /></ProtectedRoute>
        } />
        <Route path="/freight/air-destination" element={
          <ProtectedRoute><AirDestinationMaintenance /></ProtectedRoute>
        } />

        {/* === SEA FREIGHT IMPORT === */}
        <Route path="/sea-freight/import/job-master" element={
          <ProtectedRoute><JobMasterImport /></ProtectedRoute>
        } />
        <Route path="/sea-freight/import/delivery-order" element={
          <ProtectedRoute><DeliveryOrder /></ProtectedRoute>
        } />
        <Route path="/sea-freight/sales-invoice" element={
          <ProtectedRoute><SalesInvoice /></ProtectedRoute>
        } />

        {/* === REPORTS === */}
        <Route path="/reports" element={
          <ProtectedRoute><Reports /></ProtectedRoute>
        } />
        <Route path="/reports/delivery-orders" element={
          <ProtectedRoute><DeliveryOrderReports /></ProtectedRoute>
        } />
        <Route path="/reports/sales-invoices" element={
          <ProtectedRoute><SalesInvoiceReports /></ProtectedRoute>
        } />

        <Route path='/imports/manifest-reports' element={
          <ProtectedRoute><ManifestReports /></ProtectedRoute>
        } />

        <Route path='/imports/e-manifest-reports' element={
          <ProtectedRoute><EManifestReport /></ProtectedRoute>
        } />

        {/* === EXPORT === */}
        <Route path="/export" element={
          <ProtectedRoute><Export /></ProtectedRoute>
        } />

        {/* === USERS === */}
        <Route path="/users" element={
          <ProtectedRoute><UserMaintenance /></ProtectedRoute>
        } />

        {/* === CLIENT PORTAL === */}
        <Route path="/client" element={<Navigate to="/client/dashboard" replace />} />
        <Route path="/client/dashboard" element={
          <ProtectedRoute><CanadaDashboard /></ProtectedRoute>
        } />
        <Route path="/client/new" element={
          <ProtectedRoute><CanadaHBL /></ProtectedRoute>
        } />
        <Route path="/client/history" element={
          <ProtectedRoute><CanadaManifestList /></ProtectedRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;