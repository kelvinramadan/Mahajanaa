import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Target, TrendingUp, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CriteriaWeights {
  landArea: number;
  productivity: number;
  sellingPrice: number;
  productionCost: number;
  laborAvailability: number;
  marketDemand: number;
  derivativesPotential: number;
}

interface CriteriaWeightsProps {
  weights: CriteriaWeights;
  onWeightsChange: (weights: CriteriaWeights) => void;
}

const criteriaInfo = [
  {
    key: 'landArea',
    name: 'Luas Lahan',
    description: 'Ketersediaan lahan untuk budidaya',
    unit: 'Ha',
    type: 'benefit',
    icon: '🌾'
  },
  {
    key: 'productivity',
    name: 'Produktivitas',
    description: 'Hasil produksi per hektar',
    unit: 'Ton/Ha',
    type: 'benefit',
    icon: '📈'
  },
  {
    key: 'sellingPrice',
    name: 'Harga Jual',
    description: 'Nilai jual komoditas di pasar',
    unit: 'Rp/Kg',
    type: 'benefit',
    icon: '💰'
  },
  {
    key: 'productionCost',
    name: 'Biaya Produksi',
    description: 'Total biaya untuk produksi',
    unit: 'Rp/Ha',
    type: 'cost',
    icon: '💸'
  },
  {
    key: 'laborAvailability',
    name: 'Tenaga Kerja',
    description: 'Ketersediaan pekerja pertanian',
    unit: 'Orang',
    type: 'benefit',
    icon: '👥'
  },
  {
    key: 'marketDemand',
    name: 'Permintaan Pasar',
    description: 'Tingkat kebutuhan pasar lokal',
    unit: '%',
    type: 'benefit',
    icon: '🛒'
  },
  {
    key: 'derivativesPotential',
    name: 'Potensi Turunan',
    description: 'Kemungkinan pengembangan produk',
    unit: 'Skala 1-5',
    type: 'benefit',
    icon: '🔄'
  }
];

const presetWeights = {
  economic: {
    name: 'Fokus Ekonomi',
    description: 'Mengutamakan profitabilitas dan efisiensi ekonomi',
    weights: {
      landArea: 10,
      productivity: 25,
      sellingPrice: 25,
      productionCost: 20,
      laborAvailability: 5,
      marketDemand: 10,
      derivativesPotential: 5,
    }
  },
  foodSecurity: {
    name: 'Ketahanan Pangan',
    description: 'Mengutamakan produksi untuk kebutuhan pangan lokal',
    weights: {
      landArea: 20,
      productivity: 30,
      sellingPrice: 5,
      productionCost: 10,
      laborAvailability: 15,
      marketDemand: 15,
      derivativesPotential: 5,
    }
  },
  efficiency: {
    name: 'Efisiensi Sumber Daya',
    description: 'Mengoptimalkan penggunaan lahan dan tenaga kerja',
    weights: {
      landArea: 25,
      productivity: 20,
      sellingPrice: 10,
      productionCost: 15,
      laborAvailability: 20,
      marketDemand: 5,
      derivativesPotential: 5,
    }
  },
  balanced: {
    name: 'Seimbang',
    description: 'Distribusi bobot yang merata untuk semua kriteria',
    weights: {
      landArea: 14,
      productivity: 14,
      sellingPrice: 14,
      productionCost: 15,
      laborAvailability: 14,
      marketDemand: 15,
      derivativesPotential: 14,
    }
  }
};

export function CriteriaWeights({ weights, onWeightsChange }: CriteriaWeightsProps) {
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  const handleWeightChange = (criteriaKey: keyof CriteriaWeights, value: number[]) => {
    const newWeights = {
      ...weights,
      [criteriaKey]: value[0]
    };
    onWeightsChange(newWeights);
  };

  const handlePresetChange = (presetKey: string) => {
    if (presetKey && presetWeights[presetKey as keyof typeof presetWeights]) {
      const preset = presetWeights[presetKey as keyof typeof presetWeights];
      onWeightsChange(preset.weights);
      setSelectedPreset(presetKey);
      toast({
        title: "Preset Diterapkan",
        description: `Bobot kriteria diatur sesuai preset: ${preset.name}`,
      });
    }
  };

  const handleNormalize = () => {
    const normalized = Object.keys(weights).reduce((acc, key) => {
      acc[key as keyof CriteriaWeights] = Math.round((weights[key as keyof CriteriaWeights] / totalWeight) * 100);
      return acc;
    }, {} as CriteriaWeights);
    
    onWeightsChange(normalized);
    toast({
      title: "Bobot Dinormalisasi",
      description: "Semua bobot telah dinormalisasi menjadi total 100%",
    });
  };

  const handleReset = () => {
    onWeightsChange(presetWeights.balanced.weights);
    setSelectedPreset('balanced');
    toast({
      title: "Bobot Direset",
      description: "Bobot dikembalikan ke nilai default seimbang",
    });
  };

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Preset Bobot Kriteria
          </CardTitle>
          <CardDescription>
            Pilih preset yang sesuai dengan prioritas pengambilan keputusan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preset">Pilih Preset</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih preset bobot kriteria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(presetWeights).map(([key, preset]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col">
                        <span className="font-medium">{preset.name}</span>
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={handleNormalize} variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Normalisasi
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Weight Controls */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Pengaturan Bobot Manual</CardTitle>
          <CardDescription>
            Sesuaikan bobot setiap kriteria sesuai dengan prioritas keputusan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {criteriaInfo.map((criteria) => {
              const weight = weights[criteria.key as keyof CriteriaWeights];
              
              return (
                <div key={criteria.key} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{criteria.icon}</span>
                      <div>
                        <Label className="text-sm font-medium">
                          {criteria.name}
                          <Badge variant={criteria.type === 'benefit' ? 'default' : 'secondary'} className="ml-2 text-xs">
                            {criteria.type === 'benefit' ? 'Benefit' : 'Cost'}
                          </Badge>
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {criteria.description} ({criteria.unit})
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{weight}</div>
                      <div className="text-xs text-muted-foreground">
                        {totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0.0'}%
                      </div>
                    </div>
                  </div>
                  
                  <Slider
                    value={[weight]}
                    onValueChange={(value) => handleWeightChange(criteria.key as keyof CriteriaWeights, value)}
                    max={50}
                    min={0}
                    step={1}
                    className="flex-1"
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Attention Notice */}
      {totalWeight !== 100 && (
        <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
          <p className="text-sm text-warning-foreground">
            <strong>Perhatian:</strong> Total bobot saat ini {totalWeight}%. 
            Disarankan untuk menormalisasi bobot menjadi 100% untuk hasil yang optimal.
          </p>
        </div>
      )}

      {/* Weight Summary */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Ringkasan Bobot
            </span>
            <Badge variant={totalWeight === 100 ? "default" : "secondary"}>
              Total: {totalWeight.toFixed(0)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {criteriaInfo.map((criteria) => {
              const weight = weights[criteria.key as keyof CriteriaWeights];
              const percentage = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(1) : '0.0';
              
              return (
                <div key={criteria.key} className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl mb-1">{criteria.icon}</div>
                  <div className="text-sm font-medium">{criteria.name}</div>
                  <div className="text-lg font-bold text-primary">{percentage}%</div>
                  <Badge variant={criteria.type === 'benefit' ? 'default' : 'secondary'} className="text-xs">
                    {criteria.type === 'benefit' ? 'Benefit' : 'Cost'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}