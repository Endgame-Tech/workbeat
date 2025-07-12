import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-bold text-blue-600 dark:text-blue-400">404</h1>
        
        <div className="mt-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/">
            <Button variant="primary" className="w-full">
              Go Home
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
        
        <div className="mt-8 text-gray-500 dark:text-gray-400 text-sm">
          <p>Need help? <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Contact Support</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;