import { useState, useCallback } from "react";
import DashboardLayout from "./shared/layouts/DashboardLayout";
import LoginForm from "./modules/auth/LoginForm";
import InventoryView from "./modules/inventory/InventoryView";
import OrderView from "./modules/orders/OrderView";
import UserManagementView from "./modules/users/UserManagementView";
import ShippingView from "./modules/shipping/ShippingView";

const App = () => {
  const [user, setUser] = useState(null);
  const [currentPath, setCurrentPath] = useState("inventory");

  const handleLogin = useCallback((userData) => {
    setUser(userData);
    setCurrentPath("inventory");
  }, []);

  const handleNavigate = useCallback((path) => {
    if (path === "auth") {
      setUser(null);
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
