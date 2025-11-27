'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Upload, FileText, Users, Building } from 'lucide-react';
import { toast } from 'sonner';

interface IndirectAttainmentData {
  poCode: string;
  alumniSurvey: number;
  exitSurvey: number;
  employerSurvey: number;
  average: number;
  comments: string;
}

interface IndirectAttainmentFormProps {
  programId: string;
  batchId: string;
  poCodes: string[];
  onSave: (data: IndirectAttainmentData[]) => void;
}

export function IndirectAttainmentForm({ programId, batchId, poCodes, onSave }: IndirectAttainmentFormProps) {
  const [activeTab, setActiveTab] = useState('alumni');
  const [surveyData, setSurveyData] = useState<Record<string, IndirectAttainmentData>>(() => {
    const initial: Record<string, IndirectAttainmentData> = {};
    poCodes.forEach(poCode => {
      initial[poCode] = {
        poCode,
        alumniSurvey: 0,
        exitSurvey: 0,
        employerSurvey: 0,
        average: 0,
        comments: ''
      };
    });
    return initial;
  });

  const updateSurveyData = (poCode: string, field: keyof IndirectAttainmentData, value: number | string) => {
    setSurveyData(prev => {
      const updated = { ...prev };
      const poData = { ...updated[poCode] };
      
      if (field !== 'comments') {
        // Explicitly handle numeric fields
        if (field === 'alumniSurvey' || field === 'exitSurvey' || field === 'employerSurvey' || field === 'average') {
          poData[field] = value as number;
        }
        // Recalculate average
        const surveys = [poData.alumniSurvey, poData.exitSurvey, poData.employerSurvey].filter(v => v > 0);
        poData.average = surveys.length > 0 ? surveys.reduce((sum, v) => sum + v, 0) / surveys.length : 0;
      } else {
        poData[field] = value as string;
      }
      
      updated[poCode] = poData;
      return updated;
    });
  };

  const handleSave = () => {
    const data = Object.values(surveyData);
    
    // Validate that at least one survey is completed for each PO
    const invalidPOs = data.filter(po => 
      po.alumniSurvey === 0 && po.exitSurvey === 0 && po.employerSurvey === 0
    );
    
    if (invalidPOs.length > 0) {
      toast.error(`Please complete at least one survey for: ${invalidPOs.map(po => po.poCode).join(', ')}`);
      return;
    }
    
    onSave(data);
    toast.success('Indirect attainment data saved successfully');
  };

  const handleBulkUpload = (surveyType: 'alumni' | 'exit' | 'employer') => {
    // This would typically open a file upload dialog
    toast.info(`Bulk upload for ${surveyType} survey would be implemented here`);
  };

  const getSurveyColor = (value: number) => {
    if (value >= 2.5) return 'text-green-600';
    if (value >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Indirect Attainment Input
          </CardTitle>
          <CardDescription>
            Enter survey-based indirect attainment data for Program Outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alumni" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alumni Survey
              </TabsTrigger>
              <TabsTrigger value="exit" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Exit Survey
              </TabsTrigger>
              <TabsTrigger value="employer" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Employer Survey
              </TabsTrigger>
            </TabsList>

            <TabsContent value="alumni" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Alumni Survey Data</h3>
                <Button variant="outline" size="sm" onClick={() => handleBulkUpload('alumni')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
              <div className="grid gap-4">
                {poCodes.map(poCode => (
                  <div key={poCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <Label className="font-medium">{poCode}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      step="0.1"
                      placeholder="0.0 - 3.0"
                      value={surveyData[poCode].alumniSurvey || ''}
                      onChange={(e) => updateSurveyData(poCode, 'alumniSurvey', parseFloat(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">
                      Current: <span className={getSurveyColor(surveyData[poCode].alumniSurvey)}>
                        {surveyData[poCode].alumniSurvey.toFixed(1)}
                      </span>
                    </div>
                    <Textarea
                      placeholder="Comments for this PO..."
                      value={surveyData[poCode].comments}
                      onChange={(e) => updateSurveyData(poCode, 'comments', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="exit" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Course Exit Survey Data</h3>
                <Button variant="outline" size="sm" onClick={() => handleBulkUpload('exit')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
              <div className="grid gap-4">
                {poCodes.map(poCode => (
                  <div key={poCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <Label className="font-medium">{poCode}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      step="0.1"
                      placeholder="0.0 - 3.0"
                      value={surveyData[poCode].exitSurvey || ''}
                      onChange={(e) => updateSurveyData(poCode, 'exitSurvey', parseFloat(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">
                      Current: <span className={getSurveyColor(surveyData[poCode].exitSurvey)}>
                        {surveyData[poCode].exitSurvey.toFixed(1)}
                      </span>
                    </div>
                    <div />
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="employer" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Employer Survey Data</h3>
                <Button variant="outline" size="sm" onClick={() => handleBulkUpload('employer')}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
              </div>
              <div className="grid gap-4">
                {poCodes.map(poCode => (
                  <div key={poCode} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <Label className="font-medium">{poCode}</Label>
                    <Input
                      type="number"
                      min="0"
                      max="3"
                      step="0.1"
                      placeholder="0.0 - 3.0"
                      value={surveyData[poCode].employerSurvey || ''}
                      onChange={(e) => updateSurveyData(poCode, 'employerSurvey', parseFloat(e.target.value) || 0)}
                    />
                    <div className="text-sm text-muted-foreground">
                      Current: <span className={getSurveyColor(surveyData[poCode].employerSurvey)}>
                        {surveyData[poCode].employerSurvey.toFixed(1)}
                      </span>
                    </div>
                    <div />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Summary Section */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-4">Summary & Averages</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">PO Code</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Alumni</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Exit</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Employer</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Average</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {poCodes.map(poCode => {
                    const data = surveyData[poCode];
                    return (
                      <tr key={poCode} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-medium">{poCode}</td>
                        <td className={`border border-gray-300 px-4 py-2 text-center ${getSurveyColor(data.alumniSurvey)}`}>
                          {data.alumniSurvey.toFixed(1)}
                        </td>
                        <td className={`border border-gray-300 px-4 py-2 text-center ${getSurveyColor(data.exitSurvey)}`}>
                          {data.exitSurvey.toFixed(1)}
                        </td>
                        <td className={`border border-gray-300 px-4 py-2 text-center ${getSurveyColor(data.employerSurvey)}`}>
                          {data.employerSurvey.toFixed(1)}
                        </td>
                        <td className={`border border-gray-300 px-4 py-2 text-center font-bold ${getSurveyColor(data.average)}`}>
                          {data.average.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          <Badge variant={data.average >= 2.0 ? 'default' : 'destructive'}>
                            {data.average >= 2.0 ? 'Target Met' : 'Below Target'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Indirect Attainment Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}