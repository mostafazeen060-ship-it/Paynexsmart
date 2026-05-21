// ... داخل الـ map للمنتجات ...
{products.map((product) => {
  const price = product.price ?? 0;
  const monthlyInstallment = price > 0 ? Math.round(price / 24) : 0;

  return (
    <div 
      key={product.id} 
      className="border rounded-xl p-4 shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
    >
      {/* 1. الصورة */}
      <div className="w-full h-48 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden mb-4 p-2">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name ?? "منتج"} className="max-h-full max-w-full object-contain mix-blend-multiply" />
        ) : (
          <div className="text-gray-400 text-xs text-center">لا توجد صورة متوفرة</div>
        )}
      </div>

      {/* 2. الاسم والسعر */}
      <div className="text-right flex-grow">
        <h3 className="font-medium text-sm text-gray-800 mb-2 line-clamp-2 h-10 leading-tight">
          {product.name ?? "منتج بدون اسم"}
        </h3>
        
        <p className="text-lg font-bold text-gray-900 mb-2">
          {price > 0 ? `${price.toLocaleString()} ج.م` : "السعر غير متاح"}
        </p>

        {/* 3. صندوق الأقساط */}
        {price > 0 && (
          <div className="bg-orange-50 p-2 rounded-lg text-right mt-3 border border-orange-100">
            <span className="text-[10px] text-orange-600 block mb-0.5">قسط شهري مرن:</span>
            <span className="text-xs font-bold text-orange-700">
              {monthlyInstallment.toLocaleString()} ج.م × 24 شهر
            </span>
          </div>
        )}
      </div>

      {/* 4. الزر الجديد (اطلب بالتقسيط) - أضفناه هنا */}
      <button 
        className="w-full mt-4 bg-[#D4A373] hover:bg-[#b08968] text-white font-bold py-2.5 rounded-xl transition duration-200 text-sm"
        onClick={() => {
           // هنا ضع الرابط الذي يفتح تفاصيل المنتج أو صفحة التقسيط
           window.location.href = `/product/${product.id}`;
        }}
      >
        اطلب بالتقسيط
      </button>
    </div>
  );
})}
