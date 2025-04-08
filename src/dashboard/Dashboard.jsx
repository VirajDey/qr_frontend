import { useState, useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeGenerator } from '../qr/QRCodeGenerator';
import { QRCodeList } from '../qr/QRCodeList';

export default function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('static');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [qrCodes, setQRCodes] = useState({
    static: [],
    dynamic: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('name');

  // Fetch user's QR codes on component mount
  useEffect(() => {
    const fetchUserQRCodes = async () => {
      try {
        const token = await getToken();
        const baseUrl = import.meta.env.VITE_SERVER_URL || '';
        
        // In your fetchUserQRCodes function
        const response = await fetch(`${baseUrl}/api/qrcodes/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          mode: 'cors'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setQRCodes({
          static: data.filter(qr => qr.type === 'static'),
          dynamic: data.filter(qr => qr.type === 'dynamic')
        });
      } catch (error) {
        console.error('Error fetching QR codes:', error);
      }
    };

    if (user) {
      fetchUserQRCodes();
    }
  }, [user]);

  const handleDeleteQR = async (id, updatedList) => {
    // If updatedList is provided, it's an edit operation
    if (updatedList) {
      setQRCodes(prev => ({
        ...prev,
        [activeTab]: updatedList
      }));
      return;
    }

    try {
      const token = await getToken();
      const baseUrl = import.meta.env.VITE_SERVER_URL || '';
      
      const response = await fetch(`${baseUrl}/api/qrcodes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Origin': window.location.origin
        },
        credentials: 'include',
        mode: 'cors'
      });

      if (response.ok) {
        setQRCodes(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].filter(qr => qr._id !== id)
        }));
      } else {
        console.error('Failed to delete QR code');
      }
    } catch (error) {
      console.error('Error deleting QR code:', error);
    }
  };

  const handleQRCodeGenerated = (qrData) => {
    setQRCodes(prev => ({
      ...prev,
      [activeTab]: [...prev[activeTab], qrData]
    }));
    setShowGenerateModal(false);
  };

  // Filter QR codes based on search query and type
  // Update the filter function
  const filteredQRCodes = qrCodes[activeTab].filter(qr => {
    if (searchType === 'name') {
      return qr.name?.toLowerCase().includes(searchQuery.toLowerCase());
    } else if (searchType === 'url') {
      // Search through all URLs in the links array
      return qr.links?.some(link => 
        link.url?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-indigo-600">QRVerse</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 mr-2">Welcome {user.username || user.firstName || 'User'}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500  px-3 py-2 rounded-md border border-solid shadow-lg bg-white hover:bg-red-500 hover:text-white"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('static')}
                className={`${
                  activeTab === 'static'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Static QR Codes
              </button>
              <button
                onClick={() => setActiveTab('dynamic')}
                className={`${
                  activeTab === 'dynamic'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Dynamic QR Codes
              </button>
            </nav>
            {/* Search Section */}
            <div className="mt-4 flex space-x-4">
              <div className="flex-1">
                <div className="mt-1 flex rounded-md shadow-sm">
                  <div className="relative flex items-stretch flex-grow focus-within:z-10">
                    <select
                      className="absolute inset-y-0 left-0 -ml-px pl-3 pr-9 flex items-center rounded-l-md border border-gray-300 bg-gray-50 text-gray-500 sm:text-sm"
                      value={searchType}
                      onChange={(e) => setSearchType(e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="url">Link URL</option>
                    </select>
                    <input
                      type="text"
                      className="block w-full rounded-none rounded-r-md border-gray-300 pl-32 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder={`Search by ${searchType}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Add QR Code
              </button>
            </div>
          </div> {/* Added missing closing div */}

          {/* Generate QR Code Modal */}
          {showGenerateModal && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-900">
                    Generate New QR Code
                  </h2>
                  <button
                    onClick={() => setShowGenerateModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <QRCodeGenerator
                  type={activeTab}
                  onGenerate={handleQRCodeGenerated}
                />
              </div>
            </div>
          )}

          <div className="mt-8">
            <QRCodeList
              qrCodes={filteredQRCodes}
              type={activeTab}
              onDelete={handleDeleteQR}
            />
          </div>
        </div>
      </div>
    </div>
  );
}