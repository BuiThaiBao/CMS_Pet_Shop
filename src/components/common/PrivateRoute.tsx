import React from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../services/authService";

interface Props {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<Props> = ({ children }) => {
  // Nếu chưa có token hợp lệ (hoặc không có ROLE_SHOP) sẽ chuyển đến signin
  if (!authService.isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default PrivateRoute;
