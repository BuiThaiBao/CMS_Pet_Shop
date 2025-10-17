import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { authService } from "../../services/authService";

const PrivateRouteAsync: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const [status, setStatus] = useState<"checking" | "ok" | "no">("checking");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const ok = await authService.verifyToken();
      if (!mounted) return;
      setStatus(ok ? "ok" : "no");
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div>Đang xác thực...</div>
      </div>
    );
  }

  if (status === "no") return <Navigate to="/signin" replace />;

  return children;
};

export default PrivateRouteAsync;
