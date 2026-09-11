import React, { useState } from 'react';
import { useSalaryData, parseNumber, formatKWD } from '@/hooks/use-salary-data';
import { Plus, Trash2, Wallet, Receipt, AlertCircle, CalendarDays, ShoppingBag } from 'lucide-react';

export default function Home() {
  const [salaryError, setSalaryError] = useState('');
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseResult, setPurchaseResult] = useState<{
    message?: string;
    percentage?: number;
    tone: 'green' | 'amber' | 'red' | 'neutral';
    exceedsRemaining?: boolean;
  } | null>(null);
  const {
    salary,
    setSalary,
    commitments,
    addCommitment,
    updateCommitment,
    removeCommitment,
    isCalculated,
    calculate,
    isReady
  } = useSalaryData();

  if (!isReady) {
    return null; // Avoid hydration mismatch on initial render
  }

  const numericSalary = parseNumber(salary);
  
  // Calculate total commitments
  const totalCommitments = commitments.reduce((total, c) => {
    return total + parseNumber(c.amount);
  }, 0);

  const remainingSalary = numericSalary - totalCommitments;
  const dailyBudget = remainingSalary > 0 ? remainingSalary / 30 : 0;
  const isDeficit = remainingSalary < 0;

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimal point
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setSalary(val);
      setSalaryError('');
    }
  };

  const handleCalculate = () => {
    if (numericSalary <= 0) {
      setSalaryError('أدخل راتبك الشهري أولاً');
      return;
    }

    setSalaryError('');
    setPurchaseResult(null);
    calculate();
  };

  const handleCommitmentAmountChange = (id: string, value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      updateCommitment(id, 'amount', value);
    }
  };

  const handlePurchaseAmountChange = (value: string) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setPurchaseAmount(value);
      setPurchaseError('');
      setPurchaseResult(null);
    }
  };

  const handlePurchaseCheck = () => {
    if (!isCalculated) {
      setPurchaseError('احسب راتبك والتزاماتك أول');
      setPurchaseResult(null);
      return;
    }

    const amount = parseNumber(purchaseAmount);
    if (amount <= 0) {
      setPurchaseError('أدخل سعر الشي أو القسط الشهري');
      setPurchaseResult(null);
      return;
    }

    setPurchaseError('');

    if (remainingSalary <= 0 || amount > remainingSalary) {
      const percentage = remainingSalary > 0 ? (amount / remainingSalary) * 100 : undefined;
      setPurchaseResult({
        message: 'المبلغ أعلى من راتبك المتبقي حاليًا',
        tone: 'red',
        percentage,
        exceedsRemaining: true,
      });
      return;
    }

    const percentage = (amount / remainingSalary) * 100;
    const result =
      percentage <= 20
        ? { message: 'مناسبة لميزانيتك', tone: 'green' as const }
        : percentage <= 40
          ? { message: 'ممكن، بس انتبه لصرفك', tone: 'amber' as const }
          : { message: 'الأفضل تأجلها', tone: 'red' as const };

    setPurchaseResult({ ...result, percentage });
  };

  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 w-full bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
              <Wallet className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">DOOM | دُوم</h1>
          </div>
          <p className="text-sm font-medium text-muted-foreground">خل راتبك يدوم</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 pb-8">
        {/* Salary Input Section */}
        <section className="bg-card rounded-[2rem] p-6 shadow-xl shadow-primary/5 border border-card-border">
          <label htmlFor="salary" className="block text-sm font-semibold text-foreground mb-3">
            الراتب الشهري
          </label>
          <div className="relative flex items-center">
            <input
              id="salary"
              type="text"
              inputMode="decimal"
              value={salary}
              onChange={handleSalaryChange}
              placeholder="0.000"
              className="w-full bg-muted/50 border border-input rounded-2xl py-4 px-5 text-2xl font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all pr-14 text-right"
              dir="ltr"
              aria-describedby={salaryError ? 'salary-error' : undefined}
              aria-invalid={Boolean(salaryError)}
            />
            <span className="absolute right-5 text-muted-foreground font-medium select-none">
              د.ك
            </span>
          </div>
          {salaryError && (
            <p id="salary-error" className="mt-2 text-sm font-semibold text-destructive">
              {salaryError}
            </p>
          )}
        </section>

        {/* Commitments Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" />
              الالتزامات والمصاريف
            </h2>
          </div>

          <div className="space-y-3">
            {commitments.map((commitment) => (
              <div 
                key={commitment.id} 
                className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm border border-card-border transition-all hover:border-primary/30 group"
              >
                <div className="flex-1">
                  <input
                    type="text"
                    value={commitment.name}
                    onChange={(e) => updateCommitment(commitment.id, 'name', e.target.value)}
                    placeholder="اسم الالتزام (مثال: قسط سيارة)"
                    className="w-full bg-transparent border-none text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0 px-2 py-1"
                  />
                </div>
                <div className="w-32 relative flex items-center">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={commitment.amount}
                    onChange={(e) => handleCommitmentAmountChange(commitment.id, e.target.value)}
                    placeholder="0.000"
                    className="w-full bg-muted/50 border border-input rounded-xl py-2 px-3 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50 text-right transition-all"
                    dir="ltr"
                  />
                </div>
                <button
                  onClick={() => removeCommitment(commitment.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex-shrink-0"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {commitments.length === 0 && (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-foreground font-medium">لا توجد التزامات</p>
                  <p className="text-sm text-muted-foreground mt-1">أضف مصاريفك الثابتة لحساب دقيق</p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={addCommitment}
            className="w-full py-4 border-2 border-dashed border-primary/20 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            إضافة التزام
          </button>
        </section>

        {/* Calculate CTA */}
        <div>
          <button
            onClick={handleCalculate}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg font-bold py-4 rounded-2xl shadow-xl shadow-primary/25 transition-transform active:scale-[0.98] flex items-center justify-center"
          >
            احسب لي
          </button>
        </div>

        {/* Results Section */}
        {isCalculated && (
          <section className="animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
            <div className={`rounded-[2rem] p-6 shadow-xl border ${isDeficit ? 'bg-destructive/5 border-destructive/20 text-destructive-foreground' : 'bg-primary border-primary text-primary-foreground'}`}>
              
              {isDeficit ? (
                <div className="flex items-center gap-3 mb-6 bg-destructive/10 text-destructive p-4 rounded-xl">
                  <AlertCircle className="w-6 h-6 flex-shrink-0" />
                  <p className="font-bold text-sm">تنبيه: التزاماتك تتجاوز راتبك الحالي. يرجى مراجعة مصاريفك.</p>
                </div>
              ) : null}

              <div className="text-center mb-8">
                <p className={`text-sm font-medium opacity-90 mb-1 ${isDeficit ? 'text-destructive' : 'text-primary-foreground/80'}`}>الراتب المتبقي</p>
                <div className={`text-4xl font-black tracking-tight ${isDeficit ? 'text-destructive' : 'text-white'}`} dir="ltr">
                  {formatKWD(remainingSalary)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-2xl ${isDeficit ? 'bg-background' : 'bg-white/10'}`}>
                  <p className={`text-xs font-medium mb-1 ${isDeficit ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>الراتب الأساسي</p>
                  <p className={`text-lg font-bold ${isDeficit ? 'text-foreground' : 'text-white'}`} dir="ltr">{formatKWD(numericSalary)}</p>
                </div>
                <div className={`p-4 rounded-2xl ${isDeficit ? 'bg-background' : 'bg-white/10'}`}>
                  <p className={`text-xs font-medium mb-1 ${isDeficit ? 'text-muted-foreground' : 'text-primary-foreground/70'}`}>إجمالي الالتزامات</p>
                  <p className={`text-lg font-bold ${isDeficit ? 'text-foreground' : 'text-white'}`} dir="ltr">{formatKWD(totalCommitments)}</p>
                </div>
              </div>

              <div className={`mt-4 p-5 rounded-2xl flex items-center justify-between ${isDeficit ? 'bg-background' : 'bg-white/15'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDeficit ? 'bg-muted' : 'bg-white/20'}`}>
                      <CalendarDays className={`w-5 h-5 ${isDeficit ? 'text-destructive' : 'text-white'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${isDeficit ? 'text-foreground' : 'text-white'}`}>ميزانية الصرف اليومية</p>
                      <p className={`text-xs font-medium ${isDeficit ? 'text-muted-foreground' : 'text-primary-foreground/80'}`}>مبنية على 30 يوم</p>
                    </div>
                  </div>
                  <div className={`text-xl font-black ${isDeficit ? 'text-destructive' : 'text-white'}`} dir="ltr">
                    {formatKWD(dailyBudget)}
                  </div>
                </div>
            </div>
          </section>
        )}

        {/* Purchase Check Section */}
        <section className="bg-card rounded-[2rem] p-6 shadow-xl shadow-primary/5 border border-card-border space-y-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">أقدر عليها؟</h2>
          </div>

          <div className="space-y-3">
            <label htmlFor="purchase-name" className="block text-sm font-semibold text-foreground">
              اسم الشي
            </label>
            <input
              id="purchase-name"
              type="text"
              value={purchaseName}
              onChange={(e) => setPurchaseName(e.target.value)}
              placeholder="مثال: سماعة جديدة"
              className="w-full bg-muted/50 border border-input rounded-2xl py-3 px-4 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-right"
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="purchase-amount" className="block text-sm font-semibold text-foreground">
              السعر أو القسط الشهري
            </label>
            <div className="relative flex items-center">
              <input
                id="purchase-amount"
                type="text"
                inputMode="decimal"
                value={purchaseAmount}
                onChange={(e) => handlePurchaseAmountChange(e.target.value)}
                placeholder="0.000"
                className="w-full bg-muted/50 border border-input rounded-2xl py-3 px-4 pr-14 text-sm font-bold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-right"
                dir="ltr"
              />
              <span className="absolute right-5 text-muted-foreground font-medium select-none">
                د.ك
              </span>
            </div>
          </div>

          {purchaseError && (
            <p className="text-sm font-semibold text-destructive" role="alert">
              {purchaseError}
            </p>
          )}

          <button
            type="button"
            onClick={handlePurchaseCheck}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/15 transition-transform active:scale-[0.98]"
          >
            شوف إذا تناسبني
          </button>

          {purchaseResult && isCalculated && (
            <div
              className={`rounded-2xl p-5 border ${
                purchaseResult.tone === 'green'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : purchaseResult.tone === 'amber'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-red-50 border-red-200 text-red-800'
              }`}
              role="status"
            >
              <p className="text-lg font-black">{purchaseResult.message}</p>
              {purchaseResult.exceedsRemaining ? (
                <>
                  <p className="mt-2 text-sm font-medium">
                    المتبقي عندك: <span dir="ltr">{formatKWD(Math.max(remainingSalary, 0))}</span>
                  </p>
                  {purchaseResult.percentage !== undefined && (
                    <p className="mt-2 text-sm font-medium">
                      هالشراء ياخذ تقريبًا{' '}
                      <span dir="ltr">{purchaseResult.percentage.toFixed(1)}%</span> من المبلغ المتبقي عندك
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm font-medium">
                  هالشراء ياخذ تقريبًا{' '}
                  <span dir="ltr">{purchaseResult.percentage?.toFixed(1)}%</span> من المبلغ المتبقي عندك
                </p>
              )}
            </div>
          )}
        </section>
      </main>

    </div>
  );
}