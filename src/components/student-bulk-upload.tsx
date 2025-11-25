'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface StudentBulkUploadProps {
  selectedCollege: string;
  selectedProgram: string;
  selectedBatch: string;
  onStudentsUploaded: () => void;
  onClose: () => void;
}

interface UploadResult {
  successful: any[];
  failed: any[];
  duplicates: any[];
}

export function StudentBulkUpload({ selectedCollege, selectedProgram, selectedBatch, onStudentsUploaded, onClose }: StudentBulkUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      console.log('Processing file:', file.name, file.type, file.size);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Excel parsed successfully:', {
        sheets: workbook.SheetNames,
        sheetName: sheetName,
        rowCount: jsonData.length,
        sampleRow: jsonData[0]
      });

      if (!jsonData || jsonData.length === 0) {
        toast.error('Excel file is empty or invalid');
        return;
      }

        // Validate and transform data
      const students = jsonData.map((row: any) => {
        let studentId = String(row['Student ID'] || row['studentId'] || row['StudentID'] || '').trim();
        let studentName = String(row['Student Name'] || row['studentName'] || row['StudentName'] || '').trim();
        
        const studentData: any = {
          studentId: studentId, // Store student ID in the proper field
          name: studentName,
          password: 'password123', // Default password for bulk uploaded students (not used for login)
        };

        // Only include programId and batchId if they exist and are not empty
        if (selectedProgram && selectedProgram.trim() !== '') {
          studentData.programId = selectedProgram;
        }
        if (selectedBatch && selectedBatch.trim() !== '') {
          studentData.batchId = selectedBatch;
        }

        return studentData;
      }).filter(student => student.studentId && student.name);

      if (students.length === 0) {
        toast.error('No valid student data found in Excel file');
        return;
      }

      // Check if user has program and batch information
      if (!selectedProgram || !selectedBatch) {
        toast.error('You need to select a program and batch to upload students.');
        return;
      }

      // Upload students
      setUploading(true);
      const response = await fetch('/api/students/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students }),
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result.results);
        toast.success(result.message);
        onStudentsUploaded();
      } else {
        console.error('Bulk upload error response:', result);
        if (result.details && Array.isArray(result.details)) {
          const validationErrors = result.details.map((err: any) => 
            `${err.path?.join('.') || 'field'}: ${err.message}`
          ).join(', ');
          toast.error(`Validation Error: ${validationErrors}`);
        } else {
          toast.error(result.error || result.message || 'Failed to upload students');
        }
      }
    } catch (error) {
      console.error('Error processing Excel file:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('Unsupported file')) {
          toast.error('Unsupported file format. Please ensure the file is a valid Excel (.xlsx, .xls) or CSV file.');
        } else if (error.message.includes('Invalid file')) {
          toast.error('Invalid file format. Please check the Excel file and try again.');
        } else {
          toast.error(`Failed to process Excel file: ${error.message}`);
        }
      } else {
        toast.error('Failed to process Excel file. Please check the file format and try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File) => {
    // Check file extension as fallback for browsers that don't correctly detect MIME types
    const fileName = file.name.toLowerCase();
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    // Check file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv', // .csv
    ];

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast.error('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
      hasValidExtension: hasValidExtension
    });

    await processExcelFile(file);
  };

  const downloadTemplate = () => {
    // Create a template Excel file
    const template = [
      {
        'Student ID': 'CS101001',
        'Student Name': 'John Doe'
      },
      {
        'Student ID': 'cs101002',
        'Student Name': 'Jane Smith'
      },
      {
        'Student ID': '2023001',
        'Student Name': 'Alice Johnson'
      },
      {
        'Student ID': 'STU2024001',
        'Student Name': 'Bob Wilson'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_upload_template.xlsx');
  };

  const resetUpload = () => {
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Bulk Upload Students
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!uploadResult ? (
          <>
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Upload Excel File</h3>
                <p className="text-sm text-gray-600">
                  Upload an Excel file with student information. The file must contain columns for "Student ID" and "Student Name". Student IDs will be stored as-is in the dedicated student ID field.
                </p>
                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-md">
                  <p className="font-medium mb-1">⚠️ Important:</p>
                  <ul className="text-left space-y-1">
                    <li>• Column names must be exactly: "Student ID" and "Student Name"</li>
                    <li>• Student IDs will be stored exactly as provided (numeric or alphanumeric)</li>
                    <li>• Student IDs should be formatted as text (not numbers) in Excel</li>
                    <li>• Remove any empty rows from the file</li>
                    <li>• Download the template below for the correct format</li>
                  </ul>
                </div>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your Excel file here, or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileInput}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Processing...' : 'Choose File'}
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  variant="link"
                  onClick={downloadTemplate}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Download Template
                </Button>
                <p className="text-xs text-gray-500">
                  Download a template Excel file to see the required format
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-4">Upload Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Successful</span>
                  </div>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {uploadResult.successful.length}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <X className="h-5 w-5" />
                    <span className="font-medium">Failed</span>
                  </div>
                  <p className="text-2xl font-bold text-red-700 mt-1">
                    {uploadResult.failed.length}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Duplicates</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-700 mt-1">
                    {uploadResult.duplicates.length}
                  </p>
                </div>
              </div>

              {(uploadResult.failed.length > 0 || uploadResult.duplicates.length > 0) && (
                <div className="space-y-4">
                  {uploadResult.failed.length > 0 && (
                    <div className="text-left">
                      <h4 className="font-medium text-red-700 mb-2">Failed Uploads:</h4>
                      <div className="max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded p-3">
                        {uploadResult.failed.map((item, index) => (
                          <div key={index} className="text-sm text-red-600 mb-1">
                            {item.name} ({item.email}): {item.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.duplicates.length > 0 && (
                    <div className="text-left">
                      <h4 className="font-medium text-yellow-700 mb-2">Duplicates:</h4>
                      <div className="max-h-40 overflow-y-auto bg-yellow-50 border border-yellow-200 rounded p-3">
                        {uploadResult.duplicates.map((item, index) => (
                          <div key={index} className="text-sm text-yellow-600 mb-1">
                            {item.name} ({item.email}): {item.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button onClick={resetUpload}>
                Upload Another File
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}