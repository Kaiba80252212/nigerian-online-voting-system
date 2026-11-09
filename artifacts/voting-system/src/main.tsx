import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAdminToken } from "@/lib/auth";
import App from "./App";
import "./index.css";

// Attach the admin JWT to every API call (admin routes are protected on the
// server). The token lives only in sessionStorage and is never set for
// anonymous voters, so public requests stay bare.
setAuthTokenGetter(getAdminToken);

createRoot(document.getElementById("root")!).render(<App />);
