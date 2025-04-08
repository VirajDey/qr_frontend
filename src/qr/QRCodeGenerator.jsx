import { useState } from 'react';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';
import { useUser, useAuth } from '@clerk/clerk-react'; // Add useAuth import

export function QRCodeGenerator({ type, onGenerate }) {
  const { user } = useUser();
  const { getToken } = useAuth(); // Add this hook
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [links, setLinks] = useState([{ title: '', url: '' }]);

  const addLink = () => {
    setLinks([...links, { title: '', url: '' }]);
  };

  const removeLink = (index) => {
    if (links.length > 1) {
      setLinks(links.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const generateQRCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
  
    try {
      const shortId = nanoid();
      const baseUrl = import.meta.env.VITE_SERVER_URL;
      const finalUrl = `${baseUrl}/qr/${shortId}`;
      const qrDataUrl = await QRCode.toDataURL(finalUrl);
      const token = await getToken();
      
      const qrData = {
        shortId,
        userId: user.id,
        name,
        url: finalUrl,
        originalUrl: null,
        links,
        qrCode: qrDataUrl,
        type: 'dynamic',
        createdAt: new Date().toISOString(),
        scans: 0
      };
  
      const response = await fetch(`${baseUrl}/api/qrcodes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Origin': 'https://qr-frontend-neon.vercel.app'
        },
        body: JSON.stringify(qrData),
        credentials: 'include',
        mode: 'cors'
      });
  
      if (!response.ok) {
        throw new Error(`Failed to save QR code: ${response.status}`);
      }
  
      const savedQR = await response.json();
      onGenerate(savedQR);
      setName('');
      setLinks([{ title: '', url: '' }]);
    } catch (err) {
      setError('Failed to generate QR code. Please try again.');
      console.error('Error generating QR code:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900">
        Generate Multi-Link QR Code
      </h2>
      
      <form onSubmit={generateQRCode} className="mt-5 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            QR Code Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Enter a name for your QR code"
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Links</h3>
            <button
              type="button"
              onClick={addLink}
              className="text-indigo-600 hover:text-indigo-800 text-sm"
            >
              + Add Another Link
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto pr-2 space-y-4">
            {links.map((link, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 bg-white">
                <div className="flex justify-between items-center sticky top-0 bg-white pb-2">
                  <h4 className="text-sm font-medium text-gray-700">Link {index + 1}</h4>
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLink(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Link Title
                  </label>
                  <input
                    type="text"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Enter link title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    URL
                  </label>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </form>
    </div>
  );
}