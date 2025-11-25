'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  collegeId?: string;
  departmentId?: string;
  programId?: string;
  batchId?: string;
}

interface CourseUploadProps {
  user: User;
  onCoursesUploaded?: () => void;
  onClose?: () => void;
}

interface CourseData {
  code: string;
  name: string;
  semester?: string;
}

interface UploadResult {
  success: boolean;
  course?: CourseData;
  error?: string;
}

export function CourseBulkUpload({ user, onCoursesUploaded, onClose }: CourseUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const templateData = [
      {
        'Course Code': 'CS101',
        'Course Name': 'Introduction to Programming',
        'Semester': '1st'
      },
      {
        'Course Code': 'CS102',
        'Course Name': 'Data Structures',
        'Semester': '2nd'
      },
      {
        'Course Code': 'CS201',
        'Course Name': 'Database Management',
        'Semester': '3rd'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'course_upload_template.xlsx');
  };

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

  const handleFile = (selectedFile: File) => {
    const fileTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    
    if (!fileTypes.includes(selectedFile.type)) {
      toast.error('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setFile(selectedFile);
    setUploadResults([]);
  };

  const parseExcelFile = async (file: File): Promise<CourseData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const courses: CourseData[] = jsonData.map((row: any) => ({
            code: row['Course Code'] || row['course code'] || row['CODE'] || '',
            name: row['Course Name'] || row['course name'] || row['NAME'] || '',
            semester: row['Semester'] || row['semester'] || row['SEMESTER'] || '1st'
          })).filter(course => course.code && course.name);

          resolve(courses);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    // Validate that user has program and batch selected
    if (!user.programId || !user.batchId) {
      toast.error('Please select a program and batch before uploading courses');
      return;
    }

    setIsUploading(true);
    setUploadResults([]);

    try {
      const courses = await parseExcelFile(file);
      
      if (courses.length === 0) {
        toast.error('No valid courses found in the file');
        setIsUploading(false);
        return;
      }

      const results: UploadResult[] = [];

      for (const course of courses) {
        try {
          const requestData = {
            courses: [course],
            programId: user.programId,
            batchId: user.batchId,
          };
          
          console.log('Sending request with data:', requestData);
          
          const response = await fetch('/api/courses/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          if (response.ok) {
            results.push({ success: true, course });
          } else {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            results.push({ 
              success: false, 
              course, 
              error: errorData.message || errorData.error || 'Failed to create course' 
            });
          }
        } catch (error) {
          results.push({ 
            success: false, 
            course, 
            error: 'Network error' 
          });
        }
      }

      setUploadResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} course(s)`);
      }
      
      if (failureCount > 0) {
        toast.error(`Failed to upload ${failureCount} course(s)`);
      }

      if (successCount > 0) {
        onCoursesUploaded?.();
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to process file');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadResults([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Upload className="h-6 w-6 text-red-600" />
        </div>
        <CardTitle className="text-xl font-bold text-gray-900">Bulk Upload Courses</CardTitle>
        <CardDescription>
          Upload multiple courses at once using an Excel file
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Context */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Current Context</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Program ID: {user.programId || 'Not selected'}</p>
            <p>Batch ID: {user.batchId || 'Not selected'}</p>
          </div>
          {(!user.programId || !user.batchId) && (
            <p className="text-xs text-red-600 mt-2">
              ⚠️ Please select both program and batch before uploading
            </p>
          )}
        </div>

        {/* Download Template */}
        <div className="text-center">
          <Button
            onClick={downloadTemplate}
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Download the Excel template to see the required format
          </p>
        </div>

        {/* File Upload Area */}
        <div className="space-y-4">
          <Label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
            Select Excel File
          </Label>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            <div className="space-y-2">
              <FileText className="h-8 w-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag and drop your Excel file here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                Supports .xlsx and .xls files
              </p>
            </div>
          </div>

          {/* Selected File */}
          {file && (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="flex justify-center gap-2">
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Courses
              </>
            )}
          </Button>
          
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Upload Results</h3>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {uploadResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.course?.code} - {result.course?.name}
                    </p>
                    {!result.success && (
                      <p className="text-xs text-red-600">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• The Excel file should contain columns: Course Code, Course Name, Semester</p>
          <p>• Course Code and Course Name are required fields</p>
          <p>• Semester will default to "1st" if not provided</p>
          <p>• Duplicate course codes in the same program and batch will be rejected</p>
        </div>
      </CardContent>
    </Card>
  );
}