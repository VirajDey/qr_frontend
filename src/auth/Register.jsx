import { SignUp } from '@clerk/clerk-react';

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your QRVerse account
          </h2>
        </div>
        <SignUp 
          routing="path" 
          path="/register"
          appearance={{
            elements: {
              formButtonPrimary: 
                "bg-indigo-600 hover:bg-indigo-700 text-white",
              card: "bg-white"
            }
          }}
        />
      </div>
    </div>
  );
}