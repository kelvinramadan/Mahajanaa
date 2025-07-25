import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommodityInput } from './CommodityInput';
import { CriteriaWeights as CriteriaWeightsComponent } from './CriteriaWeights';
import { Results } from './Results';
import { Calculator, Wheat, BarChart3, Download, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Commodity {
  id: string;
  name: string;
  landArea: number;
  productivity: number;
  sellingPrice: number;
  productionCost: number;
  laborAvailability: number;
  marketDemand: number;
  derivativesPotential: number;
}

export interface CriteriaWeights {
  landArea: number;
  productivity: number;
  sellingPrice: number;
  productionCost: number;
  laborAvailability: number;
  marketDemand: number;
  derivativesPotential: number;
}

export interface CalculationResult {
  saw: {
    alternatives: Array<{
      id: string;
      name: string;
      score: number;
      rank: number;
    }>;
  };
  topsis: {
    alternatives: Array<{
      id: string;
      name: string;
      score: number;
      rank: number;
    }>;
  };
}

export function SPKDashboard() {
  const { toast } = useToast();
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [budget, setBudget] = useState<number>(0);
  const [weights, setWeights] = useState<CriteriaWeights>({
    landArea: 15,
    productivity: 20,
    sellingPrice: 15,
    productionCost: 15,
    laborAvailability: 10,
    marketDemand: 15,
    derivativesPotential: 10,
  });
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    if (commodities.length < 2) {
      toast({
        title: "Error",
        description: "Minimal 2 komoditas diperlukan untuk perhitungan",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const calculationResult = calculateSPK(commodities, weights);
      setResults(calculationResult);
      
      toast({
        title: "Perhitungan Berhasil",
        description: "Hasil SAW dan TOPSIS telah dikalkulasi",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan dalam perhitungan",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleReset = () => {
    setCommodities([]);
    setBudget(0);
    setResults(null);
    toast({
      title: "Data Direset",
      description: "Semua data telah dihapus",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-gradient-primary shadow-soft border-b">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary-glow rounded-lg flex items-center justify-center flex-shrink-0">
              <Wheat className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-primary-foreground truncate">
                Desa Mandiri Pangan
              </h1>
              <p className="text-primary-foreground/80 mt-1 text-sm sm:text-base">
                <span className="hidden sm:inline">Sistem Pendukung Keputusan Alokasi Sumber Daya Pertanian dalam Rangka Penguatan Ketahanan Pangan Desa</span>
                <span className="sm:hidden">SPK Ketahanan Pangan Desa</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="input" className="flex items-center gap-2 text-xs sm:text-sm">
              <Calculator className="w-4 h-4" />
              <span className="hidden sm:inline">Input Data & Bobot Kriteria</span>
              <span className="sm:hidden">Input Data</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2 text-xs sm:text-sm">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Hasil & Rekomendasi</span>
              <span className="sm:hidden">Hasil</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader className="bg-gradient-subtle rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Wheat className="w-5 h-5 text-primary" />
                  Data Komoditas Pertanian
                </CardTitle>
                <CardDescription>
                  Masukkan data komoditas yang akan dibandingkan untuk pengambilan keputusan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CommodityInput 
                  commodities={commodities}
                  onCommoditiesChange={setCommodities}
                  budget={budget}
                  onBudgetChange={setBudget}
                />
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader className="bg-gradient-subtle rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Penetapan Bobot Kriteria
                </CardTitle>
                <CardDescription>
                  Tentukan tingkat kepentingan setiap kriteria dalam pengambilan keputusan
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <CriteriaWeightsComponent
                  weights={weights}
                  onWeightsChange={setWeights}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Results
              commodities={commodities}
              weights={weights}
              results={results}
              budget={budget}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || commodities.length < 2}
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300 w-full sm:w-auto"
            size="lg"
          >
            {isCalculating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Menghitung...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Hitung SPK
              </>
            )}
          </Button>          
          <Button
            onClick={handleReset}
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset Data
          </Button>
        </div>
      </div>
    </div>
  );
}

// SPK Calculation Functions
function calculateSAW(commodities: Commodity[], weights: CriteriaWeights) {
  const normalizedWeights = normalizeWeights(weights);
  
  // Normalize criteria (benefit/cost)
  const normalized = commodities.map(commodity => {
    const maxLandArea = Math.max(...commodities.map(c => c.landArea));
    const maxProductivity = Math.max(...commodities.map(c => c.productivity));
    const maxSellingPrice = Math.max(...commodities.map(c => c.sellingPrice));
    const minProductionCost = Math.min(...commodities.map(c => c.productionCost));
    const maxLaborAvailability = Math.max(...commodities.map(c => c.laborAvailability));
    const maxMarketDemand = Math.max(...commodities.map(c => c.marketDemand));
    const maxDerivativesPotential = Math.max(...commodities.map(c => c.derivativesPotential));

    return {
      id: commodity.id,
      name: commodity.name,
      landArea: commodity.landArea / maxLandArea,
      productivity: commodity.productivity / maxProductivity,
      sellingPrice: commodity.sellingPrice / maxSellingPrice,
      productionCost: minProductionCost / commodity.productionCost, // Cost criteria (lower is better)
      laborAvailability: commodity.laborAvailability / maxLaborAvailability,
      marketDemand: commodity.marketDemand / maxMarketDemand,
      derivativesPotential: commodity.derivativesPotential / maxDerivativesPotential,
    };
  });

  // Calculate weighted scores
  const scored = normalized.map(item => {
    const score = 
      item.landArea * normalizedWeights.landArea +
      item.productivity * normalizedWeights.productivity +
      item.sellingPrice * normalizedWeights.sellingPrice +
      item.productionCost * normalizedWeights.productionCost +
      item.laborAvailability * normalizedWeights.laborAvailability +
      item.marketDemand * normalizedWeights.marketDemand +
      item.derivativesPotential * normalizedWeights.derivativesPotential;

    return {
      id: item.id,
      name: item.name,
      score: score * 100, // Scale to 0-100
    };
  });

  // Sort and rank
  scored.sort((a, b) => b.score - a.score);
  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function calculateTOPSIS(commodities: Commodity[], weights: CriteriaWeights) {
  const normalizedWeights = normalizeWeights(weights);
  
  // Create decision matrix
  const matrix = commodities.map(commodity => [
    commodity.landArea,
    commodity.productivity,
    commodity.sellingPrice,
    1 / commodity.productionCost, // Invert cost criteria
    commodity.laborAvailability,
    commodity.marketDemand,
    commodity.derivativesPotential,
  ]);

  // Normalize decision matrix
  const normalized = matrix.map(row => 
    row.map((value, colIndex) => {
      const columnSum = Math.sqrt(matrix.reduce((sum, r) => sum + r[colIndex] ** 2, 0));
      return value / columnSum;
    })
  );

  // Apply weights
  const weighted = normalized.map(row => [
    row[0] * normalizedWeights.landArea,
    row[1] * normalizedWeights.productivity,
    row[2] * normalizedWeights.sellingPrice,
    row[3] * normalizedWeights.productionCost,
    row[4] * normalizedWeights.laborAvailability,
    row[5] * normalizedWeights.marketDemand,
    row[6] * normalizedWeights.derivativesPotential,
  ]);

  // Determine ideal solutions
  const idealBest = weighted[0].map((_, colIndex) => 
    Math.max(...weighted.map(row => row[colIndex]))
  );
  const idealWorst = weighted[0].map((_, colIndex) => 
    Math.min(...weighted.map(row => row[colIndex]))
  );

  // Calculate distances and scores
  const scored = weighted.map((row, index) => {
    const distanceBest = Math.sqrt(
      row.reduce((sum, value, colIndex) => 
        sum + (value - idealBest[colIndex]) ** 2, 0
      )
    );
    const distanceWorst = Math.sqrt(
      row.reduce((sum, value, colIndex) => 
        sum + (value - idealWorst[colIndex]) ** 2, 0
      )
    );
    
    const score = distanceWorst / (distanceBest + distanceWorst);
    
    return {
      id: commodities[index].id,
      name: commodities[index].name,
      score: score * 100, // Scale to 0-100
    };
  });

  // Sort and rank
  scored.sort((a, b) => b.score - a.score);
  return scored.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function calculateSPK(commodities: Commodity[], weights: CriteriaWeights): CalculationResult {
  return {
    saw: {
      alternatives: calculateSAW(commodities, weights),
    },
    topsis: {
      alternatives: calculateTOPSIS(commodities, weights),
    },
  };
}

function normalizeWeights(weights: CriteriaWeights) {
  const total = Object.values(weights).reduce((sum: number, weight: number) => sum + weight, 0);
  return {
    landArea: weights.landArea / total,
    productivity: weights.productivity / total,
    sellingPrice: weights.sellingPrice / total,
    productionCost: weights.productionCost / total,
    laborAvailability: weights.laborAvailability / total,
    marketDemand: weights.marketDemand / total,
    derivativesPotential: weights.derivativesPotential / total,
  };
}