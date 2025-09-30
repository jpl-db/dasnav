import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, Hash, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
interface SchemaColumn {
  name: string;
  type: string;
  role: 'time' | 'metric' | 'dimension' | 'unassigned';
}
interface SchemaInferenceProps {
  schema: SchemaColumn[];
  onSchemaUpdate: (schema: SchemaColumn[]) => void;
}
const getRoleIcon = (role: string) => {
  switch (role) {
    case 'time':
      return <Clock className="h-3 w-3" />;
    case 'metric':
      return <Hash className="h-3 w-3" />;
    case 'dimension':
      return <Tag className="h-3 w-3" />;
    default:
      return null;
  }
};
const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  switch (role) {
    case 'time':
      return "default";
    case 'metric':
      return "secondary";
    default:
      return "outline";
  }
};
const SchemaInference = ({
  schema,
  onSchemaUpdate
}: SchemaInferenceProps) => {
  const handleRoleChange = (columnName: string, newRole: string) => {
    const updatedSchema = schema.map(col => col.name === columnName ? {
      ...col,
      role: newRole as SchemaColumn['role']
    } : col);
    onSchemaUpdate(updatedSchema);
  };
  return <Card className="p-4">
      <h2 className="mb-3 font-semibold text-foreground">Configure your dataset</h2>
      <div className="space-y-2">
        {schema.map(column => <div key={column.name} className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2">
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <p className="text-sm font-medium text-foreground truncate">{column.name}</p>
              <p className="text-xs text-muted-foreground">({column.type})</p>
            </div>
            <Select value={column.role} onValueChange={value => handleRoleChange(column.name, value)}>
              <SelectTrigger className="h-8 w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Time
                  </div>
                </SelectItem>
                <SelectItem value="metric">
                  <div className="flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Metric
                  </div>
                </SelectItem>
                <SelectItem value="dimension">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3 w-3" />
                    Dimension
                  </div>
                </SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>)}
      </div>
    </Card>;
};
export default SchemaInference;