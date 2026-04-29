import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { PublicReview } from "@/pages/PublicReview";
import { NegativeExperience } from "@/pages/NegativeExperience";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/review/:token" element={<PublicReview />} />
          <Route path="/review/:token/negative" element={<NegativeExperience />} />
          <Route path="*" element={<Navigate to="/review/invalid" replace />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
