'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import type {
  Service,
  ServiceCategory,
  ServiceProduct,
  UpdateServicePayload,
  AddServiceProductPayload,
  UpdateServiceProductPayload,
} from '../types';
import ServiceForm from '../components/service-form';

interface ProductSearchResult {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  salePrice: number;
}

function formatPrice(value: number): string {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes === null) return '—';
  if (minutes < 60) return `${minutes} dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

type ProductModalState =
  | { type: 'none' }
  | { type: 'add' }
  | { type: 'edit'; serviceProduct: ServiceProduct };

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params['id'] as string;

  const [service, setService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Product modal state
  const [productModal, setProductModal] = useState<ProductModalState>({ type: 'none' });
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductSearchResult | null>(null);
  const [productQuantity, setProductQuantity] = useState('1');
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const loadService = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<Service>(`/services/${serviceId}`);
      setService(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hizmet yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await apiClient.get<ServiceCategory[]>('/service-categories');
      setCategories(res.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    void loadService();
    void loadCategories();
  }, [loadService, loadCategories]);

  const handleServiceUpdate = async (payload: UpdateServicePayload) => {
    await apiClient.patch<Service>(`/services/${serviceId}`, payload);
    setIsEditing(false);
    await loadService();
  };

  // Product search
  const handleProductSearch = useCallback(async (query: string) => {
    setProductSearch(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await apiClient.get<ProductSearchResult[]>('/products', {
        search: query.trim(),
        limit: 10,
      });
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleAddProduct = async () => {
    if (selectedProduct === null) {
      setProductError('Lütfen bir ürün seçin.');
      return;
    }
    const qty = Number(productQuantity);
    if (isNaN(qty) || qty <= 0) {
      setProductError('Geçerli bir miktar girin.');
      return;
    }
    const payload: AddServiceProductPayload = {
      productId: selectedProduct.id,
      defaultQuantity: qty,
    };
    try {
      setProductSubmitting(true);
      await apiClient.post<ServiceProduct>(
        `/services/${serviceId}/products`,
        payload,
      );
      setProductModal({ type: 'none' });
      resetProductModal();
      await loadService();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Ürün eklenemedi.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleUpdateProductQuantity = async () => {
    if (productModal.type !== 'edit') return;
    const qty = Number(productQuantity);
    if (isNaN(qty) || qty <= 0) {
      setProductError('Geçerli bir miktar girin.');
      return;
    }
    const payload: UpdateServiceProductPayload = { defaultQuantity: qty };
    try {
      setProductSubmitting(true);
      await apiClient.patch<ServiceProduct>(
        `/services/${serviceId}/products/${productModal.serviceProduct.productId}`,
        payload,
      );
      setProductModal({ type: 'none' });
      resetProductModal();
      await loadService();
    } catch (err) {
      setProductError(err instanceof Error ? err.message : 'Güncelleme başarısız.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (!confirm('Bu ürünü hizmetten kaldırmak istediğinizden emin misiniz?')) return;
    try {
      setDeletingProductId(productId);
      await apiClient.delete(`/services/${serviceId}/products/${productId}`);
      await loadService();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ürün kaldırılamadı.');
    } finally {
      setDeletingProductId(null);
    }
  };

  const resetProductModal = () => {
    setProductSearch('');
    setSearchResults([]);
    setSelectedProduct(null);
    setProductQuantity('1');
    setProductError(null);
  };

  const openEditProductModal = (sp: ServiceProduct) => {
    setProductModal({ type: 'edit', serviceProduct: sp });
    setProductQuantity(String(sp.defaultQuantity));
    setProductError(null);
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
    );
  }

  if (error !== null && service === null) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  if (service === null) return null;

  return (
    <div className="max-w-3xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/services" className="hover:text-gray-700">
          Hizmetler
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{service.name}</span>
      </nav>

      {error !== null && (
        <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700 font-medium"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Service Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">{service.name}</h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                service.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {service.isActive ? 'Aktif' : 'Pasif'}
            </span>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Düzenle
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="px-6 py-5">
            <ServiceForm
              categories={categories}
              initialData={service}
              onSubmit={handleServiceUpdate}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        ) : (
          <dl className="divide-y divide-gray-100">
            <div className="px-6 py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Kategori</dt>
              <dd className="col-span-2 text-sm text-gray-900">
                {service.category?.name ?? '—'}
              </dd>
            </div>
            <div className="px-6 py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Fiyat</dt>
              <dd className="col-span-2 text-sm font-semibold text-gray-900">
                {formatPrice(service.defaultPrice)} TL
              </dd>
            </div>
            <div className="px-6 py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Tahmini Süre</dt>
              <dd className="col-span-2 text-sm text-gray-900">
                {formatDuration(service.estimatedDuration ?? null)}
              </dd>
            </div>
            {service.description !== null && service.description !== '' && (
              <div className="px-6 py-3 grid grid-cols-3 gap-4">
                <dt className="text-sm font-medium text-gray-500">Açıklama</dt>
                <dd className="col-span-2 text-sm text-gray-700 whitespace-pre-wrap">
                  {service.description}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>

      {/* Related Products Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">
            İlişkili Ürünler
          </h2>
          <button
            type="button"
            onClick={() => {
              resetProductModal();
              setProductModal({ type: 'add' });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Ürün Ekle
          </button>
        </div>

        {service.serviceProducts === undefined ||
        service.serviceProducts.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            Bu hizmete henüz ürün eklenmemiş.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Ürün
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  SKU
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Birim Fiyat
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Varsayılan Miktar
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">İşlemler</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {service.serviceProducts.map((sp) => (
                <tr key={sp.productId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {sp.product?.name ?? sp.productId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                    {sp.product?.sku ?? '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-700">
                    {sp.product !== undefined
                      ? `${formatPrice(sp.product.salePrice)} TL`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">
                    {sp.defaultQuantity} {sp.product?.unit ?? ''}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEditProductModal(sp)}
                        className="text-gray-500 hover:text-blue-600"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleRemoveProduct(sp.productId)}
                        disabled={deletingProductId === sp.productId}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingProductId === sp.productId ? '...' : 'Kaldır'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Product Modal */}
      {productModal.type !== 'none' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setProductModal({ type: 'none' });
            resetProductModal();
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">
                {productModal.type === 'add' ? 'Ürün Ekle' : 'Miktar Düzenle'}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {productError !== null && (
                <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                  {productError}
                </div>
              )}

              {productModal.type === 'add' && (
                <div>
                  <label
                    htmlFor="product-search"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Ürün Ara
                  </label>
                  <input
                    id="product-search"
                    type="text"
                    value={productSearch}
                    onChange={(e) => void handleProductSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Ürün adı veya SKU..."
                    autoComplete="off"
                  />
                  {searchLoading && (
                    <p className="mt-1 text-xs text-gray-400">Aranıyor...</p>
                  )}
                  {searchResults.length > 0 && selectedProduct === null && (
                    <ul className="mt-1 border border-gray-200 rounded-md divide-y divide-gray-100 max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(p);
                              setProductSearch(p.name);
                              setSearchResults([]);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                          >
                            <span className="font-medium">{p.name}</span>
                            {p.sku !== null && (
                              <span className="ml-2 text-gray-400 text-xs font-mono">
                                {p.sku}
                              </span>
                            )}
                            <span className="float-right text-gray-500 text-xs">
                              {formatPrice(p.salePrice)} TL
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {selectedProduct !== null && (
                    <div className="mt-2 flex items-center justify-between rounded-md bg-blue-50 border border-blue-200 px-3 py-2">
                      <span className="text-sm font-medium text-blue-800">
                        {selectedProduct.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setProductSearch('');
                        }}
                        className="text-xs text-blue-500 hover:text-blue-700 ml-2"
                      >
                        Değiştir
                      </button>
                    </div>
                  )}
                </div>
              )}

              {productModal.type === 'edit' && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Ürün:{' '}
                    <span className="font-medium">
                      {productModal.serviceProduct.product?.name ??
                        productModal.serviceProduct.productId}
                    </span>
                  </p>
                </div>
              )}

              <div>
                <label
                  htmlFor="product-qty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Varsayılan Miktar{' '}
                  {productModal.type === 'add' && selectedProduct !== null && (
                    <span className="text-gray-400 font-normal">
                      ({selectedProduct.unit})
                    </span>
                  )}
                  {productModal.type === 'edit' &&
                    productModal.serviceProduct.product !== undefined && (
                      <span className="text-gray-400 font-normal">
                        ({productModal.serviceProduct.product.unit})
                      </span>
                    )}
                </label>
                <input
                  id="product-qty"
                  type="number"
                  min={0.01}
                  step="0.01"
                  value={productQuantity}
                  onChange={(e) => setProductQuantity(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setProductModal({ type: 'none' });
                    resetProductModal();
                  }}
                  disabled={productSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void (productModal.type === 'add'
                      ? handleAddProduct()
                      : handleUpdateProductQuantity());
                  }}
                  disabled={productSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {productSubmitting
                    ? 'Kaydediliyor...'
                    : productModal.type === 'add'
                    ? 'Ekle'
                    : 'Güncelle'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
