'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type { Product } from '@/types/product';
import { ProductForm } from '../../components/product-form';

export default function EditProductPage() {
  const params = useParams();
  const id = params['id'] as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await apiClient.get<Product>(`/products/${id}`);
        setProduct(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Urun yuklenemedi.');
      } finally {
        setLoading(false);
      }
    }
    void fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
        Yukleniyor...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-red-600 text-sm mb-4">{error ?? 'Urun bulunamadi.'}</p>
        <Link href="/products" className="text-blue-600 hover:underline text-sm">
          Urunlere don
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link href="/products" className="hover:text-gray-700">
            Urunler
          </Link>
          <span>/</span>
          <Link href={`/products/${id}`} className="hover:text-gray-700">
            {product.name}
          </Link>
          <span>/</span>
          <span>Duzenle</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Urunu Duzenle</h1>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
