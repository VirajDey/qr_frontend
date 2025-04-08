import { useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

export function QRCodeList({ qrCodes, type, onDelete }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [selectedQR, setSelectedQR] = useState(null);
  const [editLinks, setEditLinks] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState('png');
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  const handleEdit = (qrCode) => {
    setSelectedQR(qrCode);
    setEditLinks([...qrCode.links]);
  };

  const addLink = () => {
    setEditLinks([...editLinks, { title: '', url: '' }]);
  };

  const removeLink = (index) => {
    if (editLinks.length > 1) {
      setEditLinks(editLinks.filter((_, i) => i !== index));
    }
  };

  const updateLink = (index, field, value) => {
    const newLinks = [...editLinks];
    newLinks[index][field] = value;
    setEditLinks(newLinks);
  };

  const handleSaveEdit = async () => {
    if (!selectedQR) return;

    try {
      const token = await getToken();
      const baseUrl = import.meta.env.VITE_SERVER_URL; // Add this line
      
      const response = await fetch(`${baseUrl}/api/qrcodes/${selectedQR._id}`, { // Update the URL
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Origin': 'https://qr-frontend-neon.vercel.app'
        },
        body: JSON.stringify({
          links: editLinks
        }),
        credentials: 'include', // Add this line
        mode: 'cors' // Add this line
      });

      if (!response.ok) {
        throw new Error('Failed to update QR code');
      }

      const updatedQRCode = await response.json();
      
      const updatedQRCodes = qrCodes.map(qr => 
        qr._id === selectedQR._id ? updatedQRCode : qr
      );
      
      if (typeof onDelete === 'function') {
        onDelete(null, updatedQRCodes);
      }

      setSelectedQR(null);
      setEditLinks([]);
    } catch (error) {
      console.error('Error updating QR code:', error);
    }
  };

  const handleDownload = (qrCode) => {
    // Convert base64 to blob
    const base64Data = qrCode.qrCode.split(',')[1];
    const blob = base64ToBlob(base64Data, `image/${selectedFormat}`);
    
    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${qrCode.name}-qr-code.${selectedFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const base64ToBlob = (base64, mimeType) => {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation) {
      await onDelete(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Your {type === 'dynamic' ? 'Dynamic' : 'Static'} QR Codes
      </h2>

      {/* Edit Modal */}
      {selectedQR && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit QR Code Links</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Links</h4>
                <button
                  type="button"
                  onClick={addLink}
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  + Add Another Link
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto space-y-4">
                {editLinks.map((link, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h5 className="text-sm font-medium text-gray-700">Link {index + 1}</h5>
                      {editLinks.length > 1 && (
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
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setSelectedQR(null);
                    setEditLinks([]);
                  }}
                  className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-500 mb-6">Are you sure you want to delete this QR code? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {qrCodes.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No QR codes generated yet. Create your first one above!
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {qrCodes.map((qrCode) => (
            <div key={qrCode._id} className="border rounded-lg p-4 space-y-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-900">{qrCode.name}</h3>
                <div className="flex space-x-2">
                  {type === 'dynamic' && (
                    <button
                      onClick={() => handleEdit(qrCode)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirmation(qrCode._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex justify-center bg-gray-50 p-4 rounded">
                <img
                  src={qrCode.qrCode}
                  alt={`QR code for ${qrCode.name}`}
                  className="w-32 h-32"
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500 truncate">
                  URL: {qrCode.originalUrl}
                </p>
                {type === 'dynamic' && (
                  <p className="text-sm text-gray-500">
                    Scans: {qrCode.scans}
                  </p>
                )}
                <div className="flex space-x-2">
                  <select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    className="flex-1 rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                    <option value="jpg">JPG</option>
                  </select>
                  <button
                    onClick={() => handleDownload(qrCode)}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Download QR Code
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}