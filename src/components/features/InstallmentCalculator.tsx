import { useState, useMemo } from 'react';
import { Calculator, Info } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { calculateInstallment, getAvailableMonths } from '@/lib/installment';
import { formatCurrency } from '@/lib/utils';

interface Props {
  productPrice: number;
  onPlanSelected?: (plan: ReturnType<typeof calculateInstallment>) => void;
}

export default function InstallmentCalculator({ productPrice, onPlanSelected }: Props) {
  const { t, lang, settings } = useApp();
  const [downPayment, setDownPayment] = useState(0);
  const [months, setMonths] = useState(settings.defaultInstallmentMonths);

  const availableMonths = getAvailableMonths();

  const plan = useMemo(
    () => calculateInstallment({ productPrice, downPayment, months }),
    [productPrice, downPayment, months]
  );

  const maxDown = Math.floor(productPrice * 0.8);

  function handleSelectPlan() {
    onPlanSelected?.(plan);
  }

  return (
    <div className="bg-gradient-to-br from-[#0f2460] to-[#1a368e] text-white rounded-2xl p-6 shadow-navy">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
          <Calculator size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg">{t('حاسبة التقسيط', 'Installment Calculator')}</h3>
          <p className="text-white/60 text-xs">{t('احسب قسطك الشهري فوراً', 'Calculate your monthly payment instantly')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Down Payment */}
        <div>
          <label className="text-sm text-white/80 mb-2 block">
            {t('المقدم', 'Down Payment')} ({t('اختياري', 'optional')})
          </label>
          <div className="relative">
            <input
              type="range"
              min={0}
              max={maxDown}
              step={500}
              value={downPayment}
              onChange={e => setDownPayment(Number(e.target.value))}
              className="w-full accent-[#d4a339]"
            />
            <div className="flex justify-between text-xs text-white/50 mt-1">
              <span>{t('0 مقدم', '0 Down')}</span>
              <span className="font-semibold text-[#d4a339]">{formatCurrency(downPayment, lang)}</span>
              <span>{formatCurrency(maxDown, lang)}</span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="text-sm text-white/80 mb-2 block">{t('مدة التقسيط', 'Duration')}</label>
          <div className="grid grid-cols-4 gap-1.5">
            {availableMonths.slice(0, 8).map(m => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                  months === m
                    ? 'bg-[#d4a339] text-[#0f2460]'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {m} {t('ش', 'm')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Summary */}
      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-white/60 text-xs mb-1">{t('القسط الشهري', 'Monthly')}</div>
            <div className="text-2xl font-bold text-[#d4a339]">{formatCurrency(plan.monthlyPayment, lang)}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">{t('المقدم', 'Down')}</div>
            <div className="font-bold text-lg">{formatCurrency(plan.downPayment, lang)}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">{t('الإجمالي', 'Total')}</div>
            <div className="font-bold text-lg">{formatCurrency(plan.totalAmount, lang)}</div>
          </div>
          <div>
            <div className="text-white/60 text-xs mb-1">{t('الفائدة', 'Interest')}</div>
            <div className="font-bold text-lg text-green-400">
              {plan.interestRate === 0 ? t('0%', '0%') : `${plan.interestRate}%`}
            </div>
          </div>
        </div>
      </div>

      {/* Inquiry Fee Notice */}
      <div className="flex items-start gap-2 bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-4">
        <Info size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-white/80">
          {t(
            `تنبيه: تُطبَّق رسوم استعلام وآي سكور بقيمة ${formatCurrency(plan.inquiryFee, 'ar')} تُدفع عند استلام الطلب من قِبل مشرف المحافظة. هذه الرسوم ثابتة ومحددة من الإدارة.`,
            `Note: An inquiry & i-Score fee of ${formatCurrency(plan.inquiryFee, 'en')} applies, paid upon order processing by the province supervisor. This fee is fixed by management.`
          )}
        </p>
      </div>

      {onPlanSelected && (
        <button onClick={handleSelectPlan} className="btn-gold w-full">
          {t('اختر هذه الخطة', 'Select This Plan')}
        </button>
      )}
    </div>
  );
}
