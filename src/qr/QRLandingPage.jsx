import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Change from named export to default export
export default function QRLandingPage() {
  const { shortId } = useParams();
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQRData = async () => {
      try {
        // Direct API call without redirection
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/qrcodes/landing/${shortId}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          throw new Error('QR code not found');
        }
        
        const data = await response.json();
        setQrData(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching QR data:', err);
      }
    };

    fetchQRData();
  }, [shortId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">{qrData.name}</h1>
            <div className="space-y-4">
              {qrData.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h2 className="text-lg font-medium text-indigo-600">{link.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{link.url}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}