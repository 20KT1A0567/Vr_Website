import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true
        }}
      >
        <App />
        <Toaster
          position="top-right"
          gutter={12}
          toastOptions={{
            duration: 3600,
            style: {
              border: "1px solid var(--vr-border)",
              borderRadius: "18px",
              boxShadow: "0 18px 45px rgba(15, 23, 42, 0.16)",
              color: "var(--vr-text)",
              fontWeight: 700,
              padding: "13px 15px"
            },
            success: {
              iconTheme: {
                primary: "var(--vr-success)",
                secondary: "#ffffff"
              }
            },
            error: {
              duration: 4600,
              iconTheme: {
                primary: "var(--vr-danger)",
                secondary: "#ffffff"
              }
            }
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
