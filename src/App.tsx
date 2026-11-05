import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PublicReview } from "@/pages/PublicReview";
import { useVersionCheck } from "./hooks/useVersionCheck";

const queryClient = new QueryClient();

// Wrapper to run the version check hook at root level
const VersionGuard = ({ children }: { children: React.ReactNode }) => {
  useVersionCheck();
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <VersionGuard>
        <BrowserRouter>
          <Routes>
            <Route path="/review/:token" element={<PublicReview />} />
            <Route path="/review/:token/negative" element={<PublicReview />} />
            <Route path="*" element={<Navigate to="/review/invalid" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </VersionGuard>
    </QueryClientProvider>
  );
}

export default App;

