import logo from "@/assets/images/stretchlab.png";
import { Button } from "@/components/shared";
import { useNavigate } from "react-router";

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-secondary/20 to-primary-tertiary/30 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div>
            <img src={logo} alt="StretchLab" className="w-40 h-auto mx-auto" />
          </div>
          <div className="mt-12">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Page Not Found
            </h2>
            <p className="text-base text-gray-600 mb-8 max-w-6xl mx-auto">
              Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL? Be
              sure to check your spelling.
            </p>
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate(-1)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-sm"
              >
                Go Back
              </Button>
              {/* <Button
                onClick={() => navigate("/dashboard")}
                className="px-6 py-2 bg-primary-base text-white hover:bg-primary-base/80 rounded-sm"
              >
                Go to Dashboard
              </Button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};