import { AlertCircle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading data.',
  action,
}) {
  return (
    <div className="text-center py-12">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      {message && (
        <p className="mt-1 text-sm text-gray-500">{message}</p>
      )}
      {action && (
        <div className="mt-6">
          <Button
            onClick={action.onClick}
            variant="primary"
          >
            {action.label || 'Retry'}
          </Button>
        </div>
      )}
    </div>
  );
}
