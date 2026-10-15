export const formatCurrency = (value, locale = 'en-IN', currency = 'INR') => {
  let finalLocale = 'en-IN';
  let finalCurrency = 'INR';

  if (locale && typeof locale === 'object') {
    finalLocale = locale.locale || 'en-IN';
    finalCurrency = locale.code || locale.currency || 'INR';
  } else {
    if (typeof locale === 'string' && locale.trim()) {
      finalLocale = locale.trim();
    }
    if (typeof currency === 'string' && currency.trim()) {
      finalCurrency = currency.trim();
    } else if (currency && typeof currency === 'object') {
      finalCurrency = currency.code || currency.currency || 'INR';
    }
  }

  try {
    return new Intl.NumberFormat(finalLocale, {
      style: 'currency',
      currency: finalCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  } catch (err) {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: finalCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(Number(value || 0));
    } catch {
      return `${finalCurrency} ${Number(value || 0).toLocaleString()}`;
    }
  }
};
