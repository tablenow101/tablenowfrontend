import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Billing() {
  const navigate = useNavigate();
  const { appState } = useAuth();

  const handleUpgrade = () => {
    // Placeholder for subscription upgrade flow
    alert('Subscription upgrade flow coming soon');
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@tablenow.io';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-4">Subscription & Billing</h1>

          <div className="mb-8">
            <p className="text-gray-600 mb-4">
              Your current subscription status:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-semibold text-lg">
                Status: <span className="text-blue-600">{appState?.subscription?.status || 'free'}</span>
              </p>
            </div>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-2xl font-semibold mb-4">Upgrade Your Plan</h2>
            <p className="text-gray-600 mb-6">
              Unlock advanced features and higher limits by upgrading to a paid plan.
            </p>
            <button
              onClick={handleUpgrade}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition mb-4"
            >
              Upgrade Now
            </button>
            <button
              onClick={handleContactSupport}
              className="ml-4 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Contact Support
            </button>
          </div>

          <div className="border-t pt-8 mt-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:underline"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
