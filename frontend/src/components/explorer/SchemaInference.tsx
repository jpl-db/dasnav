import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Clock, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
  includeInTopN?: boolean;
}
interface SchemaInferenceProps {
  schema: SchemaColumn[];
  onSchemaUpdate: (schema: SchemaColumn[]) => void;
}

const SchemaInference = ({ schema, onSchemaUpdate }: SchemaInferenceProps) => {
  const timeColumn = schema.find(col => col.role === 'time')?.name || '';
  
  const handleTimeColumnChange = (columnName: string) => {
    // Set the selected column as time, and reset any other time columns
    const updatedSchema = schema.map(col => ({
      ...col,
      role: col.name === columnName 
        ? 'time' as const 
        : col.role === 'time' 
          ? 'unassigned' as const 
          : col.role
    }));
    onSchemaUpdate(updatedSchema);
  };

  const handleTopNToggle = (columnName: string, checked: boolean) => {
    const updatedSchema = schema.map(col => 
      col.name === columnName ? { ...col, includeInTopN: checked } : col
    );
    onSchemaUpdate(updatedSchema);
  };

  // Filter potential time columns (timestamp, date types)
  const timeColumnCandidates = schema.filter(col => {
    const type = col.type.toLowerCase();
    return type.includes('timestamp') || type.includes('date') || type.includes('time');
  });

  const dimensions = schema.filter(col => col.role === 'dimension');

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-foreground">Time Configuration</h2>
      </div>
      
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Select which column to use for the X-axis (time dimension)
        </p>
        
        {schema.length === 0 ? (
          <div className="rounded-md bg-muted p-4 text-center">
            <p className="text-xs text-muted-foreground">No schema available</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Time Column</Label>
            <Select value={timeColumn} onValueChange={handleTimeColumnChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select time column" />
              </SelectTrigger>
              <SelectContent>
                {timeColumnCandidates.length > 0 ? (
                  <>
                    {timeColumnCandidates.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <>
                    {schema.map((col) => (
                      <SelectItem key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            
            {timeColumn && (
              <div className="mt-3 rounded-md bg-muted/50 p-3">
                <p className="text-xs font-medium text-foreground mb-2">Available Metrics:</p>
                <div className="flex flex-wrap gap-1">
                  {schema.filter(col => col.role === 'metric').map(col => (
                    <span key={col.name} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      {col.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {dimensions.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground">Top N Analysis</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Select dimensions to include in Top N visualizations
              </p>
              <div className="space-y-2">
                {dimensions.map((col) => (
                  <div key={col.name} className="flex items-center gap-3 rounded-md border border-border p-2 hover:bg-muted/50">
                    <Checkbox
                      id={`topn-${col.name}`}
                      checked={col.includeInTopN || false}
                      onCheckedChange={(checked) => handleTopNToggle(col.name, checked as boolean)}
                    />
                    <label
                      htmlFor={`topn-${col.name}`}
                      className="flex-1 text-sm font-medium cursor-pointer"
                    >
                      {col.name}
                      <span className="ml-2 text-xs text-muted-foreground">({col.type})</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
export default SchemaInference;