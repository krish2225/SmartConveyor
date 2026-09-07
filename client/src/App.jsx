import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

// Auth and Firebase
import { subscribeToAuth, logoutUser, getCurrentUser } from './firebase/auth.js';
import { listenToAlerts, listenToVisionEvents } from './firebase/firestore.js';

// Real-Time Hooks
import { useSensorData } from './hooks/useSensorData.js';
import { useJointHealth } from './hooks/useJointHealth.js';
import { useSensorReliability } from './hooks/useSensorReliability.js';
import { useEmergencyStatus } from './hooks/useEmergencyStatus.js';

// Shared Components
import Navbar from './components/shared/Navbar.jsx';
import Sidebar from './components/shared/Sidebar.jsx';
import EmergencyStopBanner from './components/shared/EmergencyStopBanner.jsx';
import ChatWidget from './components/chat/ChatWidget.jsx';

// Pages
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DigitalTwin from './pages/DigitalTwin.jsx';
import VisionMonitoring from './pages/VisionMonitoring.jsx';
import SensorHealth from './pages/SensorHealth.jsx';
import Alerts from './pages/Alerts.jsx';
import Logs from './pages/Logs.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Facility state
  const [activeFacilityId, setActiveFacilityId] = useState('nmdc-kirandul-cv101');
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Live stream hooks
  const { telemetry, history: telemetryHistory } = useSensorData(activeFacilityId, 30);
  const {
    joints,
    selectedJoint,
    setSelectedJointId,
    overallRiskScore,
    minRulDays,
    criticalCount,
    warningCount,
    healthyCount
  } = useJointHealth(activeFacilityId);
  const { scores: reliabilityScores, fleetAverageScore } = useSensorReliability(activeFacilityId);
  const emergencyStatus = useEmergencyStatus(activeFacilityId);

  const [alerts, setAlerts] = useState([]);
  const [visionEvents, setVisionEvents] = useState([]);

  // Subscribe to alerts and vision streams
  useEffect(() => {
    const unsubAlerts = listenToAlerts(activeFacilityId, setAlerts);
    const unsubVision = listenToVisionEvents(activeFacilityId, setVisionEvents);
    const unsubAuth = subscribeToAuth(setCurrentUser);

    return () => {
      unsubAlerts();
      unsubVision();
      unsubAuth();
    };
  }, [activeFacilityId]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleInvestigateJoint = (jointId) => {
    setSelectedJointId(jointId);
    navigate('/digital-twin');
  };

  const handleAcknowledgeAlert = async (alertId, remark = '') => {
    if (!alertId) return;
    // Optimistic UI state update immediately
    setAlerts(prev => prev.map(a => 
      (a.id === alertId || a._id === alertId || a.incidentId === alertId)
        ? { ...a, status: 'ACKNOWLEDGED', acknowledged: true, acknowledgedBy: currentUser?.displayName || 'Operator', acknowledgedAt: new Date().toISOString() }
        : a
    ));

    try {
      await acknowledgeAlertDoc(activeFacilityId, alertId, currentUser);
    } catch (err) {
      console.warn('[App] Alert ACK synced with local fallback:', err.message);
    }
  };

  const activeAlertCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      
      {/* Global Persistent Full-Width Emergency Stop Banner */}
      {!isLoginPage && (
        <EmergencyStopBanner
          emergencyStatus={emergencyStatus}
          currentUser={currentUser}
          facilityId={activeFacilityId}
        />
      )}

      {/* Main Layout Header */}
      {!isLoginPage && (
        <Navbar
          activeFacilityId={activeFacilityId}
          onSelectFacility={setActiveFacilityId}
          currentUser={currentUser}
          onLogout={handleLogout}
          emergencyStatus={emergencyStatus}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
      )}

      <div className="flex-1 flex w-full">
        {/* Sidebar */}
        {!isLoginPage && (
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeAlertCount={activeAlertCount}
            currentUser={currentUser}
          />
        )}

        {/* Main Content Area */}
        <main className={isLoginPage ? 'w-full' : 'flex-1 p-3 md:p-5 lg:p-6 max-w-[1720px] mx-auto w-full overflow-x-hidden'}>
          <Routes>
            <Route
              path="/login"
              element={<Login onLoginSuccess={() => navigate('/')} />}
            />
            <Route
              path="/"
              element={
                <Dashboard
                  facilityId={activeFacilityId}
                  telemetry={telemetry}
                  telemetryHistory={telemetryHistory}
                  joints={joints}
                  overallRiskScore={overallRiskScore}
                  minRulDays={minRulDays}
                  criticalCount={criticalCount}
                  warningCount={warningCount}
                  healthyCount={healthyCount}
                  alerts={alerts}
                  reliabilityScores={reliabilityScores}
                  fleetAverageScore={fleetAverageScore}
                  currentUser={currentUser}
                  onInvestigateJoint={handleInvestigateJoint}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                />
              }
            />
            <Route
              path="/digital-twin"
              element={
                <DigitalTwin
                  facilityId={activeFacilityId}
                  joints={joints}
                  selectedJointId={selectedJoint?.jointId || 'Joint-05'}
                  onSelectJoint={setSelectedJointId}
                  telemetry={telemetry}
                />
              }
            />
            <Route
              path="/vision"
              element={
                <VisionMonitoring
                  facilityId={activeFacilityId}
                  visionEvents={visionEvents}
                  telemetry={telemetry}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/sensor-health"
              element={
                <SensorHealth
                  scores={reliabilityScores}
                  fleetAverageScore={fleetAverageScore}
                  healthyCount={healthyCount}
                  degradedCount={warningCount}
                  faultyCount={0}
                />
              }
            />
            <Route
              path="/sensors"
              element={<Navigate to="/sensor-health" replace />}
            />
            <Route
              path="/alerts"
              element={
                <Alerts
                  facilityId={activeFacilityId}
                  alerts={alerts}
                  currentUser={currentUser}
                  onAcknowledgeAlert={handleAcknowledgeAlert}
                />
              }
            />
            <Route
              path="/logs"
              element={
                <Logs
                  facilityId={activeFacilityId}
                  currentUser={currentUser}
                />
              }
            />
            <Route
              path="/reports"
              element={
                <Reports
                  facilityId={activeFacilityId}
                  joints={joints}
                  overallRiskScore={overallRiskScore}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <Settings
                  facilityId={activeFacilityId}
                  emergencyStatus={emergencyStatus}
                  currentUser={currentUser}
                />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Floating AI Assistant Chat Widget (Available on all screens) */}
      {!isLoginPage && (
        <ChatWidget
          activeFacilityId={activeFacilityId}
          currentUser={currentUser}
          telemetry={telemetry}
          joints={joints}
          alerts={alerts}
          emergencyStatus={emergencyStatus}
          reliabilityScores={reliabilityScores}
        />
      )}

    </div>
  );
}
