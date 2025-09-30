import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Database, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useBackendHealth } from "@/hooks/useDatabricks";

interface DataConfigProps {
  tableName: string;
  onTableNameChange: (tableName: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const DataConfig = ({ tableName, onTableNameChange, onRefresh, isLoading }: DataConfigProps) => {
  const { data: health, isLoading: healthLoading } = useBackendHealth();

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">Data Configuration</h2>
        </div>
        {health && (
          <Badge variant={health.status === 'ok' ? 'default' : 'destructive'} className="text-xs">
            {health.status === 'ok' ? 'Connected' : 'Disconnected'}
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Backend Status */}
        {health && (
          <div className="text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Service:</span>
              <span className="font-mono">{health.service}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profile:</span>
              <span className="font-mono">{health.profile}</span>
            </div>
          </div>
        )}

        {/* Table Name Input */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground">
            Unity Catalog Table Name
          </Label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={tableName}
              onChange={(e) => onTableNameChange(e.target.value)}
              placeholder="samples.nyctaxi.trips"
              className="h-9 font-mono text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || !tableName.trim()}
              className="h-9 px-3"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the full path to your Unity Catalog table (e.g., catalog.schema.table)
          </p>
        </div>
      </div>
    </Card>
  );
};

export default DataConfig;
