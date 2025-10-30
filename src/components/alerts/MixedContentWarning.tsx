import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { API_BASE_URL } from "@/utils/constants";

export const MixedContentWarning = () => {
  // Check if we're on HTTPS but API is HTTP
  const isHttps = window.location.protocol === 'https:';
  const apiIsHttp = API_BASE_URL.startsWith('http://');
  const showWarning = isHttps && apiIsHttp;

  if (!showWarning) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Backend Connection Issue</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <p>
          The backend API is using HTTP while this app is on HTTPS. Browsers block this for security (mixed content).
        </p>
        <div className="text-sm space-y-1">
          <p className="font-semibold">Solutions:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Recommended:</strong> Update backend to use HTTPS (contact your backend team)</li>
            <li><strong>For Development:</strong> Run locally with <code className="bg-background px-1 py-0.5 rounded">npm run dev</code> and access via <code className="bg-background px-1 py-0.5 rounded">http://localhost:5173</code></li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
