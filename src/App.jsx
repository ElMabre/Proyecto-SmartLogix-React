import { useState, useCallback, useEffect } from "react";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import LoginForm from "./modules/auth/LoginForm";
import InventoryView from "./modules/inventory/InventoryView";
import OrderView from "./modules/orders/OrderView";
import UserManagementView from "./modules/users/UserManagementView";
import ShippingView from "./modules/shipping/ShippingView";
import { initMockDB } from "./core/storage/mockDatabase";

const App = () => {
  const [user, setUser] = useState(() => {
    const jwt = localStorage.getItem("smartlogix_jwt");
    const role = localStorage.getItem("smartlogix_role");
    if (jwt && role) {
      return {
        jwt,
        role,
        pymeId: localStorage.getItem("smartlogix_pymeId") || null,
        userId: localStorage.getItem("smartlogix_userId") || null,
      };
    }
    return null;
  });
  const [currentPath, setCurrentPath] = useState("inventory");

  useEffect(() => {
    initMockDB();
  }, []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem("smartlogix_user", JSON.stringify(userData));
    setCurrentPath("inventory");
  }, []);

  const handleNavigate = useCallback((path) => {
    if (path === "auth") {
      setUser(null);
      localStorage.removeItem("smartlogix_user");
      localStorage.removeItem("smartlogix_jwt");
      localStorage.removeItem("smartlogix_role");
      localStorage.removeItem("smartlogix_pymeId");
      localStorage.removeItem("smartlogix_userId");
    } else {
      setCurrentPath(path);
    }
  }, []);

  if (!user) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <DashboardLayout
      onNavigate={handleNavigate}
      currentPath={currentPath}
      userRole={user?.role}
    >
      {currentPath === "inventory" && <InventoryView />}
      {currentPath === "orders" && <OrderView />}
      {currentPath === "shipping" && <ShippingView />}
      {currentPath === "users" && user?.role === "ADMIN" && (
        <UserManagementView />
      )}
    </DashboardLayout>
  );
};

export default App;