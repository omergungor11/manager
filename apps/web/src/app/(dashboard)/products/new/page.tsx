import { ProductForm } from '../components/product-form';

export default function NewProductPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Urun</h1>
        <p className="text-sm text-gray-500 mt-1">
          Stoga yeni bir urun ekleyin.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
