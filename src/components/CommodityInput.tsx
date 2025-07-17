import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit } from 'lucide-react';
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

interface CommodityInputProps {
  commodities: Commodity[];
  onCommoditiesChange: (commodities: Commodity[]) => void;
  budget: number;
  onBudgetChange: (budget: number) => void;
}

export function CommodityInput({ commodities, onCommoditiesChange, budget, onBudgetChange }: CommodityInputProps) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Commodity>>({
    name: '',
    landArea: 0,
    productivity: 0,
    sellingPrice: 0,
    productionCost: 0,
    laborAvailability: 0,
    marketDemand: 0,
    derivativesPotential: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.landArea || !formData.productivity) {
      toast({
        title: "Error",
        description: "Nama komoditas, luas lahan, dan produktivitas wajib diisi",
        variant: "destructive",
      });
      return;
    }

    const newCommodity: Commodity = {
      id: editingId || `commodity-${Date.now()}`,
      name: formData.name || '',
      landArea: Number(formData.landArea) || 0,
      productivity: Number(formData.productivity) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      productionCost: Number(formData.productionCost) || 0,
      laborAvailability: Number(formData.laborAvailability) || 0,
      marketDemand: Number(formData.marketDemand) || 0,
      derivativesPotential: Number(formData.derivativesPotential) || 1,
    };

    if (editingId) {
      const updated = commodities.map(c => 
        c.id === editingId ? newCommodity : c
      );
      onCommoditiesChange(updated);
      toast({
        title: "Berhasil",
        description: "Data komoditas berhasil diperbarui",
      });
    } else {
      onCommoditiesChange([...commodities, newCommodity]);
      toast({
        title: "Berhasil",
        description: "Komoditas baru berhasil ditambahkan",
      });
    }

    resetForm();
  };

  const handleEdit = (commodity: Commodity) => {
    setEditingId(commodity.id);
    setFormData(commodity);
  };

  const handleDelete = (id: string) => {
    const updated = commodities.filter(c => c.id !== id);
    onCommoditiesChange(updated);
    toast({
      title: "Berhasil",
      description: "Komoditas berhasil dihapus",
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      landArea: 0,
      productivity: 0,
      sellingPrice: 0,
      productionCost: 0,
      laborAvailability: 0,
      marketDemand: 0,
      derivativesPotential: 1,
    });
  };

  const loadSampleData = () => {
    const sampleCommodities: Commodity[] = [
      {
        id: 'sample-1',
        name: 'Padi',
        landArea: 50,
        productivity: 5.2,
        sellingPrice: 4500,
        productionCost: 8000000,
        laborAvailability: 25,
        marketDemand: 85,
        derivativesPotential: 3,
      },
      {
        id: 'sample-2',
        name: 'Jagung',
        landArea: 30,
        productivity: 4.8,
        sellingPrice: 3200,
        productionCost: 6500000,
        laborAvailability: 20,
        marketDemand: 70,
        derivativesPotential: 4,
      },
      {
        id: 'sample-3',
        name: 'Singkong',
        landArea: 40,
        productivity: 25,
        sellingPrice: 1800,
        productionCost: 4000000,
        laborAvailability: 15,
        marketDemand: 60,
        derivativesPotential: 5,
      },
      {
        id: 'sample-4',
        name: 'Kacang Tanah',
        landArea: 20,
        productivity: 1.8,
        sellingPrice: 12000,
        productionCost: 7000000,
        laborAvailability: 18,
        marketDemand: 45,
        derivativesPotential: 2,
      },
    ];
    
    onCommoditiesChange(sampleCommodities);
    toast({
      title: "Data Contoh Dimuat",
      description: "4 komoditas contoh telah ditambahkan untuk demonstrasi",
    });
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? 'Edit Komoditas' : 'Tambah Komoditas Baru'}
          </CardTitle>
          <CardDescription>
            Masukkan data lengkap untuk setiap komoditas pertanian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Komoditas *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Padi, Jagung, Singkong"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="landArea">Luas Lahan (Ha) *</Label>
                <Input
                  id="landArea"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.landArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, landArea: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productivity">Produktivitas (Ton/Ha) *</Label>
                <Input
                  id="productivity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.productivity}
                  onChange={(e) => setFormData(prev => ({ ...prev, productivity: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Harga Jual (Rp/Kg)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  min="0"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, sellingPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionCost">Biaya Produksi (Rp/Ha)</Label>
                <Input
                  id="productionCost"
                  type="number"
                  min="0"
                  value={formData.productionCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="laborAvailability">Ketersediaan Tenaga Kerja (Orang)</Label>
                <Input
                  id="laborAvailability"
                  type="number"
                  min="0"
                  value={formData.laborAvailability}
                  onChange={(e) => setFormData(prev => ({ ...prev, laborAvailability: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="marketDemand">Kebutuhan Pasar Lokal (%)</Label>
                <Input
                  id="marketDemand"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.marketDemand}
                  onChange={(e) => setFormData(prev => ({ ...prev, marketDemand: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="derivativesPotential">Potensi Produk Turunan (1-5)</Label>
                <Input
                  id="derivativesPotential"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.derivativesPotential}
                  onChange={(e) => setFormData(prev => ({ ...prev, derivativesPotential: parseInt(e.target.value) || 1 }))}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                {editingId ? 'Update Komoditas' : 'Tambah Komoditas'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              )}
              {commodities.length === 0 && (
                <Button type="button" variant="secondary" onClick={loadSampleData}>
                  Muat Data Contoh
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Data Table */}
      {commodities.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Daftar Komoditas ({commodities.length})</CardTitle>
            <CardDescription>
              Data komoditas yang telah diinput
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Luas Lahan (Ha)</TableHead>
                    <TableHead>Produktivitas (Ton/Ha)</TableHead>
                    <TableHead>Harga Jual (Rp/Kg)</TableHead>
                    <TableHead>Biaya Produksi (Rp/Ha)</TableHead>
                    <TableHead>Tenaga Kerja</TableHead>
                    <TableHead>Pasar Lokal (%)</TableHead>
                    <TableHead>Potensi Turunan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commodities.map((commodity) => (
                    <TableRow key={commodity.id}>
                      <TableCell className="font-medium">{commodity.name}</TableCell>
                      <TableCell>{commodity.landArea.toFixed(1)}</TableCell>
                      <TableCell>{commodity.productivity.toFixed(1)}</TableCell>
                      <TableCell>{commodity.sellingPrice.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{commodity.productionCost.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{commodity.laborAvailability}</TableCell>
                      <TableCell>{commodity.marketDemand}%</TableCell>
                      <TableCell>{commodity.derivativesPotential}/5</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(commodity)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(commodity.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Input */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Anggaran yang Tersedia</CardTitle>
          <CardDescription>
            Total dana desa atau bantuan yang akan dialokasikan untuk pengembangan komoditas pertanian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="budget">Dana/Anggaran yang Tersedia (Rp)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              value={budget}
              onChange={(e) => onBudgetChange(Number(e.target.value) || 0)}
              placeholder="0"
              className="text-lg font-medium"
            />
            {budget > 0 && (
              <p className="text-sm text-muted-foreground">
                Total anggaran: Rp {budget.toLocaleString('id-ID')}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}