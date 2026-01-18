'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { usePulseCheckUserContext } from '@/context/PulseCheckUserContext';

// Purple color palette
const COLORS = {
  lightest: '#EDE9FE',
  light: '#DDD6FE',
  mediumLight: '#C4B5FD',
  medium: '#A78BFA',
  mediumDark: '#8B5CF6',
  dark: '#7C3AED',
  darker: '#6D28D9',
  veryDark: '#5B21B6',
  darkest: '#4C1D95',
};

interface ImportResult {
  row: number;
  name: string;
  email: string;
  status: 'success' | 'error' | 'duplicate';
  message?: string;
}

interface ImportSummary {
  total: number;
  success: number;
  errors: number;
  duplicates: number;
}

export default function PulseCheckImportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading, isAuthenticated, login, isAdminAssistant } = usePulseCheckUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState('');

  // Auto-login if email in URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam && !isAuthenticated && !isUserLoading) {
      login(emailParam);
    }
  }, [searchParams, isAuthenticated, isUserLoading, login]);

  const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResults(null);
    setSummary(null);
    setError('');

    // Parse CSV for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => 
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
      setPreviewData(lines.slice(0, 6)); // Show header + 5 rows
    };
    reader.readAsText(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Name,Email,Provider Type,Credential,Site,Department,Director Email\n" +
      "John Smith,john.smith@hospital.com,physician,MD,Main Hospital,Emergency Medicine,director@hospital.com\n" +
      "Jane Doe,jane.doe@hospital.com,apc,PA,Main Hospital,Emergency Medicine,director@hospital.com\n";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pulsecheck_provider_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file || !user?.directorId) return;

    setIsUploading(true);
    setError('');

    try {
      // Parse the full CSV
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      
      // Map headers to expected fields
      const headerMap: Record<string, string> = {
        'name': 'name',
        'email': 'email',
        'provider type': 'provider_type',
        'provider_type': 'provider_type',
        'type': 'provider_type',
        'credential': 'credential',
        'credentials': 'credential',
        'site': 'site',
        'hospital': 'site',
        'department': 'department',
        'dept': 'department',
        'director email': 'director_email',
        'director_email': 'director_email',
      };

      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((header, i) => {
          const mappedKey = headerMap[header];
          if (mappedKey && values[i]) {
            row[mappedKey] = values[i];
          }
        });
        return row;
      }).filter(row => row.name && row.email);

      if (rows.length === 0) {
        setError('No valid rows found in the file');
        return;
      }

      // Send to API
      const response = await fetch('/api/pulsecheck/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          imported_by: user.directorId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setSummary(data.summary);
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2"
          style={{ borderColor: COLORS.dark }}
        />
      </div>
    );
  }

  if (!isAdminAssistant) {
    return (
      <div className="max-w-xl mx-auto text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">You do not have permission to import providers.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push(`/pulsecheck/admin${emailParam}`)}
          className="text-sm text-slate-500 hover:text-slate-700 mb-2 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Import Providers</h1>
        <p className="text-slate-600">Upload a CSV file to bulk import providers</p>
      </div>

      {/* Instructions */}
      <div 
        className="bg-white rounded-xl border p-6"
        style={{ borderColor: COLORS.light }}
      >
        <h3 className="font-semibold text-slate-900 mb-3">CSV Format Requirements</h3>
        <ul className="text-sm text-slate-600 space-y-2 mb-4">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Required columns:</strong> Name, Email, Provider Type (physician/apc)</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span><strong>Optional columns:</strong> Credential, Site, Department, Director Email</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>Site and Department names must match existing records exactly</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <span>Duplicate emails will be skipped</span>
          </li>
        </ul>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: COLORS.lightest, color: COLORS.darker }}
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Upload Area */}
      <div 
        className="bg-white rounded-xl border p-6"
        style={{ borderColor: COLORS.light }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {!file ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-12 border-2 border-dashed rounded-xl transition-colors hover:bg-slate-50"
            style={{ borderColor: COLORS.light }}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto mb-4" style={{ color: COLORS.medium }} />
            <p className="font-medium text-slate-900">Click to select a CSV file</p>
            <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8" style={{ color: COLORS.dark }} />
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setResults(null);
                  setSummary(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Remove
              </button>
            </div>

            {/* Preview */}
            {previewData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      {previewData[0].map((header, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium text-slate-600">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1).map((row, i) => (
                      <tr key={i} className="border-t">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-slate-600">
                            {cell || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 5 && (
                  <p className="text-sm text-slate-500 mt-2">
                    Showing first 5 rows...
                  </p>
                )}
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full py-3 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: COLORS.dark }}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Import Providers
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg flex items-center gap-3 bg-red-50 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results */}
      {summary && results && (
        <div 
          className="bg-white rounded-xl border overflow-hidden"
          style={{ borderColor: COLORS.light }}
        >
          {/* Summary */}
          <div className="p-6 border-b" style={{ borderColor: COLORS.lightest }}>
            <h3 className="font-semibold text-slate-900 mb-4">Import Results</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-slate-50">
                <p className="text-2xl font-bold text-slate-900">{summary.total}</p>
                <p className="text-sm text-slate-600">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-50">
                <p className="text-2xl font-bold text-green-600">{summary.success}</p>
                <p className="text-sm text-green-600">Success</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-50">
                <p className="text-2xl font-bold text-amber-600">{summary.duplicates}</p>
                <p className="text-sm text-amber-600">Duplicates</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-red-50">
                <p className="text-2xl font-bold text-red-600">{summary.errors}</p>
                <p className="text-sm text-red-600">Errors</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Row</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Name</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-600">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {results.map((result, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600">{result.row}</td>
                    <td className="px-4 py-2 text-slate-900">{result.name}</td>
                    <td className="px-4 py-2 text-slate-600">{result.email}</td>
                    <td className="px-4 py-2">
                      {result.status === 'success' && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          Success
                        </span>
                      )}
                      {result.status === 'duplicate' && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          Duplicate
                        </span>
                      )}
                      {result.status === 'error' && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="w-4 h-4" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{result.message || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
