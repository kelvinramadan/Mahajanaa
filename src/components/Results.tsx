import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Award, BarChart3, Download, FileText, TrendingUp, Calculator, Target, DollarSign, Shield, Lightbulb, Users, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import type { Commodity, CriteriaWeights as CriteriaWeightsType, CalculationResult } from './SPKDashboard';

interface ResultsProps {
  commodities: Commodity[];
  weights: CriteriaWeightsType;
  results: CalculationResult | null;
  budget: number;
  onCalculate: () => void;
  isCalculating: boolean;
}

export function Results({ commodities, weights, results, budget, onCalculate, isCalculating }: ResultsProps) {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [showCalculationSteps, setShowCalculationSteps] = useState(false);

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!results) return;

    try {
      if (format === 'pdf') {
        await exportToPDF();
      } else {
        exportToExcel();
      }
      
      toast({
        title: "Export Berhasil",
        description: `Hasil SPK berhasil diekspor ke format ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Export Gagal",
        description: "Terjadi kesalahan saat mengekspor data",
        variant: "destructive",
      });
    }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with automatic line wrapping
    const addText = (text: string, x: number, y: number, maxWidth?: number) => {
      if (maxWidth) {
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return y + (lines.length * 6);
      } else {
        pdf.text(text, x, y);
        return y + 6;
      }
    };

    // Title
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('LAPORAN HASIL ANALISIS SPK', margin, yPosition);
    yPosition = addText('Sistem Pendukung Keputusan Komoditas Pertanian', margin, yPosition + 5);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition = addText(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, margin, yPosition + 10);
    
    // Budget info
    if (budget > 0) {
      yPosition = addText(`Anggaran Tersedia: Rp ${budget.toLocaleString('id-ID')}`, margin, yPosition + 5);
    }

    yPosition += 15;

    // Recommendation
    const recommendation = getRecommendation();
    if (recommendation) {
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'bold');
      yPosition = addText('REKOMENDASI SISTEM', margin, yPosition);
      
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      yPosition = addText(recommendation.message, margin, yPosition + 5, pageWidth - 2 * margin);
      yPosition += 10;
    }

    // Results Table
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('HASIL PERINGKAT KOMODITAS', margin, yPosition);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    
    // Table headers
    const headers = ['Peringkat', 'Komoditas', 'Skor SAW', 'Skor TOPSIS', 'Rata-rata'];
    const columnWidths = [25, 60, 30, 30, 30];
    let xPos = margin;
    
    yPosition += 10;
    pdf.setFont(undefined, 'bold');
    headers.forEach((header, i) => {
      pdf.text(header, xPos, yPosition);
      xPos += columnWidths[i];
    });
    
    pdf.line(margin, yPosition + 2, pageWidth - margin, yPosition + 2);
    yPosition += 8;
    
    // Table data
    pdf.setFont(undefined, 'normal');
    commodities.forEach((commodity) => {
      const sawResult = results.saw.alternatives.find(a => a.id === commodity.id);
      const topsisResult = results.topsis.alternatives.find(a => a.id === commodity.id);
      const avgScore = sawResult && topsisResult ? (sawResult.score + topsisResult.score) / 2 : 0;
      
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = margin;
      }
      
      xPos = margin;
      const data = [
        `#${sawResult?.rank || '-'}`,
        commodity.name,
        sawResult?.score.toFixed(2) || '-',
        topsisResult?.score.toFixed(2) || '-',
        avgScore.toFixed(2)
      ];
      
      data.forEach((cell, i) => {
        pdf.text(cell, xPos, yPosition);
        xPos += columnWidths[i];
      });
      yPosition += 6;
    });

    // Budget Allocation
    yPosition += 15;
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('REKOMENDASI ALOKASI ANGGARAN', margin, yPosition);
    
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    yPosition += 5;
    
    const budgetAllocation = calculateBudgetAllocation();
    budgetAllocation.forEach((item, index) => {
      yPosition = addText(
        `${index + 1}. ${item.name}: ${item.percentage.toFixed(1)}% (Rp ${item.allocation.toLocaleString('id-ID')})`,
        margin,
        yPosition + 5,
        pageWidth - 2 * margin
      );
    });

    // Food Security Index
    yPosition += 15;
    const foodSecurity = calculateFoodSecurityIndex();
    
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    yPosition = addText('INDIKATOR KETAHANAN PANGAN', margin, yPosition);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    yPosition = addText(`Skor: ${foodSecurity.score}/100 (${foodSecurity.category})`, margin, yPosition + 5);

    // Save PDF
    pdf.save(`Laporan_SPK_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
      ['LAPORAN HASIL ANALISIS SPK'],
      ['Sistem Pendukung Keputusan Komoditas Pertanian'],
      [''],
      [`Tanggal: ${new Date().toLocaleDateString('id-ID')}`],
      ...(budget > 0 ? [[`Anggaran: Rp ${budget.toLocaleString('id-ID')}`]] : []),
      [''],
      ['REKOMENDASI SISTEM'],
      [getRecommendation()?.message || ''],
      ['']
    ];
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summaryWS, 'Ringkasan');
    
    // Sheet 2: Detailed Results
    const resultsData = [
      ['Peringkat', 'Komoditas', 'Skor SAW', 'Peringkat SAW', 'Skor TOPSIS', 'Peringkat TOPSIS', 'Rata-rata Skor']
    ];
    
    commodities.forEach((commodity) => {
      const sawResult = results!.saw.alternatives.find(a => a.id === commodity.id);
      const topsisResult = results!.topsis.alternatives.find(a => a.id === commodity.id);
      const avgScore = sawResult && topsisResult ? (sawResult.score + topsisResult.score) / 2 : 0;
      
      resultsData.push([
        sawResult?.rank?.toString() || '',
        commodity.name,
        sawResult?.score.toFixed(2) || '',
        sawResult?.rank?.toString() || '',
        topsisResult?.score.toFixed(2) || '',
        topsisResult?.rank?.toString() || '',
        avgScore.toFixed(2)
      ]);
    });
    
    const resultsWS = XLSX.utils.aoa_to_sheet(resultsData);
    XLSX.utils.book_append_sheet(workbook, resultsWS, 'Hasil Detail');
    
    // Sheet 3: Budget Allocation
    const budgetData = [
      ['REKOMENDASI ALOKASI ANGGARAN'],
      [''],
      ['Peringkat', 'Komoditas', 'Persentase (%)', 'Alokasi (Rp)', 'Prioritas']
    ];
    
    const budgetAllocation = calculateBudgetAllocation();
    budgetAllocation.forEach((item, index) => {
      budgetData.push([
        (index + 1).toString(),
        item.name,
        item.percentage.toFixed(1),
        item.allocation.toLocaleString('id-ID'),
        item.priority
      ]);
    });
    
    const budgetWS = XLSX.utils.aoa_to_sheet(budgetData);
    XLSX.utils.book_append_sheet(workbook, budgetWS, 'Alokasi Anggaran');
    
    // Sheet 4: Food Security
    const foodSecurity = calculateFoodSecurityIndex();
    const foodSecurityData = [
      ['INDIKATOR KETAHANAN PANGAN'],
      [''],
      ['Indikator', 'Nilai'],
      ['Skor Total', foodSecurity.score],
      ['Kategori', foodSecurity.category],
      ['Diversitas', foodSecurity.details.diversity],
      ['Faktor Pasar', foodSecurity.details.market],
      ['Produktivitas', foodSecurity.details.productivity],
      ['Skor SPK', foodSecurity.details.spkScore]
    ];
    
    const foodSecurityWS = XLSX.utils.aoa_to_sheet(foodSecurityData);
    XLSX.utils.book_append_sheet(workbook, foodSecurityWS, 'Ketahanan Pangan');
    
    // Save Excel file
    XLSX.writeFile(workbook, `Laporan_SPK_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank === 2) return 'secondary';
    if (rank === 3) return 'outline';
    return 'secondary';
  };

  const getRecommendation = () => {
    if (!results) return null;

    const sawWinner = results.saw.alternatives[0];
    const topsisWinner = results.topsis.alternatives[0];
    
    if (sawWinner.id === topsisWinner.id) {
      return {
        type: 'consensus',
        commodity: sawWinner,
        message: `Kedua metode (SAW & TOPSIS) merekomendasikan ${sawWinner.name} sebagai prioritas utama pengembangan.`
      };
    } else {
      return {
        type: 'different',
        sawWinner,
        topsisWinner,
        message: `Terdapat perbedaan rekomendasi: SAW merekomendasikan ${sawWinner.name}, sedangkan TOPSIS merekomendasikan ${topsisWinner.name}.`
      };
    }
  };

  const calculateBudgetAllocation = () => {
    if (!results) return [];
    
    const totalBudget = budget || 1000000000; // Use input budget or default
    const topCommodities = results.saw.alternatives.slice(0, 3);
    const totalScore = topCommodities.reduce((sum, item) => sum + item.score, 0);
    
    return topCommodities.map((commodity, index) => {
      const percentage = (commodity.score / totalScore) * 100;
      const allocation = (commodity.score / totalScore) * totalBudget;
      
      return {
        ...commodity,
        percentage: percentage,
        allocation: allocation,
        priority: index === 0 ? 'Tinggi' : index === 1 ? 'Sedang' : 'Rendah'
      };
    });
  };

  const calculateFoodSecurityIndex = () => {
    if (!results || commodities.length === 0) return { score: 0, category: 'Tidak Terhitung', color: 'muted' };
    
    // Calculate based on top 3 commodities and their characteristics
    const topCommodities = results.saw.alternatives.slice(0, 3);
    const totalScore = topCommodities.reduce((sum, item) => sum + item.score, 0);
    const avgScore = totalScore / topCommodities.length;
    
    // Factor in market demand and productivity from original commodities
    const topCommodityData = topCommodities.map(alt => 
      commodities.find(c => c.id === alt.id)
    ).filter(Boolean);
    
    const avgMarketDemand = topCommodityData.reduce((sum, c) => sum + (c?.marketDemand || 0), 0) / topCommodityData.length;
    const avgProductivity = topCommodityData.reduce((sum, c) => sum + (c?.productivity || 0), 0) / topCommodityData.length;
    
    // Calculate food security index (0-100)
    const diversityBonus = Math.min(commodities.length * 5, 20); // Max 20 points for diversity
    const marketFactor = (avgMarketDemand / 100) * 30; // Max 30 points for market demand
    const productivityFactor = Math.min(avgProductivity * 2, 25); // Max 25 points for productivity
    const scoreFactor = (avgScore / 100) * 25; // Max 25 points for SPK score
    
    const foodSecurityScore = diversityBonus + marketFactor + productivityFactor + scoreFactor;
    
    let category = 'Rawan';
    let color = 'destructive';
    
    if (foodSecurityScore >= 75) {
      category = 'Kuat';
      color = 'default';
    } else if (foodSecurityScore >= 50) {
      category = 'Sedang';
      color = 'secondary';
    }
    
    return {
      score: Math.round(foodSecurityScore),
      category,
      color,
      details: {
        diversity: Math.round(diversityBonus),
        market: Math.round(marketFactor),
        productivity: Math.round(productivityFactor),
        spkScore: Math.round(scoreFactor)
      }
    };
  };

  const getDevelopmentRecommendations = () => {
    if (!results) return [];
    
    const topCommodity = results.saw.alternatives[0];
    const secondCommodity = results.saw.alternatives[1];
    const thirdCommodity = results.saw.alternatives[2];
    
    const recommendations = [
      {
        icon: Target,
        title: 'Prioritas Utama',
        description: `Fokus pengembangan ${topCommodity?.name} sebagai komoditas unggulan`,
        actions: [
          'Alokasi lahan terbesar untuk komoditas ini',
          'Pelatihan intensif teknik budidaya modern',
          'Penyediaan bibit/benih berkualitas tinggi',
          'Pembentukan kelompok tani khusus'
        ]
      },
      {
        icon: Users,
        title: 'Pengembangan SDM',
        description: 'Penguatan kapasitas petani dan kelembagaan',
        actions: [
          'Pelatihan teknik budidaya untuk semua komoditas prioritas',
          'Workshop pengolahan produk turunan',
          'Pembentukan koperasi petani',
          'Pelatihan manajemen keuangan pertanian'
        ]
      },
      {
        icon: DollarSign,
        title: 'Dukungan Modal',
        description: 'Bantuan permodalan dan akses pasar',
        actions: [
          'Program kredit mikro untuk petani',
          'Bantuan sarana produksi (pupuk, pestisida)',
          'Pengadaan alat-alat pertanian modern',
          'Pembangunan akses jalan ke lahan pertanian'
        ]
      },
      {
        icon: TrendingUp,
        title: 'Diversifikasi',
        description: `Pengembangan ${secondCommodity?.name} dan ${thirdCommodity?.name} sebagai alternatif`,
        actions: [
          'Uji coba penanaman komoditas alternatif',
          'Penelitian adaptasi varietas lokal',
          'Program rotasi tanaman',
          'Pengembangan produk olahan'
        ]
      }
    ];
    
    return recommendations;
  };

  if (!results && commodities.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="text-center py-12">
          <Calculator className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Data</h3>
          <p className="text-muted-foreground mb-4">
            Tambahkan minimal 2 komoditas untuk memulai perhitungan SPK
          </p>
          <Button onClick={() => window.location.hash = '#input'} variant="outline">
            Tambah Komoditas
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="shadow-soft">
        <CardContent className="text-center py-12">
          <div className="space-y-4">
            <Target className="w-16 h-16 text-primary mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">Menunggu Perhitungan</h3>
              <p className="text-muted-foreground mb-4">
                {commodities.length} komoditas telah diinput. Gunakan tombol "Hitung SPK" di bagian bawah halaman untuk menjalankan analisis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recommendation = getRecommendation();

  return (
    <div className="space-y-6">
      {/* Recommendation Card */}
      <Card className="shadow-soft border-primary/20">
        <CardHeader className="bg-gradient-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Rekomendasi Sistem
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Hasil analisis berdasarkan metode SAW dan TOPSIS
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recommendation && (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                recommendation.type === 'consensus' 
                  ? 'bg-success/10 border border-success/20' 
                  : 'bg-warning/10 border border-warning/20'
              }`}>
                <div className="flex items-start gap-3">
                  {recommendation.type === 'consensus' ? (
                    <Award className="w-5 h-5 text-success mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {recommendation.message}
                    </p>
                    {recommendation.type === 'different' && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Disarankan untuk meninjau kembali bobot kriteria atau menggunakan metode tambahan untuk validasi.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {recommendation.type === 'consensus' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">#1</div>
                    <div className="text-sm text-muted-foreground">Peringkat</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {((results.saw.alternatives[0].score + results.topsis.alternatives[0].score) / 2).toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">Rata-rata Skor</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {recommendation.commodity.name}
                    </div>
                    <div className="text-xs text-muted-foreground">Komoditas Terpilih</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Allocation */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            Rekomendasi Alokasi Anggaran
          </CardTitle>
          <CardDescription>
            Pembagian dana optimal berdasarkan peringkat komoditas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {calculateBudgetAllocation().map((item, index) => (
                <div key={item.id} className="p-4 border rounded-lg bg-gradient-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={index === 0 ? 'default' : index === 1 ? 'secondary' : 'outline'}>
                      {item.priority}
                    </Badge>
                    <span className="text-sm font-medium">#{item.rank}</span>
                  </div>
                  <h4 className="font-semibold text-lg mb-1">{item.name}</h4>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {item.percentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rp {item.allocation.toLocaleString('id-ID')}
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {budget > 0 
                  ? `* Berdasarkan anggaran yang diinput: Rp ${budget.toLocaleString('id-ID')}` 
                  : "* Estimasi berdasarkan asumsi total anggaran Rp 1 Miliar. Masukkan anggaran aktual untuk perhitungan yang lebih akurat."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Food Security Index */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Indikator Ketahanan Pangan Desa
          </CardTitle>
          <CardDescription>
            Status ketahanan pangan berdasarkan analisis komoditas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const foodSecurity = calculateFoodSecurityIndex();
            return (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-primary mb-4">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {foodSecurity.score}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Badge variant={foodSecurity.color as any} className="text-lg px-4 py-2">
                      {foodSecurity.category}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Indeks Ketahanan Pangan: {foodSecurity.score}/100
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-primary">{foodSecurity.details.diversity}</div>
                    <div className="text-xs text-muted-foreground">Diversitas</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-primary">{foodSecurity.details.market}</div>
                    <div className="text-xs text-muted-foreground">Pasar</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-primary">{foodSecurity.details.productivity}</div>
                    <div className="text-xs text-muted-foreground">Produktivitas</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-lg font-bold text-primary">{foodSecurity.details.spkScore}</div>
                    <div className="text-xs text-muted-foreground">Skor SPK</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-sm font-medium mb-2">Interpretasi:</div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {foodSecurity.score >= 75 && (
                      <p>✅ Desa memiliki ketahanan pangan yang kuat dengan diversitas komoditas yang baik.</p>
                    )}
                    {foodSecurity.score >= 50 && foodSecurity.score < 75 && (
                      <p>⚠️ Ketahanan pangan sedang, perlu peningkatan produktivitas dan diversifikasi.</p>
                    )}
                    {foodSecurity.score < 50 && (
                      <p>🔴 Ketahanan pangan rawan, diperlukan intervensi segera dan program intensif.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Development Recommendations */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Rencana Pengembangan
          </CardTitle>
          <CardDescription>
            Saran program dan kegiatan pendukung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {getDevelopmentRecommendations().map((rec, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <rec.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
                <div className="ml-13">
                  <ul className="space-y-1">
                    {rec.actions.map((action, actionIndex) => (
                      <li key={actionIndex} className="text-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Summary */}
      <Card className="shadow-soft border-primary/20">
        <CardHeader className="bg-gradient-subtle rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Ringkasan Tindak Lanjut
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {(() => {
            const topThree = results?.saw.alternatives.slice(0, 3) || [];
            const foodSecurity = calculateFoodSecurityIndex();
            
            return (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-primary/10 rounded-lg border border-primary/20">
                  <p className="text-sm leading-relaxed">
                    <strong>Rekomendasi Utama:</strong> Prioritaskan pengembangan{' '}
                    <span className="font-semibold text-primary">{topThree[0]?.name}</span>
                    {topThree[1] && (
                      <span> dan <span className="font-semibold text-primary">{topThree[1]?.name}</span></span>
                    )} sebagai komoditas unggulan. 
                    {topThree[2] && (
                      <span> Pertimbangkan <span className="font-semibold text-primary">{topThree[2]?.name}</span> sebagai alternatif diversifikasi.</span>
                    )}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Status Ketahanan Pangan</div>
                    <div className="flex items-center gap-2">
                      <Badge variant={foodSecurity.color as any}>{foodSecurity.category}</Badge>
                      <span className="text-sm text-muted-foreground">({foodSecurity.score}/100)</span>
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-1">Komoditas Terevaluasi</div>
                    <div className="text-lg font-semibold text-primary">{commodities.length} komoditas</div>
                  </div>
                </div>

                {foodSecurity.score < 50 && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Perhatian Khusus</span>
                    </div>
                    <p className="text-sm text-destructive/80 mt-1">
                      Ketahanan pangan desa dalam kategori rawan. Disarankan untuk segera 
                      melaksanakan program intensifikasi dan diversifikasi pertanian.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Results Comparison */}
      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="comparison" className="text-xs sm:text-sm px-2 py-2">
            <span className="hidden sm:inline">Perbandingan</span>
            <span className="sm:hidden">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="saw" className="text-xs sm:text-sm px-2 py-2">SAW</TabsTrigger>
          <TabsTrigger value="topsis" className="text-xs sm:text-sm px-2 py-2">TOPSIS</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Perbandingan Hasil SAW vs TOPSIS
                  </CardTitle>
                  <CardDescription>
                    Tabel perbandingan peringkat dari kedua metode
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowCalculationSteps(!showCalculationSteps)}
                  className="flex items-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  {showCalculationSteps ? 'Sembunyikan' : 'Tampilkan'} Proses Perhitungan
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Komoditas</TableHead>
                      <TableHead className="text-center">SAW</TableHead>
                      <TableHead className="text-center">TOPSIS</TableHead>
                      <TableHead className="text-center">Rata-rata Skor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commodities.map((commodity) => {
                      const sawResult = results.saw.alternatives.find(a => a.id === commodity.id);
                      const topsisResult = results.topsis.alternatives.find(a => a.id === commodity.id);
                      const avgScore = sawResult && topsisResult 
                        ? (sawResult.score + topsisResult.score) / 2 
                        : 0;
                      
                      return (
                        <TableRow key={commodity.id}>
                          <TableCell className="font-medium">{commodity.name}</TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <Badge variant={getRankBadgeVariant(sawResult?.rank || 0)}>
                                #{sawResult?.rank}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {sawResult?.score.toFixed(1)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <Badge variant={getRankBadgeVariant(topsisResult?.rank || 0)}>
                                #{topsisResult?.rank}
                              </Badge>
                              <div className="text-xs text-muted-foreground">
                                {topsisResult?.score.toFixed(1)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="space-y-1">
                              <div className="font-semibold">{avgScore.toFixed(1)}</div>
                              <Progress value={avgScore} className="w-16 h-2" />
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {sawResult?.rank === topsisResult?.rank ? (
                              <Badge variant="default">Konsisten</Badge>
                            ) : (
                              <Badge variant="secondary">Berbeda</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              
              {/* Calculation Steps Display */}
              {showCalculationSteps && (
                <div className="mt-6 space-y-6">
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-primary" />
                      Langkah-langkah Perhitungan
                    </h3>
                    
                    <Tabs defaultValue="saw-steps" className="space-y-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="saw-steps">Proses SAW</TabsTrigger>
                        <TabsTrigger value="topsis-steps">Proses TOPSIS</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="saw-steps" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Metode SAW (Simple Additive Weighting)</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Langkah 1: Normalisasi Matriks</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                Untuk kriteria benefit: R[i,j] = X[i,j] / Max(X[i,j])<br/>
                                Untuk kriteria cost: R[i,j] = Min(X[i,j]) / X[i,j]
                              </p>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Komoditas</TableHead>
                                      <TableHead>Luas Lahan</TableHead>
                                      <TableHead>Produktivitas</TableHead>
                                      <TableHead>Harga Jual</TableHead>
                                      <TableHead>Tenaga Kerja</TableHead>
                                      <TableHead>Permintaan Pasar</TableHead>
                                      <TableHead>Potensi Turunan</TableHead>
                                      <TableHead>Biaya Produksi</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {commodities.map((commodity) => (
                                      <TableRow key={commodity.id}>
                                        <TableCell className="font-medium">{commodity.name}</TableCell>
                                        <TableCell>{(commodity.landArea / Math.max(...commodities.map(c => c.landArea))).toFixed(3)}</TableCell>
                                        <TableCell>{(commodity.productivity / Math.max(...commodities.map(c => c.productivity))).toFixed(3)}</TableCell>
                                        <TableCell>{(commodity.sellingPrice / Math.max(...commodities.map(c => c.sellingPrice))).toFixed(3)}</TableCell>
                                        <TableCell>{(commodity.laborAvailability / Math.max(...commodities.map(c => c.laborAvailability))).toFixed(3)}</TableCell>
                                        <TableCell>{(commodity.marketDemand / Math.max(...commodities.map(c => c.marketDemand))).toFixed(3)}</TableCell>
                                        <TableCell>{(commodity.derivativesPotential / Math.max(...commodities.map(c => c.derivativesPotential))).toFixed(3)}</TableCell>
                                        <TableCell>{(Math.min(...commodities.map(c => c.productionCost)) / commodity.productionCost).toFixed(3)}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Langkah 2: Perhitungan Skor Akhir</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                S[i] = Σ(W[j] × R[i,j])
                              </p>
                              <div className="space-y-2">
                                {results.saw.alternatives.map((alternative) => {
                                  const commodity = commodities.find(c => c.id === alternative.id);
                                  if (!commodity) return null;
                                  
                                  const normalizedValues = [
                                    commodity.landArea / Math.max(...commodities.map(c => c.landArea)),
                                    commodity.productivity / Math.max(...commodities.map(c => c.productivity)),
                                    commodity.sellingPrice / Math.max(...commodities.map(c => c.sellingPrice)),
                                    commodity.laborAvailability / Math.max(...commodities.map(c => c.laborAvailability)),
                                    commodity.marketDemand / Math.max(...commodities.map(c => c.marketDemand)),
                                    commodity.derivativesPotential / Math.max(...commodities.map(c => c.derivativesPotential)),
                                    Math.min(...commodities.map(c => c.productionCost)) / commodity.productionCost
                                  ];
                                  
                                  const weightValues = [
                                    weights.landArea,
                                    weights.productivity,
                                    weights.sellingPrice,
                                    weights.laborAvailability,
                                    weights.marketDemand,
                                    weights.derivativesPotential,
                                    weights.productionCost
                                  ];
                                  
                                  return (
                                    <div key={alternative.id} className="p-3 bg-background rounded border">
                                      <div className="font-medium mb-1">{commodity.name}:</div>
                                      <div className="text-sm text-muted-foreground">
                                        S = ({weightValues[0]} × {normalizedValues[0].toFixed(3)}) + 
                                        ({weightValues[1]} × {normalizedValues[1].toFixed(3)}) + 
                                        ({weightValues[2]} × {normalizedValues[2].toFixed(3)}) + 
                                        ({weightValues[3]} × {normalizedValues[3].toFixed(3)}) + 
                                        ({weightValues[4]} × {normalizedValues[4].toFixed(3)}) + 
                                        ({weightValues[5]} × {normalizedValues[5].toFixed(3)}) + 
                                        ({weightValues[6]} × {normalizedValues[6].toFixed(3)}) = 
                                        <span className="font-semibold text-primary"> {alternative.score.toFixed(3)}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      <TabsContent value="topsis-steps" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Metode TOPSIS</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Langkah 1: Normalisasi Matriks</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                R[i,j] = X[i,j] / √(Σ(X[i,j]²))
                              </p>
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Komoditas</TableHead>
                                      <TableHead>Luas Lahan</TableHead>
                                      <TableHead>Produktivitas</TableHead>
                                      <TableHead>Harga Jual</TableHead>
                                      <TableHead>Tenaga Kerja</TableHead>
                                      <TableHead>Permintaan Pasar</TableHead>
                                      <TableHead>Potensi Turunan</TableHead>
                                      <TableHead>Biaya Produksi</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {commodities.map((commodity) => {
                                      // Calculate TOPSIS normalization
                                      const sqrtSums = [
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.landArea * c.landArea, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.productivity * c.productivity, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.sellingPrice * c.sellingPrice, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.laborAvailability * c.laborAvailability, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.marketDemand * c.marketDemand, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.derivativesPotential * c.derivativesPotential, 0)),
                                        Math.sqrt(commodities.reduce((sum, c) => sum + c.productionCost * c.productionCost, 0))
                                      ];
                                      
                                      return (
                                        <TableRow key={commodity.id}>
                                          <TableCell className="font-medium">{commodity.name}</TableCell>
                                          <TableCell>{(commodity.landArea / sqrtSums[0]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.productivity / sqrtSums[1]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.sellingPrice / sqrtSums[2]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.laborAvailability / sqrtSums[3]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.marketDemand / sqrtSums[4]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.derivativesPotential / sqrtSums[5]).toFixed(3)}</TableCell>
                                          <TableCell>{(commodity.productionCost / sqrtSums[6]).toFixed(3)}</TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Langkah 2: Solusi Ideal Positif dan Negatif</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                A+ = nilai maksimal untuk benefit, minimal untuk cost<br/>
                                A- = nilai minimal untuk benefit, maksimal untuk cost
                              </p>
                            </div>
                            
                            <div className="p-4 bg-muted rounded-lg">
                              <h4 className="font-semibold mb-2">Langkah 3: Perhitungan Kedekatan Relatif</h4>
                              <p className="text-sm text-muted-foreground mb-3">
                                C[i] = D[i-] / (D[i+] + D[i-])
                              </p>
                              <div className="space-y-2">
                                {results.topsis.alternatives.map((alternative) => (
                                  <div key={alternative.id} className="p-3 bg-background rounded border">
                                    <div className="font-medium mb-1">{alternative.name}:</div>
                                    <div className="text-sm text-muted-foreground">
                                      Skor TOPSIS = <span className="font-semibold text-primary">{alternative.score.toFixed(3)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saw" className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Hasil Metode SAW (Simple Additive Weighting)</CardTitle>
              <CardDescription>
                Peringkat berdasarkan penjumlahan terbobot dari nilai normalisasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peringkat</TableHead>
                      <TableHead>Komoditas</TableHead>
                      <TableHead>Skor SAW</TableHead>
                      <TableHead>Visualisasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.saw.alternatives.map((alternative) => (
                      <TableRow key={alternative.id}>
                        <TableCell>
                          <Badge variant={getRankBadgeVariant(alternative.rank)}>
                            #{alternative.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alternative.name}</TableCell>
                        <TableCell>
                          <div className="text-lg font-semibold">{alternative.score.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={alternative.score} className="w-24" />
                            <div className="text-xs text-muted-foreground">
                              {alternative.score.toFixed(1)}%
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topsis" className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Hasil Metode TOPSIS</CardTitle>
              <CardDescription>
                Peringkat berdasarkan kedekatan terhadap solusi ideal positif dan negatif
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Peringkat</TableHead>
                      <TableHead>Komoditas</TableHead>
                      <TableHead>Skor TOPSIS</TableHead>
                      <TableHead>Visualisasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.topsis.alternatives.map((alternative) => (
                      <TableRow key={alternative.id}>
                        <TableCell>
                          <Badge variant={getRankBadgeVariant(alternative.rank)}>
                            #{alternative.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{alternative.name}</TableCell>
                        <TableCell>
                          <div className="text-lg font-semibold">{alternative.score.toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Progress value={alternative.score} className="w-24" />
                            <div className="text-xs text-muted-foreground">
                              {alternative.score.toFixed(1)}%
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Export Hasil
          </CardTitle>
          <CardDescription>
            Unduh hasil analisis dalam format yang diinginkan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => handleExport('pdf')}
              className="bg-gradient-primary w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}