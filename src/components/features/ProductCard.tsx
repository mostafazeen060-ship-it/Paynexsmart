import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Star, Tag } from 'lucide-react';
import type { Product } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { formatCurrency } from '@/lib/utils';
import { calculateInstallment } from '@/lib/installment';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const navigate = useNavigate();
  const { t, lang } = useApp();

  const name = lang === 'ar' ? product.nameAr : product.nameEn;

  const plan = calculateInstallment({
    productPrice: product.price,
    downPayment: 0,
    months: 12,
  });

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="product-card group" onClick={() => navigate(`/products/${product.id}`)}>
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-slate-50">
        <img
          src={product.images[0]}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {discountPercent > 0 && (
          <div className="absolute top-3 start-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </div>
        )}
        <div className="absolute top-3 end-3 flex flex-col gap-1">
          <span className="badge-navy text-[10px]">{lang === 'ar' ? product.categoryAr : product.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <Tag size={14} className="text-[#d4a339] mt-1 flex-shrink-0" />
          <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{name}</h3>
        </div>

        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(s => (
            <Star key={s} size={12} className="fill-[#d4a339] text-[#d4a339]" />
          ))}
          <span className="text-xs text-slate-400 ms-1">(4.8)</span>
        </div>

        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="text-xs text-slate-400">{t('السعر', 'Price')}</div>
            <div className="font-bold text-lg text-[#0f2460]">{formatCurrency(product.price, lang)}</div>
            {product.originalPrice && (
              <div className="text-xs text-slate-400 line-through">{formatCurrency(product.originalPrice, lang)}</div>
            )}
          </div>
          <div className="text-end">
            <div className="text-xs text-slate-400">{t('أو قسط شهري', 'Or monthly')}</div>
            <div className="installment-badge text-xs">{formatCurrency(plan.monthlyPayment, lang)}/{t('شهر', 'mo')}</div>
          </div>
        </div>

        <button
          onClick={e => { e.stopPropagation(); navigate(`/order/${product.id}`); }}
          className="btn-gold w-full text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart size={16} />
          {t('اطلب بالتقسيط', 'Order in Installments')}
        </button>
      </div>
    </div>
  );
}
